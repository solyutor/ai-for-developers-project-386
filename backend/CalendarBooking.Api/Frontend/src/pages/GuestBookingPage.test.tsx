import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GuestBookingPage } from './GuestBookingPage'
import type { EventType, Slot } from '../types'

const today = new Date()
const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

const mockEventTypes: EventType[] = [
  {
    id: 'et-1',
    ownerId: 'owner-1',
    name: 'Консультация',
    description: 'Бесплатная консультация',
    durationMinutes: 30,
    slotIntervalMinutes: 15,
  },
  {
    id: 'et-2',
    ownerId: 'owner-1',
    name: 'Тренировка',
    description: 'Индивидуальная тренировка',
    durationMinutes: 60,
    slotIntervalMinutes: 30,
  },
]

const mockSlots: Slot[] = [
  {
    id: 'slot-1',
    eventTypeId: 'et-1',
    startTime: `${dateStr}T10:00:00Z`,
    endTime: `${dateStr}T10:30:00Z`,
    isOccupied: false,
  },
  {
    id: 'slot-2',
    eventTypeId: 'et-1',
    startTime: `${dateStr}T11:00:00Z`,
    endTime: `${dateStr}T11:30:00Z`,
    isOccupied: true,
  },
  {
    id: 'slot-3',
    eventTypeId: 'et-1',
    startTime: `${dateStr}T14:00:00Z`,
    endTime: `${dateStr}T14:30:00Z`,
    isOccupied: false,
  },
]

vi.mock('../api', () => ({
  fetchEventTypes: vi.fn(),
  fetchEventType: vi.fn(),
  fetchAvailableSlots: vi.fn(),
  createBooking: vi.fn(),
}))

import { fetchEventTypes, fetchEventType, fetchAvailableSlots, createBooking } from '../api'

const mockFetchEventTypes = vi.mocked(fetchEventTypes)
const mockFetchEventType = vi.mocked(fetchEventType)
const mockFetchAvailableSlots = vi.mocked(fetchAvailableSlots)
const mockCreateBooking = vi.mocked(createBooking)

function LocationDisplay() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

function renderPage() {
  return render(
    <MantineProvider>
      <MemoryRouter initialEntries={['/guest/book']}>
        <GuestBookingPage />
        <LocationDisplay />
      </MemoryRouter>
    </MantineProvider>,
  )
}

describe('GuestBookingPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    mockFetchEventTypes.mockResolvedValue(mockEventTypes)
    mockFetchEventType.mockResolvedValue(mockEventTypes[0])
    mockFetchAvailableSlots.mockResolvedValue(mockSlots)
    mockCreateBooking.mockResolvedValue({
      id: 'booking-1',
      slotId: 'slot-1',
      guestName: 'Иван',
      guestEmail: 'ivan@test.com',
      createdAt: '2026-06-15T00:00:00Z',
    })
  })

  it('shows loading initially', () => {
    renderPage()
    expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument()
  })

  it('renders event type cards after loading', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Консультация')).toBeInTheDocument()
    })
    expect(screen.getByText('Тренировка')).toBeInTheDocument()
  })

  it('shows "no event types" message when list is empty', async () => {
    mockFetchEventTypes.mockResolvedValue([])
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Нет доступных типов событий')).toBeInTheDocument()
    })
  })

  it('loads slots when event type is selected', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Консультация')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Консультация'))
    await waitFor(() => {
      expect(mockFetchAvailableSlots).toHaveBeenCalledWith('et-1', undefined)
    })
  })

  it('highlights selected event type card', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Консультация')).toBeInTheDocument()
    })
    const card = screen.getByText('Консультация').closest('.mantine-Card-root')!
    await user.click(card)
    await waitFor(() => {
      expect(card.getAttribute('style')).toContain('background: var(--mantine-color-blue-0)')
    })
  })

  it('shows available day slots after selecting event type', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Консультация')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Консультация'))
    await waitFor(() => {
      expect(screen.getByText('10:00 – 10:30')).toBeInTheDocument()
    })
  })

  it('disables book button when no slot is selected', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Консультация')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Консультация'))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Забронировать' })).toBeDisabled()
    })
  })

  it('enables book button after selecting a slot', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Консультация')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Консультация'))
    await waitFor(() => {
      expect(screen.getByText('10:00 – 10:30')).toBeInTheDocument()
    })
    await user.click(screen.getByText('10:00 – 10:30'))
    expect(screen.getByRole('button', { name: 'Забронировать' })).not.toBeDisabled()
  })

  it('creates booking with localStorage data', async () => {
    localStorage.setItem('guestName', 'Тест')
    localStorage.setItem('guestEmail', 'test@test.com')
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Консультация')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Консультация'))
    await waitFor(() => {
      expect(screen.getByText('10:00 – 10:30')).toBeInTheDocument()
    })
    await user.click(screen.getByText('10:00 – 10:30'))
    await user.click(screen.getByRole('button', { name: 'Забронировать' }))
    await waitFor(() => {
      expect(mockCreateBooking).toHaveBeenCalledWith({
        slotId: 'slot-1',
        guestName: 'Тест',
        guestEmail: 'test@test.com',
      })
    })
  })

  it('shows success screen after booking', async () => {
    localStorage.setItem('guestName', 'Тест')
    localStorage.setItem('guestEmail', 'test@test.com')
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Консультация')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Консультация'))
    await waitFor(() => {
      expect(screen.getByText('10:00 – 10:30')).toBeInTheDocument()
    })
    await user.click(screen.getByText('10:00 – 10:30'))
    await user.click(screen.getByRole('button', { name: 'Забронировать' }))
    await waitFor(() => {
      expect(screen.getByText('Бронирование подтверждено!')).toBeInTheDocument()
    })
  })

  it('shows error when localStorage has no guest data', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Консультация')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Консультация'))
    await waitFor(() => {
      expect(screen.getByText('10:00 – 10:30')).toBeInTheDocument()
    })
    await user.click(screen.getByText('10:00 – 10:30'))
    await user.click(screen.getByRole('button', { name: 'Забронировать' }))
    await waitFor(() => {
      expect(screen.getByText(/Не указаны имя или email/)).toBeInTheDocument()
    })
  })

  it('navigates back to /guest/guest-info', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Консультация')).toBeInTheDocument()
    })
    await userEvent.setup().click(screen.getByRole('button', { name: 'Назад' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/guest/guest-info')
  })
})
