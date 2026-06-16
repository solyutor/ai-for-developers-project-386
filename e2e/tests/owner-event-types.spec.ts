import { test, expect } from '@playwright/test'
import { fillMantineInput } from './helpers'

test.describe('Owner Event Types Management', () => {
  test('page loads with event types section', async ({ page }) => {
    await page.goto('/admin/bookings', { waitUntil: 'networkidle' })
    await expect(page.getByText('Создать тип события')).toBeAttached()
  })

  test('create event type modal shows form fields', async ({ page }) => {
    await page.goto('/admin/bookings', { waitUntil: 'networkidle' })

    await page.getByRole('button', { name: 'Создать тип события' }).click()

    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()
    await expect(modal.getByPlaceholder('Например: Консультация')).toBeVisible()
    await expect(modal.getByPlaceholder('Описание типа события для гостей')).toBeVisible()
  })

  test('creates an event type and verifies success', async ({ page }) => {
    await page.goto('/admin/bookings', { waitUntil: 'networkidle' })

    await page.getByRole('button', { name: 'Создать тип события' }).click()

    const modal = page.getByRole('dialog')
    await fillMantineInput(page, 'Например: Консультация', 'Тестовая встреча')
    await fillMantineInput(page, 'Описание типа события для гостей', 'Автоматический тест')

    await modal.getByRole('button', { name: 'Создать' }).click()

    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})
