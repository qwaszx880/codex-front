import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError } from './api'

describe('API client', () => {
  afterEach(() => vi.restoreAllMocks())

  it('adds the bearer token and parses a successful response', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([{ id: 'project-1', name: 'Sandbox' }]), { status: 200 }),
    )

    const projects = await api.projects('test-token')

    expect(projects[0].name).toBe('Sandbox')
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/projects', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
    }))
  })

  it('surfaces API error details', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ detail: 'Permission denied' }), { status: 403 }),
    )

    await expect(api.projects('bad-token')).rejects.toEqual(new ApiError(403, 'Permission denied'))
  })

  it('discovers OIDC endpoints and exchanges a public-client authorization code', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({
        authorization_endpoint: 'https://identity.example/authorize',
        token_endpoint: 'https://identity.example/token',
      })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'oidc-token' })))

    const metadata = await api.oidcMetadata('https://identity.example/')
    const tokens = await api.exchangeOidcCode(metadata.token_endpoint, {
      grant_type: 'authorization_code', code: 'code', client_id: 'public-client',
      redirect_uri: 'https://console.example/', code_verifier: 'verifier',
    })

    expect(tokens.access_token).toBe('oidc-token')
    expect(fetchMock).toHaveBeenNthCalledWith(1, 'https://identity.example/.well-known/openid-configuration', undefined)
    const exchange = fetchMock.mock.calls[1][1] as RequestInit
    expect(exchange.body?.toString()).toContain('code_verifier=verifier')
    expect(exchange.body?.toString()).not.toContain('client_secret')
  })
})
