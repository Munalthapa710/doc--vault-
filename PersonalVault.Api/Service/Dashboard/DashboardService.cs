using MongoDB.Bson;
using MongoDB.Driver;
using PersonalVault.Api.ViewModel.Auth;
using PersonalVault.Api.ViewModel.Document;
using PersonalVault.Api.Helpers;
using PersonalVault.Api.Data;
using PersonalVault.Api.Model.Document;

namespace PersonalVault.Api.Service.Dashboard;

public class DashboardService(ApplicationDbContext context) : IDashboardService
{
    public async Task<DashboardSummaryResponse> GetSummaryAsync(string userId)
    {
        var activeFilter = Builders<DocumentFile>.Filter.Eq(x => x.UserId, userId) & Builders<DocumentFile>.Filter.Eq(x => x.IsDeleted, false);
        var totalDocumentsTask = context.Documents.CountDocumentsAsync(activeFilter);
        var storageTask = context.Documents.Aggregate()
            .Match(activeFilter)
            .Group(new BsonDocument
            {
                ["_id"] = BsonNull.Value,
                ["totalStorageUsed"] = new BsonDocument("$sum", "$FileSize")
            })
            .FirstOrDefaultAsync();
        var typeCountsTask = context.Documents.Aggregate()
            .Match(activeFilter)
            .Group(new BsonDocument
            {
                ["_id"] = "$FileExtension",
                ["count"] = new BsonDocument("$sum", 1)
            })
            .ToListAsync();
        var recentUploadsTask = context.Documents.Find(activeFilter)
            .SortByDescending(x => x.UploadedAt)
            .Limit(5)
            .ToListAsync();
        var favoriteDocumentsTask = context.Documents.Find(activeFilter & Builders<DocumentFile>.Filter.Eq(x => x.IsFavorite, true))
            .SortByDescending(x => x.UpdatedAt)
            .Limit(5)
            .ToListAsync();
        var lastDownloadedDocumentsTask = context.Documents.Find(activeFilter & Builders<DocumentFile>.Filter.Ne(x => x.LastDownloadedAt, null))
            .SortByDescending(x => x.LastDownloadedAt)
            .Limit(5)
            .ToListAsync();
        var userTask = context.Users.Find(x => x.Id == userId).FirstOrDefaultAsync();

        await Task.WhenAll(totalDocumentsTask, storageTask, typeCountsTask, recentUploadsTask, favoriteDocumentsTask, lastDownloadedDocumentsTask, userTask);

        var storage = storageTask.Result;
        var typeCounts = typeCountsTask.Result
            .Where(x => x["_id"].IsString)
            .ToDictionary(x => x["_id"].AsString, x => x["count"].ToInt64());

        return new DashboardSummaryResponse
        {
            TotalDocuments = totalDocumentsTask.Result,
            TotalStorageUsed = storage is null ? 0 : storage["totalStorageUsed"].ToInt64(),
            DocumentsByType = typeCounts,
            RecentUploads = recentUploadsTask.Result.Select(Map).ToList(),
            FavoriteDocuments = favoriteDocumentsTask.Result.Select(Map).ToList(),
            LastDownloadedDocuments = lastDownloadedDocumentsTask.Result.Select(Map).ToList(),
            LastLoginAt = userTask.Result?.LastLoginAt
        };
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



