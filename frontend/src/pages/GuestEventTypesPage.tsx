import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Title, Text, Stack, Card, Badge, SimpleGrid, Loader, Alert } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { fetchEventTypes } from '../api'
import type { EventType } from '../types'

export function GuestEventTypesPage() {
  const navigate = useNavigate()
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <Stack gap="md">
      <Title order={2}>Доступные типы брони</Title>

      {loading && <Loader />}

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red">
          {error}
        </Alert>
      )}

      {!loading && !error && eventTypes.length === 0 && (
        <Text c="dimmed">Нет доступных типов брони</Text>
      )}

      {!loading && !error && eventTypes.length > 0 && (
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          {eventTypes.map((et) => (
            <Card
              key={et.id}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/guest/book/${et.id}`)}
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
    </Stack>
  )
}
