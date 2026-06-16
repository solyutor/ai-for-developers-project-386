import { test, expect } from '@playwright/test'

test.describe('Owner Bookings Page', () => {
  test('loads the bookings page layout', async ({ page }) => {
    await page.goto('/admin/bookings', { waitUntil: 'networkidle' })

    await expect(page.getByText('Создать тип события')).toBeAttached()
  })

  test('displays existing event types or empty state', async ({ page }) => {
    await page.goto('/admin/bookings', { waitUntil: 'networkidle' })

    const emptyState = page.getByText('Пока нет типов событий')
    const eventTypeCards = page.locator('.mantine-Card-root')

    const isEmpty = await emptyState.isVisible().catch(() => false)
    const hasCards = (await eventTypeCards.count()) > 0

    expect(isEmpty || hasCards).toBeTruthy()
  })
})
