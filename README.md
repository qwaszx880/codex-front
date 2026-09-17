# Northstar cluster console

A modern React console for the [Cluster Control Plane](https://github.com/qwaszx880/codex). It covers the complete documented API surface: identity, visible projects, project role assignments, cluster creation, scaling and upgrades, operation history, revisions, normalized health, raw resources, and conditions.

## Highlights

- Responsive fleet dashboard and cluster detail views
- Guided cluster provisioning with safe local defaults
- Scale and Kubernetes upgrade actions
- Full revision, operation, health, resource, and condition inspection
- Project membership and role management
- OIDC bearer token injection for local development (kept in `sessionStorage` only)
- A Compose stack with the API, PostgreSQL, RabbitMQ, Keycloak, executor, observer, Flower, and Adminer

## Quick start (Docker Compose)

**Requirements:** Docker Engine or Docker Desktop with Compose v2, and internet access on the first build. The Compose build fetches the backend directly from its GitHub repository.

```bash
cp .env.example .env
docker compose up --build -d
docker compose ps -a
```

Wait for `migrate` and `bootstrap` to finish successfully, then get the local developer token:

```bash
make token
```

Open <http://localhost:5173>, paste the printed token, and select **Open console**. Local credentials and services are development-only.

| Service | URL / credentials |
|---|---|
| Northstar console | <http://localhost:5173> |
| FastAPI / OpenAPI | <http://localhost:8000/docs> |
| Keycloak | <http://localhost:8081> (`admin` / `admin`) |
| Adminer | <http://localhost:8080> (`postgres`, server `postgres`, `platform` / `platform`) |
| RabbitMQ | <http://localhost:15672> (`platform` / `platform`) |
| Flower | <http://localhost:5555> |

The imported application user is `developer` / `developer`. `make token` exchanges these local credentials with Keycloak; the console itself never handles passwords.

### Stop or reset

```bash
make down                 # retain database and queues
make reset                # delete all local volumes and state
```

If accessing Compose from another machine, set `PLATFORM_PUBLIC_HOST` in `.env` to the hostname or IP that the browser uses. This is important because the token issuer must match the backend OIDC configuration.

## Run only the frontend

Use this when the FastAPI application and its dependencies already run locally:

```bash
npm install
npm run dev
```

Vite serves the app at <http://localhost:5173> and proxies `/api` to the Compose service `api`. When running Vite directly on the host, override the API URL:

```bash
VITE_API_URL=http://localhost:8000 npm run dev
```

The upstream API does not enable browser CORS by default, so the full Compose proxy is recommended. For a production-style static image, build and run the included multi-stage image on the same Docker network as a service named `api`:

```bash
docker build -t northstar-console .
```

## Development commands

```bash
npm run check              # ESLint
npm test                   # Vitest
npm run build              # Type-check and production build
docker compose config      # Validate the local stack
```

Source layout:

```text
src/
├── components/            # Shared presentational primitives
├── lib/api.ts             # Typed FastAPI client
├── pages/                 # Route-level product views
├── App.tsx                # Authentication and application shell
└── styles.css             # Responsive visual system
```

## Authentication and security

The console accepts an existing OIDC access token for development and sends it as a bearer token on every API request. The token is stored in browser `sessionStorage`, not local storage, and is removed when signing out or closing the tab. This injection flow is convenient for local testing but is not a replacement for a production authorization-code + PKCE flow. Put the console and API behind TLS and integrate your OIDC client before production deployment.

## API capability map

| Capability | Console location |
|---|---|
| Current principal and visible projects | Sign-in bootstrap and application shell |
| List/create clusters | **Clusters** |
| Cluster metadata and health | **Clusters → cluster → Overview** |
| Scale / upgrade | **Clusters → cluster → Overview** |
| Operations, revisions, resources, conditions | Matching cluster detail tabs |
| Project roles and members | **Projects & access** |
| Add/remove a project role | **Projects & access** |
| Health and metrics endpoints | Compose health/log tooling; FastAPI `/healthz` and `/metrics` |

Cluster deletion and general patching are not shown because the backend explicitly documents them as future work rather than implemented API functions.

## Troubleshooting

- **Token rejected:** ensure Keycloak is ready, regenerate it with `make token`, and verify `PLATFORM_PUBLIC_HOST` matches the browser-visible hostname.
- **Empty operations immediately after create:** mutations are asynchronous. Refresh after the executor and fake observer process the command.
- **Backend image rebuild:** run `docker compose build --no-cache api`, then `docker compose up -d`.
- **Start fresh:** run `make reset`, followed by `docker compose up --build -d`.
