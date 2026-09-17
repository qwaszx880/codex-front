import { api } from './api'

const STATE_KEY = 'cluster-console-oidc-state'
const VERIFIER_KEY = 'cluster-console-pkce-verifier'

export const oidcConfig = {
  issuer: (import.meta.env.VITE_OIDC_ISSUER || '').replace(/\/$/, ''),
  clientId: import.meta.env.VITE_OIDC_CLIENT_ID || '',
  scope: import.meta.env.VITE_OIDC_SCOPE || 'openid profile email',
  redirectUri: import.meta.env.VITE_OIDC_REDIRECT_URI || `${window.location.origin}/`,
  allowTokenInjection: import.meta.env.VITE_ALLOW_TOKEN_INJECTION === 'true',
}

function randomValue(bytes = 32) {
  const value = crypto.getRandomValues(new Uint8Array(bytes))
  return Array.from(value, byte => byte.toString(16).padStart(2, '0')).join('')
}

function base64Url(bytes: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function oidcIsConfigured() {
  return Boolean(oidcConfig.issuer && oidcConfig.clientId)
}

export async function beginOidcLogin() {
  if (!oidcIsConfigured()) throw new Error('OIDC issuer and client ID are not configured.')
  const metadata = await api.oidcMetadata(oidcConfig.issuer)
  const state = randomValue()
  const verifier = randomValue(48)
  const challenge = base64Url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)))
  sessionStorage.setItem(STATE_KEY, state)
  sessionStorage.setItem(VERIFIER_KEY, verifier)
  const params = new URLSearchParams({
    response_type: 'code', client_id: oidcConfig.clientId, redirect_uri: oidcConfig.redirectUri,
    scope: oidcConfig.scope, state, code_challenge: challenge, code_challenge_method: 'S256',
  })
  window.location.assign(`${metadata.authorization_endpoint}?${params}`)
}

export async function finishOidcLogin(search: string) {
  const params = new URLSearchParams(search)
  const code = params.get('code')
  if (!code) return undefined
  const expectedState = sessionStorage.getItem(STATE_KEY)
  const verifier = sessionStorage.getItem(VERIFIER_KEY)
  sessionStorage.removeItem(STATE_KEY)
  sessionStorage.removeItem(VERIFIER_KEY)
  if (!expectedState || params.get('state') !== expectedState) throw new Error('OIDC state validation failed. Please sign in again.')
  if (!verifier) throw new Error('The PKCE verifier is missing. Please sign in again.')
  const metadata = await api.oidcMetadata(oidcConfig.issuer)
  const tokens = await api.exchangeOidcCode(metadata.token_endpoint, {
    grant_type: 'authorization_code', code, client_id: oidcConfig.clientId,
    redirect_uri: oidcConfig.redirectUri, code_verifier: verifier,
  })
  return tokens.access_token
}
