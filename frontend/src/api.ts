import type { Booking, BookingWithSlot, CreateBookingRequest, EventType, Slot } from './types'

const API_BASE = '/api'

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Ошибка сервера' }))
    throw new Error(error.message || 'Ошибка запроса')
  }
  return response.json()
}

async function postRequest<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Ошибка сервера' }))
    throw new Error(error.message || 'Ошибка запроса')
  }
  return response.json()
}

export function fetchBookings(): Promise<BookingWithSlot[]> {
  return request<BookingWithSlot[]>('/bookings')
}

export function fetchEventTypes(): Promise<EventType[]> {
  return request<EventType[]>('/event-types')
}

export function fetchEventType(id: string): Promise<EventType> {
  return request<EventType>(`/public/event-types/${id}`)
}

export function fetchAvailableSlots(eventTypeId: string): Promise<Slot[]> {
  return request<Slot[]>(`/public/event-types/${eventTypeId}/slots`)
}

export function createBooking(data: CreateBookingRequest): Promise<Booking> {
  return postRequest<Booking>('/public/bookings', data)
}
