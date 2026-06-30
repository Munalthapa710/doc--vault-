using PersonalVault.Api.ViewModel.Auth;
using PersonalVault.Api.ViewModel.Document;

namespace PersonalVault.Api.Service.Auth;

public interface IAuthService
{
    Task RegisterAsync(RegisterRequest request, HttpContext httpContext);
    Task LoginAsync(LoginRequest request, HttpContext httpContext);
    Task<TokenResponse> LoginWithSecretWordAsync(SecretWordLoginRequest request, HttpContext httpContext);
    Task<TokenResponse> VerifyLoginOtpAsync(VerifyOtpRequest request, HttpContext httpContext);
    Task VerifyEmailOtpAsync(VerifyOtpRequest request, HttpContext httpContext);
    Task ResendOtpAsync(ResendOtpRequest request, HttpContext httpContext);
    Task<TokenResponse> GoogleLoginAsync(GoogleLoginRequest request, HttpContext httpContext);
    Task ForgotPasswordAsync(ForgotPasswordRequest request, HttpContext httpContext);
    Task ResetPasswordAsync(ResetPasswordRequest request, HttpContext httpContext);
    Task ChangePasswordAsync(string userId, ChangePasswordRequest request, HttpContext httpContext);
    Task UpdateSecretWordAsync(string userId, UpdateSecretWordRequest request, HttpContext httpContext);
    Task<UserResponse> GetMeAsync(string userId);
}


