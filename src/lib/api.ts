import type { Cluster, Json, Membership, Operation, Principal, Project, Role } from '../types'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export class ApiError extends Error {
  constructor(public status: number, public detail: string) { super(detail) }
}

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init?.headers },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: response.statusText }))
    throw new ApiError(response.status, typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail))
  }
  return response.status === 204 ? undefined as T : response.json()
}

export const api = {
  me: (t: string) => request<Principal>('/v1/principals/me', t),
  projects: (t: string) => request<Project[]>('/v1/projects', t),
  clusters: (t: string, projectId: string) => request<Cluster[]>(`/v1/clusters?project_id=${projectId}`, t),
  cluster: (t: string, id: string) => request<Cluster>(`/v1/clusters/${id}`, t),
  createCluster: (t: string, body: Json) => request<Operation>('/v1/clusters', t, { method: 'POST', body: JSON.stringify(body) }),
  scale: (t: string, id: string, pool: string, replicas: number) => request<Operation>(`/v1/clusters/${id}/scale`, t, { method: 'POST', body: JSON.stringify({ pool, replicas }) }),
  upgrade: (t: string, id: string, version: string) => request<Operation>(`/v1/clusters/${id}/upgrade`, t, { method: 'POST', body: JSON.stringify({ version }) }),
  revisions: (t: string, id: string) => request<Json[]>(`/v1/clusters/${id}/revisions`, t),
  operations: (t: string, id: string) => request<Operation[]>(`/v1/clusters/${id}/operations`, t),
  operation: (t: string, id: string) => request<Operation>(`/v1/operations/${id}`, t),
  health: (t: string, id: string) => request<Json>(`/v1/clusters/${id}/health`, t),
  resources: (t: string, id: string) => request<Json[]>(`/v1/clusters/${id}/resources`, t),
  conditions: (t: string, id: string) => request<Json[]>(`/v1/clusters/${id}/conditions`, t),
  roles: (t: string, projectId: string) => request<Role[]>(`/v1/projects/${projectId}/roles`, t),
  members: (t: string, projectId: string) => request<Membership[]>(`/v1/projects/${projectId}/members`, t),
  addMember: (t: string, projectId: string, principal_id: string, role_id: string) => request<Membership>(`/v1/projects/${projectId}/members`, t, { method: 'POST', body: JSON.stringify({ principal_id, role_id }) }),
  removeMember: (t: string, projectId: string, principalId: string, roleId: string) => request<void>(`/v1/projects/${projectId}/members/${principalId}/roles/${roleId}`, t, { method: 'DELETE' }),
}
