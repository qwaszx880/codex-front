import { FormEvent, useState } from 'react'
import { ArrowRight, CloudCog, KeyRound, LockKeyhole } from 'lucide-react'
import { beginOidcLogin, oidcConfig, oidcIsConfigured } from '../lib/oidc'

export function AuthPage({ onToken, error, checking }: { onToken: (token: string) => Promise<void>; error: string; checking: boolean }) {
  const [token, setToken] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  async function submit(e: FormEvent) { e.preventDefault(); setLoading(true); try { await onToken(token.trim()) } finally { setLoading(false) } }
  async function login() { setLoginError(''); setLoading(true); try { await beginOidcLogin() } catch (cause) { setLoginError(cause instanceof Error ? cause.message : 'Could not start OIDC sign-in'); setLoading(false) } }
  return <div className="auth-page"><section className="auth-story"><div className="brand light"><span className="brand-mark"><CloudCog /></span><div><b>Northstar</b><small>Cluster console</small></div></div><div><span className="eyebrow">Infrastructure, clearly</span><h1>Your clusters.<br /><em>One calm view.</em></h1><p>Provision, scale, upgrade, and observe Kubernetes clusters across projects without leaving the console.</p><div className="trust-row"><span><b>OIDC</b> authenticated</span><span><b>CAPI</b> powered</span><span><b>∞</b> scalable</span></div></div><small>Built for platform teams</small></section>
    <section className="auth-panel"><form onSubmit={submit}><span className="auth-icon"><LockKeyhole /></span><h2>Connect to your platform</h2><p>Sign in securely with your organization’s identity provider.</p>{(error || loginError) && <div className="error-box">{error || loginError}</div>}<button type="button" className="button primary wide" onClick={login} disabled={loading || checking || !oidcIsConfigured()}>{loading || checking ? 'Connecting…' : <>Sign in with OIDC <ArrowRight /></>}</button>{!oidcIsConfigured() && <div className="local-note"><b>OIDC is not configured</b><p>Set the issuer and client ID in the frontend environment.</p></div>}{oidcConfig.allowTokenInjection && <><label htmlFor="token">Development access token</label><div className="token-input"><KeyRound /><input id="token" type={show ? 'text' : 'password'} value={token} onChange={e => setToken(e.target.value)} placeholder="eyJhbGciOiJSUzI1NiIs..." required /><button type="button" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button></div><small className="hint">Stored in session storage and cleared when this browser tab closes.</small><button className="button wide" disabled={loading || checking}>{loading ? 'Verifying…' : 'Use development token'}</button></>}</form></section>
  </div>
}
