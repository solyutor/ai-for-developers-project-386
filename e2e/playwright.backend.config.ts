import { defineConfig, devices } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const libPath = path.join(__dirname, '.playwright-libs')
const port = process.env.PORT || '4010'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    launchOptions: {
      env: {
        ...process.env,
        LD_LIBRARY_PATH: `${libPath}:${process.env.LD_LIBRARY_PATH || ''}`,
      },
    },
  },
  webServer: [
    {
      command: 'rm -f /tmp/e2e-calendar.db && cd ../backend/CalendarBooking.Api && dotnet run',
      port: Number(port),
      env: {
        PORT: port,
        ConnectionStrings__Default: 'Data Source=/tmp/e2e-calendar.db',
      },
      reuseExistingServer: !process.env.CI,
      timeout: process.env.CI ? 60000 : 30000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
