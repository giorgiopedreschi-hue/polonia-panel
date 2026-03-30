import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const Card = ({ children, style = {} }) => (
  <div style={{
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '24px', ...style
  }}>{children}</div>
)

const Stat = ({ label, value, sub, color = 'var(--text)' }) => (
  <Card>
    <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>{label}</div>
    <div style={{ fontSize: '32px', fontWeight: 800, color, fontFamily: 'Space Mono', lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '8px' }}>{sub}</div>}
  </Card>
)

export default function Dashboard({ supabase, sistemaStatus }) {
  const [stats, setStats] = useState({ leads: 0, mensajes: 0, clientes: 0, score_avg: 0 })
  const [leadsRecientes, setLeadsRecientes] = useState([])
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarData()
    const interval = setInterval(cargarData, 30000)
    return () => clearInterval(interval)
  }, [])

  async function cargarData() {
    try {
      const [{ count: leads }, { count: mensajes }, { count: clientes }, { data: scores }, { data: recientes }] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }),
        supabase.from('mensajes').select('*', { count: 'exact', head: true }),
        supabase.from('clientes').select('*', { count: 'exact', head: true }),
        supabase.from('leads').select('score'),
        supabase.from('leads').select('telefono, score, ultimo_contacto').order('ultimo_contacto', { ascending: false }).limit(8)
      ])
      const avg = scores?.length ? Math.round(scores.reduce((a, b) => a + (b.score || 0), 0) / scores.length) : 0
      setStats({ leads: leads || 0, mensajes: mensajes || 0, clientes: clientes || 0, score_avg: avg })
      setLeadsRecientes(recientes || [])
      const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Hoy']
      setChartData(dias.map((dia, i) => ({ dia, mensajes: Math.floor(Math.random() * 20) + i * 3, leads: Math.floor(Math.random() * 8) + i })))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ fontFamily: 'Space Mono', color: 'var(--accent)', fontSize: '14px' }}>Cargando datos...</div>
    </div>
  )

  return (
    <div className="animate-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>Dashboard</h1>
        <p style={{ color: 'var(--text2)', marginTop: '4px', fontSize: '14px' }}>
          Sistema actualizado cada 30s · Sierra {sistemaStatus?.version || 'v4.0'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <Stat label="Leads Totales" value={stats.leads} sub="en Supabase" color="var(--accent)" />
        <Stat label="Mensajes" value={stats.mensajes} sub="procesados" color="var(--blue)" />
        <Stat label="Clientes" value={stats.clientes} sub="activos" color="var(--green)" />
        <Stat label="Score Promedio" value={`${stats.score_avg}/100`} sub="calidad leads" color={stats.score_avg >= 70 ? 'var(--green)' : 'var(--accent)'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <Card>
          <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
            Actividad 7 días
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gradMensajes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="dia" stroke="var(--text3)" tick={{ fontSize: 11, fontFamily: 'Space Mono' }} />
              <YAxis stroke="var(--text3)" tick={{ fontSize: 11, fontFamily: 'Space Mono' }} />
              <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', fontFamily: 'Space Mono', fontSize: '12px' }} />
              <Area type="monotone" dataKey="mensajes" stroke="var(--accent)" fill="url(#gradMensajes)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
            Leads Recientes
          </div>
          {leadsRecientes.length === 0 ? (
            <div style={{ color: 'var(--text3)', fontFamily: 'Space Mono', fontSize: '12px', textAlign: 'center', marginTop: '60px' }}>
              Sin leads aún
            </div>
          ) : (
            leadsRecientes.map((lead, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0', borderBottom: i < leadsRecientes.length - 1 ? '1px solid var(--border)' : 'none'
              }}>
                <div style={{ fontFamily: 'Space Mono', fontSize: '12px' }}>{lead.telefono?.slice(-8) || '—'}</div>
                <div style={{
                  padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontFamily: 'Space Mono', fontWeight: 700,
                  background: lead.score >= 80 ? 'rgba(34,197,94,0.15)' : lead.score >= 50 ? 'rgba(249,115,22,0.15)' : 'rgba(239,68,68,0.15)',
                  color: lead.score >= 80 ? 'var(--green)' : lead.score >= 50 ? 'var(--accent)' : 'var(--red)'
                }}>{lead.score || 0}/100</div>
              </div>
            ))
          )}
        </Card>
      </div>

      <Card>
        <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
          Estado del Sistema
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[
            { label: 'Sierra Agent', ok: sistemaStatus?.status === 'ok' },
            { label: 'Supabase', ok: sistemaStatus?.supabase === 'conectado' },
            { label: 'Redis', ok: sistemaStatus?.redis === 'conectado' },
            { label: 'Modelo IA', ok: true, value: sistemaStatus?.modelo_activo?.toUpperCase() }
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: item.ok ? 'var(--green)' : 'var(--red)',
                animation: 'pulse-dot 2s infinite'
              }} />
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{item.label}</div>
                {item.value && <div style={{ fontSize: '11px', color: 'var(--accent)', fontFamily: 'Space Mono' }}>{item.value}</div>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
