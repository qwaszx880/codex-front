// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { createPkceChallenge } from './oidc'

describe('OIDC PKCE', () => {
  const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
  const challenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'

  it('creates an S256 challenge with Web Crypto', async () => {
    expect(await createPkceChallenge(verifier)).toBe(challenge)
  })

  it('creates an S256 challenge when crypto.subtle is unavailable', async () => {
    expect(await createPkceChallenge(verifier, undefined)).toBe(challenge)
  })
})
