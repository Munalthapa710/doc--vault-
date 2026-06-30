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
        var docs = await context.Documents.Find(x => x.UserId == userId && !x.IsDeleted).ToListAsync();
        var user = await context.Users.Find(x => x.Id == userId).FirstOrDefaultAsync();
        return new DashboardSummaryResponse
        {
            TotalDocuments = docs.Count,
            TotalStorageUsed = docs.Sum(x => x.FileSize),
            DocumentsByType = docs.GroupBy(x => x.FileExtension).ToDictionary(x => x.Key, x => (long)x.Count()),
            RecentUploads = docs.OrderByDescending(x => x.UploadedAt).Take(5).Select(Map).ToList(),
            FavoriteDocuments = docs.Where(x => x.IsFavorite).OrderByDescending(x => x.UpdatedAt).Take(5).Select(Map).ToList(),
            LastDownloadedDocuments = docs.Where(x => x.LastDownloadedAt is not null).OrderByDescending(x => x.LastDownloadedAt).Take(5).Select(Map).ToList(),
            LastLoginAt = user?.LastLoginAt
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



