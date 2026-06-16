import { test, expect } from '@playwright/test'

test.describe('Role Selection', () => {
  test('shows both role cards on the home page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await expect(page.getByText('Calendar Booking')).toBeAttached()
    await expect(page.getByRole('heading', { name: 'Владелец' })).toBeAttached()
    await expect(page.getByRole('heading', { name: 'Гость' })).toBeAttached()
  })

  test('navigates to admin bookings when Owner card is clicked', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.locator('.mantine-Card-root').filter({ hasText: 'Владелец' }).click()
    await expect(page).toHaveURL(/\/admin\/bookings/)
  })

  test('navigates to guest info when Guest card is clicked', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.locator('.mantine-Card-root').filter({ hasText: 'Гость' }).click()
    await expect(page).toHaveURL(/\/guest\/guest-info/)
  })
})
