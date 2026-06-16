namespace CalendarBooking.Api.Models;

public class Booking
{
    public Guid Id { get; set; }
    public Guid SlotId { get; set; }
    public required string GuestName { get; set; }
    public required string GuestEmail { get; set; }
    public DateTime CreatedAt { get; set; }

    public Slot Slot { get; set; } = null!;
}
