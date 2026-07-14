import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// Tipados para reflejar la estructura relacional de tu base de datos
interface Integrante {
  id: string;
  nombre: string;
  instrumento: string | null;
}

interface Cancion {
  id: string;
  titulo: string;
  spotify_embed_url: string | null;
  youtube_embed_url: string | null;
}

interface BandaCompleta {
  id: string;
  nombre: string;
  genero: string;
  historia: string;
  plan: 'gratis' | 'premium';
  integrantes: Integrante[];
  canciones: Cancion[];
}

export default function ListaBandas() {
  const [bandas, setBandas] = useState<BandaCompleta[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const traerBandasPublicas = async () => {
      setCargando(true);
      
      // Traemos las bandas aprobadas junto con sus integrantes y canciones asociadas
      const { data, error } = await supabase
        .from('bandas')
        .select(`
          id, nombre, genero, historia, plan,
          integrantes ( id, nombre, instrumento ),
          canciones ( id, titulo, spotify_embed_url, youtube_embed_url )
        `)
        .eq('aprobado', true); // ¡Solo las aprobadas por el Admin!

      if (error) {
        console.error('Error al traer el catálogo:', error.message);
      } else {
        setBandas((data as unknown as BandaCompleta[]) || []);
      }
      setCargando(false);
    };

    traerBandasPublicas();
  }, []);

  // Función auxiliar para limpiar y renderizar iframes de YouTube de forma segura
  const obtenerYoutubeEmbed = (url: string) => {
    if (url.includes('embed')) return url;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
  };

  // Función auxiliar para limpiar links de Spotify
  const obtenerSpotifyEmbed = (url: string) => {
    if (url.includes('embed')) return url;
    if (url.includes('open.spotify.com')) {
      return url.replace('open.spotify.com/', 'open.spotify.com/embed/');
    }
    return url;
  };

  if (cargando) return <p style={{ color: '#fff', textAlign: 'center' }}>Cargando catálogo musical...</p>;

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '1rem', fontFamily: 'sans-serif', color: '#fff' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '2px solid #22c55e', paddingBottom: '10px' }}>
        🎵 Bandas Oficiales de Coronel Suárez
      </h2>

      {bandas.length === 0 ? (
        <p style={{ color: '#aaa', textAlign: 'center', fontStyle: 'italic' }}>
          Aún no hay bandas aprobadas en la cartelera principal. ¡Ve al panel de admin y aprueba una!
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '25px' }}>
          {bandas.map((banda) => {
            const esPremium = banda.plan === 'premium';

            return (
              <div 
                key={banda.id} 
                style={{ 
                  backgroundColor: '#2d2d34', 
                  borderRadius: '12px', 
                  padding: '2rem',
                  boxShadow: esPremium ? '0 0 15px rgba(255, 215, 0, 0.2)' : '0 4px 6px rgba(0,0,0,0.1)',
                  border: esPremium ? '2px solid #ffd700' : '1px solid #444',
                  position: 'relative'
                }}
              >
                {/* Insignia Premium */}
                {esPremium && (
                  <span style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: '#ffd700', color: '#000', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                    👑 PREMIUM
                  </span>
                )}

                {/* Info Principal */}
                <h3 style={{ margin: '0 0 5px 0', fontSize: '1.8rem', color: esPremium ? '#ffd700' : '#fff' }}>{banda.nombre}</h3>
                <span style={{ backgroundColor: '#444', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', color: '#22c55e', fontWeight: 'bold' }}>
                  {banda.genero}
                </span>

                <p style={{ color: '#ccc', marginTop: '15px', lineHeight: '1.5' }}>
                  {banda.historia || 'Sin descripción disponible.'}
                </p>

                {/* Sección Integrantes */}
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid #444', paddingTop: '10px' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#aaa' }}>Integrantes:</h4>
                  {esPremium ? (
                    // Vista Premium: Muestra nombres e instrumentos con estilo de etiquetas
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {banda.integrantes.map(i => (
                        <span key={i.id} style={{ backgroundColor: '#1e1e24', padding: '5px 10px', borderRadius: '6px', fontSize: '14px', border: '1px solid #555' }}>
                          👤 <strong>{i.nombre}</strong> {i.instrumento ? `(${i.instrumento})` : ''}
                        </span>
                      ))}
                    </div>
                  ) : (
                    // Vista Gratis: Lista simple de nombres separados por comas
                    <p style={{ color: '#eee', fontSize: '15px', margin: '0' }}>
                      {banda.integrantes.map(i => i.nombre).join(', ')}
                    </p>
                  )}
                </div>

                {/* Sección Multimedia (EXCLUSIVA PREMIUM) */}
                {esPremium && banda.canciones && banda.canciones.length > 0 && (
                  <div style={{ marginTop: '2rem', borderTop: '1px dashed #ffd700', paddingTop: '15px' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#ffd700' }}>Escuchá su música 🎧</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                      {banda.canciones.map((cancion) => (
                        <div key={cancion.id} style={{ backgroundColor: '#1e1e24', padding: '10px', borderRadius: '8px' }}>
                          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#fff' }}>🎵 {cancion.titulo}</p>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {cancion.spotify_embed_url && (
                              <iframe 
                                src={obtenerSpotifyEmbed(cancion.spotify_embed_url)} 
                                width="100%" 
                                height="80" 
                                frameBorder="0" 
                                allow="encrypted-media"
                                style={{ borderRadius: '8px' }}
                              ></iframe>
                            )}

                            {cancion.youtube_embed_url && (
                              <iframe 
                                width="100%" 
                                height="200" 
                                src={obtenerYoutubeEmbed(cancion.youtube_embed_url)} 
                                title={cancion.titulo}
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                                style={{ borderRadius: '8px' }}
                              ></iframe>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}