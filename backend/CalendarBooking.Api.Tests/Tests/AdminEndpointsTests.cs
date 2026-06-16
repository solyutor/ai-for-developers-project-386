using System.Net;
using System.Net.Http.Json;
using CalendarBooking.Api.Dtos;
using CalendarBooking.Api.Models;

namespace CalendarBooking.Api.Tests.Tests;

public class AdminEndpointsTests
{
    [Test]
    public async Task ListEventTypes_Empty_ReturnsEmptyList()
    {
        await using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/event-types");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var body = await response.Content.ReadFromJsonAsync<EventType[]>();
        Assert.That(body, Is.Empty);
    }

    [Test]
    public async Task CreateEventType_ReturnsCreated()
    {
        await using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();

        var payload = new CreateEventTypeRequest
        {
            Name = "Consultation",
            Description = "30 min meeting",
            DurationMinutes = 30,
            SlotIntervalMinutes = 60,
        };

        var response = await client.PostAsJsonAsync("/api/event-types", payload);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var body = await response.Content.ReadFromJsonAsync<EventType>();
        Assert.That(body, Is.Not.Null);
        Assert.That(body!.Id, Is.Not.EqualTo(Guid.Empty));
        Assert.That(body.Name, Is.EqualTo("Consultation"));
    }

    [Test]
    public async Task ListEventTypes_AfterCreate_ReturnsOne()
    {
        await using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();

        var payload = new CreateEventTypeRequest
        {
            Name = "Consultation",
            Description = "30 min meeting",
            DurationMinutes = 30,
            SlotIntervalMinutes = 60,
        };
        await client.PostAsJsonAsync("/api/event-types", payload);

        var response = await client.GetAsync("/api/event-types");
        var body = await response.Content.ReadFromJsonAsync<EventType[]>();

        Assert.That(body, Has.Length.EqualTo(1));
    }

    [Test]
    public async Task UpdateEventType_ReturnsUpdated()
    {
        await using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();

        var createPayload = new CreateEventTypeRequest
        {
            Name = "Original",
            Description = "Original desc",
            DurationMinutes = 30,
            SlotIntervalMinutes = 60,
        };
        var createResponse = await client.PostAsJsonAsync("/api/event-types", createPayload);
        var created = await createResponse.Content.ReadFromJsonAsync<EventType>();

        var updatePayload = new UpdateEventTypeRequest
        {
            Name = "Updated",
            Description = "Updated desc",
            DurationMinutes = 45,
            SlotIntervalMinutes = 30,
        };
        var updateResponse = await client.PutAsJsonAsync($"/api/event-types/{created!.Id}", updatePayload);

        Assert.That(updateResponse.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var updated = await updateResponse.Content.ReadFromJsonAsync<EventType>();
        Assert.That(updated!.Name, Is.EqualTo("Updated"));
        Assert.That(updated.DurationMinutes, Is.EqualTo(45));
    }

    [Test]
    public async Task DeleteEventType_RemovesIt()
    {
        await using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();

        var createPayload = new CreateEventTypeRequest
        {
            Name = "ToDelete",
            Description = "Will be deleted",
            DurationMinutes = 30,
            SlotIntervalMinutes = 60,
        };
        var createResponse = await client.PostAsJsonAsync("/api/event-types", createPayload);
        var created = await createResponse.Content.ReadFromJsonAsync<EventType>();

        var deleteResponse = await client.DeleteAsync($"/api/event-types/{created!.Id}");

        Assert.That(deleteResponse.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));

        var listResponse = await client.GetAsync("/api/event-types");
        var list = await listResponse.Content.ReadFromJsonAsync<EventType[]>();
        Assert.That(list, Is.Empty);
    }

    [Test]
    public async Task ListSlots_ReturnsSlots()
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

        var response = await client.GetAsync($"/api/slots?eventTypeId={eventType!.Id}");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var slots = await response.Content.ReadFromJsonAsync<Slot[]>();
        Assert.That(slots, Is.Not.Empty);
        Assert.That(slots!.All(s => s.EventTypeId == eventType.Id), Is.True);
    }

    [Test]
    public async Task ListBookings_ReturnsEmpty()
    {
        await using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/bookings");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var body = await response.Content.ReadFromJsonAsync<object[]>();
        Assert.That(body, Is.Empty);
    }

    [Test]
    public async Task DeleteBooking_NotFound_Returns404()
    {
        await using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.DeleteAsync($"/api/bookings/{Guid.NewGuid()}");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }
}
