namespace CalendarBooking.Api.Models;

public class ErrorResponse
{
    public int Code { get; set; }
    public required string Message { get; set; }
}
