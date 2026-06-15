import { Title, Text, Card, SimpleGrid, Stack } from '@mantine/core'
import { IconBuilding, IconUser } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'

export function RoleSelectPage() {
  const navigate = useNavigate()

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
          onClick={() => navigate('/admin/bookings')}
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
          onClick={() => navigate('/guest/guest-info')}
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
    </Stack>
  )
}
