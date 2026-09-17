import type { ReactNode } from 'react'

export function PageHeader({ eyebrow, title, text, actions }: { eyebrow?: string; title: string; text: string; actions?: ReactNode }) {
  return <div className="page-header"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1><p>{text}</p></div>{actions && <div className="header-actions">{actions}</div>}</div>
}
export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return <div className="empty"><span>{icon}</span><h3>{title}</h3><p>{text}</p>{action}</div>
}
export function Loading() { return <div className="loading"><i /><i /><i /></div> }
export function ErrorBox({ message }: { message: string }) { return <div className="error-box">{message}</div> }
export function JsonView({ value }: { value: unknown }) { return <pre className="json-view">{JSON.stringify(value, null, 2)}</pre> }
export function Status({ value }: { value?: string }) { const state = (value || 'unknown').toLowerCase(); return <span className={`status ${state}`}>{value || 'UNKNOWN'}</span> }
