using MongoDB.Driver;
using PersonalVault.Api.Interfaces;
using PersonalVault.Api.Models;
using PersonalVault.Api.Repositories;

namespace PersonalVault.Api.Services;

public class AuditLogService(MongoContext context) : IAuditLogService
{
    public async Task LogAsync(string? userId, string action, HttpContext httpContext, Dictionary<string, string>? metadata = null)
    {
        var log = new AuditLog
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
