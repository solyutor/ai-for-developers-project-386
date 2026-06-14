import { useState } from 'react'
import { Title, Text, Card, SimpleGrid, Button, Stack, TextInput } from '@mantine/core'
import { IconBuilding, IconUser } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'

export function RoleSelectPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [showEmail, setShowEmail] = useState(false)

  const isValidEmail = email.trim().includes('@')

  function handleOwnerClick() {
    navigate('/admin/bookings')
  }

  function handleGuestClick() {
    setShowEmail(true)
  }

  function handleGuestSubmit() {
    if (!isValidEmail) return
    localStorage.setItem('guestEmail', email.trim())
    navigate('/guest/event-types')
  }

  return (
    <Stack gap="md">
      <Title order={2}>Выберите роль</Title>

      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <Card
          shadow="sm"
          padding="xl"
          radius="md"
          withBorder
          style={{ cursor: 'pointer' }}
          onClick={handleOwnerClick}
        >
          <Stack gap="sm" align="center">
            <IconBuilding size={48} />
            <Title order={4}>Владелец</Title>
            <Text c="dimmed" size="sm" ta="center">
              Управление типами событий и просмотр встреч
            </Text>
          </Stack>
        </Card>

        <Card
          shadow="sm"
          padding="xl"
          radius="md"
          withBorder
          style={{ cursor: 'pointer' }}
          onClick={handleGuestClick}
        >
          <Stack gap="sm" align="center">
            <IconUser size={48} />
            <Title order={4}>Гость</Title>
            <Text c="dimmed" size="sm" ta="center">
              Бронирование встреч у владельца
            </Text>
          </Stack>
        </Card>
      </SimpleGrid>

      {showEmail && (
        <Stack gap="sm">
          <TextInput
            label="Email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleGuestSubmit()
            }}
          />
          <Button onClick={handleGuestSubmit} disabled={!isValidEmail}>
            Продолжить
          </Button>
        </Stack>
      )}
    </Stack>
  )
}
