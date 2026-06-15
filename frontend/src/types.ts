export interface Slot {
  id: string
  eventTypeId: string
  startTime: string
  endTime: string
  isOccupied: boolean
}

export interface BookingWithSlot {
  id: string
  slotId: string
  guestName: string
  guestEmail: string
  createdAt: string
  slot: Slot
}

export interface EventType {
  id: string
  ownerId: string
  name: string
  description: string
  durationMinutes: number
  slotIntervalMinutes: number
}

export interface Booking {
  id: string
  slotId: string
  guestName: string
  guestEmail: string
  createdAt: string
}

export interface CreateBookingRequest {
  slotId: string
  guestName: string
  guestEmail: string
}
