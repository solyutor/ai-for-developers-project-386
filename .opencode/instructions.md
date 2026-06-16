# Playwright MCP — E2E Browser Testing

Playwright MCP is available for browser automation during sessions.

## Tools available

The Playwright MCP server exposes browser tools like:
- `browser_navigate` — go to a URL
- `browser_click` — click an element
- `browser_snapshot` — get accessibility tree of current page
- `browser_fill` — fill a form field
- `browser_evaluate` — run JS in the browser

## Before using the browser

Ensure the app is running:

```bash
make prism     # API mock on port 4010
make frontend  # Vite on port 5173
```

Or both together:
```bash
make dev
```

## Typical E2E flow

1. `browser_navigate` to `http://localhost:5173`
2. `browser_snapshot` to see what's on the page
3. `browser_click` on elements to navigate
4. `browser_fill` to enter form data
5. `browser_snapshot` again to verify result

## Running automated tests

```bash
make e2e        # headless
make e2e-headed # visible browser
make e2e-ui     # Playwright UI debugger
```
