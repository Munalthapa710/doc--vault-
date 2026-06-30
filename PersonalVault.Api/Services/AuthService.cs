using System.Text.Json;
using MongoDB.Driver;
using PersonalVault.Api.DTOs;
using PersonalVault.Api.Helpers;
using PersonalVault.Api.Interfaces;
using PersonalVault.Api.Models;
using PersonalVault.Api.Repositories;

namespace PersonalVault.Api.Services;

public class AuthService(MongoContext context, IOtpService otpService, ITokenService tokenService, IAuditLogService auditLogService, IHttpClientFactory httpClientFactory) : IAuthService
{
    public async Task RegisterAsync(RegisterRequest request, HttpContext httpContext)
    {
        if (!SecurityHelpers.IsStrongPassword(request.Password)) throw new InvalidOperationException("Password does not meet security requirements.");
        var email = request.Email.Trim().ToLowerInvariant();
        if (await context.Users.Find(x => x.Email == email && !x.IsDeleted).AnyAsync()) throw new InvalidOperationException("Email already exists.");
        var user = new User { FullName = request.FullName.Trim(), Email = email, AuthProvider = "Local", HasLocalPassword = true };
        user.PasswordHash = SecurityHelpers.HashPassword(user, request.Password);
        await context.Users.InsertOneAsync(user);
        await auditLogService.LogAsync(user.Id, "Register", httpContext);
        await otpService.SendOtpAsync(user, "EmailVerification", httpContext, false);
    }

    public async Task LoginAsync(LoginRequest request, HttpContext httpContext)
    {
        var user = await FindByEmail(request.Email);
        if (user is null || !user.IsActive || user.IsDeleted || user.LockoutEndAt > DateTime.UtcNow || !SecurityHelpers.VerifyPassword(user, request.Password))
        {
            if (user is not null) await RegisterFailedLogin(user);
            await auditLogService.LogAsync(user?.Id, "Login failed", httpContext);
            throw new UnauthorizedAccessException("Invalid email or password.");
        }
        await context.Users.UpdateOneAsync(x => x.Id == user.Id, Builders<User>.Update.Set(x => x.FailedLoginCount, 0).Unset(x => x.LockoutEndAt));
        await auditLogService.LogAsync(user.Id, "Login password passed", httpContext);
        await otpService.SendOtpAsync(user, "Login", httpContext, false);
    }

    public async Task<TokenResponse> VerifyLoginOtpAsync(VerifyOtpRequest request, HttpContext httpContext)
    {
        var user = await FindByEmail(request.Email) ?? throw new UnauthorizedAccessException("Invalid OTP.");
        if (!await otpService.VerifyOtpAsync(user, "Login", request.Otp, httpContext)) throw new UnauthorizedAccessException("Invalid OTP.");
        await context.Users.UpdateOneAsync(x => x.Id == user.Id, Builders<User>.Update.Set(x => x.LastLoginAt, DateTime.UtcNow).Set(x => x.UpdatedAt, DateTime.UtcNow));
        user.LastLoginAt = DateTime.UtcNow;
        await auditLogService.LogAsync(user.Id, "Login success", httpContext);
        return await tokenService.IssueTokensAsync(user, httpContext);
    }

    public async Task VerifyEmailOtpAsync(VerifyOtpRequest request, HttpContext httpContext)
    {
        var user = await FindByEmail(request.Email) ?? throw new UnauthorizedAccessException("Invalid OTP.");
        if (!await otpService.VerifyOtpAsync(user, "EmailVerification", request.Otp, httpContext)) throw new UnauthorizedAccessException("Invalid OTP.");
        await context.Users.UpdateOneAsync(x => x.Id == user.Id, Builders<User>.Update.Set(x => x.IsEmailVerified, true).Set(x => x.UpdatedAt, DateTime.UtcNow));
        await auditLogService.LogAsync(user.Id, "Email verified", httpContext);
    }

    public async Task ResendOtpAsync(ResendOtpRequest request, HttpContext httpContext)
    {
        var user = await FindByEmail(request.Email);
        if (user is null) return;
        await otpService.SendOtpAsync(user, request.Purpose, httpContext);
    }

    public async Task<TokenResponse> GoogleLoginAsync(GoogleLoginRequest request, HttpContext httpContext)
    {
        var info = await VerifyGoogleToken(request.IdToken);
        var user = await FindByEmail(info.Email);
        if (user is null)
        {
            user = new User
            {
                FullName = info.Name,
                Email = info.Email,
                AuthProvider = "Google",
                GoogleId = info.GoogleId,
                IsEmailVerified = true,
                MustChangePassword = true,
                HasLocalPassword = false
            };
            await context.Users.InsertOneAsync(user);
        }
        else if (string.IsNullOrWhiteSpace(user.GoogleId))
        {
            await context.Users.UpdateOneAsync(x => x.Id == user.Id, Builders<User>.Update.Set(x => x.GoogleId, info.GoogleId).Set(x => x.AuthProvider, user.AuthProvider == "Local" ? "Local,Google" : user.AuthProvider).Set(x => x.UpdatedAt, DateTime.UtcNow));
            user.GoogleId = info.GoogleId;
        }
        await context.Users.UpdateOneAsync(x => x.Id == user.Id, Builders<User>.Update.Set(x => x.LastLoginAt, DateTime.UtcNow));
        user.LastLoginAt = DateTime.UtcNow;
        await auditLogService.LogAsync(user.Id, "Google login", httpContext);
        return await tokenService.IssueTokensAsync(user, httpContext);
    }

