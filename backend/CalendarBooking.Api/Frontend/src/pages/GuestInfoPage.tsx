import { useState } from 'react'
import { Title, Text, Stack, TextInput, Button } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'

export function GuestInfoPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState(localStorage.getItem('guestEmail') ?? '')

  const isValid = name.trim().length > 0 && email.trim().includes('@')

  function handleSubmit() {
    if (!isValid) return
    localStorage.setItem('guestName', name.trim())
    localStorage.setItem('guestEmail', email.trim())
    navigate('/guest/book')
  }

  return (
    <Stack gap="md">
      <Button
        variant="subtle"
        size="compact-sm"
        leftSection={<IconArrowLeft size={14} />}
        onClick={() => navigate('/')}
      >
        Назад
      </Button>

      <Title order={2}>Ваши данные</Title>
      <Text c="dimmed">Укажите имя и email для бронирования</Text>

      <TextInput
        label="Ваше имя"
        placeholder="Иван Иванов"
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
      />
      <TextInput
        label="Email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
        }}
      />

      <Button onClick={handleSubmit} disabled={!isValid}>
        Продолжить
      </Button>
    </Stack>
  )
}
