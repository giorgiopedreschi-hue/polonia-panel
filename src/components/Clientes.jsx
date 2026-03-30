import { useState, useEffect } from 'react'

const Card = ({ children, style = {} }) => (
  <div style={{
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '24px', ...style
  }}>{children}</div>
)

const Input = ({ label, value, onChange, placeholder, type = 'text' }) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
      {label}
    </label>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '10px 14px', background: 'var(--bg3)',
        border: '1px solid var(--border)', borderRadius: '8px',
        color: 'var(--text)', fontSize: '14px', fontFamily: 'Syne', outline: 'none'
      }}
    />
  </div>
)

export default function Clientes({ supabase }) {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [form, setForm] = useState({
    nombre: '', descripcion: '', phone_number_id: '',
    whatsapp_number: '', activo: true
  })

  useEffect(() => { cargarClientes() }, [])

  async function cargarClientes() {
    const { data } = await supabase.from('clientes').select('*').order('created_at', { ascending: false })
    setClientes(data || [])
    setLoading(false)
  }

  async function guardarCliente() {
    if (!form.nombre) return setMsg({ tipo: 'error', texto: 'El nombre es requerido' })
    setSaving(true)
    const { error } = await supabase.from('clientes').insert({
      ...form, created_at: new Date().toISOString()
    })
    setSaving(false)
    if (error) return setMsg({ tipo: 'error', texto: error.message })
    setMsg({ tipo: 'ok', texto: 'Cliente creado ✓' })
    setForm({ nombre: '', descripcion: '', phone_number_id: '', whatsapp_number: '', activo: true })
    setShowForm(false)
    cargarClientes()
    setTimeout(() => setMsg(null), 3000)
  }

  async function toggleActivo(id, activo) {
    await supabase.from('clientes').update({ activo: !activo }).eq('id', id)
    cargarClientes()
  }

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>Clientes</h1>
          <p style={{ color: 'var(--text2)', marginTop: '4px', fontSize: '14px' }}>{clientes.length} clientes registrados</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          padding: '10px 20px', background: 'var(--accent)', color: 'white',
          border: 'none', borderRadius: '8px', cursor: 'pointer',
          fontSize: '14px', fontWeight: 700, fontFamily: 'Syne'
        }}>
          {showForm ? '✕ Cancelar' : '+ Nuevo Cliente'}
        </button>
      </div>

      {msg && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '16px',
          background: msg.tipo === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${msg.tipo === 'ok' ? 'var(--green)' : 'var(--red)'}`,
          color: msg.tipo === 'ok' ? 'var(--green)' : 'var(--red)',
          fontSize: '14px'
        }}>{msg.texto}</div>
      )}

      {showForm && (
        <Card style={{ marginBottom: '24px', borderColor: 'var(--accent)' }}>
          <div style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 700, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Nuevo Cliente
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <Input label="Nombre del negocio *" value={form.nombre} onChange={v => setForm({ ...form, nombre: v })} placeholder="Ej: Clínica Dental Agustín" />
            <Input label="WhatsApp Number" value={form.whatsapp_number} onChange={v => setForm({ ...form, whatsapp_number: v })} placeholder="+52155..." />
            <Input label="Phone Number ID (Meta)" value={form.phone_number_id} onChange={v => setForm({ ...form, phone_number_id: v })} placeholder="123456789" />
            <Input label="Descripción" value={form.descripcion} onChange={v => setForm({ ...form, descripcion: v })} placeholder="Agencia de marketing..." />
          </div>
          <button onClick={guardarCliente} disabled={saving} style={{
            padding: '12px 28px', background: saving ? 'var(--bg3)' : 'var(--accent)',
            color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '14px', fontWeight: 700, fontFamily: 'Syne', marginTop: '8px'
          }}>
            {saving ? 'Guardando...' : 'Guardar Cliente'}
          </button>
        </Card>
      )}

      {loading ? (
        <div style={{ color: 'var(--text3)', fontFamily: 'Space Mono', fontSize: '12px' }}>Cargando...</div>
      ) : clientes.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)', fontFamily: 'Space Mono', fontSize: '13px' }}>
            Sin clientes aún — agrega el primero
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {clientes.map(c => (
            <Card key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'rgba(249,115,22,0.15)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', color: 'var(--accent)'
                }}>◉</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{c.nombre}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>{c.descripcion || 'Sin descripción'}</div>
                  {c.phone_number_id && (
                    <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'Space Mono', marginTop: '2px' }}>
                      ID: {c.phone_number_id}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  padding: '4px 12px', borderRadius: '20px', fontSize: '11px',
                  fontFamily: 'Space Mono', fontWeight: 700,
                  background: c.activo ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                  color: c.activo ? 'var(--green)' : 'var(--red)'
                }}>
                  {c.activo ? 'ACTIVO' : 'INACTIVO'}
                </div>
                <button onClick={() => toggleActivo(c.id, c.activo)} style={{
                  padding: '6px 14px', background: 'var(--bg3)',
                  border: '1px solid var(--border)', borderRadius: '6px',
                  color: 'var(--text2)', cursor: 'pointer', fontSize: '12px', fontFamily: 'Syne'
                }}>
                  {c.activo ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
