namespace CalendarBooking.Api.Models;

public class EventType
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
    public int DurationMinutes { get; set; }
    public int SlotIntervalMinutes { get; set; }
}
