namespace PersonalVault.Api.Service.AuditLog;

public interface IAuditLogService
{
    Task LogAsync(string? userId, string action, HttpContext httpContext, Dictionary<string, string>? metadata = null);
}


