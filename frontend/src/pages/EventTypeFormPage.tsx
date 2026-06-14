import { useState } from 'react'
import { useForm } from '@mantine/form'
import {
  Paper,
  Title,
  TextInput,
  Textarea,
  NumberInput,
  Button,
  Stack,
  Alert,
} from '@mantine/core'
import { IconCheck, IconAlertCircle } from '@tabler/icons-react'
import { OWNER_ID } from '../config'

export function EventTypeFormPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

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

  const handleSubmit = form.onSubmit(async (values) => {
    setIsSubmitting(true)
    setSubmitResult(null)

    try {
      const response = await fetch('/api/event-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          ownerId: OWNER_ID,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Ошибка сервера' }))
        throw new Error(error.message || 'Ошибка при создании')
      }

      setSubmitResult({ type: 'success', message: 'Тип события успешно создан!' })
      form.reset()
    } catch (err) {
      setSubmitResult({
        type: 'error',
        message: err instanceof Error ? err.message : 'Неизвестная ошибка',
      })
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <Paper shadow="md" p="xl" radius="md" maw={600} mx="auto">
      <Title order={2} mb="lg">
        Создать тип события
      </Title>

      {submitResult && (
        <Alert
          icon={submitResult.type === 'success' ? <IconCheck size={16} /> : <IconAlertCircle size={16} />}
          color={submitResult.type === 'success' ? 'green' : 'red'}
          mb="md"
          onClose={() => setSubmitResult(null)}
        >
          {submitResult.message}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
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

          <Button type="submit" loading={isSubmitting} fullWidth>
            Создать
          </Button>
        </Stack>
      </form>
    </Paper>
  )
}
