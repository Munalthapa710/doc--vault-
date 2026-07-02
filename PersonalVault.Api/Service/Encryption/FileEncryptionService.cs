using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using PersonalVault.Api.Configurations;

namespace PersonalVault.Api.Service.Encryption;

public class FileEncryptionService(IOptions<SecuritySettings> securityOptions) : IFileEncryptionService
{
    private const int NonceSize = 12;
    private const int TagSize = 16;

    public async Task<EncryptedFile> EncryptAsync(Stream plainStream, CancellationToken cancellationToken)
    {
        await using var input = new MemoryStream();
        await plainStream.CopyToAsync(input, cancellationToken);
        var plainBytes = input.ToArray();
        var cipherBytes = new byte[plainBytes.Length];
        var nonce = RandomNumberGenerator.GetBytes(NonceSize);
        var tag = new byte[TagSize];

        using var aes = new AesGcm(ResolveKey(), TagSize);
        aes.Encrypt(nonce, plainBytes, cipherBytes, tag);

        return new EncryptedFile
        {
            Stream = new MemoryStream(cipherBytes),
            Nonce = Convert.ToBase64String(nonce),
            Tag = Convert.ToBase64String(tag)
        };
    }

    public async Task<Stream> DecryptAsync(Stream encryptedStream, string nonce, string tag, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(nonce) || string.IsNullOrWhiteSpace(tag))
        {
            throw new InvalidOperationException("Encrypted document metadata is missing.");
        }

        await using var input = new MemoryStream();
        await encryptedStream.CopyToAsync(input, cancellationToken);
        var cipherBytes = input.ToArray();
        var plainBytes = new byte[cipherBytes.Length];

        using var aes = new AesGcm(ResolveKey(), TagSize);
        aes.Decrypt(Convert.FromBase64String(nonce), cipherBytes, Convert.FromBase64String(tag), plainBytes);
        return new MemoryStream(plainBytes);
    }

    private byte[] ResolveKey()
    {
        var configuredKey = securityOptions.Value.FileEncryptionKey;
        if (!string.IsNullOrWhiteSpace(configuredKey))
        {
            try
            {
                var keyBytes = Convert.FromBase64String(configuredKey);
                if (keyBytes.Length is 16 or 24 or 32) return keyBytes;
            }
            catch (FormatException)
            {
                // Fall through to key derivation for deployments that provide a plain secret.
            }

            return SHA256.HashData(Encoding.UTF8.GetBytes(configuredKey));
        }

        throw new InvalidOperationException("Security:FileEncryptionKey must be configured.");
    }
}
