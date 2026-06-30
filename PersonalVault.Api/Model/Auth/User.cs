using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace PersonalVault.Api.Model.Auth;

public class User
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PasswordHash { get; set; }
    public string? SecretWordHash { get; set; }
    public string AuthProvider { get; set; } = "Local";
    public string? GoogleId { get; set; }
    public bool IsEmailVerified { get; set; }
    public bool MustChangePassword { get; set; }
    public bool HasLocalPassword { get; set; }
    [BsonIgnore]
    public bool HasSecretWord => !string.IsNullOrWhiteSpace(SecretWordHash);
    public bool EmailOtpLoginEnabled { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
    public int FailedLoginCount { get; set; }
    public DateTime? LockoutEndAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
}



