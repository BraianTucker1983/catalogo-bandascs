import { useEffect, useState } from 'react';
import Tilt from 'react-parallax-tilt'; // 1. Importamos la librería de efecto 3D
import { supabase } from '../lib/supabaseClient';

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
  integrantes: Integrante[];
  canciones: Cancion[];
}

interface ListaBandasProps {
  onSeleccionarBanda: (id: string) => void;
}

export default function ListaBandas({ onSeleccionarBanda }: ListaBandasProps) {
  const [bandas, setBandas] = useState<BandaCompleta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarLoginForm, setMostrarLoginForm] = useState(false);

  useEffect(() => {
    const traerBandasPublicas = async () => {
      try {
        setCargando(true);
        const { data, error } = await supabase
          .from('bandas')
          .select(`
            id, 
            nombre, 
            genero, 
            historia,
            integrantes(id, nombre, instrumento),
            canciones(id, titulo, spotify_embed_url, youtube_embed_url)
          `)
          .eq('aprobado', true);

        if (error) throw error;
        setBandas((data as unknown as BandaCompleta[]) || []);
      } catch (error: any) {
        console.error('Error al traer el catálogo:', error.message);
      } finally {
        setCargando(false);
      }
    };

    traerBandasPublicas();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const manejarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(`Error de ingreso: ${error.message}`);
    } else {
      setMostrarLoginForm(false);
      setEmail('');
      setPassword('');
    }
  };

  const manejarLogout = async () => {
    await supabase.auth.signOut();
  };

  const manejarEliminarBanda = async (e: React.MouseEvent, id: string, nombre: string) => {
    e.stopPropagation(); 
    const confirmar = window.confirm(`¿Estás seguro de eliminar permanentemente a "${nombre}"?`);
    if (!confirmar) return;

    setEliminandoId(id);
    try {
      const { error } = await supabase.from('bandas').delete().eq('id', id);
      if (error) throw error;
      setBandas((prevBandas) => prevBandas.filter((b) => b.id !== id));
      alert('Eliminada con éxito.');
    } catch (error: any) {
      console.error(error.message);
    } finally {
      setEliminandoId(null);
    }
  };

  if (cargando) return <p style={{ color: '#d4af37', textAlign: 'center', fontFamily: 'Georgia, serif', marginTop: '3rem' }}>Desenrollando pergamino musical...</p>;

  return (
    <div style={{ 
      maxWidth: '1100px', 
      margin: '2rem auto', 
      padding: '2rem 1rem', 
      fontFamily: 'Georgia, serif', 
      color: '#f4ecd8', 
      position: 'relative' 
    }}>
      
      {/* PANEL ADMIN VINTAGE */}
      <div style={{ position: 'absolute', top: '-10px', right: '1rem', zIndex: 10 }}>
        {!isAdmin ? (
          <div>
            <button 
              onClick={() => setMostrarLoginForm(!mostrarLoginForm)}
              style={{ backgroundColor: '#3e2723', color: '#d4af37', border: '1px solid #d4af37', padding: '5px 10px', borderRadius: '2px', cursor: 'pointer', fontSize: '12px' }}
            >
              {mostrarLoginForm ? 'Cerrar' : '🔒 Acceso Archivero'}
            </button>

            {mostrarLoginForm && (
              <form onSubmit={manejarLogin} style={{ backgroundColor: '#2b1d16', padding: '15px', borderRadius: '4px', marginTop: '5px', border: '1px solid #d4af37', display: 'flex', flexDirection: 'column', gap: '8px', width: '200px' }}>
                <input 
                  type="email" 
                  placeholder="Email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  style={{ padding: '6px', backgroundColor: '#3e2723', color: '#f4ecd8', border: '1px solid #5d4037' }}
                />
                <input 
                  type="password" 
                  placeholder="Contraseña" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  style={{ padding: '6px', backgroundColor: '#3e2723', color: '#f4ecd8', border: '1px solid #5d4037' }}
                />
                <button type="submit" style={{ backgroundColor: '#d4af37', color: '#1a0f0a', border: 'none', padding: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Entrar
                </button>
              </form>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#2b1d16', padding: '5px 10px', border: '1px solid #d4af37' }}>
            <span style={{ fontSize: '12px', color: '#d4af37' }}>● Modo Conservador</span>
            <button onClick={manejarLogout} style={{ backgroundColor: '#b71c1c', color: '#fff', border: 'none', padding: '3px 7px', cursor: 'pointer', fontSize: '11px' }}>Salir</button>
          </div>
        )}
      </div>

      <h2 style={{ 
        textAlign: 'center', 
        marginBottom: '3rem', 
        color: '#d4af37', 
        fontSize: '2.2rem',
        letterSpacing: '1px',
        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
        borderBottom: '1px double #d4af37',
        paddingBottom: '15px'
      }}>
        📜 Registro General de Bandas & Orquestas
      </h2>

      {bandas.length === 0 ? (
        <p style={{ color: '#8d6e63', textAlign: 'center', fontStyle: 'italic' }}>
          No se registran agrupaciones en este archivo dorado.
        </p>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', 
          gap: '35px' 
        }}>
          {bandas.map((banda) => (
            /* 2. Envolvemos la Card con el componente de la librería */
            <Tilt
              key={banda.id}
              tiltMaxAngleX={12} // Inclinación vertical máxima
              tiltMaxAngleY={12} // Inclinación horizontal máxima
              perspective={900}  // Factor de profundidad 3D
              scale={1.03}       // Sutil acercamiento del cuadro
              transitionSpeed={1200} // Transición suave al mover el cursor
              glareEnable={true} // Agrega un reflejo luminoso sutil sobre el lienzo
              glareMaxOpacity={0.15}
              glareColor="#ffffff"
              style={{ display: 'flex', height: '100%' }}
            >
              <div 
                onClick={() => onSeleccionarBanda(banda.id)}
                style={{ 
                  // MOLDURA DE MADERA COMPUESTA (Doble borde concéntrico simulando marcos antiguos)
                  backgroundColor: '#1c120c', // Paspartú interno oscuro
                  border: '14px solid #3a1f13', // Moldura de madera principal
                  outline: '3px solid #1a0a03',  // Contorno exterior oscuro
                  outlineOffset: '-17px',        // Ranura de sombra interna entre madera y lienzo
                  borderRadius: '3px',
                  
                  // Sombras múltiples: Proyección realista en pared + oscuridad interna del marco
                  boxShadow: `
                    0 15px 30px rgba(0,0,0,0.7), 
                    inset 0 3px 6px rgba(255,255,255,0.05), 
                    inset 0 0 25px rgba(0,0,0,0.95)
                  `,
                  
                  padding: '1.5rem 1.2rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'between',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              >
                {isAdmin && (
                  <button
                    onClick={(e) => manejarEliminarBanda(e, banda.id, banda.nombre)}
                    disabled={eliminandoId === banda.id}
                    style={{
                      position: 'absolute', top: '0.5rem', right: '0.5rem',
                      backgroundColor: '#b71c1c', color: '#fff', border: 'none',
                      padding: '2px 6px', cursor: 'pointer', fontSize: '10px', zIndex: 15
                    }}
                  >
                    ✕
                  </button>
                )}

                {/* Contenido */}
                <div style={{ flexGrow: 1, textAlign: 'center' }}>
                  <h3 style={{ 
                    margin: '0 0 10px 0', 
                    fontSize: '1.5rem', 
                    color: '#f4ecd8',
                    fontFamily: '"Times New Roman", Times, serif',
                    borderBottom: '1px dashed #5d4037',
                    paddingBottom: '10px'
                  }}>
                    {banda.nombre}
                  </h3>
                  
                  <span style={{ 
                    fontStyle: 'italic', 
                    fontSize: '0.85rem', 
                    color: '#d4af37', 
                    letterSpacing: '1px',
                    textTransform: 'uppercase'
                  }}>
                    — {banda.genero} —
                  </span>

                  <p style={{ 
                    color: '#bcaaa4', 
                    marginTop: '15px', 
                    lineHeight: '1.5', 
                    fontSize: '0.88rem',
                    fontFamily: 'Georgia, serif',
                    textAlign: 'justify',
                    display: '-webkit-box',
                    WebkitLineClamp: 4, 
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {banda.historia || 'Sin registros cronológicos en el archivo.'}
                  </p>
                </div>

                {/* Base del cuadro: Chapita de bronce identificatoria */}
                <div style={{ 
                  marginTop: '1.5rem', 
                  display: 'flex', 
                  justifyContent: 'center',
                  borderTop: '1px solid #3a1f13', 
                  paddingTop: '14px' 
                }}>
                  <div style={{
                    backgroundColor: '#2b1d16',
                    border: '1px solid #d4af37',
                    color: '#d4af37',
                    padding: '5px 14px',
                    fontSize: '0.72rem',
                    letterSpacing: '1.5px',
                    borderRadius: '1px',
                    boxShadow: 'inset 0 0 5px rgba(0,0,0,0.6)',
                    fontWeight: 'bold'
                  }}>
                    LEER LEGAJO 📜
                  </div>
                </div>

              </div>
            </Tilt>
          ))}
        </div>
      )}
    </div>
  );
}