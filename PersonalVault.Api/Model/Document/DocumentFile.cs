using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace PersonalVault.Api.Model.Document;

public class DocumentFile
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string SafeFileName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string FileExtension { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string CloudinaryPublicId { get; set; } = string.Empty;
    public string CloudinarySecureUrl { get; set; } = string.Empty;
    public string CloudinaryResourceType { get; set; } = "raw";
    public string Folder { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = [];
    public bool IsFavorite { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastDownloadedAt { get; set; }
}



