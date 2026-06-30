using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalVault.Api.Common;
using PersonalVault.Api.Interfaces;

namespace PersonalVault.Api.Controllers;

[Authorize]
[Route("api/dashboard")]
public class DashboardController(IDashboardService dashboardService) : BaseApiController
{
    [HttpGet("summary")]
    public async Task<IActionResult> Summary() => HttpResponse(200, "Dashboard summary fetched successfully.", await dashboardService.GetSummaryAsync(UserId()));
    private string UserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? throw new UnauthorizedAccessException();
}
