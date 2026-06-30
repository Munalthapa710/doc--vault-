using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalVault.Api.Common;
using PersonalVault.Api.ViewModel.Auth;
using PersonalVault.Api.ViewModel.Document;
using PersonalVault.Api.Service.Document;

namespace PersonalVault.Api.Api.v1;

[Authorize]
[Route("api/documents")]
public class DocumentsApiController(IDocumentService documentService) : BaseApiController
{
    [HttpPost("upload")]
    [RequestSizeLimit(60_000_000)]
    public async Task<IActionResult> Upload(IFormFile file, CancellationToken cancellationToken) => HttpResponse(200, "Document uploaded successfully.", await documentService.UploadAsync(UserId(), file, HttpContext, cancellationToken));

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] DocumentQuery query) => HttpResponse(200, "Document list fetched successfully.", await documentService.ListAsync(UserId(), query));

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id) => HttpResponse(200, "Document fetched successfully.", await documentService.GetAsync(UserId(), id, HttpContext));

    [HttpGet("{id}/preview")]
    public async Task<IActionResult> Preview(string id, CancellationToken cancellationToken)
    {
        var file = await documentService.DownloadAsync(UserId(), id, HttpContext, cancellationToken);
        Response.Headers.ContentDisposition = "inline";
        return File(file.Stream, file.MimeType, enableRangeProcessing: true);
    }

    [HttpGet("{id}/download")]
    public async Task<IActionResult> Download(string id, CancellationToken cancellationToken)
    {
        var file = await documentService.DownloadAsync(UserId(), id, HttpContext, cancellationToken);
        return File(file.Stream, file.MimeType, file.FileName, enableRangeProcessing: true);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, UpdateDocumentRequest request) => HttpResponse(200, "Document updated successfully.", await documentService.UpdateAsync(UserId(), id, request));

    [HttpPatch("{id}/favorite")]
    public async Task<IActionResult> Favorite(string id) => HttpResponse(200, "Favorite updated successfully.", await documentService.ToggleFavoriteAsync(UserId(), id));

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id) { await documentService.DeleteAsync(UserId(), id, HttpContext); return HttpResponse(200, "Document deleted successfully."); }

    [HttpPost("{id}/restore")]
    public async Task<IActionResult> Restore(string id) { await documentService.RestoreAsync(UserId(), id, HttpContext); return HttpResponse(200, "Document restored successfully."); }

    [HttpDelete("{id}/permanent")]
    public async Task<IActionResult> PermanentDelete(string id, CancellationToken cancellationToken) { await documentService.PermanentDeleteAsync(UserId(), id, HttpContext, cancellationToken); return HttpResponse(200, "Document permanently deleted."); }

    private string UserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? throw new UnauthorizedAccessException();
}



