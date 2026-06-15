import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import { describe, it, expect } from 'vitest'
import { RoleSelectPage } from './RoleSelectPage'

function LocationDisplay() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

function renderPage() {
  return render(
    <MantineProvider>
      <MemoryRouter initialEntries={['/']}>
        <RoleSelectPage />
        <LocationDisplay />
      </MemoryRouter>
    </MantineProvider>,
  )
}

describe('RoleSelectPage', () => {
  it('renders two role cards', () => {
    renderPage()
    expect(screen.getByText('Владелец')).toBeInTheDocument()
    expect(screen.getByText('Гость')).toBeInTheDocument()
  })

  it('navigates to /admin/bookings when Owner is clicked', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('Владелец'))
    expect(screen.getByTestId('location')).toHaveTextContent('/admin/bookings')
  })

  it('navigates to /guest/guest-info when Guest is clicked', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('Гость'))
    expect(screen.getByTestId('location')).toHaveTextContent('/guest/guest-info')
  })

  it('does not show email input', () => {
    renderPage()
    expect(screen.queryByPlaceholderText('your@email.com')).not.toBeInTheDocument()
  })
})