    public async Task ForgotPasswordAsync(ForgotPasswordRequest request, HttpContext httpContext)
    {
        var user = await FindByEmail(request.Email);
        if (user is null) return;
        await otpService.SendOtpAsync(user, "PasswordReset", httpContext);
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request, HttpContext httpContext)
    {
        if (!SecurityHelpers.IsStrongPassword(request.NewPassword)) throw new InvalidOperationException("Password does not meet security requirements.");
        var user = await FindByEmail(request.Email) ?? throw new UnauthorizedAccessException("Invalid OTP.");
        if (!await otpService.VerifyOtpAsync(user, "PasswordReset", request.Otp, httpContext)) throw new UnauthorizedAccessException("Invalid OTP.");
        user.PasswordHash = SecurityHelpers.HashPassword(user, request.NewPassword);
        await context.Users.UpdateOneAsync(x => x.Id == user.Id, Builders<User>.Update.Set(x => x.PasswordHash, user.PasswordHash).Set(x => x.HasLocalPassword, true).Set(x => x.MustChangePassword, false).Set(x => x.UpdatedAt, DateTime.UtcNow));
        await tokenService.RevokeAllAsync(user.Id!, httpContext);
        await auditLogService.LogAsync(user.Id, "Password reset", httpContext);
    }

    public async Task ChangePasswordAsync(string userId, ChangePasswordRequest request, HttpContext httpContext)
    {
        if (!SecurityHelpers.IsStrongPassword(request.NewPassword)) throw new InvalidOperationException("Password does not meet security requirements.");
        var user = await context.Users.Find(x => x.Id == userId && !x.IsDeleted).FirstOrDefaultAsync() ?? throw new UnauthorizedAccessException();
        if (user.HasLocalPassword && !SecurityHelpers.VerifyPassword(user, request.CurrentPassword ?? string.Empty)) throw new UnauthorizedAccessException("Current password is incorrect.");
        user.PasswordHash = SecurityHelpers.HashPassword(user, request.NewPassword);
        await context.Users.UpdateOneAsync(x => x.Id == user.Id, Builders<User>.Update.Set(x => x.PasswordHash, user.PasswordHash).Set(x => x.HasLocalPassword, true).Set(x => x.MustChangePassword, false).Set(x => x.UpdatedAt, DateTime.UtcNow));
        await auditLogService.LogAsync(user.Id, "Password changed", httpContext);
    }

    public async Task<UserResponse> GetMeAsync(string userId)
    {
        var user = await context.Users.Find(x => x.Id == userId && !x.IsDeleted).FirstOrDefaultAsync() ?? throw new UnauthorizedAccessException();
        return Map(user);
    }

    private async Task RegisterFailedLogin(User user)
    {
        var count = user.FailedLoginCount + 1;
        var update = Builders<User>.Update.Set(x => x.FailedLoginCount, count);
        if (count >= 5) update = update.Set(x => x.LockoutEndAt, DateTime.UtcNow.AddMinutes(15));
        await context.Users.UpdateOneAsync(x => x.Id == user.Id, update);
    }

    private Task<User?> FindByEmail(string email) => context.Users.Find(x => x.Email == email.Trim().ToLowerInvariant() && !x.IsDeleted).FirstOrDefaultAsync()!;

    private async Task<GoogleInfo> VerifyGoogleToken(string idToken)
    {
        var client = httpClientFactory.CreateClient();
        using var response = await client.GetAsync($"https://oauth2.googleapis.com/tokeninfo?id_token={Uri.EscapeDataString(idToken)}");
        response.EnsureSuccessStatusCode();
        await using var stream = await response.Content.ReadAsStreamAsync();
        using var json = await JsonDocument.ParseAsync(stream);
        var root = json.RootElement;
        if (!root.TryGetProperty("email_verified", out var verified) || verified.GetString() != "true") throw new UnauthorizedAccessException("Google email is not verified.");
        return new GoogleInfo(root.GetProperty("sub").GetString()!, root.GetProperty("email").GetString()!.ToLowerInvariant(), root.TryGetProperty("name", out var name) ? name.GetString() ?? "Google User" : "Google User");
    }

    private static UserResponse Map(User user) => new()
    {
        Id = user.Id!,
        FullName = user.FullName,
        Email = user.Email,
        AuthProvider = user.AuthProvider,
        IsEmailVerified = user.IsEmailVerified,
        MustChangePassword = user.MustChangePassword,
        HasLocalPassword = user.HasLocalPassword,
        EmailOtpLoginEnabled = user.EmailOtpLoginEnabled,
        LastLoginAt = user.LastLoginAt
    };

    private record GoogleInfo(string GoogleId, string Email, string Name);
}
