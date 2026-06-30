using MongoDB.Driver;
using PersonalVault.Api.Model.Security;
using PersonalVault.Api.Data;
using AuditLogEntity = PersonalVault.Api.Model.Security.AuditLog;

namespace PersonalVault.Api.Service.AuditLog;

public class AuditLogService(ApplicationDbContext context) : IAuditLogService
{
    public async Task LogAsync(string? userId, string action, HttpContext httpContext, Dictionary<string, string>? metadata = null)
    {
        var log = new AuditLogEntity
        {
            UserId = userId,
            Action = action,
            IpAddress = httpContext.Connection.RemoteIpAddress?.ToString() ?? string.Empty,
            UserAgent = httpContext.Request.Headers.UserAgent.ToString(),
            Metadata = metadata ?? []
        };
        await context.AuditLogs.InsertOneAsync(log);
    }
}



