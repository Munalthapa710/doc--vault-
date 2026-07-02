using System.Text.RegularExpressions;

namespace PersonalVault.Api.Helpers;

public static class FileHelpers
{
    private static readonly Dictionary<string, string[]> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        [".jpg"] = ["image/jpeg"],
        [".jpeg"] = ["image/jpeg"],
        [".png"] = ["image/png"],
        [".webp"] = ["image/webp"],
        [".pdf"] = ["application/pdf"],
        [".doc"] = ["application/msword", "application/octet-stream"],
        [".docx"] = ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/octet-stream"],
        [".xls"] = ["application/vnd.ms-excel", "application/octet-stream"],
        [".xlsx"] = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/octet-stream"],
        [".txt"] = ["text/plain"]
    };

    public static bool IsAllowed(string extension, string mimeType)
    {
        return AllowedMimeTypes.TryGetValue(extension.ToLowerInvariant(), out var mimes) && mimes.Contains(mimeType, StringComparer.OrdinalIgnoreCase);
    }

    public static async Task<bool> IsAllowedFileAsync(IFormFile file, string extension, CancellationToken cancellationToken)
    {
        if (!IsAllowed(extension, file.ContentType)) return false;

        var header = new byte[16];
        await using var stream = file.OpenReadStream();
        var read = await stream.ReadAsync(header, cancellationToken);

        return extension.ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => read >= 3 && header[0] == 0xff && header[1] == 0xd8 && header[2] == 0xff,
            ".png" => read >= 8 && header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4e && header[3] == 0x47 && header[4] == 0x0d && header[5] == 0x0a && header[6] == 0x1a && header[7] == 0x0a,
            ".webp" => read >= 12 && header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46 && header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50,
            ".pdf" => read >= 5 && header[0] == 0x25 && header[1] == 0x50 && header[2] == 0x44 && header[3] == 0x46 && header[4] == 0x2d,
            ".doc" or ".xls" => HasPrefix(header, read, new byte[] { 0xd0, 0xcf, 0x11, 0xe0 }),
            ".docx" or ".xlsx" => HasPrefix(header, read, new byte[] { 0x50, 0x4b, 0x03, 0x04 }) || HasPrefix(header, read, new byte[] { 0x50, 0x4b, 0x05, 0x06 }) || HasPrefix(header, read, new byte[] { 0x50, 0x4b, 0x07, 0x08 }),
            ".txt" => read > 0 && header.Take(read).All(x => (x is 0x09 or 0x0a or 0x0d) || x >= 0x20),
            _ => false
        };
    }

    private static bool HasPrefix(byte[] header, int read, byte[] prefix) => read >= prefix.Length && header.Take(prefix.Length).SequenceEqual(prefix);

    public static bool CanPreview(string extension)
    {
        return new[] { ".jpg", ".jpeg", ".png", ".webp", ".pdf", ".txt" }.Contains(extension.ToLowerInvariant());
    }

    public static string SanitizeDisplayName(string fileName)
    {
        var name = Path.GetFileNameWithoutExtension(fileName);
        name = Regex.Replace(name, @"[^\w\-. ]+", "_").Trim();
        return string.IsNullOrWhiteSpace(name) ? "document" : name[..Math.Min(name.Length, 120)];
    }
}
