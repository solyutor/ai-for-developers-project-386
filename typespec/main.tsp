import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";

using TypeSpec.Http;
using TypeSpec.Rest;

@service(#{
  title: "Calendar Booking API"
})

namespace CalendarBooking;

// ─── Scalar ──────────────────────────────────────────────

@format("uuid")
scalar uuid extends string;

// ─── Models ──────────────────────────────────────────────

model Owner {
  id: uuid;
  name: string;
  email: string;
}

model EventType {
  id: uuid;
  ownerId: uuid;
  name: string;
  description: string;
  durationMinutes: int32;
  slotIntervalMinutes: int32;
}

model Slot {
  id: uuid;
  eventTypeId: uuid;
  startTime: utcDateTime;
  endTime: utcDateTime;
  isOccupied: boolean;
}

model Booking {
  id: uuid;
  slotId: uuid;
  guestName: string;
  guestEmail: string;
  createdAt: utcDateTime;
}

model BookingWithSlot {
  id: uuid;
  slotId: uuid;
  guestName: string;
  guestEmail: string;
  createdAt: utcDateTime;
  slot: Slot;
}

// ─── Request Bodies ──────────────────────────────────────

model CreateEventTypeRequest {
  name: string;
  description: string;
  durationMinutes: int32;
  slotIntervalMinutes: int32;
}

model UpdateEventTypeRequest {
  name: string;
  description: string;
  durationMinutes: int32;
  slotIntervalMinutes: int32;
}

model CreateBookingRequest {
  slotId: uuid;
  guestName: string;
  guestEmail: string;
}

// ─── Error ───────────────────────────────────────────────

model ErrorResponse {
  code: int32;
  message: string;
}

// ─── Admin Interface (Owner) ────────────────────────────

interface Admin {
  @get
  @route("/api/event-types")
  listEventTypes(): EventType[];

  @post
  @route("/api/event-types")
  createEventType(@body createEventTypeRequest: CreateEventTypeRequest): EventType;

  @put
  @route("/api/event-types/{id}")
  updateEventType(
    @path id: uuid,
    @body updateEventTypeRequest: UpdateEventTypeRequest
  ): EventType;

  @delete
  @route("/api/event-types/{id}")
  deleteEventType(@path id: uuid): void;

  @get
  @route("/api/slots")
  listSlots(@query eventTypeId: uuid): Slot[];

  @get
  @route("/api/bookings")
  listBookings(): BookingWithSlot[];

  @delete
  @route("/api/bookings/{id}")
  deleteBooking(@path id: uuid): void;
}

// ─── Public Interface (Guest) ───────────────────────────

interface Public {
  @get
  @route("/api/public/event-types/{id}")
  getEventType(@path id: uuid): EventType;

  @get
  @route("/api/public/event-types/{id}/slots")
  getAvailableSlots(@path id: uuid): Slot[];

  @post
  @route("/api/public/bookings")
  createBooking(@body createBookingRequest: CreateBookingRequest): Booking;
}
