import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  Stepper,
  Group,
  TextInput,
  Divider,
  SimpleGrid,
} from '@mantine/core'
import { IconAlertCircle, IconArrowLeft, IconArrowRight, IconCheck } from '@tabler/icons-react'
import { MonthView, ScheduleHeader, type ScheduleEventData, type DateStringValue } from '@mantine/schedule'
import { fetchEventType, fetchAvailableSlots, createBooking } from '../api'
import type { EventType, Slot } from '../types'

function buildSlotEvents(slots: Slot[]): ScheduleEventData[] {
  return slots
    .filter((s) => !s.isOccupied)
    .map((slot) => ({
      id: slot.id,
      title: dayjs(slot.startTime).format('HH:mm'),
      start: dayjs(slot.startTime).format('YYYY-MM-DD HH:mm:ss'),
      end: dayjs(slot.endTime).format('YYYY-MM-DD HH:mm:ss'),
      color: 'green' as const,
      payload: { slotId: slot.id },
    }))
}

export function GuestBookingPage() {
  const { eventTypeId } = useParams<{ eventTypeId: string }>()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [eventType, setEventType] = useState<EventType | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [selectedDate, setSelectedDate] = useState<DateStringValue>(
    dayjs().format('YYYY-MM-DD') as DateStringValue
  )

  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState(localStorage.getItem('guestEmail') ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)

  useEffect(() => {
    if (!eventTypeId) return
    async function load() {
      try {
        const [et, s] = await Promise.all([
          fetchEventType(eventTypeId!),
          fetchAvailableSlots(eventTypeId!),
        ])
        setEventType(et)
        setSlots(s)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [eventTypeId])

  const availableSlots = slots.filter((s) => !s.isOccupied)
  const events = buildSlotEvents(slots)
  const daySlots = availableSlots.filter((s) =>
    dayjs(s.startTime).isSame(dayjs(selectedDate), 'day')
  )

  const isFormValid = guestName.trim().length > 0 && guestEmail.trim().includes('@') && selectedSlot

  async function handleBooking() {
    if (!selectedSlot || !isFormValid) return
    setSubmitting(true)
    try {
      await createBooking({
        slotId: selectedSlot.id,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
      })
      setBookingSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при бронировании')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loader />
  if (error && !eventType)
    return (
      <Alert icon={<IconAlertCircle size={16} />} color="red">
        {error}
      </Alert>
    )
  if (!eventType) return null

  if (bookingSuccess) {
    return (
      <Stack gap="md" align="center">
        <Title order={2}>Бронирование подтверждено!</Title>
        <Card shadow="sm" padding="lg" radius="md" withBorder w="100%">
          <Stack gap="xs">
            <Text>
              <b>{eventType.name}</b>
            </Text>
            <Text>
              {dayjs(selectedSlot!.startTime).format('D MMMM YYYY, dddd, HH:mm')} –{' '}
              {dayjs(selectedSlot!.endTime).format('HH:mm')}
            </Text>
            <Text c="dimmed" size="sm">
              Гость: {guestName} ({guestEmail})
            </Text>
          </Stack>
        </Card>
        <Button variant="light" onClick={() => navigate('/guest/event-types')}>
          Вернуться к списку
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
        onClick={() => {
          if (step === 0) navigate('/guest/event-types')
          else setStep(step - 1)
        }}
      >
        {step === 0 ? 'К списку' : 'Назад'}
      </Button>

      <Stepper active={step} onStepClick={setStep} allowNextStepsSelect={false}>
        <Stepper.Step label="Событие" description="Информация" />
        <Stepper.Step label="Время" description="Выбор слота" />
        <Stepper.Step label="Данные" description="Подтверждение" />
      </Stepper>

      {step === 0 && (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="sm">
            <Title order={3}>{eventType.name}</Title>
            <Text c="dimmed">{eventType.description}</Text>
            <Group>
              <Badge variant="light" color="blue">
                {eventType.durationMinutes} мин
              </Badge>
              <Badge variant="light" color="gray">
                Интервал: {eventType.slotIntervalMinutes} мин
              </Badge>
            </Group>
          </Stack>
        </Card>
      )}

      {step === 1 && (
        <Stack gap="md">
          {events.length === 0 ? (
            <Text c="dimmed">Нет доступных слотов на ближайшие 14 дней</Text>
          ) : (
            <>
              <ScheduleHeader>
                <ScheduleHeader.Previous
                  onClick={() =>
                    setSelectedDate(
                      dayjs(selectedDate)
                        .subtract(1, 'month')
                        .startOf('month')
                        .format('YYYY-MM-DD') as DateStringValue
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
                        .format('YYYY-MM-DD') as DateStringValue
                    )
                  }
                  onMonthChange={(month) =>
                    setSelectedDate(
                      dayjs(selectedDate)
                        .month(month)
                        .startOf('month')
                        .format('YYYY-MM-DD') as DateStringValue
                    )
                  }
                />
                <ScheduleHeader.Next
                  onClick={() =>
                    setSelectedDate(
                      dayjs(selectedDate)
                        .add(1, 'month')
                        .startOf('month')
                        .format('YYYY-MM-DD') as DateStringValue
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
                events={events}
                locale="ru"
                firstDayOfWeek={1}
                withHeader={false}
                maxEventsPerDay={4}
              />
            </>
          )}

          {daySlots.length > 0 && (
            <>
              <Divider label={dayjs(selectedDate).format('D MMMM, dddd')} labelPosition="left" />
              <SimpleGrid cols={{ base: 2, sm: 3 }}>
                {daySlots.map((slot) => (
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

      {step === 2 && (
        <Stack gap="md">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="xs">
              <Text>
                <b>{eventType.name}</b>
              </Text>
              <Text size="sm">
                {dayjs(selectedSlot!.startTime).format('D MMMM YYYY, dddd, HH:mm')} –{' '}
                {dayjs(selectedSlot!.endTime).format('HH:mm')}
              </Text>
            </Stack>
          </Card>

          <TextInput
            label="Ваше имя"
            placeholder="Иван Иванов"
            value={guestName}
            onChange={(e) => setGuestName(e.currentTarget.value)}
          />
          <TextInput
            label="Email"
            placeholder="your@email.com"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.currentTarget.value)}
          />

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red">
              {error}
            </Alert>
          )}
        </Stack>
      )}

      <Group justify="flex-end">
        <Button
          rightSection={<IconArrowRight size={14} />}
          disabled={step === 1 && (!selectedSlot || daySlots.length === 0)}
          onClick={() => {
            if (step < 2) setStep(step + 1)
            else handleBooking()
          }}
          loading={submitting}
          leftSection={step === 2 ? <IconCheck size={14} /> : undefined}
        >
          {step === 2 ? 'Подтвердить бронирование' : 'Далее'}
        </Button>
      </Group>
    </Stack>
  )
}
