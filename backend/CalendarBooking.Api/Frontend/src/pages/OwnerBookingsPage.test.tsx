import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import dayjs from 'dayjs'
import { OwnerBookingsPage } from './OwnerBookingsPage'
import type { BookingWithSlot, EventType } from '../types'

const monday = dayjs().day(1).format('YYYY-MM-DD')

const mockEventTypes: EventType[] = [
  {
    id: 'et-1',
    ownerId: 'owner-1',
    name: 'Консультация',
    description: 'Бесплатная консультация',
    durationMinutes: 30,
    slotIntervalMinutes: 15,
  },
]

const mockBookings: BookingWithSlot[] = [
  {
    id: 'b-1',
    slotId: 'slot-1',
    guestName: 'Иван',
    guestEmail: 'ivan@test.com',
    createdAt: '2026-06-15T00:00:00Z',
    slot: {
      id: 'slot-1',
      eventTypeId: 'et-1',
      startTime: `${monday}T10:00:00`,
      endTime: `${monday}T10:30:00`,
      isOccupied: true,
    },
  },
  {
    id: 'b-2',
    slotId: 'slot-2',
    guestName: 'Мария',
    guestEmail: 'maria@test.com',
    createdAt: '2026-06-15T00:00:00Z',
    slot: {
      id: 'slot-2',
      eventTypeId: 'et-1',
      startTime: `${monday}T14:00:00`,
      endTime: `${monday}T14:30:00`,
      isOccupied: true,
    },
  },
]

vi.mock('../api', () => ({
  fetchBookings: vi.fn(),
  fetchEventTypes: vi.fn(),
}))

import { fetchBookings, fetchEventTypes } from '../api'

const mockFetchBookings = vi.mocked(fetchBookings)
const mockFetchEventTypes = vi.mocked(fetchEventTypes)

function renderPage() {
  return render(
    <MantineProvider>
      <MemoryRouter initialEntries={['/admin/bookings']}>
        <OwnerBookingsPage />
      </MemoryRouter>
    </MantineProvider>,
  )
}

describe('OwnerBookingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchBookings.mockResolvedValue(mockBookings)
    mockFetchEventTypes.mockResolvedValue(mockEventTypes)
  })

  it('shows loading initially', () => {
    renderPage()
    expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument()
  })

  it('renders title after loading', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Предстоящие встречи')).toBeInTheDocument()
    })
  })

  it('renders WeekView after loading', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Предстоящие встречи')).toBeInTheDocument()
    })
    expect(document.querySelector('[class*="weekView"]')).toBeInTheDocument()
  })

  it('renders events on the week view', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/Иван/)).toBeInTheDocument()
    })
    expect(screen.getByText(/Мария/)).toBeInTheDocument()
  })

  it('shows error alert when fetchBookings fails', async () => {
    mockFetchBookings.mockRejectedValue(new Error('Сетевая ошибка'))
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Сетевая ошибка')).toBeInTheDocument()
    })
  })

  it('shows error alert when fetchEventTypes fails', async () => {
    mockFetchEventTypes.mockRejectedValue(new Error('Ошибка загрузки'))
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Ошибка загрузки')).toBeInTheDocument()
    })
  })

  it('renders week navigation header with controls', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Предстоящие встречи')).toBeInTheDocument()
    })
    const header = document.querySelector('[class*="weekViewHeader"]')
    expect(header).toBeInTheDocument()
  })

  it('initializes date to current week Monday', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Предстоящие встречи')).toBeInTheDocument()
    })
    const headerText = document.querySelector('[class*="weekViewHeader"]')?.textContent ?? ''
    expect(headerText).toContain(dayjs(monday).format('D'))
  })

  it('navigates to next week when next button is clicked', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Предстоящие встречи')).toBeInTheDocument()
    })

    const initialText = document.querySelector('[class*="weekViewHeader"]')?.textContent ?? ''
    const nextBtn = screen.getByRole('button', { name: 'Next' })
    await user.click(nextBtn)

    await waitFor(() => {
      const newText = document.querySelector('[class*="weekViewHeader"]')?.textContent ?? ''
      expect(newText).not.toBe(initialText)
      expect(newText).toContain(dayjs(monday).add(7, 'day').format('D'))
    })
  })

  it('navigates to previous week when prev button is clicked', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Предстоящие встречи')).toBeInTheDocument()
    })

    const initialText = document.querySelector('[class*="weekViewHeader"]')?.textContent ?? ''
    const prevBtn = screen.getByRole('button', { name: 'Previous' })
    await user.click(prevBtn)

    await waitFor(() => {
      const newText = document.querySelector('[class*="weekViewHeader"]')?.textContent ?? ''
      expect(newText).not.toBe(initialText)
      expect(newText).toContain(dayjs(monday).subtract(7, 'day').format('D'))
    })
  })

  it('returns to current week when today button is clicked', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Предстоящие встречи')).toBeInTheDocument()
    })

    const initialText = document.querySelector('[class*="weekViewHeader"]')?.textContent ?? ''
    const nextBtn = screen.getByRole('button', { name: 'Next' })
    await user.click(nextBtn)
    await waitFor(() => {
      const newText = document.querySelector('[class*="weekViewHeader"]')?.textContent ?? ''
      expect(newText).not.toBe(initialText)
    })

    const todayBtn = screen.getByRole('button', { name: 'Today' })
    await user.click(todayBtn)
    await waitFor(() => {
      const headerText = document.querySelector('[class*="weekViewHeader"]')?.textContent ?? ''
      expect(headerText).toContain(dayjs(monday).format('D'))
    })
  })

  it('renders empty week view when there are no bookings', async () => {
    mockFetchBookings.mockResolvedValue([])
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Предстоящие встречи')).toBeInTheDocument()
    })
    expect(document.querySelector('[class*="weekView"]')).toBeInTheDocument()
    expect(screen.queryByText(/Иван/)).not.toBeInTheDocument()
  })
})
