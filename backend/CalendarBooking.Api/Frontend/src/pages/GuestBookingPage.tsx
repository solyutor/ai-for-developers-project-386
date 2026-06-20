import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import {
  Title,
  Text,
  Stack,
  Card,
  Badge,
  Button,
  Loader,
  Alert,
  Group,
  Divider,
  SimpleGrid,
} from '@mantine/core'
import { IconAlertCircle, IconArrowLeft, IconCheck } from '@tabler/icons-react'
import { MonthView, ScheduleHeader, type ScheduleEventData, type DateStringValue } from '@mantine/schedule'
import { fetchEventTypes, fetchEventType, fetchAvailableSlots, createBooking } from '../api'
import type { EventType, Slot } from '../types'

function buildSlotEvents(slots: Slot[]): ScheduleEventData[] {
  return slots.map((slot) => ({
    id: slot.id,
    title: dayjs(slot.startTime).format('HH:mm'),
    start: dayjs(slot.startTime).format('YYYY-MM-DD HH:mm:ss'),
    end: dayjs(slot.endTime).format('YYYY-MM-DD HH:mm:ss'),
    color: slot.isOccupied ? 'blue' as const : 'green' as const,
    payload: { slotId: slot.id, isMyBooking: slot.isOccupied },
  }))
}

