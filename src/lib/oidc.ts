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

// Web Crypto's digest API is unavailable on non-secure HTTP origins in some
// browsers. Keep PKCE usable there while deployments are moved to HTTPS.
function sha256(value: Uint8Array) {
  const rotateRight = (word: number, bits: number) => (word >>> bits) | (word << (32 - bits))
  const constants = new Uint32Array(64)
  const initial = new Uint32Array(8)
  let prime = 2
  let constantIndex = 0

  while (constantIndex < 64) {
    let isPrime = true
    for (let factor = 2; factor * factor <= prime; factor += 1) {
      if (prime % factor === 0) { isPrime = false; break }
    }
    if (isPrime) {
      if (constantIndex < 8) initial[constantIndex] = (Math.sqrt(prime) % 1) * 0x100000000
      constants[constantIndex] = (Math.cbrt(prime) % 1) * 0x100000000
      constantIndex += 1
    }
    prime += 1
  }

  const bitLength = value.length * 8
  const paddedLength = Math.ceil((value.length + 9) / 64) * 64
  const padded = new Uint8Array(paddedLength)
  padded.set(value)
  padded[value.length] = 0x80
  const paddedView = new DataView(padded.buffer)
  paddedView.setUint32(paddedLength - 4, bitLength, false)

  const hash = initial
  const words = new Uint32Array(64)
  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let index = 0; index < 16; index += 1) words[index] = paddedView.getUint32(offset + index * 4, false)
    for (let index = 16; index < 64; index += 1) {
      const previous = words[index - 15]
      const earlier = words[index - 2]
      const sigma0 = rotateRight(previous, 7) ^ rotateRight(previous, 18) ^ (previous >>> 3)
      const sigma1 = rotateRight(earlier, 17) ^ rotateRight(earlier, 19) ^ (earlier >>> 10)
      words[index] = words[index - 16] + sigma0 + words[index - 7] + sigma1
    }

    let [a, b, c, d, e, f, g, h] = hash
    for (let index = 0; index < 64; index += 1) {
      const sum1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25)
      const choice = (e & f) ^ (~e & g)
      const first = h + sum1 + choice + constants[index] + words[index]
      const sum0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22)
      const majority = (a & b) ^ (a & c) ^ (b & c)
      const second = sum0 + majority
      ;[a, b, c, d, e, f, g, h] = [first + second, a, b, c, d + first, e, f, g]
    }
    ;[a, b, c, d, e, f, g, h].forEach((word, index) => { hash[index] += word })
  }

  const result = new Uint8Array(32)
  const resultView = new DataView(result.buffer)
  hash.forEach((word, index) => resultView.setUint32(index * 4, word, false))
  return result.buffer
}

export async function createPkceChallenge(verifier: string, subtle = globalThis.crypto.subtle) {
  const value = new TextEncoder().encode(verifier)
  return base64Url(subtle ? await subtle.digest('SHA-256', value) : sha256(value))
}

export function oidcIsConfigured() {
  return Boolean(oidcConfig.issuer && oidcConfig.clientId)
}

export async function beginOidcLogin() {
  if (!oidcIsConfigured()) throw new Error('OIDC issuer and client ID are not configured.')
  const metadata = await api.oidcMetadata(oidcConfig.issuer)
  const state = randomValue()
  const verifier = randomValue(48)
  const challenge = await createPkceChallenge(verifier)
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
