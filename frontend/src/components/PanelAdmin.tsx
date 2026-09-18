import React, { useState, useEffect } from 'react';
import { ShieldCheck, Loader2, LogOut, Check, X, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function PanelAdmin() {
  const [bandasPendientes, setBandasPendientes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarBandasPendientes = async () => {
    setCargando(true);
    setError(null);
    try {
      // Obtener el token de la sesión activa de Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/admin/bandas-pendientes', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
      const data = await res.json();
      setBandasPendientes(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error('Error cargando pendientes', e);
      setError(e.message || 'Error al conectar con el servidor');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarBandasPendientes();
  }, []);

  const handleAprobar = async (id: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`/api/admin/bandas/${id}/aprobar`, {
        method: 'PUT',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        cargarBandasPendientes();
      }
    } catch (e) {
      console.error('Error al aprobar banda', e);
    }
  };

  const handleRechazar = async (id: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`/api/admin/bandas/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        cargarBandasPendientes();
      }
    } catch (e) {
      console.error('Error al rechazar banda', e);
    }
  };

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="p-8 text-white max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Panel de Administración</h1>
            <p className="text-xs text-slate-400">Sesión de administración validada correctamente</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={cargarBandasPendientes}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            title="Recargar lista"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} /> Recargar
          </button>
          <button
            onClick={handleCerrarSesion}
            className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <h2 className="text-lg font-semibold mb-4">Bandas Pendientes de Aprobación</h2>

        {cargando ? (
          <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            <span className="text-sm">Cargando legajos pendientes...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm">
            {error}
          </div>
        ) : bandasPendientes.length === 0 ? (
          <p className="text-slate-400 text-sm py-8 text-center">No hay bandas pendientes de revisión en este momento.</p>
        ) : (
          <div className="space-y-3">
            {bandasPendientes.map((b) => (
              <div key={b.id} className="flex justify-between items-center bg-slate-800/80 border border-slate-700/50 p-4 rounded-lg">
                <div>
                  <p className="font-semibold text-white">{b.nombre}</p>
                  <p className="text-xs text-slate-400">{b.genero} • {b.email}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAprobar(b.id)}
                    className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg border border-emerald-500/30 transition-colors cursor-pointer"
                    title="Aprobar banda"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRechazar(b.id)}
                    className="p-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg border border-rose-500/30 transition-colors cursor-pointer"
                    title="Rechazar banda"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}