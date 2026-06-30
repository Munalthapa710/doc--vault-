namespace PersonalVault.Api.Service.Email;

public interface IEmailService
{
    Task SendOtpAsync(string email, string fullName, string otp, string purpose);
}


