namespace PersonalVault.Api.Configurations;

public class MongoDbSettings
{
    public string ConnectionString { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = "personal_vault";
}

public class JwtSettings
{
    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = "PersonalVault";
    public string Audience { get; set; } = "PersonalVaultClient";
    public int AccessTokenMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 14;
}

public class CloudinarySettings
{
    public string CloudName { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public string ApiSecret { get; set; } = string.Empty;
    public string Folder { get; set; } = "personal-vault";
}

public class BrevoSettings
{
    public string ApiKey { get; set; } = string.Empty;
    public string SenderEmail { get; set; } = string.Empty;
    public string SenderName { get; set; } = "Personal Vault";
}

public class GoogleAuthSettings
{
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
}

public class SecuritySettings
{
    public string[] AllowedCorsOrigins { get; set; } = [];
    public long MaxFileSizeBytes { get; set; } = 26214400;
    public int ResendOtpCooldownSeconds { get; set; } = 60;
    public int OtpExpiryMinutes { get; set; } = 5;
    public int MaxOtpAttempts { get; set; } = 5;
    public int MaxLoginAttempts { get; set; } = 5;
    public int LockoutMinutes { get; set; } = 15;
    public bool EnableEmailOtpLogin { get; set; } = true;
}
