import React, { useState, useEffect } from 'react'
import { ShieldCheck, Mail, KeyRound, Loader2, CheckCircle2, AlertCircle, LogOut, Check, X } from 'lucide-react'

export default function PanelAdmin() {
  const [autenticado, setAutenticado] = useState(false)
  const [paso, setPaso] = useState<'email' | 'codigo'>('email')
  const [emailAdmin, setEmailAdmin] = useState('')
  const [codigoOtp, setCodigoOtp] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null)
  const [bandasPendientes, setBandasPendientes] = useState<any[]>([])

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      setAutenticado(true)
      cargarBandasPendientes()
    }
  }, [])

  const cargarBandasPendientes = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/admin/bandas-pendientes')
      if (res.ok) {
        const data = await res.json()
        setBandasPendientes(data)
      }
    } catch (e) {
      console.error('Error cargando pendientes', e)
    }
  }

  const handleEnviarCodigo = async (e: React.FormEvent) => {
    e.preventDefault()
    setMensaje(null)
    setCargando(true)

    try {
      const res = await fetch('http://localhost:3000/api/admin/solicitar-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailAdmin }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setPaso('codigo')
      setMensaje({ tipo: 'exito', texto: 'Código generado correctamente.' })
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al enviar código.' })
    } finally {
      setCargando(false)
    }
  }

  const handleValidarCodigo = async (e: React.FormEvent) => {
    e.preventDefault()
    setMensaje(null)
    setCargando(true)

    try {
      const res = await fetch('http://localhost:3000/api/admin/validar-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailAdmin, codigoOTP: codigoOtp }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      localStorage.setItem('admin_token', data.token)
      setAutenticado(true)
      cargarBandasPendientes()
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Código incorrecto.' })
    } finally {
      setCargando(false)
    }
  }

  const handleAprobar = async (id: number) => {
    await fetch(`http://localhost:3000/api/admin/bandas/${id}/aprobar`, { method: 'PUT' })
    cargarBandasPendientes()
  }

  const handleRechazar = async (id: number) => {
    await fetch(`http://localhost:3000/api/admin/bandas/${id}`, { method: 'DELETE' })
    cargarBandasPendientes()
  }

  const handleCerrarSesion = () => {
    localStorage.removeItem('admin_token')
    setAutenticado(false)
    setPaso('email')
    setEmailAdmin('')
    setCodigoOtp('')
  }

  if (!autenticado) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-left">
        <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
          <ShieldCheck className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold text-white text-center mb-1">
          {paso === 'email' ? 'Acceso de Administrador' : 'Validar Identidad'}
        </h3>
        <p className="text-slate-400 text-xs text-center mb-6">
          {paso === 'email' ? 'Ingresa tu correo institucional' : `Ingresa el código enviado a ${emailAdmin}`}
        </p>

        {mensaje && (
          <div className={`mb-5 p-3 rounded-lg flex items-center gap-2.5 text-xs font-medium ${
            mensaje.tipo === 'exito' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          }`}>
            {mensaje.tipo === 'exito' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <p>{mensaje.texto}</p>
          </div>
        )}

        {paso === 'email' ? (
          <form onSubmit={handleEnviarCodigo} className="space-y-4">
            <input
              type="email"
              value={emailAdmin}
              onChange={(e) => setEmailAdmin(e.target.value)}
              placeholder="admin@ejemplo.com"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white"
              required
            />
            <button type="submit" disabled={cargando} className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold">
              {cargando ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Enviar Código'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleValidarCodigo} className="space-y-4">
            <input
              type="text"
              maxLength={6}
              value={codigoOtp}
              onChange={(e) => setCodigoOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-center text-lg text-white font-mono"
              required
            />
            <button type="submit" disabled={cargando} className="w-full py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold">
              {cargando ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Validar e Ingresar'}
            </button>
          </form>
        )}
      </div>
    )
  }

  return (
    <div className="p-8 text-white max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Panel de Administración</h1>
        <button onClick={handleCerrarSesion} className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold">
          <LogOut className="w-4 h-4" /> Salir
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Bandas Pendientes de Aprobación</h2>
        {bandasPendientes.length === 0 ? (
          <p className="text-slate-400 text-sm">No hay bandas pendientes de revisión.</p>
        ) : (
          <div className="space-y-3">
            {bandasPendientes.map((b) => (
              <div key={b.id} className="flex justify-between items-center bg-slate-800 p-4 rounded-lg">
                <div>
                  <p className="font-semibold">{b.nombre}</p>
                  <p className="text-xs text-slate-400">{b.genero} • {b.email}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAprobar(b.id)} className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleRechazar(b.id)} className="p-2 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}