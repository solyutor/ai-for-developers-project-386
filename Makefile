.PHONY: dev backend prism frontend test build lint stop check e2e-install e2e e2e-ui e2e-headed e2e-mcp e2e-mcp-headless

dev:
	$(MAKE) stop
	cd backend/CalendarBooking.Api && dotnet run --urls "http://localhost:4010" &
	cd frontend && npm run dev &
	wait

backend:
	$(MAKE) stop
	cd backend/CalendarBooking.Api && dotnet run --urls "http://localhost:4010"

prism:
	cd typespec && npx prism mock tsp-output/openapi/openapi.yaml --port 4010

frontend:
	cd frontend && npm run dev

test:
	dotnet test backend/CalendarBooking.Api.Tests

e2e-install:
	cd e2e && npm install

e2e: e2e-install
	cd e2e && npx playwright test

e2e-headed: e2e-install
	cd e2e && npx playwright test --headed

e2e-ui: e2e-install
	cd e2e && npx playwright test --ui

e2e-mcp:
	cd e2e && npx @playwright/mcp@latest

e2e-mcp-headless:
	cd e2e && npx @playwright/mcp@latest --headless

build:
	cd frontend && npm run build

lint:
	cd frontend && npm run lint

check:
	@curl -sf http://localhost:4010/api/event-types > /dev/null && echo "✓ Backend OK" || echo "✗ Backend not responding"
	@curl -sf http://localhost:5173/ > /dev/null && echo "✓ Frontend OK" || echo "✗ Frontend not responding"
	@which npx > /dev/null && echo "✓ Node.js tools OK" || echo "✗ npx not found"

stop:
	@echo "Stopping backend and frontend..."
	@lsof -ti:4010 | xargs kill 2>/dev/null || true
	@lsof -ti:5173 | xargs kill 2>/dev/null || true
	@sleep 1
	@lsof -ti:4010 | xargs kill -9 2>/dev/null || true
	@lsof -ti:5173 | xargs kill -9 2>/dev/null || true
