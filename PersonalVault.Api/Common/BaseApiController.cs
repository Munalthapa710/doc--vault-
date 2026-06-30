using Microsoft.AspNetCore.Mvc;

namespace PersonalVault.Api.Common;

[ApiController]
public abstract class BaseApiController : ControllerBase
{
    protected IActionResult HttpResponse(int status, string message, object? data = null)
    {
        object body = data is null ? new { status, message } : new { status, message, data };
        return StatusCode(status, body);
    }

    protected IActionResult ErrorResponse(int status, string message, object? errors = null)
    {
        object body = errors is null ? new { status, message } : new { status, message, errors };
        return StatusCode(status, body);
    }
}

public class PagedResult<T>
{
    public IReadOnlyList<T> Rows { get; set; } = [];
    public long Total { get; set; }
    public int Page { get; set; }
    public int Pages { get; set; }
}
