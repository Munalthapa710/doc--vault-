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
