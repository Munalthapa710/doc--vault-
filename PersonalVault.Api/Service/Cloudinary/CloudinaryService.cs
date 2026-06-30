using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using PersonalVault.Api.Configurations;

namespace PersonalVault.Api.Service.Cloudinary;

public class CloudinaryService(IHttpClientFactory httpClientFactory, IOptions<CloudinarySettings> options) : ICloudinaryService
{
    public async Task<CloudinaryUploadResult> UploadAsync(IFormFile file, string userId, string safeFileName, CancellationToken cancellationToken)
    {
        var settings = options.Value;
        if (string.IsNullOrWhiteSpace(settings.CloudName) || string.IsNullOrWhiteSpace(settings.ApiKey) || string.IsNullOrWhiteSpace(settings.ApiSecret))
        {
            throw new InvalidOperationException("Cloudinary configuration is required for uploads.");
        }
        var resourceType = file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase) ? "image" : "raw";
        var folder = $"{settings.Folder.Trim('/')}/{userId}/documents";
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        var publicId = Path.GetFileNameWithoutExtension(safeFileName);
        var signatureBase = $"folder={folder}&public_id={publicId}&timestamp={timestamp}&type=authenticated{settings.ApiSecret}";
        var signature = Sha1(signatureBase);

        using var content = new MultipartFormDataContent();
        await using var stream = file.OpenReadStream();
        using var fileContent = new StreamContent(stream);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);
        content.Add(fileContent, "file", safeFileName);
        content.Add(new StringContent(settings.ApiKey), "api_key");
        content.Add(new StringContent(timestamp), "timestamp");
        content.Add(new StringContent(signature), "signature");
        content.Add(new StringContent(folder), "folder");
        content.Add(new StringContent(publicId), "public_id");
        content.Add(new StringContent("authenticated"), "type");

        var client = httpClientFactory.CreateClient();
        using var response = await client.PostAsync($"https://api.cloudinary.com/v1_1/{settings.CloudName}/{resourceType}/upload", content, cancellationToken);
        response.EnsureSuccessStatusCode();
        await using var responseStream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var json = await JsonDocument.ParseAsync(responseStream, cancellationToken: cancellationToken);
        var root = json.RootElement;
        return new CloudinaryUploadResult
        {
            PublicId = root.GetProperty("public_id").GetString() ?? string.Empty,
            SecureUrl = root.TryGetProperty("secure_url", out var url) ? url.GetString() ?? string.Empty : string.Empty,
            ResourceType = resourceType,
            Format = root.TryGetProperty("format", out var format) ? format.GetString() ?? string.Empty : string.Empty,
            Bytes = root.TryGetProperty("bytes", out var bytes) ? bytes.GetInt64() : file.Length,
            Version = root.TryGetProperty("version", out var version) ? version.GetInt64() : 0,
            CreatedAt = DateTime.UtcNow
        };
    }

    public async Task<Stream> DownloadAsync(string publicId, string resourceType, CancellationToken cancellationToken)
    {
        var client = httpClientFactory.CreateClient();
        var response = await client.GetAsync(CreateSignedUrl(publicId, resourceType), cancellationToken);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsStreamAsync(cancellationToken);
    }

    public async Task DeleteAsync(string publicId, string resourceType, CancellationToken cancellationToken)
    {
        var settings = options.Value;
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        var signature = Sha1($"public_id={publicId}&timestamp={timestamp}&type=authenticated{settings.ApiSecret}");
        using var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["public_id"] = publicId,
            ["timestamp"] = timestamp,
            ["type"] = "authenticated",
            ["api_key"] = settings.ApiKey,
            ["signature"] = signature
        });
        var client = httpClientFactory.CreateClient();
        using var response = await client.PostAsync($"https://api.cloudinary.com/v1_1/{settings.CloudName}/{resourceType}/destroy", content, cancellationToken);
        response.EnsureSuccessStatusCode();
    }

    public string CreateSignedUrl(string publicId, string resourceType)
    {
        var settings = options.Value;
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var signature = Sha1($"public_id={publicId}&timestamp={timestamp}{settings.ApiSecret}");
        return $"https://res.cloudinary.com/{settings.CloudName}/{resourceType}/authenticated/s--{signature}--/v{timestamp}/{publicId}";
    }

    private static string Sha1(string value)
    {
        var bytes = SHA1.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}



