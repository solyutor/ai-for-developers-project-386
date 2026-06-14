import { MantineProvider, Container, Title, Stack } from '@mantine/core'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { EventTypeFormPage } from './pages/EventTypeFormPage'
import { EventTypesListPage } from './pages/EventTypesListPage'

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
              <Route path="/" element={<EventTypesListPage />} />
              <Route path="/admin/event-types/new" element={<EventTypeFormPage />} />
            </Routes>
          </Stack>
        </Container>
      </BrowserRouter>
    </MantineProvider>
  )
}

export default App
