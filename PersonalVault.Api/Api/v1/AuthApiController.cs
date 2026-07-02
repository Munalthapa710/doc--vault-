using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using PersonalVault.Api.Common;
using PersonalVault.Api.Configurations;
using PersonalVault.Api.ViewModel.Auth;
using PersonalVault.Api.ViewModel.Document;
using PersonalVault.Api.Service.AuditLog;
using PersonalVault.Api.Service.Auth;
using PersonalVault.Api.Service.Token;

namespace PersonalVault.Api.Api.v1;

[Route("api/auth")]
[EnableRateLimiting("Auth")]
public class AuthApiController(IAuthService authService, ITokenService tokenService, IAuditLogService auditLogService, IOptions<JwtSettings> jwtOptions) : BaseApiController
{
    private const string RefreshCookieName = "__Host-personalVaultRefresh";

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request) { await authService.RegisterAsync(request, HttpContext); return HttpResponse(200, "Registration successful. Please verify your email OTP."); }

    [HttpPost("verify-email-otp")]
    public async Task<IActionResult> VerifyEmailOtp(VerifyOtpRequest request) { await authService.VerifyEmailOtpAsync(request with { Purpose = "EmailVerification" }, HttpContext); return HttpResponse(200, "Email verified successfully."); }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request) { await authService.LoginAsync(request, HttpContext); return HttpResponse(200, "OTP sent to registered email."); }

    [HttpPost("login-secret-word")]
    public async Task<IActionResult> LoginWithSecretWord(SecretWordLoginRequest request) => TokenHttpResponse("Login successful.", await authService.LoginWithSecretWordAsync(request, HttpContext));

    [HttpPost("verify-login-otp")]
    public async Task<IActionResult> VerifyLoginOtp(VerifyOtpRequest request) => TokenHttpResponse("Login successful.", await authService.VerifyLoginOtpAsync(request with { Purpose = "Login" }, HttpContext));

    [HttpPost("resend-otp")]
    public async Task<IActionResult> ResendOtp(ResendOtpRequest request) { await authService.ResendOtpAsync(request, HttpContext); return HttpResponse(200, "If the account exists, OTP has been sent."); }

    [HttpPost("google-login")]
    public async Task<IActionResult> GoogleLogin(GoogleLoginRequest request) => TokenHttpResponse("Google login successful.", await authService.GoogleLoginAsync(request, HttpContext));

    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken([FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] RefreshTokenRequest? request)
    {
        var refreshToken = request?.RefreshToken ?? Request.Cookies[RefreshCookieName];
        if (string.IsNullOrWhiteSpace(refreshToken)) return ErrorResponse(401, "Invalid refresh token.");
        var response = await tokenService.RefreshAsync(refreshToken, HttpContext);
        return response is null ? ErrorResponse(401, "Invalid refresh token.") : TokenHttpResponse("Token refreshed.", response);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] RefreshTokenRequest? request) { var refreshToken = request?.RefreshToken ?? Request.Cookies[RefreshCookieName]; if (!string.IsNullOrWhiteSpace(refreshToken)) await tokenService.RevokeAsync(refreshToken, HttpContext); ClearRefreshCookie(); await auditLogService.LogAsync(UserIdOrNull(), "Logout", HttpContext); return HttpResponse(200, "Logged out successfully."); }

    [Authorize]
    [HttpPost("logout-all")]
    public async Task<IActionResult> LogoutAll() { await tokenService.RevokeAllAsync(UserId(), HttpContext); ClearRefreshCookie(); await auditLogService.LogAsync(UserId(), "Logout all devices", HttpContext); return HttpResponse(200, "Logged out from all devices."); }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request) { await authService.ForgotPasswordAsync(request, HttpContext); return HttpResponse(200, "If the account exists, reset OTP has been sent."); }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request) { await authService.ResetPasswordAsync(request, HttpContext); return HttpResponse(200, "Password reset successful."); }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request) { await authService.ChangePasswordAsync(UserId(), request, HttpContext); return HttpResponse(200, "Password changed successfully."); }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me() => HttpResponse(200, "Profile fetched successfully.", await authService.GetMeAsync(UserId()));

    private string UserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? throw new UnauthorizedAccessException();
    private string? UserIdOrNull() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");

    private IActionResult TokenHttpResponse(string message, TokenResponse response)
    {
        Response.Cookies.Append(RefreshCookieName, response.RefreshToken, RefreshCookieOptions(DateTimeOffset.UtcNow.AddDays(jwtOptions.Value.RefreshTokenDays)));
        response.RefreshToken = string.Empty;
        return HttpResponse(200, message, response);
    }

    private void ClearRefreshCookie() => Response.Cookies.Delete(RefreshCookieName, RefreshCookieOptions(DateTimeOffset.UtcNow.AddDays(-1)));

    private static CookieOptions RefreshCookieOptions(DateTimeOffset expires) => new()
    {
        HttpOnly = true,
        Secure = true,
        SameSite = SameSiteMode.None,
        Path = "/",
        Expires = expires
    };
}



