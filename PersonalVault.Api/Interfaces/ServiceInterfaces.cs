using PersonalVault.Api.Common;
using PersonalVault.Api.DTOs;
using PersonalVault.Api.Models;

namespace PersonalVault.Api.Interfaces;

public interface IAuditLogService
{
    Task LogAsync(string? userId, string action, HttpContext httpContext, Dictionary<string, string>? metadata = null);
}

public interface IEmailService
{
    Task SendOtpAsync(string email, string fullName, string otp, string purpose);
}

public interface IOtpService
{
    Task SendOtpAsync(User user, string purpose, HttpContext httpContext, bool enforceCooldown = true);
    Task<bool> VerifyOtpAsync(User user, string purpose, string otp, HttpContext httpContext);
}

public interface ITokenService
{
    Task<TokenResponse> IssueTokensAsync(User user, HttpContext httpContext);
    Task<TokenResponse?> RefreshAsync(string refreshToken, HttpContext httpContext);
    Task RevokeAsync(string refreshToken, HttpContext httpContext);
    Task RevokeAllAsync(string userId, HttpContext httpContext);
    Task<IReadOnlyList<SecuritySessionResponse>> GetSessionsAsync(string userId);
}

public interface IAuthService
{
    Task RegisterAsync(RegisterRequest request, HttpContext httpContext);
    Task LoginAsync(LoginRequest request, HttpContext httpContext);
    Task<TokenResponse> VerifyLoginOtpAsync(VerifyOtpRequest request, HttpContext httpContext);
    Task VerifyEmailOtpAsync(VerifyOtpRequest request, HttpContext httpContext);
    Task ResendOtpAsync(ResendOtpRequest request, HttpContext httpContext);
    Task<TokenResponse> GoogleLoginAsync(GoogleLoginRequest request, HttpContext httpContext);
    Task ForgotPasswordAsync(ForgotPasswordRequest request, HttpContext httpContext);
    Task ResetPasswordAsync(ResetPasswordRequest request, HttpContext httpContext);
    Task ChangePasswordAsync(string userId, ChangePasswordRequest request, HttpContext httpContext);
    Task<UserResponse> GetMeAsync(string userId);
}

public interface ICloudinaryService
{
    Task<CloudinaryUploadResult> UploadAsync(IFormFile file, string userId, string safeFileName, CancellationToken cancellationToken);
    Task<Stream> DownloadAsync(string publicId, string resourceType, CancellationToken cancellationToken);
    Task DeleteAsync(string publicId, string resourceType, CancellationToken cancellationToken);
    string CreateSignedUrl(string publicId, string resourceType);
}

public interface IDocumentService
{
    Task<DocumentResponse> UploadAsync(string userId, IFormFile file, HttpContext httpContext, CancellationToken cancellationToken);
    Task<PagedResult<DocumentResponse>> ListAsync(string userId, DocumentQuery query);
    Task<DocumentResponse> GetAsync(string userId, string id, HttpContext httpContext);
    Task<(Stream Stream, string MimeType, string FileName)> DownloadAsync(string userId, string id, HttpContext httpContext, CancellationToken cancellationToken);
    Task<DocumentResponse> UpdateAsync(string userId, string id, UpdateDocumentRequest request);
    Task<DocumentResponse> ToggleFavoriteAsync(string userId, string id);
    Task DeleteAsync(string userId, string id, HttpContext httpContext);
    Task RestoreAsync(string userId, string id, HttpContext httpContext);
    Task PermanentDeleteAsync(string userId, string id, HttpContext httpContext, CancellationToken cancellationToken);
}

public interface IDashboardService
{
    Task<DashboardSummaryResponse> GetSummaryAsync(string userId);
}

public class CloudinaryUploadResult
{
    public string PublicId { get; set; } = string.Empty;
    public string SecureUrl { get; set; } = string.Empty;
    public string ResourceType { get; set; } = "raw";
    public string Format { get; set; } = string.Empty;
    public long Bytes { get; set; }
    public long Version { get; set; }
    public DateTime CreatedAt { get; set; }
}
