import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

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
  
  // NUEVO ESTADO: Verificación de seguridad
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

  // NUEVA FUNCIÓN: Eliminar postulaciones rechazadas
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

  // VISTA DE ACCESO DENEGADO SI NO INICIÓ SESIÓN
  if (!cargando && !autenticado) {
    return (
      <div style={{ maxWidth: '500px', margin: '4rem auto', padding: '2rem', textAlign: 'center', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', border: '1px solid #fecaca', fontFamily: 'sans-serif' }}>
        <h3>🔒 Acceso Restringido</h3>
        <p>Debes iniciar sesión como administrador para gestionar las postulaciones del catálogo.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1.5rem', fontFamily: 'sans-serif', color: '#333' }}>
      <h2 style={{ borderBottom: '2px solid #3b82f6', paddingBottom: '10px' }}>🕵️‍♂️ Panel de Administración</h2>
      <p style={{ color: '#666' }}>Revisión de grupos musicales postulados para el Catálogo de Coronel Suárez.</p>

      {/* Alertas de Feedback */}
      {mensaje && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          borderRadius: '6px',
          fontWeight: 'bold',
          backgroundColor: mensaje.tipo === 'exito' ? '#dcfce7' : '#fee2e2',
          color: mensaje.tipo === 'exito' ? '#166534' : '#991b1b',
          border: `1px solid ${mensaje.tipo === 'exito' ? '#bbf7d0' : '#fecaca'}`
        }}>
          {mensaje.texto}
        </div>
      )}

      {cargando ? (
        <p style={{ textAlign: 'center', fontWeight: 'bold' }}>Cargando postulaciones...</p>
      ) : bandas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
          <p style={{ fontSize: '18px', margin: 0 }}>🎉 ¡No hay bandas pendientes de revisión!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {bandas.map((banda) => (
            <div key={banda.id} style={{
              padding: '1.5rem',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', color: '#1e3a8a' }}>{banda.nombre}</h3>
                  <span style={{
                    display: 'inline-block',
                    padding: '3px 8px',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    marginBottom: '10px'
                  }}>{banda.genero}</span>
                </div>
                
                {/* GRUPO DE BOTONES DE ACCIÓN */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => handleRechazarBanda(banda.id, banda.nombre)}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ef4444')}
                  >
                    ❌ Rechazar
                  </button>

                  <button 
                    onClick={() => handleAprobarBanda(banda.id, banda.nombre)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#22c55e',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#16a34a')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#22c55e')}
                  >
                    ✅ Aprobar Banda
                  </button>
                </div>
              </div>

              {banda.email && (
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#4b5563' }}>
                  <strong>Contacto:</strong> {banda.email}
                </p>
              )}
              
              <p style={{ margin: '10px 0 0 0', fontSize: '14px', lineHeight: '1.5', color: '#374151', whiteSpace: 'pre-line' }}>
                <strong>Historia:</strong> {banda.historia || 'Sin biografía cargada.'}
              </p>
              
              <span style={{ display: 'block', marginTop: '12px', fontSize: '11px', color: '#9ca3af' }}>
                Registrada el: {new Date(banda.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}