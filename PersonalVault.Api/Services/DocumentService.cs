using Microsoft.Extensions.Options;
using MongoDB.Driver;
using PersonalVault.Api.Common;
using PersonalVault.Api.Configurations;
using PersonalVault.Api.DTOs;
using PersonalVault.Api.Helpers;
using PersonalVault.Api.Interfaces;
using PersonalVault.Api.Models;
using PersonalVault.Api.Repositories;

namespace PersonalVault.Api.Services;

public class DocumentService(MongoContext context, ICloudinaryService cloudinaryService, IAuditLogService auditLogService, IOptions<SecuritySettings> options, IOptions<CloudinarySettings> cloudinaryOptions) : IDocumentService
{
    public async Task<DocumentResponse> UploadAsync(string userId, IFormFile file, HttpContext httpContext, CancellationToken cancellationToken)
    {
        if (file.Length <= 0 || file.Length > options.Value.MaxFileSizeBytes) throw new InvalidOperationException("Invalid file size.");
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!FileHelpers.IsAllowed(extension, file.ContentType)) throw new InvalidOperationException("File type is not allowed.");
        var safeFileName = $"{Guid.NewGuid():N}{extension}";
        var uploaded = await cloudinaryService.UploadAsync(file, userId, safeFileName, cancellationToken);
        var document = new DocumentFile
        {
            UserId = userId,
            OriginalFileName = Path.GetFileName(file.FileName),
            SafeFileName = safeFileName,
            DisplayName = FileHelpers.SanitizeDisplayName(file.FileName),
            FileExtension = extension.TrimStart('.'),
            MimeType = file.ContentType,
            FileSize = uploaded.Bytes,
            CloudinaryPublicId = uploaded.PublicId,
            CloudinarySecureUrl = uploaded.SecureUrl,
            CloudinaryResourceType = uploaded.ResourceType,
            Folder = $"{cloudinaryOptions.Value.Folder.Trim('/')}/{userId}/documents"
        };
        await context.Documents.InsertOneAsync(document, cancellationToken: cancellationToken);
        await auditLogService.LogAsync(userId, "Document uploaded", httpContext, new Dictionary<string, string> { ["documentId"] = document.Id! });
        return Map(document);
    }

    public async Task<PagedResult<DocumentResponse>> ListAsync(string userId, DocumentQuery query)
    {
        query.Page = Math.Max(1, query.Page);
        query.PageSize = Math.Clamp(query.PageSize, 1, 60);
        var filter = Builders<DocumentFile>.Filter.Eq(x => x.UserId, userId);
        if (!query.IncludeDeleted) filter &= Builders<DocumentFile>.Filter.Eq(x => x.IsDeleted, false);
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var regex = new MongoDB.Bson.BsonRegularExpression(query.Search.Trim(), "i");
            filter &= Builders<DocumentFile>.Filter.Or(Builders<DocumentFile>.Filter.Regex(x => x.DisplayName, regex), Builders<DocumentFile>.Filter.Regex(x => x.OriginalFileName, regex), Builders<DocumentFile>.Filter.AnyEq(x => x.Tags, query.Search.Trim()));
        }
        if (!string.IsNullOrWhiteSpace(query.FileType)) filter &= Builders<DocumentFile>.Filter.Eq(x => x.FileExtension, query.FileType.Trim().TrimStart('.').ToLowerInvariant());
        if (query.From is not null) filter &= Builders<DocumentFile>.Filter.Gte(x => x.UploadedAt, query.From.Value.Date);
        if (query.To is not null) filter &= Builders<DocumentFile>.Filter.Lte(x => x.UploadedAt, query.To.Value.Date.AddDays(1).AddTicks(-1));
        var sort = query.Sort switch
        {
            "oldest" => Builders<DocumentFile>.Sort.Ascending(x => x.UploadedAt),
            "name" => Builders<DocumentFile>.Sort.Ascending(x => x.DisplayName),
            "size" => Builders<DocumentFile>.Sort.Descending(x => x.FileSize),
            _ => Builders<DocumentFile>.Sort.Descending(x => x.UploadedAt)
        };
        var total = await context.Documents.CountDocumentsAsync(filter);
        var rows = await context.Documents.Find(filter).Sort(sort).Skip((query.Page - 1) * query.PageSize).Limit(query.PageSize).ToListAsync();
        return new PagedResult<DocumentResponse> { Rows = rows.Select(Map).ToList(), Total = total, Page = query.Page, Pages = (int)Math.Ceiling(total / (double)query.PageSize) };
    }

    public async Task<DocumentResponse> GetAsync(string userId, string id, HttpContext httpContext)
    {
        var doc = await RequireDocument(userId, id, false);
        await auditLogService.LogAsync(userId, "Document viewed", httpContext, new Dictionary<string, string> { ["documentId"] = id });
        return Map(doc);
    }

    public async Task<(Stream Stream, string MimeType, string FileName)> DownloadAsync(string userId, string id, HttpContext httpContext, CancellationToken cancellationToken)
    {
        var doc = await RequireDocument(userId, id, false);
        var stream = await cloudinaryService.DownloadAsync(doc.CloudinaryPublicId, doc.CloudinaryResourceType, cancellationToken);
        await context.Documents.UpdateOneAsync(x => x.Id == id, Builders<DocumentFile>.Update.Set(x => x.LastDownloadedAt, DateTime.UtcNow), cancellationToken: cancellationToken);
        await auditLogService.LogAsync(userId, "Document downloaded", httpContext, new Dictionary<string, string> { ["documentId"] = id });
        return (stream, doc.MimeType, $"{doc.DisplayName}.{doc.FileExtension}");
    }

    public async Task<DocumentResponse> UpdateAsync(string userId, string id, UpdateDocumentRequest request)
    {
        await RequireDocument(userId, id, false);
        var update = Builders<DocumentFile>.Update.Set(x => x.DisplayName, FileHelpers.SanitizeDisplayName(request.DisplayName)).Set(x => x.Tags, request.Tags?.Select(x => x.Trim()).Where(x => x.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase).Take(20).ToList() ?? []).Set(x => x.UpdatedAt, DateTime.UtcNow);
        await context.Documents.UpdateOneAsync(x => x.Id == id && x.UserId == userId, update);
        return Map(await RequireDocument(userId, id, true));
    }

    public async Task<DocumentResponse> ToggleFavoriteAsync(string userId, string id)
    {
        var doc = await RequireDocument(userId, id, false);
        await context.Documents.UpdateOneAsync(x => x.Id == id, Builders<DocumentFile>.Update.Set(x => x.IsFavorite, !doc.IsFavorite).Set(x => x.UpdatedAt, DateTime.UtcNow));
        doc.IsFavorite = !doc.IsFavorite;
        return Map(doc);
    }

    public async Task DeleteAsync(string userId, string id, HttpContext httpContext)
    {
        await RequireDocument(userId, id, false);
        await context.Documents.UpdateOneAsync(x => x.Id == id, Builders<DocumentFile>.Update.Set(x => x.IsDeleted, true).Set(x => x.DeletedAt, DateTime.UtcNow));
        await auditLogService.LogAsync(userId, "Document deleted", httpContext, new Dictionary<string, string> { ["documentId"] = id });
    }

    public async Task RestoreAsync(string userId, string id, HttpContext httpContext)
    {
        await RequireDocument(userId, id, true);
        await context.Documents.UpdateOneAsync(x => x.Id == id && x.UserId == userId, Builders<DocumentFile>.Update.Set(x => x.IsDeleted, false).Unset(x => x.DeletedAt));
        await auditLogService.LogAsync(userId, "Document restored", httpContext, new Dictionary<string, string> { ["documentId"] = id });
    }

    public async Task PermanentDeleteAsync(string userId, string id, HttpContext httpContext, CancellationToken cancellationToken)
    {
        var doc = await RequireDocument(userId, id, true);
        await cloudinaryService.DeleteAsync(doc.CloudinaryPublicId, doc.CloudinaryResourceType, cancellationToken);
        await context.Documents.DeleteOneAsync(x => x.Id == id && x.UserId == userId, cancellationToken);
        await auditLogService.LogAsync(userId, "Document permanently deleted", httpContext, new Dictionary<string, string> { ["documentId"] = id });
    }

    private async Task<DocumentFile> RequireDocument(string userId, string id, bool includeDeleted)
    {
        var filter = Builders<DocumentFile>.Filter.Eq(x => x.Id, id) & Builders<DocumentFile>.Filter.Eq(x => x.UserId, userId);
        if (!includeDeleted) filter &= Builders<DocumentFile>.Filter.Eq(x => x.IsDeleted, false);
        return await context.Documents.Find(filter).FirstOrDefaultAsync() ?? throw new KeyNotFoundException("Document not found.");
    }

    private static DocumentResponse Map(DocumentFile doc) => new()
    {
        Id = doc.Id!,
        DisplayName = doc.DisplayName,
        OriginalFileName = doc.OriginalFileName,
        FileExtension = doc.FileExtension,
        MimeType = doc.MimeType,
        FileSize = doc.FileSize,
        Tags = doc.Tags,
        IsFavorite = doc.IsFavorite,
        IsDeleted = doc.IsDeleted,
        UploadedAt = doc.UploadedAt,
        UpdatedAt = doc.UpdatedAt,
        LastDownloadedAt = doc.LastDownloadedAt,
        CanPreview = FileHelpers.CanPreview($".{doc.FileExtension}")
    };
}
