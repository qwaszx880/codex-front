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
})
