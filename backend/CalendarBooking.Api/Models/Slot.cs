namespace CalendarBooking.Api.Models;

public class Slot
{
    public Guid Id { get; set; }
    public Guid EventTypeId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public bool IsOccupied { get; set; }

    public EventType EventType { get; set; } = null!;
}
