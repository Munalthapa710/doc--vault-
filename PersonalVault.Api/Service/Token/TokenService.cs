using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using PersonalVault.Api.Configurations;
using PersonalVault.Api.ViewModel.Auth;
using PersonalVault.Api.ViewModel.Document;
using PersonalVault.Api.Helpers;
using PersonalVault.Api.Model.Auth;
using PersonalVault.Api.Model.Document;
using PersonalVault.Api.Model.Security;
using PersonalVault.Api.Data;

namespace PersonalVault.Api.Service.Token;

public class TokenService(ApplicationDbContext context, IOptions<JwtSettings> options) : ITokenService
{
    public async Task<TokenResponse> IssueTokensAsync(User user, HttpContext httpContext)
    {
        var refreshToken = SecurityHelpers.GenerateSecureToken();
        var refreshHash = SecurityHelpers.Sha256(refreshToken);
        await context.RefreshTokens.InsertOneAsync(new RefreshToken
        {
            UserId = user.Id!,
            TokenHash = refreshHash,
            ExpiresAt = DateTime.UtcNow.AddDays(options.Value.RefreshTokenDays),
            IpAddress = httpContext.Connection.RemoteIpAddress?.ToString() ?? string.Empty,
            UserAgent = httpContext.Request.Headers.UserAgent.ToString()
        });
        return new TokenResponse { AccessToken = CreateJwt(user), RefreshToken = refreshToken, User = Map(user) };
    }

    public async Task<TokenResponse?> RefreshAsync(string refreshToken, HttpContext httpContext)
    {
        var hash = SecurityHelpers.Sha256(refreshToken);
        var stored = await context.RefreshTokens.Find(x => x.TokenHash == hash && x.RevokedAt == null && x.ExpiresAt > DateTime.UtcNow).FirstOrDefaultAsync();
        if (stored is null) return null;
        var user = await context.Users.Find(x => x.Id == stored.UserId && !x.IsDeleted && x.IsActive).FirstOrDefaultAsync();
        if (user is null) return null;
        var next = SecurityHelpers.GenerateSecureToken();
        var nextHash = SecurityHelpers.Sha256(next);
        await context.RefreshTokens.UpdateOneAsync(x => x.Id == stored.Id, Builders<RefreshToken>.Update.Set(x => x.RevokedAt, DateTime.UtcNow).Set(x => x.ReplacedByTokenHash, nextHash));
        await context.RefreshTokens.InsertOneAsync(new RefreshToken
        {
            UserId = user.Id!,
            TokenHash = nextHash,
            ExpiresAt = DateTime.UtcNow.AddDays(options.Value.RefreshTokenDays),
            IpAddress = httpContext.Connection.RemoteIpAddress?.ToString() ?? string.Empty,
            UserAgent = httpContext.Request.Headers.UserAgent.ToString()
        });
        return new TokenResponse { AccessToken = CreateJwt(user), RefreshToken = next, User = Map(user) };
    }

    public async Task RevokeAsync(string refreshToken, HttpContext httpContext)
    {
        var hash = SecurityHelpers.Sha256(refreshToken);
        await context.RefreshTokens.UpdateOneAsync(x => x.TokenHash == hash && x.RevokedAt == null, Builders<RefreshToken>.Update.Set(x => x.RevokedAt, DateTime.UtcNow));
    }

    public async Task RevokeAllAsync(string userId, HttpContext httpContext)
    {
        await context.RefreshTokens.UpdateManyAsync(x => x.UserId == userId && x.RevokedAt == null, Builders<RefreshToken>.Update.Set(x => x.RevokedAt, DateTime.UtcNow));
    }

    public async Task<IReadOnlyList<SecuritySessionResponse>> GetSessionsAsync(string userId)
    {
        return await context.RefreshTokens.Find(x => x.UserId == userId && x.RevokedAt == null && x.ExpiresAt > DateTime.UtcNow)
            .SortByDescending(x => x.CreatedAt)
            .Project(x => new SecuritySessionResponse { Id = x.Id!, CreatedAt = x.CreatedAt, ExpiresAt = x.ExpiresAt, IpAddress = x.IpAddress, UserAgent = x.UserAgent })
            .ToListAsync();
    }

    private string CreateJwt(User user)
    {
        var settings = options.Value;
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings.Key));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id!),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("fullName", user.FullName)
        };
        var token = new JwtSecurityToken(settings.Issuer, settings.Audience, claims, expires: DateTime.UtcNow.AddMinutes(settings.AccessTokenMinutes), signingCredentials: credentials);
        return new JwtSecurityTokenHandler().WriteToken(token);
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
}



