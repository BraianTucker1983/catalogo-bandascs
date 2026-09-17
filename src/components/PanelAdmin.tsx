import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ShieldCheck, Mail, KeyRound, Loader2, CheckCircle2, AlertCircle, ArrowLeft, LogOut } from 'lucide-react';

export default function PanelAdmin() {
  const [autenticado, setAutenticado] = useState(false);
  const [paso, setPaso] = useState<'email' | 'codigo'>('email');
  const [emailAdmin, setEmailAdmin] = useState('');
  const [codigoOtp, setCodigoOtp] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    const verificarSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Comprobar si el usuario tiene rol de administrador en app_metadata
      const esAdmin = session?.user?.app_metadata?.role === 'admin';
      setAutenticado(Boolean(esAdmin));
    };

    verificarSesion();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const esAdmin = session?.user?.app_metadata?.role === 'admin';
      setAutenticado(Boolean(esAdmin));
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleEnviarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);
    setCargando(true);

    try {
      // Envía la OTP a cualquier usuario existente (Supabase rechazará emails no registrados)
      const { error } = await supabase.auth.signInWithOtp({
        email: emailAdmin.trim(),
        options: { shouldCreateUser: false },
      });

      if (error) throw error;

      setPaso('codigo');
      setMensaje({ tipo: 'exito', texto: 'Código de verificación enviado. Revisa tu casilla de correo.' });
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al enviar el código de verificación.' });
    } finally {
      setCargando(false);
    }
  };

  const handleValidarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);
    setCargando(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: emailAdmin.trim(),
        token: codigoOtp.trim(),
        type: 'email',
      });

      if (error) throw error;

      // Verificar si el usuario que acaba de ingresar es admin
      if (data.session?.user?.app_metadata?.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Tu cuenta no tiene permisos de administrador.');
      }

      setAutenticado(true);
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Código incorrecto o expirado.' });
    } finally {
      setCargando(false);
    }
  };

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut();
    setAutenticado(false);
    setPaso('email');
    setEmailAdmin('');
    setCodigoOtp('');
  };

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
          {paso === 'email' 
            ? 'Ingresa tu correo institucional para recibir la clave de acceso.' 
            : `Ingresa el código numérico de 6 dígitos enviado a ${emailAdmin}`}
        </p>

        {mensaje && (
          <div className={`mb-5 p-3 rounded-lg flex items-center gap-2.5 text-xs font-medium ${
            mensaje.tipo === 'exito'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}>
            {mensaje.tipo === 'exito' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <p>{mensaje.texto}</p>
          </div>
        )}

        {paso === 'email' ? (
          <form onSubmit={handleEnviarCodigo} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Correo de Administrador</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={emailAdmin}
                  onChange={(e) => setEmailAdmin(e.target.value)}
                  placeholder="admin@ejemplo.com"
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar Código por Mail'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleValidarCodigo} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Código de 6 dígitos</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  maxLength={6}
                  value={codigoOtp}
                  onChange={(e) => setCodigoOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-center text-lg tracking-widest font-mono text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando || codigoOtp.length < 6}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Validar e Ingresar'}
            </button>

            <button
              type="button"
              onClick={() => { setPaso('email'); setMensaje(null); }}
              className="w-full text-xs text-slate-400 hover:text-white transition flex items-center justify-center gap-1 pt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Cambiar correo
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Panel de Administración</h1>
        <button
          onClick={handleCerrarSesion}
          className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold"
        >
          <LogOut className="w-4 h-4" /> Salir
        </button>
      </div>
      <p className="text-slate-400 text-sm">Sesión de administración validada correctamente.</p>
    </div>
  );
}