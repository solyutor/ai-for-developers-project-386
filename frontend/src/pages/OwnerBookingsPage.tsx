import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import { Container, Title, Stack, Loader, Alert } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { WeekView, type ScheduleEventData, type DateStringValue } from '@mantine/schedule'
import { fetchBookings, fetchEventTypes } from '../api'
import type { BookingWithSlot, EventType } from '../types'

const EVENT_COLORS = ['blue', 'green', 'violet', 'orange', 'teal', 'pink', 'grape'] as const

function buildEvents(bookings: BookingWithSlot[], eventTypes: EventType[]): ScheduleEventData[] {
  const typeMap = new Map(eventTypes.map((t) => [t.id, t]))

  return bookings.map((booking, index) => {
    const eventType = typeMap.get(booking.slot.eventTypeId)
    return {
      id: booking.id,
      title: `${booking.guestName} — ${eventType?.name ?? 'Встреча'}`,
      start: dayjs(booking.slot.startTime).format('YYYY-MM-DD HH:mm:ss'),
      end: dayjs(booking.slot.endTime).format('YYYY-MM-DD HH:mm:ss'),
      color: EVENT_COLORS[index % EVENT_COLORS.length],
      payload: { guestEmail: booking.guestEmail, eventTypeName: eventType?.name },
    }
  })
}

export function OwnerBookingsPage() {
  const [date, setDate] = useState<DateStringValue>(
    dayjs().day(1).format('YYYY-MM-DD') as DateStringValue
  )
  const [events, setEvents] = useState<ScheduleEventData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [bookings, eventTypes] = await Promise.all([fetchBookings(), fetchEventTypes()])
        setEvents(buildEvents(bookings, eventTypes))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <Container size="lg" py="xl">
      <Stack gap="md">
        <Title order={2}>Предстоящие встречи</Title>

        {loading && <Loader />}

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red">
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <WeekView
            date={date}
            onDateChange={setDate}
            events={events}
            locale="ru"
            firstDayOfWeek={1}
            highlightToday
            withHeader
            startTime="07:00:00"
            endTime="20:00:00"
          />
        )}
      </Stack>
    </Container>
  )
}
