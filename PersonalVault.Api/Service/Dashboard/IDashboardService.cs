using PersonalVault.Api.ViewModel.Document;

namespace PersonalVault.Api.Service.Dashboard;

public interface IDashboardService
{
    Task<DashboardSummaryResponse> GetSummaryAsync(string userId);
}


