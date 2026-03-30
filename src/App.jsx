import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Dashboard from './components/Dashboard'
import Clientes from './components/Clientes'
import Agente from './components/Agente'
import Flujos from './components/Flujos'
import Analytics from './components/Analytics'
import Campanas from './components/Campanas'

const supabase = createClient(
  'https://scjbfdbyygmkenjubdzg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjamJmZGJ5eWdta2VuanViZHpnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDU2NzEwNSwiZXBwIjoyMDkwMTQzMTA1fQ.fBTf6zivCDoRLDM4lN2FwkiHayh_Tny8pYKgGo9ZI58'
)

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '◈' },
  { id: 'clientes', label: 'Clientes', icon: '◉' },
  { id: 'campanas', label: 'Campañas IA', icon: '◐' },
  { id: 'analytics', label: 'Analytics', icon: '◑' },
  { id: 'agente', label: 'Agente IA', icon: '◎' },
  { id: 'flujos', label: 'Flujos N8n', icon: '◫' },
]

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [sistemaStatus, setSistemaStatus] = useState(null)

  useEffect(() => {
    fetch('https://webhook.polonia-marketing.uk/health')
      .then(r => r.json())
      .then(setSistemaStatus)
      .catch(() => setSistemaStatus({ status: 'error' }))
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: '220px', minHeight: '100vh', background: 'var(--bg2)',
        borderRight: '1px solid var(--border)', display: 'flex',
        flexDirection: 'column', padding: '0', position: 'fixed', top: 0, left: 0, zIndex: 100
      }}>
        <div style={{ padding: '28px 24px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Polon<span style={{ color: 'var(--accent)' }}>IA</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '4px', fontFamily: 'Space Mono' }}>
            v4.1 · Social Verse
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Sierra Agent
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: sistemaStatus?.status === 'ok' ? 'var(--green)' : 'var(--red)',
              animation: 'pulse-dot 2s infinite'
            }} />
            <span style={{ fontSize: '13px', fontFamily: 'Space Mono' }}>
              {sistemaStatus?.status === 'ok' ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 14px', borderRadius: '8px', border: 'none',
              background: tab === t.id ? 'rgba(249,115,22,0.12)' : 'transparent',
              color: tab === t.id ? 'var(--accent)' : 'var(--text2)',
              cursor: 'pointer', fontSize: '14px', fontWeight: tab === t.id ? 700 : 400,
              fontFamily: 'Syne', marginBottom: '4px',
              borderLeft: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 0.2s'
            }}>
              <span style={{ fontSize: '16px' }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'Space Mono' }}>
            {new Date().toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
          </div>
        </div>
      </aside>

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', animation: 'fade-in 0.3s ease' }}>
        {tab === 'dashboard'  && <Dashboard supabase={supabase} sistemaStatus={sistemaStatus} />}
        {tab === 'clientes'   && <Clientes supabase={supabase} />}
        {tab === 'campanas'   && <Campanas />}
        {tab === 'analytics'  && <Analytics />}
        {tab === 'agente'     && <Agente sistemaStatus={sistemaStatus} setSistemaStatus={setSistemaStatus} />}
        {tab === 'flujos'     && <Flujos />}
      </main>
    </div>
  )
}
