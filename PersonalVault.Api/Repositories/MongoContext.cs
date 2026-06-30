using Microsoft.Extensions.Options;
using MongoDB.Driver;
using PersonalVault.Api.Configurations;
using PersonalVault.Api.Models;

namespace PersonalVault.Api.Repositories;

public class MongoContext
{
    public IMongoDatabase Database { get; }
    public IMongoCollection<User> Users => Database.GetCollection<User>("Users");
    public IMongoCollection<DocumentFile> Documents => Database.GetCollection<DocumentFile>("Documents");
    public IMongoCollection<RefreshToken> RefreshTokens => Database.GetCollection<RefreshToken>("RefreshTokens");
    public IMongoCollection<OtpCode> Otps => Database.GetCollection<OtpCode>("Otps");
    public IMongoCollection<AuditLog> AuditLogs => Database.GetCollection<AuditLog>("AuditLogs");

    public MongoContext(IOptions<MongoDbSettings> options)
    {
        if (string.IsNullOrWhiteSpace(options.Value.ConnectionString))
        {
            throw new InvalidOperationException("MongoDb:ConnectionString is required.");
        }
        var client = new MongoClient(options.Value.ConnectionString);
        Database = client.GetDatabase(options.Value.DatabaseName);
    }

    public async Task EnsureIndexesAsync(CancellationToken cancellationToken = default)
    {
        await Users.Indexes.CreateOneAsync(new CreateIndexModel<User>(Builders<User>.IndexKeys.Ascending(x => x.Email), new CreateIndexOptions { Unique = true }), cancellationToken: cancellationToken);
        await Documents.Indexes.CreateManyAsync([
            new CreateIndexModel<DocumentFile>(Builders<DocumentFile>.IndexKeys.Ascending(x => x.UserId)),
            new CreateIndexModel<DocumentFile>(Builders<DocumentFile>.IndexKeys.Ascending(x => x.UserId).Ascending(x => x.IsDeleted)),
            new CreateIndexModel<DocumentFile>(Builders<DocumentFile>.IndexKeys.Ascending(x => x.UserId).Descending(x => x.UploadedAt)),
            new CreateIndexModel<DocumentFile>(Builders<DocumentFile>.IndexKeys.Ascending(x => x.Tags))
        ], cancellationToken);
        await RefreshTokens.Indexes.CreateOneAsync(new CreateIndexModel<RefreshToken>(Builders<RefreshToken>.IndexKeys.Ascending(x => x.UserId)), cancellationToken: cancellationToken);
        await Otps.Indexes.CreateManyAsync([
            new CreateIndexModel<OtpCode>(Builders<OtpCode>.IndexKeys.Ascending(x => x.UserId)),
            new CreateIndexModel<OtpCode>(Builders<OtpCode>.IndexKeys.Ascending(x => x.ExpiresAt), new CreateIndexOptions { ExpireAfter = TimeSpan.Zero })
        ], cancellationToken);
        await AuditLogs.Indexes.CreateOneAsync(new CreateIndexModel<AuditLog>(Builders<AuditLog>.IndexKeys.Ascending(x => x.UserId).Descending(x => x.CreatedAt)), cancellationToken: cancellationToken);
    }
}
