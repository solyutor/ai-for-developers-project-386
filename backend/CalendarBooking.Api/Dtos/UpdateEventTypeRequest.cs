namespace CalendarBooking.Api.Dtos;

public class UpdateEventTypeRequest
{
    public required string Name { get; set; }
    public required string Description { get; set; }
    public int DurationMinutes { get; set; }
    public int SlotIntervalMinutes { get; set; }
}
