namespace PersonalVault.Api.Service.Encryption;

public interface IFileEncryptionService
{
    Task<EncryptedFile> EncryptAsync(Stream plainStream, CancellationToken cancellationToken);
    Task<Stream> DecryptAsync(Stream encryptedStream, string nonce, string tag, CancellationToken cancellationToken);
}

public class EncryptedFile
{
    public Stream Stream { get; set; } = Stream.Null;
    public string Nonce { get; set; } = string.Empty;
    public string Tag { get; set; } = string.Empty;
}
