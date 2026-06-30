using Microsoft.Extensions.Options;
using MongoDB.Driver;
using PersonalVault.Api.Configurations;
using PersonalVault.Api.Helpers;
using PersonalVault.Api.Model.Auth;
using PersonalVault.Api.Model.Document;
using PersonalVault.Api.Model.Security;
using PersonalVault.Api.Data;
using PersonalVault.Api.Service.AuditLog;
using PersonalVault.Api.Service.Email;

namespace PersonalVault.Api.Service.Otp;

public class OtpService(ApplicationDbContext context, IEmailService emailService, IAuditLogService auditLogService, IOptions<SecuritySettings> options) : IOtpService
{
    public async Task SendOtpAsync(User user, string purpose, HttpContext httpContext, bool enforceCooldown = true)
    {
        var settings = options.Value;
        var now = DateTime.UtcNow;
        var existing = await context.Otps.Find(x => x.UserId == user.Id && x.Purpose == purpose && x.UsedAt == null && x.ExpiresAt > now)
            .SortByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync();

        if (enforceCooldown && existing?.LastSentAt is not null && existing.LastSentAt.Value.AddSeconds(settings.ResendOtpCooldownSeconds) > now)
        {
            throw new InvalidOperationException("Please wait before requesting another OTP.");
        }

        var otp = SecurityHelpers.GenerateOtp();
        var entity = new OtpCode
        {
            UserId = user.Id!,
            Email = user.Email,
            Purpose = purpose,
            OtpHash = SecurityHelpers.Sha256($"{user.Id}:{purpose}:{otp}"),
            ExpiresAt = now.AddMinutes(settings.OtpExpiryMinutes),
            LastSentAt = now
        };
        await context.Otps.InsertOneAsync(entity);
        await emailService.SendOtpAsync(user.Email, user.FullName, otp, purpose);
        await auditLogService.LogAsync(user.Id, "OTP sent", httpContext, new Dictionary<string, string> { ["purpose"] = purpose });
    }

    public async Task<bool> VerifyOtpAsync(User user, string purpose, string otp, HttpContext httpContext)
    {
        var settings = options.Value;
        var now = DateTime.UtcNow;
        var entity = await context.Otps.Find(x => x.UserId == user.Id && x.Purpose == purpose && x.UsedAt == null && x.ExpiresAt > now)
            .SortByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync();
        if (entity is null) return false;
        if (entity.Attempts >= settings.MaxOtpAttempts) return false;

        var expected = SecurityHelpers.Sha256($"{user.Id}:{purpose}:{otp}");
        if (!SecurityHelpers.FixedTimeEquals(entity.OtpHash, expected))
        {
            await context.Otps.UpdateOneAsync(x => x.Id == entity.Id, Builders<OtpCode>.Update.Inc(x => x.Attempts, 1));
            return false;
        }

        await context.Otps.UpdateOneAsync(x => x.Id == entity.Id, Builders<OtpCode>.Update.Set(x => x.UsedAt, now));
        await auditLogService.LogAsync(user.Id, "OTP verified", httpContext, new Dictionary<string, string> { ["purpose"] = purpose });
        return true;
    }
}



