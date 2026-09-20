using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace PersonalVault.Api.Api;

[ApiController]
public abstract class BaseApiController : ControllerBase
{
    protected IActionResult HttpResponse(int status, string message, object? data = null)
    {
        return StatusCode(status, new ApiResponse<object?>
        {
            Code = status,
            Message = message,
            Data = data,
            Errors = []
        });
    }

    protected IActionResult SuccessResponse(string message, object? data = null)
    {
        return HttpResponse(StatusCodes.Status200OK, message, data);
    }

    protected IActionResult CreatedResponse(string message, object? data = null)
    {
        return HttpResponse(StatusCodes.Status201Created, message, data);
    }

    protected IActionResult ErrorResponse(int status, string message, object? errors = null)
    {
        var errorMessages = errors switch
        {
            null => new[] { message },
            string value => new[] { value },
            IEnumerable<string> values => values.ToArray(),
            _ => new[] { errors.ToString() ?? message }
        };

        return StatusCode(status, new ApiResponse<object?>
        {
            Code = status,
            Message = message,
            Data = null,
            Errors = errorMessages
        });
    }

    protected IActionResult ValidationResponse(ModelStateDictionary modelState)
    {
        var errors = modelState.Values
            .SelectMany(x => x.Errors)
            .Select(x => x.ErrorMessage)
            .ToArray();

        return StatusCode(StatusCodes.Status400BadRequest, new ApiResponse<object?>
        {
            Code = StatusCodes.Status400BadRequest,
            Message = "Validation Failed",
            Data = null,
            Errors = errors
        });
    }

    protected IActionResult NotFoundResponse(string message = "Data not found.")
    {
        return ErrorResponse(StatusCodes.Status404NotFound, message);
    }

    protected IActionResult ExceptionResponse(Exception exception)
    {
        return ErrorResponse(StatusCodes.Status500InternalServerError, "Something went wrong.", exception.Message);
    }
}
