using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalVault.Api.Common;
using PersonalVault.Api.Service.Dashboard;

namespace PersonalVault.Api.Api.v1;

[Authorize]
[Route("api/dashboard")]
public class DashboardApiController(IDashboardService dashboardService) : BaseApiController
{
    [HttpGet("summary")]
    public async Task<IActionResult> Summary() => HttpResponse(200, "Dashboard summary fetched successfully.", await dashboardService.GetSummaryAsync(UserId()));
    private string UserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? throw new UnauthorizedAccessException();
}



