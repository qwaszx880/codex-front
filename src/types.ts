export interface Project { id: string; organization_id: string; name: string; namespace: string; enabled: boolean }
export interface Principal { id: string; username?: string; display_name?: string; email?: string; principal_type: string; enabled: boolean }
export interface Cluster { id: string; project_id: string; name: string; desired_revision: number; applied_revision?: number; observed_revision?: number }
export interface Operation { id: string; cluster_id: string; kind: string; state: string; target_revision: number; created_at: string }
export interface Organization { id: string; name: string; display_name: string }
export interface ManagementCluster { id: string; name: string; provider: string; region: string; enabled: boolean; executor_compatibility: string; capabilities: Record<string, Json> }
export interface ProviderReference { id: string; project_id: string; provider: string; name: string; configuration: Record<string, Json> }
export interface NodeProfile { id: string; project_id: string; provider_reference_id: string; name: string; specification: Record<string, Json> }
export interface Role { id: string; name: string; scope: string; builtin: boolean; permissions: string[] }
export interface Membership { id: string; project_id: string; principal: Principal; role: Role }
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
