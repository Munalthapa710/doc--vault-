using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Options;
using PersonalVault.Api.Configurations;
using CloudinaryClient = CloudinaryDotNet.Cloudinary;

namespace PersonalVault.Api.Service.Cloudinary;

public class CloudinaryService(IHttpClientFactory httpClientFactory, IOptions<CloudinarySettings> options) : ICloudinaryService
{
    public async Task<CloudinaryUploadResult> UploadRawAsync(Stream stream, string userId, string safeFileName, CancellationToken cancellationToken)
    {
        var settings = options.Value;
        if (string.IsNullOrWhiteSpace(settings.CloudName) || string.IsNullOrWhiteSpace(settings.ApiKey) || string.IsNullOrWhiteSpace(settings.ApiSecret))
        {
            throw new InvalidOperationException("Cloudinary configuration is required for uploads.");
        }

        var folder = $"{settings.Folder.Trim('/')}/{userId}/documents";
        var publicId = Path.GetFileNameWithoutExtension(safeFileName);
        var cloudinary = CreateCloudinary(settings);

        if (stream.CanSeek) stream.Position = 0;
        var result = await cloudinary.UploadAsync(new RawUploadParams
        {
            File = new FileDescription(safeFileName, stream),
            Folder = folder,
            PublicId = publicId,
            UseFilename = false,
            UniqueFilename = false,
            Overwrite = false
        }, "raw", cancellationToken);

        if (result.Error is not null)
        {
            throw new InvalidOperationException($"Cloudinary upload failed: {result.Error.Message}");
        }

        return new CloudinaryUploadResult
        {
            PublicId = result.PublicId,
            SecureUrl = result.SecureUrl?.ToString() ?? string.Empty,
            ResourceType = "raw",
            Format = result.Format,
            Bytes = result.Bytes,
            Version = long.TryParse(result.Version, out var version) ? version : 0,
            CreatedAt = result.CreatedAt == default ? DateTime.UtcNow : result.CreatedAt
        };
    }

    public async Task<Stream> DownloadAsync(string publicId, string resourceType, string secureUrl, CancellationToken cancellationToken)
    {
        var client = httpClientFactory.CreateClient();
        var downloadUrl = string.IsNullOrWhiteSpace(secureUrl) ? CreateSignedUrl(publicId, resourceType) : secureUrl;
        var response = await client.GetAsync(downloadUrl, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new InvalidOperationException($"Cloudinary download failed: {error}");
        }
        return await response.Content.ReadAsStreamAsync(cancellationToken);
    }

    public async Task DeleteAsync(string publicId, string resourceType, CancellationToken cancellationToken)
    {
        var settings = options.Value;
        var cloudinary = CreateCloudinary(settings);
        var result = await cloudinary.DestroyAsync(new DeletionParams(publicId)
        {
            ResourceType = resourceType == "image" ? ResourceType.Image : ResourceType.Raw
        });
        if (result.Error is not null)
        {
            throw new InvalidOperationException($"Cloudinary delete failed: {result.Error.Message}");
        }
    }

    public string CreateSignedUrl(string publicId, string resourceType)
    {
        var settings = options.Value;
        return $"https://res.cloudinary.com/{settings.CloudName}/{resourceType}/upload/{publicId}";
    }

    private static CloudinaryClient CreateCloudinary(CloudinarySettings settings)
    {
        return new CloudinaryClient(new Account(settings.CloudName, settings.ApiKey, settings.ApiSecret))
        {
            Api =
            {
                Secure = true
            }
        };
    }
}



