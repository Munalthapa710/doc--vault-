using PersonalVault.Api.Model.Auth;
using PersonalVault.Api.Model.Document;
using PersonalVault.Api.Model.Security;
using PersonalVault.Api.ViewModel.Auth;
using PersonalVault.Api.ViewModel.Document;

namespace PersonalVault.Api.Service.Token;

public interface ITokenService
{
    Task<TokenResponse> IssueTokensAsync(User user, HttpContext httpContext);
    Task<TokenResponse?> RefreshAsync(string refreshToken, HttpContext httpContext);
    Task RevokeAsync(string refreshToken, HttpContext httpContext);
    Task RevokeAllAsync(string userId, HttpContext httpContext);
    Task<IReadOnlyList<SecuritySessionResponse>> GetSessionsAsync(string userId);
}


