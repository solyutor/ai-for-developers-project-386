import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import { describe, it, expect, beforeEach } from 'vitest'
import { GuestInfoPage } from './GuestInfoPage'

function LocationDisplay() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

function renderPage() {
  return render(
    <MantineProvider>
      <MemoryRouter initialEntries={['/guest/guest-info']}>
        <GuestInfoPage />
        <LocationDisplay />
      </MemoryRouter>
    </MantineProvider>,
  )
}

describe('GuestInfoPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders name and email inputs', () => {
    renderPage()
    expect(screen.getByLabelText('Ваше имя')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('pre-fills email from localStorage', () => {
    localStorage.setItem('guestEmail', 'test@example.com')
    renderPage()
    expect(screen.getByLabelText('Email')).toHaveValue('test@example.com')
  })

  it('disables submit button when fields are empty', () => {
    renderPage()
    expect(screen.getByRole('button', { name: 'Продолжить' })).toBeDisabled()
  })

  it('enables submit button when name and email are valid', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText('Ваше имя'), 'Иван Иванов')
    await user.type(screen.getByLabelText('Email'), 'ivan@example.com')
    expect(screen.getByRole('button', { name: 'Продолжить' })).not.toBeDisabled()
  })

  it('saves to localStorage and navigates on submit', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText('Ваше имя'), 'Иван Иванов')
    await user.type(screen.getByLabelText('Email'), 'ivan@example.com')
    await user.click(screen.getByRole('button', { name: 'Продолжить' }))
    expect(localStorage.getItem('guestName')).toBe('Иван Иванов')
    expect(localStorage.getItem('guestEmail')).toBe('ivan@example.com')
    expect(screen.getByTestId('location')).toHaveTextContent('/guest/book')
  })

  it('navigates back to / on back button click', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('Назад'))
    expect(screen.getByTestId('location')).toHaveTextContent('/')
  })
})
