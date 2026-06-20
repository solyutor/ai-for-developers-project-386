# Agents

## Default branch
- Default branch: `master` — all CI/CD workflows trigger on this branch.

## What this repo is
Hexlet educational project: a TypeSpec API contract for a Calendar Booking system with a React frontend and a .NET backend implementation.

## Structure
- `typespec/` — TypeSpec API contract (single source of truth)
- `backend/` — .NET 10 API (EF Core + SQLite, port 4010)
  - `CalendarBooking.Api/` — minimal API project
  - `CalendarBooking.Api/Frontend/` — Vite + React 19 + TypeScript + Mantine UI (moved inside backend for Rider single-solution support)
- `e2e/` — Playwright E2E tests + MCP server config
- `Dockerfile` — multi-stage Docker build (frontend + backend)
- `CalendarBooking.Api.slnx` — .NET solution at repo root (open in Rider)
- `.run/` — shared Rider run configurations (Backend, Frontend, All)

## Key files
- `typespec/main.tsp` — API models, routes, request bodies
- `typespec/tspconfig.yaml` — emitter config (OpenAPI 3.0)
- `typespec/tsp-output/openapi/openapi.yaml` — generated OpenAPI spec (**gitignored, must regenerate after clone**)
- `backend/CalendarBooking.Api/Program.cs` — .NET minimal API routes (mirrors TypeSpec contract). Reads `PORT` env var (default 4010). Serves static files from `wwwroot/` and provides SPA fallback for React Router.
- `backend/CalendarBooking.Api/Config.cs` — hardcoded `OwnerId` and `SlotWindowDays` (14)
- `backend/CalendarBooking.Api/appsettings.json` — SQLite connection string
- `backend/CalendarBooking.Api/CalendarBooking.Api.csproj` — MSBuild targets auto-build the frontend on first build and in Release
- `backend/CalendarBooking.Api/Frontend/vite.config.ts` — Vite config, `outDir: '../wwwroot'`
- `backend/CalendarBooking.Api/Frontend/src/config.ts` — hardcoded `OWNER_ID` (no auth system)
- `backend/CalendarBooking.Api/Frontend/src/App.tsx` — app routes
- `backend/CalendarBooking.Api/Frontend/src/api.ts` — API client
- `e2e/playwright.backend.config.ts` — Playwright config for E2E tests against backend-served frontend (port 4010)
- `CONTEXT.md` — app specification (owner/guest roles, booking rules) in Russian
- `Makefile` — convenience targets for dev workflow

## Commands

### TypeSpec
```bash
cd typespec && npm install            # install TypeSpec compiler
npx tsp compile main.tsp              # regenerate OpenAPI output
```

### Backend (.NET)
```bash
cd backend/CalendarBooking.Api && dotnet run --urls "http://localhost:4010"
dotnet test backend/CalendarBooking.Api.Tests
```
Solution file: `CalendarBooking.Api.slnx` at repo root (.slnx format).

The MSBuild targets in `.csproj` auto-build the frontend:
- On fresh clone (no `wwwroot/index.html`) — **first `dotnet build` installs npm deps + builds**
- Subsequent `dotnet build` (Debug) — **skips frontend** (fast)
- `dotnet build -c Release` or `dotnet publish` — **always rebuilds frontend**
- `dotnet build -p:BuildFrontend=true` — **force rebuild frontend**

### Frontend
```bash
cd backend/CalendarBooking.Api/Frontend && npm install
npm run dev                           # start Vite dev server (port 5173)
npm run build                         # typecheck (tsc -b) + production build
npm run lint                          # ESLint
npm run test                          # vitest run
```

### Docker
```bash
docker build -t calendar-booking .                                    # multi-stage build
docker run --rm -p 4010:4010 -e PORT=4010 calendar-booking            # run container
```

The backend serves the built frontend from `wwwroot/` on the same port — no separate Vite process needed.

### API mock via Prism (alternative to real backend)
```bash
cd typespec && npx prism mock tsp-output/openapi/openapi.yaml --port 4010
```

Vite proxies `/api/*` to `localhost:4010` — either the real .NET backend or the Prism mock.

### Full dev workflow (via Makefile from repo root)
```bash
make dev                              # starts real .NET backend + Vite in parallel
make backend                          # starts .NET backend only (port 4010)
make prism                            # starts Prism mock only (port 4010)
make frontend                         # starts Vite only (port 5173)
make stop                             # kills processes on ports 4010 and 5173
make check PORT=4010                  # health-checks API + SPA on given port
make test                             # runs backend .NET tests only
make deploy-local PORT=4010           # build Docker image + run container locally
make e2e-backend                      # run E2E tests against backend-served frontend
```

## Rider (JetBrains IDE)
- Open repo root — `CalendarBooking.Api.slnx` loads both .NET projects + `Frontend/` folder
- `.run/` shared run configurations provide three targets:
  - **Backend** — `dotnet run` on port 4010, debug breakpoints work
  - **Frontend** — `npm run dev` with HMR, proxies API to backend
  - **All** — compound config starts both simultaneously

## CI pipeline
`.github/workflows/ci.yml` runs only Playwright E2E tests (on push/PR to master). It installs frontend deps, builds backend in Release (MSBuild auto-builds frontend), installs E2E deps, and runs Playwright against the backend-served frontend (port 4010). Does **not** run frontend unit tests, lint, or TypeSpec compilation.

## Rules
- Do not edit `.github/workflows/hexlet-check.yml` — auto-generated by Hexlet.
- After editing `typespec/main.tsp`, regenerate OpenAPI output before committing.
- Two API interfaces: `Admin` (`/api/...`) and `Public` (`/api/public/...`).
- `tsp-output/` is gitignored. After a fresh clone, run TypeSpec compile before starting Prism or the backend.
- Commits must follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) format.
- Prism is a devDependency in `typespec/package.json` — run from `typespec/` via `npx prism mock ...`.
- `OWNER_ID` in `backend/CalendarBooking.Api/Frontend/src/config.ts` (and `Config.cs` in backend) is hardcoded — no auth/registration system.
- Frontend tests: `npm run test` from `backend/CalendarBooking.Api/Frontend/` runs vitest (jsdom). Test setup mocks Mantine's `matchMedia` and `ResizeObserver`.
- Backend tests: NUnit, use `CustomWebApplicationFactory` with SQLite in-memory.

### E2E (Playwright)
```bash
make e2e-install      # install deps + Chromium browser
make e2e              # run all E2E tests (headless, auto-starts Vite + real .NET backend)
make e2e-headed       # run tests in visible browser
make e2e-ui           # Playwright UI debugger
make e2e-mcp          # start Playwright MCP server (headed)
make e2e-mcp-headless # start Playwright MCP server (headless)
make e2e-backend      # run E2E tests against backend-served frontend (no Vite)
```

E2E Playwright config (`e2e/playwright.config.ts`) auto-starts both Vite (port 5173) and the real .NET backend (port 4010) via `webServer`. The backend uses a temporary SQLite database at `/tmp/e2e-calendar.db` (deleted before each run). Existing servers on those ports are reused when running outside CI.

For deployment-like testing, `e2e/playwright.backend.config.ts` runs Playwright against the backend-served frontend (port 4010 only, no Vite). The frontend is auto-built via MSBuild Release configuration — `make e2e-backend` runs `dotnet build -c Release` first.

Playwright MCP server is also registered in `.opencode/mcp.json` — opencode can use browser tools (`browser_navigate`, `browser_click`, etc.) during sessions. See `.opencode/instructions.md` for browser tool usage guidance.
