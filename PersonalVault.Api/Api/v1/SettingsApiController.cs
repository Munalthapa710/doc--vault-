using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using PersonalVault.Api.Common;
using PersonalVault.Api.ViewModel.Auth;
using PersonalVault.Api.ViewModel.Document;
using PersonalVault.Api.Data;
using PersonalVault.Api.Model.Auth;
using PersonalVault.Api.Service.Auth;
using PersonalVault.Api.Service.Token;

namespace PersonalVault.Api.Api.v1;

[Authorize]
[Route("api/settings")]
public class SettingsApiController(ApplicationDbContext context, IAuthService authService, ITokenService tokenService) : BaseApiController
{
    [HttpGet("profile")]
    public async Task<IActionResult> Profile() => HttpResponse(200, "Profile fetched successfully.", await authService.GetMeAsync(UserId()));

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(UpdateProfileRequest request)
    {
        var update = Builders<User>.Update.Set(x => x.FullName, request.FullName.Trim()).Set(x => x.UpdatedAt, DateTime.UtcNow);
        if (request.EmailOtpLoginEnabled is not null) update = update.Set(x => x.EmailOtpLoginEnabled, request.EmailOtpLoginEnabled.Value);
        await context.Users.UpdateOneAsync(x => x.Id == UserId(), update);
        return HttpResponse(200, "Profile updated successfully.", await authService.GetMeAsync(UserId()));
    }

    [HttpGet("security")]
    public async Task<IActionResult> Security() => HttpResponse(200, "Security settings fetched successfully.", await authService.GetMeAsync(UserId()));

    [HttpGet("sessions")]
    public async Task<IActionResult> Sessions() => HttpResponse(200, "Active sessions fetched successfully.", await tokenService.GetSessionsAsync(UserId()));

    private string UserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? throw new UnauthorizedAccessException();
}



