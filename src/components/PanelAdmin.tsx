import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface BandaPendiente {
  id: string;
  nombre: string;
  genero: string;
  historia: string;
  plan: string;
  created_at: string;
}

export default function PanelAdmin() {
  const [bandas, setBandas] = useState<BandaPendiente[]>([]);
  const [cargando, setCargando] = useState(true);

  // Función para cargar las bandas pendientes
  const obtenerBandasPendientes = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('bandas')
      .select('*')
      .eq('aprobado', false) // Solo las que no están aprobadas
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al traer pendientes:', error.message);
    } else {
      setBandas(data || []);
    }
    setCargando(false);
  };

  useEffect(() => {
    obtenerBandasPendientes();
  }, []);

  // Función para aprobar la banda
  const handleAprobar = async (id: string) => {
    const { error } = await supabase
      .from('bandas')
      .update({ aprobado: true })
      .eq('id', id);

    if (error) {
      alert(`Error al aprobar: ${error.message}`);
    } else {
      // Filtramos la banda aprobada del estado local para que desaparezca de la lista
      setBandas(bandas.filter(b => b.id !== id));
      alert('¡Banda aprobada con éxito! Ya es pública.');
    }
  };

  // Función para descartar/eliminar la banda (Ubicada correctamente aquí arriba)
  const handleDescartar = async (id: string) => {
    const confirmar = window.confirm("¿Estás seguro de que quieres descartar esta banda? Se eliminarán todos sus datos permanentemente.");
    if (!confirmar) return;

    const { error } = await supabase
      .from('bandas')
      .delete()
      .eq('id', id);

    if (error) {
      alert(`Error al descartar: ${error.message}`);
    } else {
      // La removemos del estado local para que desaparezca de la pantalla inmediatamente
      setBandas(bandas.filter(b => b.id !== id));
      alert('Banda descartada y eliminada correctamente.');
    }
  };

  if (cargando) return <p style={{ color: '#fff', textAlign: 'center' }}>Cargando panel de control...</p>;

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem', fontFamily: 'sans-serif', color: '#fff' }}>
      <h2 style={{ borderBottom: '2px solid #ef4444', paddingBottom: '10px' }}>🛡️ Panel de Administración (Moderación)</h2>
      
      {bandas.length === 0 ? (
        <p style={{ color: '#aaa', fontStyle: 'italic' }}>No hay bandas pendientes de aprobación por el momento. ¡Buen trabajo!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '1rem' }}>
          {bandas.map((banda) => (
            <div key={banda.id} style={{ backgroundColor: '#2d2d34', padding: '1.5rem', borderRadius: '8px', borderLeft: banda.plan === 'premium' ? '5px solid #ffd700' : '5px solid #007bff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0' }}>{banda.nombre} <span style={{ fontSize: '12px', padding: '2px 6px', borderRadius: '4px', backgroundColor: banda.plan === 'premium' ? '#ffd700' : '#555', color: banda.plan === 'premium' ? '#000' : '#fff' }}>{banda.plan.toUpperCase()}</span></h3>
                  <p style={{ color: '#ef4444', margin: '0', fontWeight: 'bold', fontSize: '14px' }}>Género: {banda.genero}</p>
                </div>
                
                {/* Contenedor de botones alineados */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => handleAprobar(banda.id)}
                    style={{ backgroundColor: '#22c55e', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Aprobar ✅
                  </button>
                  <button 
                    onClick={() => handleDescartar(banda.id)}
                    style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Descartar ❌
                  </button>
                </div>
              </div>
              <p style={{ color: '#ccc', marginTop: '10px', fontSize: '14px' }}>{banda.historia || 'Sin descripción.'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}