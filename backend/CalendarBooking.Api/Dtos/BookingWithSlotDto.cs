using CalendarBooking.Api.Models;

namespace CalendarBooking.Api.Dtos;

public class BookingWithSlotDto
{
    public Guid Id { get; set; }
    public Guid SlotId { get; set; }
    public required string GuestName { get; set; }
    public required string GuestEmail { get; set; }
    public DateTime CreatedAt { get; set; }
    public required Slot Slot { get; set; }
}
