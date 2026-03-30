import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Dashboard from './components/Dashboard'
import Clientes  from './components/Clientes'
import Campanas  from './components/Campanas'
import Analytics from './components/Analytics'
import Agente    from './components/Agente'
import Flujos    from './components/Flujos'
import '../src/index.css'

const supabase = createClient(
  'https://scjbfdbyygmkenjubdzg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjamJmZGJ5eWdta2VuanViZHpnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDU2NzEwNSwiZXBwIjoyMDkwMTQzMTA1fQ.fBTf6zivCDoRLDM4lN2FwkiHayh_Tny8pYKgGo9ZI58'
)

const TABS = [
  { id: 'dashboard', label: 'Dashboard',   icon: '⬡' },
  { id: 'clientes',  label: 'Clientes',    icon: '⬡' },
  { id: 'campanas',  label: 'Campañas IA', icon: '⬡' },
  { id: 'analytics', label: 'Analytics',   icon: '⬡' },
  { id: 'agente',    label: 'Agente IA',   icon: '⬡' },
  { id: 'flujos',    label: 'Flujos N8n',  icon: '⬡' },
]

export default function App() {
  const [tab, setTab]                   = useState('dashboard')
  const [sistemaStatus, setSistemaStatus] = useState(null)

  useEffect(() => {
    const check = () =>
      fetch('https://webhook.polonia-marketing.uk/health')
        .then(r => r.json())
        .then(setSistemaStatus)
        .catch(() => setSistemaStatus({ status: 'error' }))
    check()
    const t = setInterval(check, 30000)
    return () => clearInterval(t)
  }, [])

  const online = sistemaStatus?.status === 'ok'

  return (
    <div className="layout">
      {/* ── SIDEBAR ──────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-text">
            Polon<span className="logo-accent">IA</span>
          </div>
          <div className="logo-sub">v4.1 · Social Verse</div>
        </div>

        <div className="sidebar-status">
          <div className="status-label">Sierra Agent</div>
          <div className="status-indicator">
            <div className={`dot ${online ? 'dot-green' : 'dot-red'}`} />
            <span className="status-text" style={{ color: online ? 'var(--green)' : 'var(--red)' }}>
              {online ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`nav-btn ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-date mono">
            {new Date().toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────── */}
      <main className="main">
        {tab === 'dashboard'  && <Dashboard supabase={supabase} sistemaStatus={sistemaStatus} />}
        {tab === 'clientes'   && <Clientes  supabase={supabase} />}
        {tab === 'campanas'   && <Campanas />}
        {tab === 'analytics'  && <Analytics />}
        {tab === 'agente'     && <Agente sistemaStatus={sistemaStatus} setSistemaStatus={setSistemaStatus} />}
        {tab === 'flujos'     && <Flujos />}
      </main>
    </div>
  )
}
