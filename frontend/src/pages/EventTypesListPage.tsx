import { Title, Button, Stack } from '@mantine/core'
import { Link } from 'react-router-dom'

export function EventTypesListPage() {
  return (
    <Stack gap="md">
      <Title order={2}>Типы событий</Title>
      <Button component={Link} to="/admin/event-types/new" variant="light">
        Создать новый
      </Button>
    </Stack>
  )
}
