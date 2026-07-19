import { useEffect, useState } from 'react';
import Tilt from 'react-parallax-tilt';
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

  if (cargando) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <p className="text-muted-foreground font-medium animate-pulse text-lg tracking-wider">
          Sincronizando catálogo de bandas...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 relative text-foreground">
      
      {/* Panel Administrador */}
      <div className="absolute top-0 right-4 z-20">
        {!isAdmin ? (
          <div className="relative">
            <button 
              onClick={() => setMostrarLoginForm(!mostrarLoginForm)}
              className="text-xs font-semibold px-3 py-1.5 rounded bg-muted hover:bg-secondary text-white/80 border border-border transition-colors cursor-pointer"
            >
              {mostrarLoginForm ? 'Cerrar' : '🔒 Acceso Admin'}
            </button>

            {mostrarLoginForm && (
              <form 
                onSubmit={manejarLogin} 
                className="absolute right-0 mt-2 p-4 bg-card rounded-lg border border-border flex flex-col gap-3 w-56 shadow-2xl backdrop-blur-md"
              >
                <input 
                  type="email" 
                  placeholder="Email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  className="p-2 text-sm bg-background border border-border rounded text-foreground focus:outline-none focus:border-primary"
                />
                <input 
                  type="password" 
                  placeholder="Contraseña" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  className="p-2 text-sm bg-background border border-border rounded text-foreground focus:outline-none focus:border-primary"
                />
                <button 
                  type="submit" 
                  className="bg-primary hover:opacity-90 text-white py-2 rounded text-sm font-bold transition-opacity cursor-pointer"
                >
                  Ingresar
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-card p-2 rounded-lg border border-border shadow-md">
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Panel de Control
            </span>
            <button 
              onClick={manejarLogout} 
              className="bg-destructive hover:opacity-90 text-white text-xs px-2 py-1 rounded transition-opacity cursor-pointer"
            >
              Salir
            </button>
          </div>
        )}
      </div>

      {/* Encabezado */}
      <div className="text-center mb-16 relative">
        <h2 className="text-3xl md:text-5xl font-black tracking-wider uppercase mb-3 text-white">
          Catálogo de <span className="gradient-text">Bandas</span>
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto rounded-full" />
      </div>

      {bandas.length === 0 ? (
        <p className="text-muted-foreground text-center italic tracking-wide">
          No hay bandas cargadas de forma pública todavía.
        </p>
      ) : (
        /* SOLUCIÓN: Cambiado a un contenedor de lectura amplio y centrado */
        <div className="max-w-4xl mx-auto w-full">
          {/* SOLUCIÓN: grid-cols-1 estricto para asegurar la orientación vertical */}
          <div className="grid grid-cols-1 gap-6 w-full">
            {bandas.map((banda) => (
              /* SOLUCIÓN: w-full sin límites chicos para que abarque el ancho */
              <div key={banda.id} className="w-full">
                <Tilt
                  tiltMaxAngleX={3} // Bajado un poco el ángulo para que no distorsione al ser una card ancha
                  tiltMaxAngleY={3}
                  perspective={1500}
                  scale={1.01}
                  transitionSpeed={1400}
                  glareEnable={true}
                  glareMaxOpacity={0.07}
                  glareColor="#ffffff"
                  style={{ display: 'flex', width: '100%' }}
                >
                  <div 
                    onClick={() => onSeleccionarBanda(banda.id)}
                    className="member-card p-6 flex flex-col justify-between w-full cursor-pointer relative"
                  >
                    {isAdmin && (
                      <button
                        onClick={(e) => manejarEliminarBanda(e, banda.id, banda.nombre)}
                        disabled={eliminandoId === banda.id}
                        className="absolute top-4 right-4 bg-destructive text-white p-1.5 rounded-full hover:scale-105 active:scale-95 transition-transform z-30 flex items-center justify-center w-6 h-6 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}

                    {/* SOLUCIÓN: Disposición horizontal interna en pantallas medianas/grandes */}
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-baseline gap-3">
                          <h3 className="text-2xl font-black tracking-tight text-white">
                            {banda.nombre}
                          </h3>
                          <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
                            {banda.genero}
                          </span>
                        </div>
                        
                        {/* Aumentado a line-clamp-3 para biografías un poco más completas en el listado */}
                        <p className="text-sm text-muted-foreground leading-relaxed text-justify line-clamp-3 pt-1">
                          {banda.historia || 'Sin biografía disponible en los registros del sitio.'}
                        </p>
                      </div>

                      {/* Acción inferior alineada a la derecha en pantallas grandes */}
                      <div className="md:self-center shrink-0 flex justify-end group pt-4 md:pt-0">
                        <span className="text-xs font-bold uppercase tracking-wider text-white/70 group-hover:text-primary transition-colors flex items-center gap-1 bg-background/40 md:bg-transparent px-3 py-2 md:p-0 rounded-lg border border-border/40 md:border-transparent">
                          Ver Legajo 
                          <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
                        </span>
                      </div>
                    </div>

                  </div>
                </Tilt>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}