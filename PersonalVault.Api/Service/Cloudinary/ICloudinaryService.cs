namespace PersonalVault.Api.Service.Cloudinary;

public interface ICloudinaryService
{
    Task<CloudinaryUploadResult> UploadAsync(IFormFile file, string userId, string safeFileName, CancellationToken cancellationToken);
    Task<Stream> DownloadAsync(string publicId, string resourceType, CancellationToken cancellationToken);
    Task DeleteAsync(string publicId, string resourceType, CancellationToken cancellationToken);
    string CreateSignedUrl(string publicId, string resourceType);
}

public class CloudinaryUploadResult
{
    public string PublicId { get; set; } = string.Empty;
    public string SecureUrl { get; set; } = string.Empty;
    public string ResourceType { get; set; } = "raw";
    public string Format { get; set; } = string.Empty;
    public long Bytes { get; set; }
    public long Version { get; set; }
    public DateTime CreatedAt { get; set; }
}


