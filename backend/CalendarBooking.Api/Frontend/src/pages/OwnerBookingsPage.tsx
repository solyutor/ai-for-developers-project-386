import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import {
  Container, Title, Stack, Loader, Alert, Modal, Card, Group, Text,
  Badge, Button, TextInput, Textarea, NumberInput,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useForm } from '@mantine/form'
import { IconAlertCircle, IconPlus, IconCheck } from '@tabler/icons-react'
import { WeekView, type ScheduleEventData, type DateStringValue } from '@mantine/schedule'
import { fetchBookings, fetchEventTypes, createEventType } from '../api'
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
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [opened, { open, close }] = useDisclosure(false)
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      durationMinutes: 30,
      slotIntervalMinutes: 15,
    },
    validate: {
      name: (value) => (!value ? 'Название обязательно' : value.length > 100 ? 'Максимум 100 символов' : null),
      description: (value) => (!value ? 'Описание обязательно' : value.length > 500 ? 'Максимум 500 символов' : null),
      durationMinutes: (value) => (value < 5 || value > 480 ? 'Длительность от 5 до 480 минут' : null),
      slotIntervalMinutes: (value) => (value < 5 || value > 120 ? 'Интервал от 5 до 120 минут' : null),
    },
  })

  useEffect(() => {
    async function load() {
      try {
        const [bookings, eventTypes] = await Promise.all([fetchBookings(), fetchEventTypes()])
        setEvents(buildEvents(bookings, eventTypes))
        setEventTypes(eventTypes)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleCreate = form.onSubmit(async (values) => {
    setCreating(true)
    setFormError(null)
    try {
      await createEventType(values)
      form.reset()
      close()
      const updated = await fetchEventTypes()
      setEventTypes(updated)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Ошибка при создании')
    } finally {
      setCreating(false)
    }
  })

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

        {!loading && (
          <>
            <Group justify="space-between" align="center">
              <Title order={3}>Типы событий</Title>
              <Button leftSection={<IconPlus size={16} />} onClick={open}>
                Создать тип события
              </Button>
            </Group>

            {eventTypes.length === 0 ? (
              <Text c="dimmed" size="sm">Пока нет типов событий</Text>
            ) : (
              <Stack gap="sm">
                {eventTypes.map((et) => (
                  <Card key={et.id} shadow="sm" padding="sm" radius="md" withBorder>
                    <Group justify="space-between" mb={4}>
                      <Text fw={500}>{et.name}</Text>
                      <Badge>{et.durationMinutes} мин</Badge>
                    </Group>
                    <Text size="sm" c="dimmed" lineClamp={2}>{et.description}</Text>
                    <Text size="xs" c="gray" mt={4}>
                      Интервал слотов: {et.slotIntervalMinutes} мин
                    </Text>
                  </Card>
                ))}
              </Stack>
            )}
          </>
        )}
      </Stack>

      <Modal opened={opened} onClose={close} title="Создать тип события" size="md">
        {formError && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md" onClose={() => setFormError(null)}>
            {formError}
          </Alert>
        )}

        <form onSubmit={handleCreate}>
          <Stack gap="md">
            <TextInput
              label="Название"
              placeholder="Например: Консультация"
              {...form.getInputProps('name')}
            />

            <Textarea
              label="Описание"
              placeholder="Описание типа события для гостей"
              rows={3}
              {...form.getInputProps('description')}
            />

            <NumberInput
              label="Длительность (минуты)"
              min={5}
              max={480}
              step={5}
              {...form.getInputProps('durationMinutes')}
            />

            <NumberInput
              label="Интервал слотов (минуты)"
              min={5}
              max={120}
              step={5}
              {...form.getInputProps('slotIntervalMinutes')}
            />

            <Button type="submit" loading={creating} leftSection={<IconCheck size={16} />} fullWidth>
              Создать
            </Button>
          </Stack>
        </form>
      </Modal>
    </Container>
  )
}
