import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

// Mapa de colores
const TEMAS_MAPA: Record<string, { primary: string; bgGlow: string }> = {
  purple: { primary: '#a855f7', bgGlow: 'rgba(168, 85, 247, 0.25)' },
  emerald: { primary: '#10b981', bgGlow: 'rgba(16, 185, 129, 0.25)' },
  amber: { primary: '#f59e0b', bgGlow: 'rgba(245, 158, 11, 0.25)' },
  cyan: { primary: '#06b6d4', bgGlow: 'rgba(6, 182, 212, 0.25)' },
  rose: { primary: '#f43f5e', bgGlow: 'rgba(244, 63, 94, 0.25)' },
  indigo: { primary: '#6366f1', bgGlow: 'rgba(99, 102, 241, 0.25)' },
  crimson: { primary: '#dc2626', bgGlow: 'rgba(220, 38, 38, 0.25)' },
  lime: { primary: '#84cc16', bgGlow: 'rgba(132, 204, 22, 0.25)' },
};

interface Integrante {
  id: string | number;
  nombre: string;
  rol?: string | null;       // CORREGIDO (coincide con 'rol' del formulario)
  foto_url?: string | null;  // CORREGIDO (coincide con 'foto_url' del formulario)
  instagram?: string | null;
}

interface Cancion {
  id: string | number;
  titulo: string;
  url_audio?: string | null; // CORREGIDO
  spotify_id?: string | null; // CORREGIDO
}

interface BandaDetalle {
  id: string | number;
  nombre: string;
  genero?: string | null;
  bio?: string | null;
  historia?: string | null;
  url_portada?: string | null; // CORREGIDO (coincide con 'url_portada' del formulario)
  instagram_url?: string | null;
  spotify_url?: string | null; // CORREGIDO
  youtube_url?: string | null;  // CORREGIDO
  color_tema?: string | null;   // CORREGIDO (coincide con 'color_tema' del formulario)
  integrantes?: Integrante[];
  canciones?: Cancion[];
}

interface LandingBandaProps {
  bandaId: string;
  onVolver: () => void;
}

function parseYoutubeEmbed(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const urlLimpia = url.trim();
  if (urlLimpia.includes('/embed/')) return urlLimpia;

  const match = urlLimpia.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/
  );
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function parseSpotifyEmbed(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const urlLimpia = url.trim();
  if (urlLimpia.includes('open.spotify.com/embed/')) return urlLimpia;

  if (urlLimpia.includes('open.spotify.com/')) {
    return urlLimpia.replace('open.spotify.com/', 'open.spotify.com/embed/');
  }
  return null;
}

