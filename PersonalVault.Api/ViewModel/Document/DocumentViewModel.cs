using System.ComponentModel.DataAnnotations;

namespace PersonalVault.Api.ViewModel.Document;

public class DocumentQuery
{
    public string? Search { get; set; }
    public string? FileType { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
    public string Sort { get; set; } = "newest";
    public bool IncludeDeleted { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;
}

public record UpdateDocumentRequest([Required] string DisplayName, List<string>? Tags);

public class DocumentResponse
{
    public string Id { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string FileExtension { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public List<string> Tags { get; set; } = [];
    public bool IsFavorite { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime UploadedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? LastDownloadedAt { get; set; }
    public bool CanPreview { get; set; }
}

public class DashboardSummaryResponse
{
    public long TotalDocuments { get; set; }
    public long TotalStorageUsed { get; set; }
    public Dictionary<string, long> DocumentsByType { get; set; } = [];
    public IReadOnlyList<DocumentResponse> RecentUploads { get; set; } = [];
    public IReadOnlyList<DocumentResponse> FavoriteDocuments { get; set; } = [];
    public IReadOnlyList<DocumentResponse> LastDownloadedDocuments { get; set; } = [];
    public DateTime? LastLoginAt { get; set; }
}



