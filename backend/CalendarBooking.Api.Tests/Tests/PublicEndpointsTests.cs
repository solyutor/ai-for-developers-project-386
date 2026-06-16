using System.Net;
using System.Net.Http.Json;
using CalendarBooking.Api.Dtos;
using CalendarBooking.Api.Models;

namespace CalendarBooking.Api.Tests.Tests;

public class PublicEndpointsTests
{
    [Test]
    public async Task GetEventType_ReturnsEventType()
    {
        await using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();

        var createPayload = new CreateEventTypeRequest
        {
            Name = "Consultation",
            Description = "desc",
            DurationMinutes = 30,
            SlotIntervalMinutes = 60,
        };
        var createResponse = await client.PostAsJsonAsync("/api/event-types", createPayload);
        var eventType = await createResponse.Content.ReadFromJsonAsync<EventType>();

        var response = await client.GetAsync($"/api/public/event-types/{eventType!.Id}");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var body = await response.Content.ReadFromJsonAsync<EventType>();
        Assert.That(body!.Name, Is.EqualTo("Consultation"));
    }

    [Test]
    public async Task GetEventType_NotFound_Returns404()
    {
        await using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync($"/api/public/event-types/{Guid.NewGuid()}");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    public async Task GetAvailableSlots_ReturnsOnlyFree()
    {
        await using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();

        var createPayload = new CreateEventTypeRequest
        {
            Name = "Consultation",
            Description = "desc",
            DurationMinutes = 60,
            SlotIntervalMinutes = 60,
        };
        var createResponse = await client.PostAsJsonAsync("/api/event-types", createPayload);
        var eventType = await createResponse.Content.ReadFromJsonAsync<EventType>();

        var slotsResponse = await client.GetAsync($"/api/slots?eventTypeId={eventType!.Id}");
        var allSlots = await slotsResponse.Content.ReadFromJsonAsync<Slot[]>();

        var firstSlot = allSlots!.First(s => !s.IsOccupied);

        var bookingPayload = new CreateBookingRequest
        {
            SlotId = firstSlot.Id,
            GuestName = "John",
            GuestEmail = "john@example.com",
        };
        await client.PostAsJsonAsync("/api/public/bookings", bookingPayload);

        var availableResponse = await client.GetAsync($"/api/public/event-types/{eventType.Id}/slots");
        var availableSlots = await availableResponse.Content.ReadFromJsonAsync<Slot[]>();

        Assert.That(availableSlots, Is.Not.Null);
        Assert.That(availableSlots!.All(s => !s.IsOccupied), Is.True);
        Assert.That(availableSlots.Any(s => s.Id == firstSlot.Id), Is.False);
    }

    [Test]
    public async Task CreateBooking_ReturnsCreated()
    {
        await using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();

        var createPayload = new CreateEventTypeRequest
        {
            Name = "Consultation",
            Description = "desc",
            DurationMinutes = 30,
            SlotIntervalMinutes = 60,
        };
        var createResponse = await client.PostAsJsonAsync("/api/event-types", createPayload);
        var eventType = await createResponse.Content.ReadFromJsonAsync<EventType>();

        var slotsResponse = await client.GetAsync($"/api/slots?eventTypeId={eventType!.Id}");
        var allSlots = await slotsResponse.Content.ReadFromJsonAsync<Slot[]>();
        var freeSlot = allSlots!.First(s => !s.IsOccupied);

        var bookingPayload = new CreateBookingRequest
        {
            SlotId = freeSlot.Id,
            GuestName = "Jane",
            GuestEmail = "jane@example.com",
        };
        var bookingResponse = await client.PostAsJsonAsync("/api/public/bookings", bookingPayload);

        Assert.That(bookingResponse.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var booking = await bookingResponse.Content.ReadFromJsonAsync<Booking>();
        Assert.That(booking!.GuestName, Is.EqualTo("Jane"));
        Assert.That(booking.SlotId, Is.EqualTo(freeSlot.Id));
    }

    [Test]
    public async Task CreateBooking_DoubleBooking_ReturnsConflict()
    {
        await using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();

        var createPayload = new CreateEventTypeRequest
        {
            Name = "Consultation",
            Description = "desc",
            DurationMinutes = 30,
            SlotIntervalMinutes = 60,
        };
        var createResponse = await client.PostAsJsonAsync("/api/event-types", createPayload);
        var eventType = await createResponse.Content.ReadFromJsonAsync<EventType>();

        var slotsResponse = await client.GetAsync($"/api/slots?eventTypeId={eventType!.Id}");
        var allSlots = await slotsResponse.Content.ReadFromJsonAsync<Slot[]>();
        var freeSlot = allSlots!.First(s => !s.IsOccupied);

        var bookingPayload = new CreateBookingRequest
        {
            SlotId = freeSlot.Id,
            GuestName = "Jane",
            GuestEmail = "jane@example.com",
        };
        await client.PostAsJsonAsync("/api/public/bookings", bookingPayload);

        var secondResponse = await client.PostAsJsonAsync("/api/public/bookings", bookingPayload);

        Assert.That(secondResponse.StatusCode, Is.EqualTo(HttpStatusCode.Conflict));
    }

    [Test]
    public async Task CreateBooking_CrossEventType_MarksOtherSlotOccupied()
    {
        await using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();

        var payloadA = new CreateEventTypeRequest
        {
            Name = "EventTypeA",
            Description = "desc",
            DurationMinutes = 60,
            SlotIntervalMinutes = 60,
        };
        var createA = await client.PostAsJsonAsync("/api/event-types", payloadA);
        var eventTypeA = await createA.Content.ReadFromJsonAsync<EventType>();

        var payloadB = new CreateEventTypeRequest
        {
            Name = "EventTypeB",
            Description = "desc",
            DurationMinutes = 60,
            SlotIntervalMinutes = 60,
        };
        var createB = await client.PostAsJsonAsync("/api/event-types", payloadB);
        var eventTypeB = await createB.Content.ReadFromJsonAsync<EventType>();

        var slotsAResponse = await client.GetAsync($"/api/slots?eventTypeId={eventTypeA!.Id}");
        var slotsA = await slotsAResponse.Content.ReadFromJsonAsync<Slot[]>();
        var firstSlotA = slotsA!.First(s => !s.IsOccupied);

        var bookingPayload = new CreateBookingRequest
        {
            SlotId = firstSlotA.Id,
            GuestName = "Jane",
            GuestEmail = "jane@example.com",
        };
        await client.PostAsJsonAsync("/api/public/bookings", bookingPayload);

        var slotsBResponse = await client.GetAsync($"/api/slots?eventTypeId={eventTypeB!.Id}");
        var slotsB = await slotsBResponse.Content.ReadFromJsonAsync<Slot[]>();

        var overlapping = slotsB!.FirstOrDefault(s =>
            s.StartTime == firstSlotA.StartTime);

        Assert.That(overlapping, Is.Not.Null);
        Assert.That(overlapping!.IsOccupied, Is.True);
    }
}
