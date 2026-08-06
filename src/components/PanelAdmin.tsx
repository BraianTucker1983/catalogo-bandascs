import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Clock, 
  Mail, 
  Music2, 
  Lock, 
  Sparkles,
  Inbox
} from 'lucide-react';

interface BandaPendiente {
  id: string;
  nombre: string;
  genero: string;
  historia: string | null;
  email: string | null;
  created_at: string;
}

export default function AdminPanel() {
  const [bandas, setBandas] = useState<BandaPendiente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    const verificarSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setAutenticado(false);
        setCargando(false);
      } else {
        setAutenticado(true);
        obtenerBandasPendientes();
      }
    };

    verificarSesion();
  }, []);

  const obtenerBandasPendientes = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('bandas')
        .select('id, nombre, genero, historia, email, created_at')
        .eq('aprobado', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setBandas(data || []);
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: `Error al cargar: ${err.message}` });
    } finally {
      setCargando(false);
    }
  };

  const handleAprobarBanda = async (id: string, nombreBanda: string) => {
    setMensaje(null);
    try {
      const { error } = await supabase
        .from('bandas')
        .update({ aprobado: true })
        .eq('id', id);

      if (error) throw error;

      setBandas(prev => prev.filter(b => b.id !== id));
      setMensaje({ tipo: 'exito', texto: `¡La banda "${nombreBanda}" fue aprobada y ya es pública!` });
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: `No se pudo aprobar: ${err.message}` });
    }
  };

  const handleRechazarBanda = async (id: string, nombreBanda: string) => {
    const confirmar = window.confirm(`¿Estás seguro de que querés RECHAZAR y eliminar la postulación de "${nombreBanda}"?`);
    if (!confirmar) return;

    setMensaje(null);
    try {
      const { error } = await supabase
        .from('bandas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBandas(prev => prev.filter(b => b.id !== id));
      setMensaje({ tipo: 'error', texto: `La postulación de "${nombreBanda}" fue rechazada.` });
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: `No se pudo rechazar: ${err.message}` });
    }
  };

  // VISTA DE ACCESO RESTRENGIDO SI NO ESTÁ AUTENTICADO
  if (!cargando && !autenticado) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-center">
        <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center text-xl mx-auto mb-4 border border-rose-500/20">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Acceso Restringido</h3>
        <p className="text-slate-400 text-sm">
          Debes iniciar sesión como administrador para gestionar las postulaciones del catálogo.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto bg-slate-900 text-slate-100 rounded-2xl shadow-2xl overflow-hidden border border-slate-800 my-8">
      
      {/* HEADER DE PANEL ADMIN */}
      <div className="p-8 bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-900 border-b border-slate-800 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-3">
              <ShieldCheck className="w-3.5 h-3.5" /> Administración
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Panel de Revisión
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Aaprueba o rechaza los grupos musicales postulados para el catálogo.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-4 py-2 rounded-xl w-fit">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-medium text-slate-300">
              Pendientes: <strong className="text-white font-bold">{bandas.length}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* MENSAJES DE ESTADO DE FEEDBACK */}
        {mensaje && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            mensaje.tipo === 'exito' 
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}>
            {mensaje.tipo === 'exito' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <p className="text-sm font-medium">{mensaje.texto}</p>
          </div>
        )}

        {/* ESTADOS DE CARGA Y LISTADO */}
        {cargando ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-sm font-medium">Cargando postulaciones...</p>
          </div>
        ) : bandas.length === 0 ? (
          <div className="text-center py-16 bg-slate-800/20 rounded-2xl border border-slate-800/80">
            <Inbox className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-200">¡Todo al día!</h3>
            <p className="text-slate-400 text-sm mt-1">
              No hay bandas pendientes de revisión en este momento.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bandas.map((banda) => (
              <div
                key={banda.id}
                className="p-6 bg-slate-800/40 border border-slate-800 rounded-xl hover:border-slate-700 transition duration-200"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-xl font-bold text-white">{banda.nombre}</h3>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Music2 className="w-3 h-3" /> {banda.genero}
                      </span>
                    </div>

                    {banda.email && (
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-slate-300 font-medium">{banda.email}</span>
                      </p>
                    )}
                  </div>

                  {/* BOTONES DE ACCIÓN */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRechazarBanda(banda.id, banda.nombre)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 rounded-lg text-xs font-semibold transition"
                    >
                      <XCircle className="w-4 h-4" /> Rechazar
                    </button>

                    <button
                      onClick={() => handleAprobarBanda(banda.id, banda.nombre)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition shadow-lg shadow-emerald-900/20"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Aprobar Banda
                    </button>
                  </div>
                </div>

                {/* HISTORIA / BIOGRAFÍA */}
                <div className="mt-4 pt-4 border-t border-slate-800/80">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Historia / Biografía
                  </p>
                  <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                    {banda.historia || 'Sin biografía cargada.'}
                  </p>
                </div>

                {/* FECHA */}
                <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>Registrada el {new Date(banda.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}