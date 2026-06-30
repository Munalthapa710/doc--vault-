using System.Net;

namespace PersonalVault.Api.Middleware;

public class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            var status = ex switch
            {
                UnauthorizedAccessException => (int)HttpStatusCode.Unauthorized,
                KeyNotFoundException => (int)HttpStatusCode.NotFound,
                InvalidOperationException => (int)HttpStatusCode.BadRequest,
                _ => (int)HttpStatusCode.InternalServerError
            };
            if (status == 500) logger.LogError(ex, "Unhandled API exception");
            context.Response.StatusCode = status;
            context.Response.ContentType = "application/json";
            var message = status == 500 ? "Something went wrong." : ex.Message;
            await context.Response.WriteAsJsonAsync(new { status, message });
        }
    }
}
