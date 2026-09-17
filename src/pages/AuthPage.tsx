import { FormEvent, useState } from 'react'
import { ArrowRight, CloudCog, KeyRound, LockKeyhole } from 'lucide-react'

export function AuthPage({ onToken, error, checking }: { onToken: (token: string) => Promise<void>; error: string; checking: boolean }) {
  const [token, setToken] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  async function submit(e: FormEvent) { e.preventDefault(); setLoading(true); try { await onToken(token.trim()) } finally { setLoading(false) } }
  return <div className="auth-page"><section className="auth-story"><div className="brand light"><span className="brand-mark"><CloudCog /></span><div><b>Northstar</b><small>Cluster console</small></div></div><div><span className="eyebrow">Infrastructure, clearly</span><h1>Your clusters.<br /><em>One calm view.</em></h1><p>Provision, scale, upgrade, and observe Kubernetes clusters across projects without leaving the console.</p><div className="trust-row"><span><b>OIDC</b> authenticated</span><span><b>CAPI</b> powered</span><span><b>∞</b> scalable</span></div></div><small>Built for platform teams</small></section>
    <section className="auth-panel"><form onSubmit={submit}><span className="auth-icon"><LockKeyhole /></span><h2>Connect to your platform</h2><p>Paste an OIDC bearer token to start a secure browser session.</p><label htmlFor="token">Access token</label><div className="token-input"><KeyRound /><input id="token" autoFocus type={show ? 'text' : 'password'} value={token} onChange={e => setToken(e.target.value)} placeholder="eyJhbGciOiJSUzI1NiIs..." required /><button type="button" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button></div><small className="hint">Stored in session storage and cleared when this browser tab closes.</small>{error && <div className="error-box">{error}</div>}<button className="button primary wide" disabled={loading || checking}>{loading || checking ? 'Verifying…' : <>Open console <ArrowRight /></>}</button><div className="local-note"><b>Local development</b><p>Use the developer token from Keycloak. Run <code>make token</code> to print one.</p></div></form></section>
  </div>
}
