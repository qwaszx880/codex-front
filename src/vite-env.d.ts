/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_OIDC_ISSUER?: string
  readonly VITE_OIDC_CLIENT_ID?: string
  readonly VITE_OIDC_SCOPE?: string
  readonly VITE_OIDC_REDIRECT_URI?: string
  readonly VITE_ALLOW_TOKEN_INJECTION?: string
}
