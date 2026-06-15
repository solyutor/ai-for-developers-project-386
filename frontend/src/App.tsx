import { MantineProvider, Container, Title, Stack } from '@mantine/core'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { EventTypeFormPage } from './pages/EventTypeFormPage'
import { OwnerBookingsPage } from './pages/OwnerBookingsPage'
import { GuestBookingPage } from './pages/GuestBookingPage'
import { GuestInfoPage } from './pages/GuestInfoPage'
import { RoleSelectPage } from './pages/RoleSelectPage'

function App() {
  return (
    <MantineProvider>
      <BrowserRouter>
        <Container size="sm" py="xl">
          <Stack gap="md">
            <Title>
              <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                Calendar Booking
              </Link>
            </Title>
            <Routes>
              <Route path="/" element={<RoleSelectPage />} />
              <Route path="/admin/event-types/new" element={<EventTypeFormPage />} />
              <Route path="/admin/bookings" element={<OwnerBookingsPage />} />
              <Route path="/guest/guest-info" element={<GuestInfoPage />} />
              <Route path="/guest/book" element={<GuestBookingPage />} />
            </Routes>
          </Stack>
        </Container>
      </BrowserRouter>
    </MantineProvider>
  )
}

export default App
