using PersonalVault.Api.Model.Auth;
using PersonalVault.Api.Model.Document;
using PersonalVault.Api.Model.Security;

namespace PersonalVault.Api.Service.Otp;

public interface IOtpService
{
    Task SendOtpAsync(User user, string purpose, HttpContext httpContext, bool enforceCooldown = true);
    Task<bool> VerifyOtpAsync(User user, string purpose, string otp, HttpContext httpContext);
}