export function GuestBookingPage() {
  const navigate = useNavigate()

  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [selectedEventTypeId, setSelectedEventTypeId] = useState<string | null>(null)
  const [eventType, setEventType] = useState<EventType | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [selectedDate, setSelectedDate] = useState<DateStringValue>(
    dayjs().format('YYYY-MM-DD') as DateStringValue,
  )

  const [submitting, setSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchEventTypes()
        setEventTypes(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedEventTypeId) return
    let cancelled = false
    async function load() {
      setLoadingSlots(true)
      setSelectedSlot(null)
      try {
        const guestEmail = localStorage.getItem('guestEmail') ?? undefined
        const [et, s] = await Promise.all([
          fetchEventType(selectedEventTypeId!),
          fetchAvailableSlots(selectedEventTypeId!, guestEmail),
        ])
        if (!cancelled) {
          setEventType(et)
          setSlots(s)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Ошибка загрузки слотов')
      } finally {
        if (!cancelled) setLoadingSlots(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [selectedEventTypeId])

  const events = buildSlotEvents(slots)
  const daySlots = slots.filter((s) =>
    dayjs(s.startTime).isSame(dayjs(selectedDate), 'day'),
  )
  const selectableSlots = daySlots.filter((s) => !s.isOccupied)

  async function handleBooking() {
    if (!selectedSlot) return
    const guestName = localStorage.getItem('guestName') ?? ''
    const guestEmail = localStorage.getItem('guestEmail') ?? ''
    if (!guestName || !guestEmail) {
      setError('Не указаны имя или email гостя. Вернитесь и заполните данные.')
      return
    }
    setSubmitting(true)
    try {
      await createBooking({ slotId: selectedSlot.id, guestName, guestEmail })
      setBookingSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при бронировании')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loader />
  if (error && !eventType && eventTypes.length === 0)
    return (
      <Alert icon={<IconAlertCircle size={16} />} color="red">
        {error}
      </Alert>
    )

  if (bookingSuccess && eventType && selectedSlot) {
    const guestName = localStorage.getItem('guestName') ?? ''
    const guestEmail = localStorage.getItem('guestEmail') ?? ''
    return (
      <Stack gap="md" align="center">
        <Title order={2}>Бронирование подтверждено!</Title>
        <Card shadow="sm" padding="lg" radius="md" withBorder w="100%">
          <Stack gap="xs">
            <Text>
              <b>{eventType.name}</b>
            </Text>
            <Text>
              {dayjs(selectedSlot.startTime).format('D MMMM YYYY, dddd, HH:mm')} –{' '}
              {dayjs(selectedSlot.endTime).format('HH:mm')}
            </Text>
            <Text c="dimmed" size="sm">
              Гость: {guestName} ({guestEmail})
            </Text>
          </Stack>
        </Card>
        <Button variant="light" onClick={() => navigate('/')}>
          На главную
        </Button>
      </Stack>
    )
  }

  return (
    <Stack gap="md">
      <Button
        variant="subtle"
        size="compact-sm"
        leftSection={<IconArrowLeft size={14} />}
        onClick={() => navigate('/guest/guest-info')}
      >
        Назад
      </Button>

      <Title order={2}>Выберите событие</Title>

      {eventTypes.length === 0 ? (
        <Text c="dimmed">Нет доступных типов событий</Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          {eventTypes.map((et) => (
            <Card
              key={et.id}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              style={{ cursor: 'pointer' }}
              bg={selectedEventTypeId === et.id ? 'blue.0' : undefined}
              bd={selectedEventTypeId === et.id ? '2px solid var(--mantine-color-blue-5)' : undefined}
              onClick={() => setSelectedEventTypeId(et.id)}
            >
              <Stack gap="xs">
                <Title order={4}>{et.name}</Title>
                <Text c="dimmed" size="sm">
                  {et.description}
                </Text>
                <Badge variant="light" color="blue">
                  {et.durationMinutes} мин
                </Badge>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {selectedEventTypeId && (
        <>
          <Divider />

          {loadingSlots ? (
            <Loader />
          ) : events.length === 0 ? (
            <Text c="dimmed">Нет доступных слотов на ближайшие 14 дней</Text>
          ) : (
            <Stack gap="md">
              <ScheduleHeader>
                <ScheduleHeader.Previous
                  onClick={() =>
                    setSelectedDate(
                      dayjs(selectedDate)
                        .subtract(1, 'month')
                        .startOf('month')
                        .format('YYYY-MM-DD') as DateStringValue,
                    )
                  }
                />
                <ScheduleHeader.MonthYearSelect
                  yearValue={dayjs(selectedDate).year()}
                  monthValue={dayjs(selectedDate).month()}
                  onYearChange={(year) =>
                    setSelectedDate(
                      dayjs(selectedDate)
                        .year(year)
                        .startOf('month')
                        .format('YYYY-MM-DD') as DateStringValue,
                    )
                  }
                  onMonthChange={(month) =>
                    setSelectedDate(
                      dayjs(selectedDate)
                        .month(month)
                        .startOf('month')
                        .format('YYYY-MM-DD') as DateStringValue,
                    )
                  }
                />
                <ScheduleHeader.Next
                  onClick={() =>
                    setSelectedDate(
                      dayjs(selectedDate)
                        .add(1, 'month')
                        .startOf('month')
                        .format('YYYY-MM-DD') as DateStringValue,
                    )
                  }
                />
                <ScheduleHeader.Today
                  onClick={() =>
                    setSelectedDate(dayjs().format('YYYY-MM-DD') as DateStringValue)
                  }
                />
              </ScheduleHeader>

              <MonthView
                date={selectedDate}
                onDateChange={setSelectedDate}
                onDayClick={(date) => setSelectedDate(date)}
                events={events}
                locale="ru"
                firstDayOfWeek={1}
                withHeader={false}
                maxEventsPerDay={4}
              />

              {daySlots.some((s) => s.isOccupied) && (
                <>
                  <Divider label="Ваши записи" labelPosition="left" />
                  <SimpleGrid cols={{ base: 2, sm: 3 }}>
                    {daySlots.filter((s) => s.isOccupied).map((slot) => (
                      <Card key={slot.id} padding="sm" radius="md" withBorder bg="blue.0">
                        <Text size="sm" ta="center">
                          {dayjs(slot.startTime).format('HH:mm')} –{' '}
                          {dayjs(slot.endTime).format('HH:mm')}
                        </Text>
                        <Text size="xs" ta="center" c="blue">
                          ✓ Вы уже записаны
                        </Text>
                      </Card>
                    ))}
                  </SimpleGrid>
                </>
              )}

              {selectableSlots.length > 0 && (
                <>
                  <Divider label={dayjs(selectedDate).format('D MMMM, dddd')} labelPosition="left" />
                  <SimpleGrid cols={{ base: 2, sm: 3 }}>
                    {selectableSlots.map((slot) => (
                      <Card
                        key={slot.id}
                        padding="sm"
                        radius="md"
                        withBorder
                        style={{ cursor: 'pointer' }}
                        bg={selectedSlot?.id === slot.id ? 'blue.0' : undefined}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        <Text size="sm" ta="center" fw={selectedSlot?.id === slot.id ? 700 : 400}>
                          {dayjs(slot.startTime).format('HH:mm')} –{' '}
                          {dayjs(slot.endTime).format('HH:mm')}
                        </Text>
                      </Card>
                    ))}
                  </SimpleGrid>
                </>
              )}

              {selectedSlot && (
                <Card padding="sm" radius="md" withBorder bg="green.0">
                  <Text size="sm">
                    Выбрано: {dayjs(selectedSlot.startTime).format('D MMMM, dddd, HH:mm')} –{' '}
                    {dayjs(selectedSlot.endTime).format('HH:mm')}
                  </Text>
                </Card>
              )}
            </Stack>
          )}

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red">
              {error}
            </Alert>
          )}

          <Group justify="flex-end">
            <Button
              leftSection={<IconCheck size={14} />}
              disabled={!selectedSlot}
              onClick={handleBooking}
              loading={submitting}
            >
              Забронировать
            </Button>
          </Group>
        </>
      )}
    </Stack>
  )
}
