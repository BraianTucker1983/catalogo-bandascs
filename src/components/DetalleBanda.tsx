import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Integrante {
  id: string;
  nombre: string;
  instrumento: string | null;
  instagram_url: string | null;
  foto_url: string | null;
}

interface BandaCompleta {
  id: string;
  nombre: string;
  genero: string;
  historia: string | null;
  instagram_url: string | null;
  foto_portada: string | null;
  integrantes: Integrante[];
}

interface DetalleBandaProps {
  bandaId: string;
  onVolver: () => void;
}

export default function DetalleBanda({ bandaId, onVolver }: DetalleBandaProps) {
  const [banda, setBanda] = useState<BandaCompleta | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerDatosBanda = async () => {
      setCargando(true);
      try {
        // Traemos la banda e incluimos sus integrantes aprovechando la FK (Foreign Key)
        const { data, error } = await supabase
          .from('bandas')
          .select(`
            id, nombre, genero, historia, instagram_url, foto_portada,
            integrantes ( id, nombre, instrumento, instagram_url, foto_url )
          `)
          .eq('id', bandaId)
          .single();

        if (error) throw error;
        setBanda(data as unknown as BandaCompleta);
      } catch (err: any) {
        console.error('Error al cargar detalle de la banda:', err.message);
      } finally {
        setCargando(false);
      }
    };

    if (bandaId) obtenerDatosBanda();
  }, [bandaId]);

  if (cargando) return <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando información de la banda...</p>;
  if (!banda) return <p style={{ textAlign: 'center', padding: '2rem' }}>No se encontró la banda seleccionada.</p>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', color: '#fff', fontFamily: 'sans-serif' }}>
      
      {/* Botón Volver */}
      <button 
        onClick={onVolver} 
        style={{ marginBottom: '1.5rem', padding: '8px 16px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
      >
        ← Volver al Catálogo
      </button>

      {/* Cabecera / Portada Grande */}
      <div style={{ 
        position: 'relative', 
        borderRadius: '12px', 
        overflow: 'hidden', 
        height: '300px', 
        backgroundColor: '#2d2d34',
        backgroundImage: banda.foto_portada ? `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(30,30,36,1)), url(${banda.foto_portada})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '2rem'
      }}>
        <span style={{ backgroundColor: '#22c55e', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: '0.5rem' }}>
          {banda.genero}
        </span>
        <h2 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0' }}>{banda.nombre}</h2>
        
        {banda.instagram_url && (
          <a href={banda.instagram_url} target="_blank" rel="noreferrer" style={{ color: '#e1306c', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
            📸 Instagram de la Banda
          </a>
        )}
      </div>

      {/* Historia */}
      <div style={{ margin: '2rem 0', textAlign: 'left', lineHeight: '1.6' }}>
        <h3 style={{ borderBottom: '1px solid #444', paddingBottom: '8px', color: '#22c55e' }}>Biografía / Historia</h3>
        <p style={{ whiteSpace: 'pre-line', color: '#ccc' }}>{banda.historia || 'Esta banda aún no tiene una biografía cargada.'}</p>
      </div>

      {/* Sección Integrantes */}
      <div style={{ textAlign: 'left' }}>
        <h3 style={{ borderBottom: '1px solid #444', paddingBottom: '8px', color: '#22c55e', marginBottom: '1.5rem' }}>👥 Integrantes</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
          {banda.integrantes && banda.integrantes.length > 0 ? (
            banda.integrantes.map((músico) => (
              <div key={músico.id} style={{ backgroundColor: '#25252b', padding: '1rem', borderRadius: '8px', border: '1px solid #333', textAlign: 'center' }}>
                <img 
                  src={músico.foto_url || 'https://via.placeholder.com/150'} 
                  alt={músico.nombre} 
                  style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px', backgroundColor: '#444' }} 
                />
                <h4 style={{ margin: '5px 0' }}>{músico.nombre}</h4>
                <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#aaa' }}>{músico.instrumento || 'Músico'}</p>
                
                {músico.instagram_url && (
                  <a href={músico.instagram_url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>
                    🔗 Ver Red Social
                  </a>
                )}
              </div>
            ))
          ) : (
            <p style={{ color: '#aaa' }}>No se cargaron los integrantes de esta banda.</p>
          )}
        </div>
      </div>

    </div>
  );
}