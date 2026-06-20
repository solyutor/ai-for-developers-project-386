using Microsoft.EntityFrameworkCore;
using CalendarBooking.Api;
using CalendarBooking.Api.Data;
using CalendarBooking.Api.Dtos;
using CalendarBooking.Api.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default")));

var port = Environment.GetEnvironmentVariable("PORT") ?? "4010";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

// ─── Admin endpoints ───

var admin = app.MapGroup("/api").WithTags("Admin");

admin.MapGet("/event-types", async (AppDbContext db) =>
    await db.EventTypes.ToListAsync());

admin.MapPost("/event-types", async (CreateEventTypeRequest req, AppDbContext db) =>
{
    var entity = new EventType
    {
        Id = Guid.NewGuid(),
        OwnerId = Config.OwnerId,
        Name = req.Name,
        Description = req.Description,
        DurationMinutes = req.DurationMinutes,
        SlotIntervalMinutes = req.SlotIntervalMinutes,
    };
    db.EventTypes.Add(entity);
    await db.SaveChangesAsync();
    return Results.Ok(entity);
});

admin.MapPut("/event-types/{id:guid}", async (Guid id, UpdateEventTypeRequest req, AppDbContext db) =>
{
    var entity = await db.EventTypes.FindAsync(id);
    if (entity is null) return Results.NotFound();

    entity.Name = req.Name;
    entity.Description = req.Description;
    entity.DurationMinutes = req.DurationMinutes;
    entity.SlotIntervalMinutes = req.SlotIntervalMinutes;
    await db.SaveChangesAsync();
    return Results.Ok(entity);
});

admin.MapDelete("/event-types/{id:guid}", async (Guid id, AppDbContext db) =>
{
    var entity = await db.EventTypes.FindAsync(id);
    if (entity is null) return Results.NotFound();

    var slotIds = await db.Slots.Where(s => s.EventTypeId == id).Select(s => s.Id).ToListAsync();
    var bookings = await db.Bookings.Where(b => slotIds.Contains(b.SlotId)).ToListAsync();
    db.Bookings.RemoveRange(bookings);
    db.Slots.RemoveRange(db.Slots.Where(s => s.EventTypeId == id));
    db.EventTypes.Remove(entity);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

admin.MapGet("/slots", async (Guid eventTypeId, AppDbContext db) =>
{
    var eventType = await db.EventTypes.FindAsync(eventTypeId);
    if (eventType is null) return Results.NotFound();

    var slots = await EnsureSlotsAsync(db, eventType, CancellationToken.None);
    return Results.Ok(slots);
});

admin.MapGet("/bookings", async (AppDbContext db) =>
{
    var bookings = await db.Bookings.Include(b => b.Slot).ToListAsync();
    var dtos = bookings.Select(b => new BookingWithSlotDto
    {
        Id = b.Id,
        SlotId = b.SlotId,
        GuestName = b.GuestName,
        GuestEmail = b.GuestEmail,
        CreatedAt = b.CreatedAt,
        Slot = b.Slot,
    }).ToList();
    return Results.Ok(dtos);
});

admin.MapDelete("/bookings/{id:guid}", async (Guid id, AppDbContext db) =>
{
    var booking = await db.Bookings.Include(b => b.Slot).FirstOrDefaultAsync(b => b.Id == id);
    if (booking is null) return Results.NotFound();

    booking.Slot.IsOccupied = false;
    db.Bookings.Remove(booking);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// ─── Public endpoints ───

var publicGroup = app.MapGroup("/api/public").WithTags("Public");

publicGroup.MapGet("/event-types/{id:guid}", async (Guid id, AppDbContext db) =>
{
    var entity = await db.EventTypes.FindAsync(id);
    return entity is null ? Results.NotFound() : Results.Ok(entity);
});

publicGroup.MapGet("/event-types/{id:guid}/slots", async (Guid id, string? email, AppDbContext db) =>
{
    var eventType = await db.EventTypes.FindAsync(id);
    if (eventType is null) return Results.NotFound();

    var slots = await EnsureSlotsAsync(db, eventType, CancellationToken.None);

    if (!string.IsNullOrEmpty(email))
    {
        var guestSlotIds = await db.Bookings
            .Where(b => b.GuestEmail == email)
            .Select(b => b.SlotId)
            .ToListAsync();

        return Results.Ok(slots.Where(s => !s.IsOccupied || guestSlotIds.Contains(s.Id)).ToList());
    }

    return Results.Ok(slots.Where(s => !s.IsOccupied).ToList());
});

publicGroup.MapPost("/bookings", async (CreateBookingRequest req, AppDbContext db) =>
{
    var slot = await db.Slots.FindAsync(req.SlotId);
    if (slot is null) return Results.NotFound();
    if (slot.IsOccupied)
        return Results.Conflict(new ErrorResponse { Code = 409, Message = "Slot is already occupied" });

    slot.IsOccupied = true;
    var booking = new Booking
    {
        Id = Guid.NewGuid(),
        SlotId = req.SlotId,
        GuestName = req.GuestName,
        GuestEmail = req.GuestEmail,
        CreatedAt = DateTime.UtcNow,
    };
    db.Bookings.Add(booking);
    await db.SaveChangesAsync();
    return Results.Created($"/api/bookings/{booking.Id}", booking);
});

app.MapFallbackToFile("index.html");

app.Run();

// ─── Slot generation helper ───

static async Task<List<Slot>> EnsureSlotsAsync(AppDbContext db, EventType eventType, CancellationToken ct)
{
    var now = DateTime.UtcNow;
    var windowEnd = now.AddDays(Config.SlotWindowDays);

    var existingSlots = await db.Slots
        .Where(s => s.EventTypeId == eventType.Id)
        .ToListAsync(ct);

    var allBookings = await db.Bookings.Include(b => b.Slot).ToListAsync(ct);

    var start = RoundUp(now, eventType.SlotIntervalMinutes);
    var expected = new List<Slot>();

    for (var t = start; t.AddMinutes(eventType.DurationMinutes) <= windowEnd; t = t.AddMinutes(eventType.SlotIntervalMinutes))
    {
        var existing = existingSlots.FirstOrDefault(s => s.StartTime == t);
        if (existing is not null)
        {
            existing.IsOccupied = allBookings.Any(b => Overlaps(b.Slot, t, eventType.DurationMinutes));
            expected.Add(existing);
        }
        else
        {
            var slot = new Slot
            {
                Id = Guid.NewGuid(),
                EventTypeId = eventType.Id,
                StartTime = t,
                EndTime = t.AddMinutes(eventType.DurationMinutes),
                IsOccupied = allBookings.Any(b => Overlaps(b.Slot, t, eventType.DurationMinutes)),
            };
            db.Slots.Add(slot);
            expected.Add(slot);
        }
    }

    var toRemove = existingSlots
        .Where(s => s.StartTime < now || s.StartTime >= windowEnd)
        .Where(s => !allBookings.Any(b => b.SlotId == s.Id))
        .ToList();
    db.Slots.RemoveRange(toRemove);

    await db.SaveChangesAsync(ct);
    return expected;
}

static DateTime RoundUp(DateTime dt, int intervalMinutes)
{
    var rounded = new DateTime(dt.Year, dt.Month, dt.Day, dt.Hour, 0, 0, dt.Kind);
    while (rounded < dt) rounded = rounded.AddMinutes(intervalMinutes);
    return rounded;
}

static bool Overlaps(Slot existing, DateTime start, int durationMinutes)
{
    var end = start.AddMinutes(durationMinutes);
    return existing.StartTime < end && existing.EndTime > start;
}

public partial class Program { }
