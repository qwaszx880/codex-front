.PHONY: dev build check test token down reset

dev:
	docker compose up --build
build:
	npm ci && npm run build
check:
	npm run check

test:
	npm test
token:
	@curl -fsS -X POST "http://$${PLATFORM_PUBLIC_HOST:-localhost}:8081/realms/platform/protocol/openid-connect/token" -H 'content-type: application/x-www-form-urlencoded' -d grant_type=password -d client_id=cluster-platform -d username=developer -d password=developer | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).access_token))"
down:
	docker compose down
reset:
	docker compose down -v --remove-orphans
