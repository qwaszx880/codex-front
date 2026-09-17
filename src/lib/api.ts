import type { Cluster, Json, ManagementCluster, Membership, NodeProfile, Operation, Organization, Principal, Project, ProviderReference, Role } from '../types'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export interface OidcMetadata {
  authorization_endpoint: string
  token_endpoint: string
}

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

async function oidcRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  if (!response.ok) throw new Error(`OIDC request failed (${response.status})`)
  return response.json()
}

export const api = {
  oidcMetadata: (issuer: string) => oidcRequest<OidcMetadata>(`${issuer.replace(/\/$/, '')}/.well-known/openid-configuration`),
  exchangeOidcCode: (endpoint: string, values: Record<string, string>) => oidcRequest<{ access_token: string }>(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(values),
  }),
  me: (t: string) => request<Principal>('/v1/principals/me', t),
  organizations: (t: string) => request<Organization[]>('/v1/organizations', t),
  organizationProjects: (t: string, id: string) => request<Project[]>(`/v1/organizations/${id}/projects`, t),
  createProject: (t: string, id: string, body: { name: string; namespace: string }) => request<Project>(`/v1/organizations/${id}/projects`, t, { method: 'POST', body: JSON.stringify(body) }),
  updateProject: (t: string, id: string, body: { name?: string; enabled?: boolean }) => request<Project>(`/v1/projects/${id}`, t, { method: 'PATCH', body: JSON.stringify(body) }),
  organizationPrincipals: (t: string, id: string) => request<Principal[]>(`/v1/organizations/${id}/principals`, t),
  organizationRoles: (t: string, id: string) => request<Role[]>(`/v1/organizations/${id}/roles`, t),
  createPrincipal: (t: string, id: string, body: Json) => request<Principal>(`/v1/organizations/${id}/principals`, t, { method: 'POST', body: JSON.stringify(body) }),
  updatePrincipal: (t: string, organizationId: string, principalId: string, body: Json) => request<Principal>(`/v1/organizations/${organizationId}/principals/${principalId}`, t, { method: 'PATCH', body: JSON.stringify(body) }),
  projects: (t: string) => request<Project[]>('/v1/projects', t),
  managementClusters: (t: string) => request<ManagementCluster[]>('/v1/management-clusters', t),
  providerReferences: (t: string, projectId: string) => request<ProviderReference[]>(`/v1/projects/${projectId}/provider-references`, t),
  createProviderReference: (t: string, projectId: string, body: Json) => request<ProviderReference>(`/v1/projects/${projectId}/provider-references`, t, { method: 'POST', body: JSON.stringify(body) }),
  updateProviderReference: (t: string, projectId: string, id: string, body: Json) => request<ProviderReference>(`/v1/projects/${projectId}/provider-references/${id}`, t, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteProviderReference: (t: string, projectId: string, id: string) => request<void>(`/v1/projects/${projectId}/provider-references/${id}`, t, { method: 'DELETE' }),
  nodeProfiles: (t: string, projectId: string) => request<NodeProfile[]>(`/v1/projects/${projectId}/node-profiles`, t),
  createNodeProfile: (t: string, projectId: string, body: Json) => request<NodeProfile>(`/v1/projects/${projectId}/node-profiles`, t, { method: 'POST', body: JSON.stringify(body) }),
  updateNodeProfile: (t: string, projectId: string, id: string, specification: Json) => request<NodeProfile>(`/v1/projects/${projectId}/node-profiles/${id}`, t, { method: 'PUT', body: JSON.stringify({ specification }) }),
  deleteNodeProfile: (t: string, projectId: string, id: string) => request<void>(`/v1/projects/${projectId}/node-profiles/${id}`, t, { method: 'DELETE' }),
  clusters: (t: string, projectId: string) => request<Cluster[]>(`/v1/clusters?project_id=${projectId}`, t),
  cluster: (t: string, id: string) => request<Cluster>(`/v1/clusters/${id}`, t),
  createCluster: (t: string, body: Json) => request<Operation>('/v1/clusters', t, { method: 'POST', body: JSON.stringify(body) }),
  updateCluster: (t: string, id: string, spec: Json, reason: string) => request<Operation>(`/v1/clusters/${id}`, t, { method: 'PATCH', body: JSON.stringify({ spec, reason }) }),
  deleteCluster: (t: string, id: string) => request<Operation>(`/v1/clusters/${id}`, t, { method: 'DELETE' }),
  addWorkerNodeType: (t: string, id: string, worker_node_type: Json) => request<Operation>(`/v1/clusters/${id}/worker-node-types`, t, { method: 'POST', body: JSON.stringify({ worker_node_type }) }),
  replaceWorkerNodeType: (t: string, id: string, name: string, worker_node_type: Json) => request<Operation>(`/v1/clusters/${id}/worker-node-types/${encodeURIComponent(name)}`, t, { method: 'PUT', body: JSON.stringify({ worker_node_type }) }),
  deleteWorkerNodeType: (t: string, id: string, name: string) => request<Operation>(`/v1/clusters/${id}/worker-node-types/${encodeURIComponent(name)}`, t, { method: 'DELETE' }),
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
