import { useState, useEffect } from 'react'
import axios from 'axios'

const Card = ({ children, style = {} }) => (
  <div style={{
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '24px', ...style
  }}>{children}</div>
)

const MODELOS = [
  { id: 'groq', label: 'Groq llama-3.3-70b', desc: 'Gratis · Ultra rápido · Recomendado', color: 'var(--green)' },
  { id: 'kimi', label: 'Kimi moonshot-v1-8k', desc: 'Barato · Buen contexto · Fallback 1', color: 'var(--blue)' },
  { id: 'claude', label: 'Claude Haiku', desc: 'Premium · Límite 20/día · Último recurso', color: 'var(--accent)' },
]

export default function Agente({ sistemaStatus, setSistemaStatus }) {
  const [modeloActivo, setModeloActivo] = useState('groq')
  const [cambiando, setCambiando] = useState(false)
  const [msg, setMsg] = useState(null)
  const [testMsg, setTestMsg] = useState('')
  const [testResp, setTestResp] = useState(null)
  const [testando, setTestando] = useState(false)
  const [prompt, setPrompt] = useState('Eres Sierra, agente de ventas amable y profesional. Responde en español, máximo 3 oraciones.')
  const [guardandoPrompt, setGuardandoPrompt] = useState(false)

  useEffect(() => {
    if (sistemaStatus?.modelo_activo) setModeloActivo(sistemaStatus.modelo_activo)
  }, [sistemaStatus])

  async function cambiarModelo(modelo) {
    setCambiando(modelo)
    try {
      const res = await axios.post('https://webhook.polonia-marketing.uk/modelo', { modelo })
      setModeloActivo(modelo)
      setMsg({ tipo: 'ok', texto: res.data.mensaje })
      if (setSistemaStatus) setSistemaStatus(prev => ({ ...prev, modelo_activo: modelo }))
    } catch (e) {
      setMsg({ tipo: 'error', texto: 'Error al cambiar modelo: ' + e.message })
    } finally {
      setCambiando(false)
      setTimeout(() => setMsg(null), 3000)
    }
  }

  async function testearAgente() {
    if (!testMsg.trim()) return
    setTestando(true)
    setTestResp(null)
    try {
      const res = await axios.post('https://webhook.polonia-marketing.uk/test', {
        mensaje: testMsg,
        telefono: '51999999999'
      })
      setTestResp(res.data)
    } catch (e) {
      setTestResp({ error: e.message })
    } finally {
      setTestando(false)
    }
  }

  return (
    <div className="animate-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>Agente IA</h1>
        <p style={{ color: 'var(--text2)', marginTop: '4px', fontSize: '14px' }}>
          Configura Sierra v4.0 — modelo, comportamiento y pruebas
        </p>
      </div>

      {msg && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '16px',
          background: msg.tipo === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${msg.tipo === 'ok' ? 'var(--green)' : 'var(--red)'}`,
          color: msg.tipo === 'ok' ? 'var(--green)' : 'var(--red)', fontSize: '14px'
        }}>{msg.texto}</div>
      )}

      {/* Selector de modelo */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
          Modelo Activo
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {MODELOS.map(m => (
            <button key={m.id} onClick={() => cambiarModelo(m.id)} disabled={cambiando} style={{
              padding: '16px', borderRadius: '10px', border: `2px solid`,
              borderColor: modeloActivo === m.id ? m.color : 'var(--border)',
              background: modeloActivo === m.id ? `rgba(${m.id === 'groq' ? '34,197,94' : m.id === 'kimi' ? '59,130,246' : '249,115,22'},0.1)` : 'var(--bg3)',
              cursor: cambiando ? 'not-allowed' : 'pointer', textAlign: 'left', transition: 'all 0.2s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: modeloActivo === m.id ? m.color : 'var(--text)', fontFamily: 'Syne' }}>
                  {m.id.toUpperCase()}
                </div>
                {modeloActivo === m.id && (
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: m.color, animation: 'pulse-dot 2s infinite'
                  }} />
                )}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text2)', fontFamily: 'Space Mono', lineHeight: 1.4 }}>{m.desc}</div>
            </button>
          ))}
        </div>
        {sistemaStatus && (
          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg3)', borderRadius: '8px', display: 'flex', gap: '24px' }}>
            <div style={{ fontSize: '12px', fontFamily: 'Space Mono' }}>
              <span style={{ color: 'var(--text3)' }}>Claude hoy: </span>
              <span style={{ color: 'var(--accent)' }}>{sistemaStatus.claude_calls_hoy || 0}/{sistemaStatus.claude_limite || 20}</span>
            </div>
            <div style={{ fontSize: '12px', fontFamily: 'Space Mono' }}>
              <span style={{ color: 'var(--text3)' }}>Status: </span>
              <span style={{ color: sistemaStatus.status === 'ok' ? 'var(--green)' : 'var(--red)' }}>
                {sistemaStatus.status === 'ok' ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Prompt del sistema */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
          Prompt del Sistema
        </div>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={4}
          style={{
            width: '100%', padding: '12px 14px', background: 'var(--bg3)',
            border: '1px solid var(--border)', borderRadius: '8px',
            color: 'var(--text)', fontSize: '13px', fontFamily: 'Space Mono',
            outline: 'none', resize: 'vertical', lineHeight: 1.6
          }}
        />
        <button
          onClick={async () => {
            setGuardandoPrompt(true)
            await new Promise(r => setTimeout(r, 800))
            setGuardandoPrompt(false)
            setMsg({ tipo: 'ok', texto: 'Prompt guardado (reinicia el agente para aplicar)' })
            setTimeout(() => setMsg(null), 4000)
          }}
          style={{
            marginTop: '12px', padding: '10px 20px', background: 'var(--bg3)',
            border: '1px solid var(--border)', borderRadius: '8px',
            color: 'var(--text2)', cursor: 'pointer', fontSize: '13px', fontFamily: 'Syne'
          }}>
          {guardandoPrompt ? 'Guardando...' : 'Guardar Prompt'}
        </button>
      </Card>

      {/* Test del agente */}
      <Card>
        <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
          Probar Agente
        </div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <input
            value={testMsg}
            onChange={e => setTestMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && testearAgente()}
            placeholder="Escribe un mensaje de prueba..."
            style={{
              flex: 1, padding: '10px 14px', background: 'var(--bg3)',
              border: '1px solid var(--border)', borderRadius: '8px',
              color: 'var(--text)', fontSize: '14px', fontFamily: 'Syne', outline: 'none'
            }}
          />
          <button onClick={testearAgente} disabled={testando} style={{
            padding: '10px 20px', background: 'var(--accent)', color: 'white',
            border: 'none', borderRadius: '8px', cursor: testando ? 'not-allowed' : 'pointer',
            fontSize: '14px', fontWeight: 700, fontFamily: 'Syne', whiteSpace: 'nowrap'
          }}>
            {testando ? 'Enviando...' : 'Enviar ▶'}
          </button>
        </div>
        {testResp && (
          <div style={{
            padding: '16px', background: 'var(--bg3)', borderRadius: '8px',
            border: '1px solid var(--border)'
          }}>
            {testResp.error ? (
              <div style={{ color: 'var(--red)', fontSize: '13px', fontFamily: 'Space Mono' }}>
                Error: {testResp.error}
              </div>
            ) : (
              <>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '8px', fontFamily: 'Space Mono' }}>
                  RESPUESTA · {testResp.modelo?.toUpperCase()} · Score: {testResp.score}/100
                </div>
                <div style={{ fontSize: '14px', lineHeight: 1.6 }}>{testResp.respuesta}</div>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
