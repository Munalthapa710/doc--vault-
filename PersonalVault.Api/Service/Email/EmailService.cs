using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using PersonalVault.Api.Configurations;

namespace PersonalVault.Api.Service.Email;

public class EmailService(IHttpClientFactory httpClientFactory, IOptions<BrevoSettings> options, ILogger<EmailService> logger) : IEmailService
{
    public async Task SendOtpAsync(string email, string fullName, string otp, string purpose)
    {
        var settings = options.Value;
        if (string.IsNullOrWhiteSpace(settings.ApiKey) || string.IsNullOrWhiteSpace(settings.SenderEmail))
        {
            logger.LogWarning("Brevo is not configured. OTP for {Purpose} was generated but not sent.", purpose);
            return;
        }

        var client = httpClientFactory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email");
        request.Headers.Add("api-key", settings.ApiKey);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        var subject = purpose switch
        {
            "EmailVerification" => "Verify your Personal Vault email",
            "PasswordReset" => "Reset your Personal Vault password",
            _ => "Your Personal Vault login code"
        };
        var payload = new
        {
            sender = new { email = settings.SenderEmail, name = settings.SenderName },
            to = new[] { new { email, name = fullName } },
            subject,
            htmlContent = $"<p>Hello {System.Net.WebUtility.HtmlEncode(fullName)},</p><p>Your OTP is <strong>{otp}</strong>. It expires in 5 minutes.</p>"
        };
        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        using var response = await client.SendAsync(request);
        response.EnsureSuccessStatusCode();
    }
}



