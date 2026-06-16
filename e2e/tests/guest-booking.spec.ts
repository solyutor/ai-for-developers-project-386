import { test, expect } from '@playwright/test'
import { fillMantineInput } from './helpers'

test.describe('Guest Booking Flow', () => {
  test('guest info form validates and navigates to booking page', async ({ page }) => {
    await page.goto('/guest/guest-info', { waitUntil: 'networkidle' })

    await expect(page.getByText('Ваши данные')).toBeAttached()

    const continueBtn = page.getByRole('button', { name: 'Продолжить' })
    await expect(continueBtn).toBeDisabled()

    await fillMantineInput(page, 'Иван Иванов', 'Тестовый Гость')
    await fillMantineInput(page, 'your@email.com', 'guest@example.com')
    await page.waitForTimeout(200)

    await expect(continueBtn).toBeEnabled({ timeout: 5000 })
    await continueBtn.click()

    await expect(page).toHaveURL(/\/guest\/book/)
  })

  test('booking page loads and displays event types or empty state', async ({ page }) => {
    await page.goto('/guest/book', { waitUntil: 'networkidle' })

    const noTypes = page.getByText('Нет доступных типов событий')
    const eventCards = page.locator('.mantine-Card-root').filter({ hasText: 'мин' })

    const isEmpty = await noTypes.isVisible().catch(() => false)
    const hasEvents = await eventCards.first().isVisible().catch(() => false)
    expect(isEmpty || hasEvents).toBeTruthy()
  })

  test('full booking flow with event type selection', async ({ page }) => {
    await page.goto('/guest/guest-info', { waitUntil: 'networkidle' })
    await fillMantineInput(page, 'Иван Иванов', 'Тестовый Гость')
    await fillMantineInput(page, 'your@email.com', 'guest@example.com')
    await page.waitForTimeout(200)
    await page.getByRole('button', { name: 'Продолжить' }).click()
    await expect(page).toHaveURL(/\/guest\/book/)

    await page.waitForLoadState('networkidle')

    const noTypes = page.getByText('Нет доступных типов событий')
    if (await noTypes.isVisible()) {
      test.skip('no event types available from API')
      return
    }

    await page.locator('.mantine-Card-root').filter({ hasText: 'мин' }).first().click()
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('button', { name: 'Забронировать' })).toBeVisible()
  })
})
