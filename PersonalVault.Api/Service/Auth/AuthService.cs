using System.Text.Json;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using PersonalVault.Api.ViewModel.Auth;
using PersonalVault.Api.ViewModel.Document;
using PersonalVault.Api.Configurations;
using PersonalVault.Api.Helpers;
using PersonalVault.Api.Model.Auth;
using PersonalVault.Api.Model.Document;
using PersonalVault.Api.Model.Security;
using PersonalVault.Api.Data;
using PersonalVault.Api.Service.AuditLog;
using PersonalVault.Api.Service.Otp;
using PersonalVault.Api.Service.Token;

namespace PersonalVault.Api.Service.Auth;

public class AuthService(ApplicationDbContext context, IOtpService otpService, ITokenService tokenService, IAuditLogService auditLogService, IHttpClientFactory httpClientFactory, IOptions<GoogleAuthSettings> googleOptions, IOptions<SecuritySettings> securityOptions) : IAuthService
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
        if (!user.IsEmailVerified) throw new UnauthorizedAccessException("Please verify your email before signing in.");
        if (!user.EmailOtpLoginEnabled) throw new InvalidOperationException("Email OTP login is disabled for this account.");
        await context.Users.UpdateOneAsync(x => x.Id == user.Id, Builders<User>.Update.Set(x => x.FailedLoginCount, 0).Unset(x => x.LockoutEndAt));
        await auditLogService.LogAsync(user.Id, "Login password passed", httpContext);
        await otpService.SendOtpAsync(user, "Login", httpContext);
    }

    public async Task<TokenResponse> LoginWithSecretWordAsync(SecretWordLoginRequest request, HttpContext httpContext)
    {
        var user = await FindByEmail(request.Email);
        if (user is null || !user.IsActive || user.IsDeleted || user.LockoutEndAt > DateTime.UtcNow || !SecurityHelpers.VerifyPassword(user, request.Password) || !SecurityHelpers.VerifySecretWord(user, request.SecretWord))
        {
            if (user is not null) await RegisterFailedLogin(user);
            await auditLogService.LogAsync(user?.Id, "Login failed", httpContext);
            throw new UnauthorizedAccessException("Invalid email, password, or secret word.");
        }
        if (!user.IsEmailVerified) throw new UnauthorizedAccessException("Please verify your email before signing in.");

        await context.Users.UpdateOneAsync(x => x.Id == user.Id, Builders<User>.Update.Set(x => x.FailedLoginCount, 0).Unset(x => x.LockoutEndAt).Set(x => x.LastLoginAt, DateTime.UtcNow).Set(x => x.UpdatedAt, DateTime.UtcNow));
        user.LastLoginAt = DateTime.UtcNow;
        await auditLogService.LogAsync(user.Id, "Login success with secret word", httpContext);
        return await tokenService.IssueTokensAsync(user, httpContext);
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
        var info = await VerifyGoogleToken(request.IdToken, request.Nonce);
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

    public async Task UpdateSecretWordAsync(string userId, UpdateSecretWordRequest request, HttpContext httpContext)
    {
        var secretWord = request.SecretWord.Trim();
        if (secretWord.Length < 4) throw new InvalidOperationException("Secret word must be at least 4 characters.");
        var user = await context.Users.Find(x => x.Id == userId && !x.IsDeleted).FirstOrDefaultAsync() ?? throw new UnauthorizedAccessException();
        user.SecretWordHash = SecurityHelpers.HashSecretWord(user, secretWord);
        await context.Users.UpdateOneAsync(x => x.Id == user.Id, Builders<User>.Update.Set(x => x.SecretWordHash, user.SecretWordHash).Set(x => x.UpdatedAt, DateTime.UtcNow));
        await auditLogService.LogAsync(user.Id, "Secret word updated", httpContext);
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
        if (count >= securityOptions.Value.MaxLoginAttempts) update = update.Set(x => x.LockoutEndAt, DateTime.UtcNow.AddMinutes(securityOptions.Value.LockoutMinutes));
        await context.Users.UpdateOneAsync(x => x.Id == user.Id, update);
    }

    private Task<User?> FindByEmail(string email) => context.Users.Find(x => x.Email == email.Trim().ToLowerInvariant() && !x.IsDeleted).FirstOrDefaultAsync()!;

    private async Task<GoogleInfo> VerifyGoogleToken(string idToken, string expectedNonce)
    {
        var clientId = googleOptions.Value.ClientId;
        if (string.IsNullOrWhiteSpace(clientId)) throw new InvalidOperationException("Google client id is not configured.");

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(idToken);
        if (!jwt.Issuer.Equals("https://accounts.google.com", StringComparison.Ordinal) && !jwt.Issuer.Equals("accounts.google.com", StringComparison.Ordinal))
        {
            throw new UnauthorizedAccessException("Invalid Google token issuer.");
        }
        if (!jwt.Audiences.Contains(clientId, StringComparer.Ordinal))
        {
            throw new UnauthorizedAccessException("Invalid Google token audience.");
        }
        if (jwt.ValidTo <= DateTime.UtcNow)
        {
            throw new UnauthorizedAccessException("Google token is expired.");
        }
        var nonce = jwt.Claims.FirstOrDefault(x => x.Type == "nonce")?.Value;
        if (string.IsNullOrWhiteSpace(expectedNonce) || !string.Equals(nonce, expectedNonce, StringComparison.Ordinal))
        {
            throw new UnauthorizedAccessException("Invalid Google login nonce.");
        }

        var client = httpClientFactory.CreateClient();
        using var response = await client.GetAsync($"https://oauth2.googleapis.com/tokeninfo?id_token={Uri.EscapeDataString(idToken)}");
        response.EnsureSuccessStatusCode();
        await using var stream = await response.Content.ReadAsStreamAsync();
        using var json = await JsonDocument.ParseAsync(stream);
        var root = json.RootElement;
        if (!root.TryGetProperty("email_verified", out var verified) || verified.GetString() != "true") throw new UnauthorizedAccessException("Google email is not verified.");
        if (!root.TryGetProperty("aud", out var aud) || aud.GetString() != clientId) throw new UnauthorizedAccessException("Invalid Google token audience.");
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
        HasSecretWord = user.HasSecretWord,
        EmailOtpLoginEnabled = user.EmailOtpLoginEnabled,
        LastLoginAt = user.LastLoginAt
    };

    private record GoogleInfo(string GoogleId, string Email, string Name);
}



