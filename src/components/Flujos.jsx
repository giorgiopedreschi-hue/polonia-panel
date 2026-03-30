import { useState, useEffect, useCallback } from 'react'

const N8N_BASE = 'https://webhook.polonia-marketing.uk'

const Card = ({ children, style = {} }) => (
  <div style={{
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '24px', ...style
  }}>{children}</div>
)

const FLUJOS_TEMPLATE = [
  {
    id: 'meta-leads',
    nombre: 'Meta Lead Ads → Sierra',
    desc: 'Recibe leads de Meta Ads y los envía al agente Sierra con detección de cliente nuevo/existente',
    nodos: 3, icon: '◈', n8nName: 'Meta Lead Ads',
  },
  {
    id: 'meta-sierra',
    nombre: 'Meta → Sierra v4.0',
    desc: 'Recibe mensajes WhatsApp de Meta y los envía al agente Sierra',
    nodos: 7, icon: '◉', n8nName: 'Meta → Sierra',
  },
  {
    id: 'score-alert',
    nombre: 'Score Alto → Telegram',
    desc: 'Notifica cuando un lead supera score 80/100',
    nodos: 3, icon: '◑', n8nName: 'Score Alto',
  },
  {
    id: 'daily-report',
    nombre: 'Reporte Diario',
    desc: 'Envía métricas del día a Telegram cada noche',
    nodos: 4, icon: '◎', n8nName: 'Reporte Diario',
  },
]

const WORKFLOW_JSON = {
  name: 'Meta Lead Ads → Sierra',
  active: true,
  settings: {},
  nodes: [
    { id: 'webhook', name: 'Webhook', type: 'n8n-nodes-base.webhook', typeVersion: 1, position: [250, 300], webhookId: 'meta-leads', parameters: { path: 'meta-leads', method: 'POST' } },
    { id: 'code', name: 'Extract Data', type: 'n8n-nodes-base.code', typeVersion: 1, position: [450, 300], parameters: { mode: 'runOnceForAllItems', code: "const d = $input.first().json; const f = {}; (d.field_data || []).forEach(x => {f[x.name] = x.values?.[0] || '';}); const t = (f.telefono || f.phone || '').replace(/[^\\d+]/g, ''); let p = t.startsWith('+51') ? 'PE' : 'AR'; return [{nombre: f.nombre || 'Lead', email: f.email || '', telefono: t, pais: p}];" } },
    { id: 'telegram', name: 'Send Telegram', type: 'n8n-nodes-base.telegram', typeVersion: 1, position: [650, 300], parameters: { botToken: '8488506825:AAEs0gAP7FWHToQVVPRjDNqiCiV8pc-VW28', chatId: '6128032318', text: '📱 Lead N8n: {{ $node["Extract Data"].json[0].nombre }} | {{ $node["Extract Data"].json[0].telefono }}' } }
  ],
  connections: { 'Webhook': { main: [[{ node: 'Extract Data', type: 'main', index: 0 }]] }, 'Extract Data': { main: [[{ node: 'Send Telegram', type: 'main', index: 0 }]] } }
}

