# Northstar cluster console

Northstar is a **frontend-only** React console for an existing Cluster Control Plane deployment. FastAPI, its database, queue, workers, migrations, and identity provider run outside this repository and are managed by a separate deployment.

The primary `compose.yaml` starts exactly one application service: `frontend`.

## Connect to FastAPI through a host port

When the separate FastAPI deployment publishes port 8000 on the Docker host:

```bash
cp .env.example .env
docker compose up
```

The browser calls `/api`. Vite proxies those requests to `API_PROXY_TARGET`, which defaults to `http://host.docker.internal:8000`. The default bind address is intentionally limited to `127.0.0.1`; change `CONSOLE_BIND_ADDRESS` only when remote access is required.

For development without Compose:

```bash
npm ci
API_PROXY_TARGET=http://localhost:8000 npm run dev
```

## Connect separate Compose projects on a shared network

Create the network once, then start this frontend with the optional overlay:

```bash
docker network create platform-network
docker compose -f compose.yaml -f compose.external-network.yaml up
```

The overlay only attaches `frontend` to the external `${PLATFORM_NETWORK:-platform-network}` network. On this network, `API_PROXY_TARGET` defaults to `http://api:8000`.

The backend Compose project must attach its **existing** API service to the same external network and give it the `api` alias. For example, add an overlay in the backend repository:

```yaml
services:
  api:
    networks:
      platform:
        aliases: [api]

networks:
  platform:
    name: ${PLATFORM_NETWORK:-platform-network}
    external: true
```

This repository neither defines nor starts that API service.

## OIDC login

The browser uses OIDC discovery at `<issuer>/.well-known/openid-configuration` and Authorization Code with PKCE (S256). Configure:

| Variable | Purpose |
|---|---|
| `VITE_OIDC_ISSUER` | Browser-accessible issuer URL |
| `VITE_OIDC_CLIENT_ID` | Public browser client identifier |
| `VITE_OIDC_SCOPE` | Requested scopes (default `openid profile email`) |
| `VITE_OIDC_REDIRECT_URI` | Registered callback URI; blank uses the console origin plus `/` |
| `VITE_ALLOW_TOKEN_INJECTION` | Set `true` only to show manual token entry for development |

Register the OIDC application as a **public client** using Authorization Code + PKCE and register the exact redirect URI. Never configure a browser client secret. All `VITE_*` variables are public build-time values embedded in the frontend bundle; they must not contain secrets.

Access tokens, OIDC state, and the temporary PKCE verifier are kept in `sessionStorage`. Bearer tokens are never written to `localStorage`. The code exchange sends no client secret.

The identity provider must permit browser requests from the console origin to its discovery and token endpoints. This repository does not include or start an OIDC provider.

## Production image

The multi-stage Docker image serves static assets with Nginx and proxies `/api` through the runtime `API_PROXY_TARGET` value:

```bash
docker build -t northstar-console .
docker run --rm -p 8080:80 \
  --add-host host.docker.internal:host-gateway \
  -e API_PROXY_TARGET=http://host.docker.internal:8000 \
  northstar-console
```

OIDC `VITE_*` settings are build-time values. Supply them when building the application for each environment.

## Development checks

```bash
npm run check              # ESLint
npm test                   # Vitest
npm run build              # Type-check and production build
docker compose config      # Validate the frontend Compose project
```

Source layout:

```text
src/
├── components/            # Shared presentational primitives
├── lib/api.ts             # All HTTP access, including OIDC discovery and exchange
├── lib/oidc.ts            # Authorization Code + PKCE browser flow
├── pages/                 # Route-level product views
├── App.tsx                # Authentication and application shell
└── styles.css             # Responsive visual system
```
