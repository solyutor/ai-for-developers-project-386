namespace CalendarBooking.Api.Dtos;

public class CreateBookingRequest
{
    public Guid SlotId { get; set; }
    public required string GuestName { get; set; }
    public required string GuestEmail { get; set; }
}
