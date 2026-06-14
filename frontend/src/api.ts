import type { BookingWithSlot, EventType } from './types'

const API_BASE = '/api'

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`)
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
