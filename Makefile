.PHONY: dev prism frontend build lint stop check

dev:
	cd typespec && npx prism mock tsp-output/openapi/openapi.yaml --port 4010 &
	cd frontend && npm run dev &
	wait

prism:
	cd typespec && npx prism mock tsp-output/openapi/openapi.yaml --port 4010

frontend:
	cd frontend && npm run dev

check:
	@curl -sf http://localhost:4010/api/event-types > /dev/null && echo "✓ Prism OK" || echo "✗ Prism not responding"
	@curl -sf http://localhost:5173/ > /dev/null && echo "✓ Frontend OK" || echo "✗ Frontend not responding"

build:
	cd frontend && npm run build

lint:
	cd frontend && npm run lint

stop:
	pkill -f prism || true
	pkill -f vite || true
