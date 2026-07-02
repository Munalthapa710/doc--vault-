using System.ComponentModel.DataAnnotations;

namespace PersonalVault.Api.ViewModel.Auth;

public record RegisterRequest([Required] string FullName, [Required, EmailAddress] string Email, [Required] string Password);
public record LoginRequest([Required, EmailAddress] string Email, [Required] string Password);
public record SecretWordLoginRequest([Required, EmailAddress] string Email, [Required] string Password, [Required, MinLength(4)] string SecretWord);
public record VerifyOtpRequest([Required, EmailAddress] string Email, [Required] string Otp, string Purpose);
public record ResendOtpRequest([Required, EmailAddress] string Email, [Required] string Purpose);
public record GoogleLoginRequest([Required] string IdToken, [Required] string Nonce);
public record RefreshTokenRequest([Required] string RefreshToken);
public record ForgotPasswordRequest([Required, EmailAddress] string Email);
public record ResetPasswordRequest([Required, EmailAddress] string Email, [Required] string Otp, [Required] string NewPassword);
public record ChangePasswordRequest(string? CurrentPassword, [Required] string NewPassword);
public record UpdateSecretWordRequest([Required, MinLength(4)] string SecretWord);
public record UpdateProfileRequest([Required] string FullName, bool? EmailOtpLoginEnabled);

public class UserResponse
{
    public string Id { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string AuthProvider { get; set; } = string.Empty;
    public bool IsEmailVerified { get; set; }
    public bool MustChangePassword { get; set; }
    public bool HasLocalPassword { get; set; }
    public bool HasSecretWord { get; set; }
    public bool EmailOtpLoginEnabled { get; set; }
    public DateTime? LastLoginAt { get; set; }
}

public class TokenResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public UserResponse User { get; set; } = new();
}

public class SecuritySessionResponse
{
    public string Id { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public string UserAgent { get; set; } = string.Empty;
}



