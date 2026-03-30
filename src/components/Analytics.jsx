import { useState, useEffect } from 'react'

const API = 'https://webhook.polonia-marketing.uk'

export default function Analytics() {
  const [clientes, setClientes] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [periodo, setPeriodo] = useState('30')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mensajes, setMensajes] = useState([])

  useEffect(() => {
    fetch(`${API}/clientes`)
      .then(r => r.json())
      .then(d => {
        setClientes(d.clientes || [])
        if (d.clientes?.length > 0) setClienteId(d.clientes[0].id)
      })
  }, [])

  useEffect(() => {
    if (!clienteId) return
    setLoading(true)
    Promise.all([
      fetch(`${API}/analytics/${clienteId}?periodo=${periodo}`).then(r => r.json()),
      fetch(`${API}/analytics/${clienteId}/mensajes?limite=10`).then(r => r.json())
    ]).then(([analytics, msgs]) => {
      setData(analytics)
      setMensajes(msgs.mensajes || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [clienteId, periodo])

  const card = (label, value, color = 'var(--accent)') => (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', flex: 1 }}>
      <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '32px', fontWeight: 800, color, fontFamily: 'Space Mono' }}>{value}</div>
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '4px' }}>Analytics</h1>
        <p style={{ color: 'var(--text2)', fontSize: '14px' }}>Desempeño de Sierra por cliente</p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <select value={clienteId} onChange={e => setClienteId(e.target.value)} style={{
          background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px',
          padding: '10px 16px', color: 'var(--text1)', fontSize: '14px', cursor: 'pointer'
        }}>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        {['7','14','30','90'].map(d => (
          <button key={d} onClick={() => setPeriodo(d)} style={{
            padding: '10px 18px', borderRadius: '8px', border: '1px solid var(--border)',
            background: periodo === d ? 'var(--accent)' : 'var(--bg2)',
            color: periodo === d ? '#fff' : 'var(--text2)',
            cursor: 'pointer', fontSize: '13px', fontWeight: 600
          }}>{d}d</button>
        ))}
      </div>

      {loading && <div style={{ color: 'var(--text2)', fontFamily: 'Space Mono' }}>Cargando...</div>}

      {data && !loading && (
        <>
          {/* KPIs */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {card('Total Mensajes', data.total)}
            {card('Score Promedio', `${data.score_promedio}/100`, data.score_promedio >= 60 ? 'var(--green)' : data.score_promedio >= 40 ? 'var(--accent)' : 'var(--red)')}
            {card('Leads Calientes', data.leads_calientes, 'var(--green)')}
            {card('Tasa Conversión', `${data.tasa_conversion}%`, 'var(--accent)')}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            {/* Por modelo */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Uso por Modelo</div>
              {Object.entries(data.por_modelo).length === 0
                ? <div style={{ color: 'var(--text3)', fontSize: '13px' }}>Sin datos aún</div>
                : Object.entries(data.por_modelo).map(([mod, count]) => (
                  <div key={mod} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontFamily: 'Space Mono', fontSize: '13px', color: 'var(--accent)' }}>{mod.toUpperCase()}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '100px', height: '6px', background: 'var(--border)', borderRadius: '3px' }}>
                        <div style={{ width: `${Math.round((count / data.total) * 100)}%`, height: '100%', background: 'var(--accent)', borderRadius: '3px' }} />
                      </div>
                      <span style={{ fontSize: '13px', fontFamily: 'Space Mono' }}>{count}</span>
                    </div>
                  </div>
                ))
              }
            </div>

            {/* Palabras clave */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Palabras que Convierten</div>
              {data.palabras_clave.length === 0
                ? <div style={{ color: 'var(--text3)', fontSize: '13px' }}>Sin datos aún</div>
                : data.palabras_clave.map(p => (
                  <div key={p.palabra} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                    <span style={{ fontFamily: 'Space Mono', color: 'var(--text1)' }}>"{p.palabra}"</span>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <span style={{ color: 'var(--text3)' }}>{p.frecuencia}x</span>
                      <span style={{ color: 'var(--green)', fontWeight: 700 }}>{p.score_promedio} pts</span>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Recomendaciones */}
          {data.recomendaciones.length > 0 && (
            <div style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent)' }}>RECOMENDACIONES AUTOMÁTICAS</div>
              {data.recomendaciones.map((r, i) => (
                <div key={i} style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--text1)' }}>{r}</div>
              ))}
            </div>
          )}

          {/* Mensajes recientes */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Últimos Mensajes</div>
            {mensajes.length === 0
              ? <div style={{ color: 'var(--text3)', fontSize: '14px' }}>Sin mensajes aún. WhatsApp pendiente de conexión.</div>
              : mensajes.map((m, i) => (
                <div key={i} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontFamily: 'Space Mono', fontSize: '12px', color: 'var(--text3)' }}>{m.telefono}</span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <span style={{ fontSize: '11px', color: m.score >= 70 ? 'var(--green)' : 'var(--text3)', fontWeight: 700 }}>Score: {m.score}</span>
                      <span style={{ fontSize: '11px', color: 'var(--accent)', fontFamily: 'Space Mono' }}>{m.modelo}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '4px' }}>👤 {m.mensaje_usuario}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text1)' }}>🤖 {m.respuesta_agente}</div>
                </div>
              ))
            }
          </div>
        </>
      )}

      {!loading && !data && (
        <div style={{ color: 'var(--text3)', fontSize: '14px' }}>Selecciona un cliente para ver analytics.</div>
      )}
    </div>
  )
}
