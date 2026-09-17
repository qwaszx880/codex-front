import { useCallback, useEffect, useState } from 'react'
import { Boxes, CircleUserRound, CloudCog, FolderKanban, LayoutDashboard, LogOut, Menu, ShieldCheck, X } from 'lucide-react'
import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { api } from './lib/api'
import { AuthPage } from './pages/AuthPage'
import { ClusterDetail } from './pages/ClusterDetail'
import { ClustersPage } from './pages/ClustersPage'
import { Dashboard } from './pages/Dashboard'
import { ProjectsPage } from './pages/ProjectsPage'
import type { Principal, Project } from './types'

const TOKEN_KEY = 'cluster-console-token'

export default function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || '')
  const [me, setMe] = useState<Principal>()
  const [projects, setProjects] = useState<Project[]>([])
  const [authError, setAuthError] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  const authenticate = useCallback(async (next: string) => {
    setAuthError('')
    try {
      const [principal, visibleProjects] = await Promise.all([api.me(next), api.projects(next)])
      sessionStorage.setItem(TOKEN_KEY, next)
      setToken(next); setMe(principal); setProjects(visibleProjects)
    } catch (error) { setAuthError(error instanceof Error ? error.message : 'Authentication failed'); throw error }
  }, [])

  useEffect(() => { if (token && !me) authenticate(token).catch(() => { sessionStorage.removeItem(TOKEN_KEY); setToken('') }) }, [token, me, authenticate])
  const logout = () => { sessionStorage.removeItem(TOKEN_KEY); setToken(''); setMe(undefined); setProjects([]) }
  if (!token || !me) return <AuthPage onToken={authenticate} error={authError} checking={Boolean(token)} />

  const links = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/clusters', label: 'Clusters', icon: Boxes },
    { to: '/projects', label: 'Projects & access', icon: FolderKanban },
  ]
  return <div className="app-shell">
    <aside className={mobileOpen ? 'sidebar open' : 'sidebar'}>
      <div className="brand"><span className="brand-mark"><CloudCog /></span><div><b>Northstar</b><small>Cluster console</small></div></div>
      <button className="icon-button close-menu" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X /></button>
      <nav>{links.map(({ to, label, icon: Icon }) => <NavLink end={to === '/'} to={to} key={to} onClick={() => setMobileOpen(false)}><Icon />{label}</NavLink>)}</nav>
      <div className="sidebar-foot"><div className="user"><CircleUserRound /><span><b>{me.display_name || me.username || 'User'}</b><small>{me.email || me.principal_type}</small></span></div><button className="icon-button" onClick={logout} title="Sign out"><LogOut /></button></div>
    </aside>
    {mobileOpen && <button className="backdrop" onClick={() => setMobileOpen(false)} aria-label="Close menu" />}
    <main><header className="topbar"><button className="icon-button menu" onClick={() => setMobileOpen(true)}><Menu /></button><div><span className="status-dot" /> Platform operational</div><a href="http://localhost:8000/docs" target="_blank"><ShieldCheck /> API docs</a></header>
      <Routes>
        <Route path="/" element={<Dashboard token={token} projects={projects} me={me} />} />
        <Route path="/clusters" element={<ClustersPage token={token} projects={projects} />} />
        <Route path="/clusters/:id" element={<ClusterDetail token={token} />} />
        <Route path="/projects" element={<ProjectsPage token={token} projects={projects} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  </div>
}
