.PHONY: dev build check test down

dev:
	docker compose up --build
build:
	npm ci && npm run build
check:
	npm run check

test:
	npm test
down:
	docker compose down