export default function Flujos() {
  const [flujos, setFlujos] = useState(FLUJOS_TEMPLATE.map(f => ({ ...f, estado: 'cargando', workflowId: null })))
  const [msg, setMsg] = useState(null)
  const [creando, setCreando] = useState(false)
  const [testando, setTestando] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)

  const showMsg = (tipo, texto, ms = 3000) => {
    setMsg({ tipo, texto })
    setTimeout(() => setMsg(null), ms)
  }

  const fetchN8nWorkflows = useCallback(async (key) => {
    if (!key) return
    try {
      const r = await fetch('http://204.168.177.108:5678/api/v1/workflows?limit=20', {
        headers: { 'X-N8N-API-KEY': key }
      })
      if (!r.ok) throw new Error('API key inválida')
      const data = await r.json()
      const wfs = data.data || []
      setFlujos(prev => prev.map(f => {
        const match = wfs.find(w => w.name?.toLowerCase().includes(f.n8nName.toLowerCase().split(' ')[0]))
        return { ...f, estado: match ? (match.active ? 'activo' : 'inactivo') : 'pendiente', workflowId: match?.id || null }
      }))
    } catch (e) {
      setFlujos(prev => prev.map(f => ({ ...f, estado: 'pendiente' })))
      showMsg('err', 'No se pudo conectar a N8n: ' + e.message)
    }
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('n8n_api_key')
    if (saved) { setApiKey(saved); fetchN8nWorkflows(saved) }
    else setFlujos(prev => prev.map(f => ({ ...f, estado: 'pendiente' })))
  }, [fetchN8nWorkflows])

  function abrirN8n() { window.open('http://204.168.177.108:5678', '_blank') }

  function copiarWebhook() {
    navigator.clipboard.writeText('https://webhook.polonia-marketing.uk/webhook')
    showMsg('ok', 'Webhook URL copiado ✓')
  }

  function copiarJSON() {
    navigator.clipboard.writeText(JSON.stringify(WORKFLOW_JSON, null, 2))
    showMsg('ok', 'JSON copiado ✓')
  }

  function guardarApiKey() {
    localStorage.setItem('n8n_api_key', apiKey)
    fetchN8nWorkflows(apiKey)
    setShowApiKey(false)
    showMsg('ok', 'Conectando a N8n...')
  }

  async function crearWorkflow() {
    if (!apiKey) { setShowApiKey(true); showMsg('err', 'Primero configura tu N8n API Key'); return }
    setCreando(true)
    try {
      const r = await fetch('http://204.168.177.108:5678/api/v1/workflows', {
        method: 'POST',
        headers: { 'X-N8N-API-KEY': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(WORKFLOW_JSON)
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.message || 'Error')
      showMsg('ok', `✅ Workflow "${data.name}" creado — ID: ${data.id}`, 5000)
      fetchN8nWorkflows(apiKey)
    } catch (e) { showMsg('err', 'Error: ' + e.message) }
    setCreando(false)
  }

  async function testWebhook() {
    setTestando(true)
    try {
      const r = await fetch('http://204.168.177.108:5678/webhook/meta-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'test_' + Date.now(), field_data: [{ name: 'nombre', values: ['Test Lead'] }, { name: 'telefono', values: ['+51987654321'] }] })
      })
      if (r.ok) showMsg('ok', '✅ Test enviado — revisa Telegram', 4000)
      else showMsg('err', `Error ${r.status} — ¿workflow activo en N8n?`)
    } catch (e) { showMsg('err', 'No se pudo conectar: ' + e.message) }
    setTestando(false)
  }

  async function toggleWorkflow(flujo) {
    if (!apiKey || !flujo.workflowId) return
    const nuevoEstado = flujo.estado !== 'activo'
    try {
      const r = await fetch(`http://204.168.177.108:5678/api/v1/workflows/${flujo.workflowId}`, {
        method: 'PATCH',
        headers: { 'X-N8N-API-KEY': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: nuevoEstado })
      })
      if (!r.ok) throw new Error('Error actualizando')
      setFlujos(prev => prev.map(f => f.id === flujo.id ? { ...f, estado: nuevoEstado ? 'activo' : 'inactivo' } : f))
      showMsg('ok', `Workflow ${nuevoEstado ? 'activado' : 'desactivado'} ✓`)
    } catch (e) { showMsg('err', e.message) }
  }

  const estadoColor = (e) => ({
    activo:    { bg: 'rgba(34,197,94,0.15)',   color: 'var(--green)', label: 'ACTIVO' },
    inactivo:  { bg: 'rgba(249,115,22,0.15)',  color: 'var(--accent)', label: 'INACTIVO' },
    pendiente: { bg: 'rgba(239,68,68,0.15)',   color: 'var(--red)', label: 'PENDIENTE' },
    cargando:  { bg: 'rgba(100,100,100,0.15)', color: 'var(--text3)', label: '···' },
  }[e] || { bg: 'rgba(239,68,68,0.15)', color: 'var(--red)', label: 'PENDIENTE' })

  const activos = flujos.filter(f => f.estado === 'activo').length

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>Flujos N8n</h1>
          <p style={{ color: 'var(--text2)', marginTop: '4px', fontSize: '14px' }}>
            Automatizaciones conectadas al agente Sierra —{' '}
            <span style={{ color: activos > 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
              {activos}/{flujos.length} activos
            </span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowApiKey(!showApiKey)} style={{
            padding: '10px 16px', background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: '8px', color: apiKey ? 'var(--green)' : 'var(--text2)',
            cursor: 'pointer', fontSize: '13px', fontFamily: 'Syne'
          }}>{apiKey ? '🔑 Key OK' : '🔑 API Key'}</button>
          <button onClick={abrirN8n} style={{
            padding: '10px 20px', background: 'var(--accent)', color: 'white',
            border: 'none', borderRadius: '8px', cursor: 'pointer',
            fontSize: '14px', fontWeight: 700, fontFamily: 'Syne'
          }}>Abrir N8n ↗</button>
        </div>
      </div>

      {showApiKey && (
        <Card style={{ marginBottom: '16px', borderColor: 'rgba(249,115,22,0.4)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>N8n API Key</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              onKeyDown={e => e.key === 'Enter' && guardarApiKey()}
              style={{ flex: 1, padding: '10px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', fontFamily: 'Space Mono', fontSize: '12px', color: 'var(--text)', outline: 'none' }} />
            <button onClick={guardarApiKey} style={{ padding: '10px 18px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'Syne' }}>Conectar</button>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '8px', fontFamily: 'Space Mono' }}>En N8n → Settings → API → Create API Key</div>
        </Card>
      )}

      {msg && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '16px',
          background: msg.tipo === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${msg.tipo === 'ok' ? 'var(--green)' : 'var(--red)'}`,
          color: msg.tipo === 'ok' ? 'var(--green)' : 'var(--red)', fontSize: '13px', fontFamily: 'Space Mono'
        }}>{msg.texto}</div>
      )}

      <Card style={{ marginBottom: '24px', borderColor: 'rgba(249,115,22,0.3)' }}>
        <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Webhook URL — usar en Meta Developers</div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: 1, padding: '10px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', fontFamily: 'Space Mono', fontSize: '13px', color: 'var(--accent)' }}>
            https://webhook.polonia-marketing.uk/webhook
          </div>
          <button onClick={copiarWebhook} style={{ padding: '10px 16px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text2)', cursor: 'pointer', fontSize: '13px', fontFamily: 'Syne' }}>Copiar</button>
        </div>
        <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text3)', fontFamily: 'Space Mono' }}>
          Verify Token: <span style={{ color: 'var(--text2)' }}>polonia2024</span>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <button onClick={crearWorkflow} disabled={creando} style={{
          padding: '14px 20px', background: creando ? 'var(--bg3)' : 'rgba(249,115,22,0.15)',
          border: '1px solid rgba(249,115,22,0.4)', borderRadius: '10px',
          color: creando ? 'var(--text3)' : 'var(--accent)',
          cursor: creando ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'Syne'
        }}>{creando ? '⏳ Creando...' : '⚡ Crear workflow Meta Leads'}</button>
        <button onClick={testWebhook} disabled={testando} style={{
          padding: '14px 20px', background: testando ? 'var(--bg3)' : 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.3)', borderRadius: '10px',
          color: testando ? 'var(--text3)' : 'var(--green)',
          cursor: testando ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'Syne'
        }}>{testando ? '⏳ Enviando...' : '🧪 Test: enviar lead de prueba'}</button>
      </div>

      <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
        {flujos.map(f => {
          const est = estadoColor(f.estado)
          return (
            <Card key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: 'var(--accent)' }}>{f.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{f.nombre}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>{f.desc}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'Space Mono', marginTop: '4px' }}>
                    {f.nodos} nodos{f.workflowId && <span style={{ marginLeft: '10px' }}>ID: {f.workflowId}</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontFamily: 'Space Mono', fontWeight: 700, background: est.bg, color: est.color }}>{est.label}</div>
                {f.workflowId && (
                  <button onClick={() => toggleWorkflow(f)} style={{ padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text2)', fontSize: '11px', fontFamily: 'Syne' }}>
                    {f.estado === 'activo' ? 'Pausar' : 'Activar'}
                  </button>
                )}
                <button onClick={abrirN8n} style={{ padding: '6px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text2)', cursor: 'pointer', fontSize: '12px', fontFamily: 'Syne' }}>Configurar ↗</button>
              </div>
            </Card>
          )
        })}
      </div>

      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px' }}>JSON del workflow Meta Lead Ads</div>
          <button onClick={copiarJSON} style={{ padding: '6px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text2)', cursor: 'pointer', fontSize: '12px', fontFamily: 'Syne' }}>Copiar JSON</button>
        </div>
        <pre style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px', fontSize: '11px', fontFamily: 'Space Mono', color: 'var(--text2)', overflow: 'auto', maxHeight: '160px', lineHeight: 1.6 }}>
          {JSON.stringify(WORKFLOW_JSON, null, 2).substring(0, 400)}...
        </pre>
      </Card>

      <Card>
        <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Cómo conectar Meta → Sierra</div>
        {[
          { n: '01', texto: 'Configura tu N8n API Key arriba (botón 🔑)' },
          { n: '02', texto: 'Click "Crear workflow Meta Leads" — se crea automáticamente en N8n' },
          { n: '03', texto: 'Haz "Test: enviar lead de prueba" — deberías ver mensaje en Telegram' },
          { n: '04', texto: 'En Meta Developers → WhatsApp → Configuration → pega el webhook URL' },
          { n: '05', texto: 'Verify Token: polonia2024 — activa mensajes (messages)' },
          { n: '06', texto: 'El estado de los workflows se actualiza automáticamente desde N8n' },
        ].map(paso => (
          <div key={paso.n} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '12px 0', borderBottom: paso.n !== '06' ? '1px solid var(--border)' : 'none' }}>
            <div style={{ minWidth: '28px', height: '28px', borderRadius: '6px', background: 'rgba(249,115,22,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontFamily: 'Space Mono', color: 'var(--accent)', fontWeight: 700 }}>{paso.n}</div>
            <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.5, paddingTop: '4px' }}>{paso.texto}</div>
          </div>
        ))}
      </Card>
    </div>
  )
}
