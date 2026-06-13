import { MantineProvider, Container, Title, Button, Stack } from '@mantine/core'

function App() {
  return (
    <MantineProvider>
      <Container size="sm" py="xl">
        <Stack gap="md">
          <Title>Calendar Booking</Title>
          <Button>Get Started</Button>
        </Stack>
      </Container>
    </MantineProvider>
  )
}

export default App
