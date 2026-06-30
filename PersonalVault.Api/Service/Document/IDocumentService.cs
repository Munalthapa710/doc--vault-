using PersonalVault.Api.Common;
using PersonalVault.Api.ViewModel.Document;

namespace PersonalVault.Api.Service.Document;

public interface IDocumentService
{
    Task<DocumentResponse> UploadAsync(string userId, IFormFile file, HttpContext httpContext, CancellationToken cancellationToken);
    Task<PagedResult<DocumentResponse>> ListAsync(string userId, DocumentQuery query);
    Task<DocumentResponse> GetAsync(string userId, string id, HttpContext httpContext);
    Task<(Stream Stream, string MimeType, string FileName)> DownloadAsync(string userId, string id, HttpContext httpContext, CancellationToken cancellationToken);
    Task<DocumentResponse> UpdateAsync(string userId, string id, UpdateDocumentRequest request);
    Task<DocumentResponse> ToggleFavoriteAsync(string userId, string id);
    Task DeleteAsync(string userId, string id, HttpContext httpContext);
    Task RestoreAsync(string userId, string id, HttpContext httpContext);
    Task PermanentDeleteAsync(string userId, string id, HttpContext httpContext, CancellationToken cancellationToken);
}


