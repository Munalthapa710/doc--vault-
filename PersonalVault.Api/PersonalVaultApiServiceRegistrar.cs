using PersonalVault.Api.Service.AuditLog;
using PersonalVault.Api.Service.Auth;
using PersonalVault.Api.Service.Cloudinary;
using PersonalVault.Api.Service.Dashboard;
using PersonalVault.Api.Service.Document;
using PersonalVault.Api.Service.Email;
using PersonalVault.Api.Service.Otp;
using PersonalVault.Api.Service.Token;

namespace PersonalVault.Api;

public static class PersonalVaultApiServiceRegistrar
{
    public static IServiceCollection AddPersonalVaultApiServices(this IServiceCollection services)
    {
        services.AddScoped<IAuditLogService, AuditLogService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IOtpService, OtpService>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICloudinaryService, CloudinaryService>();
        services.AddScoped<IDocumentService, DocumentService>();
        services.AddScoped<IDashboardService, DashboardService>();

        return services;
    }
}