export default function LandingBanda({ bandaId, onVolver }: LandingBandaProps) {
  const [banda, setBanda] = useState<BandaDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function cargarDetalleBanda() {
      try {
        setCargando(true);
        setErrorCarga(null);

        const { data: bandaData, error: bandaError } = await supabase
          .from('bandas')
          .select('*')
          .eq('id', bandaId)
          .maybeSingle();

        if (bandaError) throw bandaError;

        if (!bandaData) {
          if (!cancelado) setBanda(null);
          return;
        }

        const [integrantesRes, cancionesRes] = await Promise.all([
          supabase
            .from('integrantes')
            .select('*')
            .eq('banda_id', bandaId),
          supabase
            .from('canciones')
            .select('*')
            .eq('banda_id', bandaId),
        ]);

        if (integrantesRes.error) {
          console.warn('Error al cargar integrantes:', integrantesRes.error.message);
        }

        if (cancionesRes.error) {
          console.warn('Error al cargar canciones:', cancionesRes.error.message);
        }

        if (!cancelado) {
          setBanda({
            ...bandaData,
            integrantes: integrantesRes.data || [],
            canciones: cancionesRes.data || [],
          });
        }
      } catch (err: unknown) {
        if (!cancelado) {
          const mensaje =
            err instanceof Error ? err.message : 'Error desconocido al cargar la banda.';
          console.error('Error al cargar la landing de la banda:', mensaje);
          setErrorCarga(mensaje);
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    if (bandaId) {
      cargarDetalleBanda();
    }

    return () => {
      cancelado = true;
    };
  }, [bandaId]);

  const temaActivo = useMemo(() => {
    const rawColor = banda?.color_tema || '#6366f1';
    if (rawColor.startsWith('#')) {
      return { primary: rawColor, bgGlow: `${rawColor}40` };
    }
    const claveTema = rawColor.toLowerCase();
    return TEMAS_MAPA[claveTema] || TEMAS_MAPA.indigo;
  }, [banda?.color_tema]);

  if (cargando) {
    return (
      <div className="min-h-[450px] flex flex-col justify-center items-center space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse text-sm tracking-wider uppercase">
          Cargando legajo de la banda...
        </p>
      </div>
    );
  }

  if (errorCarga || !banda) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="p-8 rounded-2xl border border-destructive/30 bg-destructive/10">
          <p className="text-destructive font-medium text-sm">
            {errorCarga
              ? 'No se pudo cargar la información de la banda.'
              : 'No se encontró la banda seleccionada.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onVolver}
          className="px-5 py-2.5 bg-card border border-border rounded-xl text-xs font-bold uppercase tracking-wider text-white hover:border-primary transition-colors cursor-pointer"
        >
          ← Volver al catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden pb-24">
      {/* Resplandor temático dinámico de fondo */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] blur-[140px] pointer-events-none opacity-30 transition-all duration-700 z-0"
        style={{ backgroundColor: temaActivo.bgGlow }}
      />

      <div className="max-w-4xl mx-auto px-4 pt-8 relative z-10 space-y-10">
        {/* Botón Volver */}
        <div>
          <button
            type="button"
            onClick={onVolver}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-white transition-colors bg-card/60 border border-border/80 px-4 py-2.5 rounded-xl backdrop-blur-md hover:border-primary/50 cursor-pointer shadow-sm"
          >
            ← Volver al catálogo
          </button>
        </div>

        {/* Encabezado Principal / Hero */}
        <header className="text-center space-y-6 pt-2">
          {banda.url_portada && (
            <div className="w-full rounded-2xl overflow-hidden border border-border/60 shadow-2xl relative bg-slate-950/80 p-3 md:p-6 flex items-center justify-center">
              <img
                src={banda.url_portada}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover opacity-20 blur-2xl pointer-events-none scale-125"
              />
              <img
                src={banda.url_portada}
                alt={banda.nombre}
                className="relative z-10 w-full max-w-2xl h-auto object-contain rounded-xl drop-shadow-2xl"
              />
            </div>
          )}

          <div className="space-y-3">
            {banda.genero && (
              <div>
                <span
                  className="inline-block text-[11px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full border border-border bg-card/80 backdrop-blur-md shadow-sm"
                  style={{ color: temaActivo.primary, borderColor: `${temaActivo.primary}40` }}
                >
                  {banda.genero}
                </span>
              </div>
            )}

            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white drop-shadow-md">
              {banda.nombre}
            </h1>

            <div
              className="w-24 h-1 mx-auto rounded-full"
              style={{ backgroundColor: temaActivo.primary }}
            />
          </div>

          {(banda.instagram_url || banda.spotify_url || banda.youtube_url) && (
            <div className="flex items-center justify-center gap-3 pt-2">
              {banda.instagram_url && (
                <a
                  href={banda.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold uppercase tracking-wider px-4 py-2 bg-card border border-border rounded-lg text-white hover:border-primary transition-colors"
                >
                  Instagram ↗
                </a>
              )}
              {banda.spotify_url && (
                <a
                  href={banda.spotify_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold uppercase tracking-wider px-4 py-2 bg-card border border-border rounded-lg text-emerald-400 hover:border-emerald-500 transition-colors"
                >
                  Spotify ↗
                </a>
              )}
              {banda.youtube_url && (
                <a
                  href={banda.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold uppercase tracking-wider px-4 py-2 bg-card border border-border rounded-lg text-rose-400 hover:border-rose-500 transition-colors"
                >
                  YouTube ↗
                </a>
              )}
            </div>
          )}
        </header>

        {/* Biografía / Historia */}
        {(banda.historia || banda.bio) && (
          <section className="bg-card/40 border border-border/80 p-6 md:p-8 rounded-2xl backdrop-blur-md shadow-lg space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <span style={{ color: temaActivo.primary }}>///</span> Biografía & Reseña
            </h2>
            <p className="text-slate-200 leading-relaxed text-justify whitespace-pre-line text-sm md:text-base">
              {banda.historia || banda.bio}
            </p>
          </section>
        )}

        {/* Formación / Integrantes */}
        {banda.integrantes && banda.integrantes.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
              <span style={{ color: temaActivo.primary }}>///</span> Formación / Integrantes
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {banda.integrantes.map((miembro) => {
                const fotoSrc =
                  miembro.foto_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    miembro.nombre || 'Integrante'
                  )}&background=1e293b&color=fff&size=400`;

                return (
                  <div
                    key={miembro.id}
                    className="bg-card/40 border border-border/80 rounded-2xl overflow-hidden backdrop-blur-sm p-4 space-y-3 hover:border-border/100 transition-colors shadow-md flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="w-full h-48 sm:h-52 rounded-xl overflow-hidden bg-slate-900 border border-border/40">
                        <img
                          src={fotoSrc}
                          alt={miembro.nombre}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-white text-base md:text-lg">{miembro.nombre}</p>
                        {miembro.rol && (
                          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                            {miembro.rol}
                          </p>
                        )}
                      </div>
                    </div>

                    {miembro.instagram && (
                      <a
                        href={miembro.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold hover:underline inline-flex items-center gap-1 transition-colors pt-1"
                        style={{ color: temaActivo.primary }}
                      >
                        Instagram ↗
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Canciones / Singles */}
        {banda.canciones && banda.canciones.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1 flex items-center gap-2">
              <span style={{ color: temaActivo.primary }}>///</span> Material Audiovisual
            </h2>
            <div className="space-y-6">
              {banda.canciones.map((cancion) => {
                const spotifyUrl = parseSpotifyEmbed(cancion.spotify_id);

                return (
                  <div
                    key={cancion.id}
                    className="bg-card/40 border border-border/80 p-5 md:p-6 rounded-2xl backdrop-blur-sm space-y-4 shadow-lg"
                  >
                    <h3 className="font-bold text-lg text-white">{cancion.titulo}</h3>

                    {spotifyUrl && (
                      <div className="rounded-xl overflow-hidden shadow-md bg-black/30">
                        <iframe
                          src={spotifyUrl}
                          title={`Spotify reproductor para ${cancion.titulo}`}
                          width="100%"
                          height="152"
                          allow="encrypted-media"
                          className="border-0 w-full block"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {cancion.url_audio && (
                      <div className="pt-2">
                        <audio controls className="w-full">
                          <source src={cancion.url_audio} type="audio/mpeg" />
                          Tu navegador no soporta el reproductor de audio.
                        </audio>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}