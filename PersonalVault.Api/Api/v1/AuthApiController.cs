using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalVault.Api.Common;
using PersonalVault.Api.ViewModel.Auth;
using PersonalVault.Api.ViewModel.Document;
using PersonalVault.Api.Service.AuditLog;
using PersonalVault.Api.Service.Auth;
using PersonalVault.Api.Service.Token;

namespace PersonalVault.Api.Api.v1;

[Route("api/auth")]
public class AuthApiController(IAuthService authService, ITokenService tokenService, IAuditLogService auditLogService) : BaseApiController
{
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request) { await authService.RegisterAsync(request, HttpContext); return HttpResponse(200, "Registration successful. Please verify your email OTP."); }

    [HttpPost("verify-email-otp")]
    public async Task<IActionResult> VerifyEmailOtp(VerifyOtpRequest request) { await authService.VerifyEmailOtpAsync(request with { Purpose = "EmailVerification" }, HttpContext); return HttpResponse(200, "Email verified successfully."); }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request) { await authService.LoginAsync(request, HttpContext); return HttpResponse(200, "OTP sent to registered email."); }

    [HttpPost("verify-login-otp")]
    public async Task<IActionResult> VerifyLoginOtp(VerifyOtpRequest request) => HttpResponse(200, "Login successful.", await authService.VerifyLoginOtpAsync(request with { Purpose = "Login" }, HttpContext));

    [HttpPost("resend-otp")]
    public async Task<IActionResult> ResendOtp(ResendOtpRequest request) { await authService.ResendOtpAsync(request, HttpContext); return HttpResponse(200, "If the account exists, OTP has been sent."); }

    [HttpPost("google-login")]
    public async Task<IActionResult> GoogleLogin(GoogleLoginRequest request) => HttpResponse(200, "Google login successful.", await authService.GoogleLoginAsync(request, HttpContext));

    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken(RefreshTokenRequest request)
    {
        var response = await tokenService.RefreshAsync(request.RefreshToken, HttpContext);
        return response is null ? ErrorResponse(401, "Invalid refresh token.") : HttpResponse(200, "Token refreshed.", response);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(RefreshTokenRequest request) { await tokenService.RevokeAsync(request.RefreshToken, HttpContext); await auditLogService.LogAsync(UserIdOrNull(), "Logout", HttpContext); return HttpResponse(200, "Logged out successfully."); }

    [Authorize]
    [HttpPost("logout-all")]
    public async Task<IActionResult> LogoutAll() { await tokenService.RevokeAllAsync(UserId(), HttpContext); await auditLogService.LogAsync(UserId(), "Logout all devices", HttpContext); return HttpResponse(200, "Logged out from all devices."); }

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
}



