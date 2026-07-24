import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// Mapa de colores basado en el selector del formulario
const TEMAS_MAPA: Record<string, { primary: string; bgGlow: string }> = {
  purple: { primary: '#a855f7', bgGlow: 'rgba(168, 85, 247, 0.25)' },
  emerald: { primary: '#10b981', bgGlow: 'rgba(16, 185, 129, 0.25)' },
  amber: { primary: '#f59e0b', bgGlow: 'rgba(245, 158, 11, 0.25)' },
  cyan: { primary: '#06b6d4', bgGlow: 'rgba(6, 182, 212, 0.25)' },
  rose: { primary: '#f43f5e', bgGlow: 'rgba(244, 63, 94, 0.25)' },
  indigo: { primary: '#6366f1', bgGlow: 'rgba(99, 102, 241, 0.25)' },
  crimson: { primary: '#efde44', bgGlow: 'rgba(239, 222, 68, 0.25)' },
  lime: { primary: '#84cc16', bgGlow: 'rgba(132, 204, 22, 0.25)' },
};

// 🔧 Helpers para asegurar que las URLs de embed carguen correctamente en los iFrames
const formatearSpotifyEmbed = (url: string | null): string | null => {
  if (!url) return null;
  if (url.includes('/embed/')) return url;
  return url.replace('spotify.com/', 'spotify.com/embed/');
};

const formatearYouTubeEmbed = (url: string | null): string | null => {
  if (!url) return null;
  if (url.includes('/embed/')) return url;
  
  // Manejo de URLs cortas tu.be o de watch?v=
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);

  return (match && match[2].length === 11) 
    ? `https://www.youtube.com/embed/${match[2]}`
    : url;
};

interface Integrante {
  id: string;
  nombre: string;
  instrumento: string | null;
  instagram_url: string | null;
  foto_url: string | null;
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
  historia: string | null;
  instagram_url: string | null;
  foto_portada: string | null;
  tema_color?: string | null;
  integrantes: Integrante[];
  canciones?: Cancion[];
}

interface DetalleBandaProps {
  bandaId: string;
  onVolver: () => void;
  onSeleccionarBanda?: (id: string) => void;
}

export default function DetalleBanda({ 
  bandaId, 
  onVolver, 
  onSeleccionarBanda 
}: DetalleBandaProps) {
  const [banda, setBanda] = useState<BandaCompleta | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerDatosBanda = async () => {
      setCargando(true);
      try {
        const { data, error } = await supabase
          .from('bandas')
          .select(`
            id, nombre, genero, historia, instagram_url, foto_portada, tema_color,
            integrantes ( id, nombre, instrumento, instagram_url, foto_url ),
            canciones ( id, titulo, spotify_embed_url, youtube_embed_url )
          `)
          .eq('id', bandaId)
          .single();

        if (error) throw error;
        setBanda(data as unknown as BandaCompleta);
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error('Error al cargar detalle de la banda:', err.message);
        } else {
          console.error('Error desconocido al cargar detalle de la banda:', err);
        }
      } finally {
        setCargando(false);
      }
    };

    if (bandaId) obtenerDatosBanda();
  }, [bandaId]);

  if (cargando) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[350px]">
        <p className="text-muted-foreground font-medium animate-pulse text-lg tracking-wider">
          Sincronizando legajo de la banda...
        </p>
      </div>
    );
  }

  if (!banda) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground italic">No se encontró la banda seleccionada.</p>
        <button
          onClick={onVolver}
          className="px-4 py-2 bg-card border border-border rounded-xl text-xs font-bold uppercase tracking-wider text-white hover:border-primary transition-colors cursor-pointer"
        >
          ← Volver al Catálogo
        </button>
      </div>
    );
  }

  const temaActivo = TEMAS_MAPA[banda.tema_color || 'purple'] || TEMAS_MAPA.purple;

  return (
    <div className="relative w-full max-w-4xl mx-auto space-y-10 py-4 text-foreground">
      
      {/* Resplandor ambiental */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] blur-[130px] pointer-events-none opacity-30 z-0"
        style={{ backgroundColor: temaActivo.bgGlow }}
      />

      <div className="relative z-10 space-y-8">
        
        {/* Botón Volver */}
        <button
          onClick={onVolver}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-white transition-colors bg-card/60 border border-border/80 px-4 py-2 rounded-xl backdrop-blur-md hover:border-primary/50 cursor-pointer"
        >
          ← Volver al Catálogo
        </button>

        {/* Portada Principal */}
        <div
          className="relative rounded-2xl overflow-hidden min-h-[280px] md:min-h-[340px] bg-card border border-border/80 flex flex-col justify-end p-6 md:p-8 shadow-xl"
          style={{
            backgroundImage: banda.foto_portada
              ? `linear-gradient(to top, rgba(10, 10, 12, 0.95), rgba(10, 10, 12, 0.2)), url(${banda.foto_portada})`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="space-y-2">
            <div>
              <span
                className="inline-block text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-md border border-border/60 bg-black/60 shadow-sm"
                style={{ color: temaActivo.primary }}
              >
                {banda.genero}
              </span>
            </div>

            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white drop-shadow-md">
              {banda.nombre}
            </h2>

            {banda.instagram_url && (
              <a
                href={banda.instagram_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-pink-400 hover:text-pink-300 transition-colors pt-2"
              >
                📸 Instagram de la Banda
              </a>
            )}
          </div>
        </div>

        {/* Biografía */}
        <section className="bg-card/40 border border-border/80 p-6 md:p-8 rounded-2xl backdrop-blur-md shadow-lg space-y-3">
          <h3
            className="text-xs font-bold uppercase tracking-widest pb-2 border-b border-border/60"
            style={{ color: temaActivo.primary }}
          >
            Biografía / Historia
          </h3>
          <p className="text-slate-200 leading-relaxed text-justify whitespace-pre-line text-sm md:text-base">
            {banda.historia || 'Esta banda aún no tiene una biografía cargada.'}
          </p>
        </section>

        {/* Integrantes */}
        <section className="space-y-4">
          <h3
            className="text-xs font-bold uppercase tracking-widest pb-2 border-b border-border/60"
            style={{ color: temaActivo.primary }}
          >
            👥 Integrantes
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {banda.integrantes && banda.integrantes.length > 0 ? (
              banda.integrantes.map((musico) => (
                <div
                  key={musico.id}
                  className="bg-card/40 border border-border/80 p-5 rounded-xl backdrop-blur-sm flex flex-col items-center text-center space-y-3 hover:border-border transition-colors"
                >
                  <img
                    src={musico.foto_url || 'https://via.placeholder.com/150'}
                    alt={musico.nombre}
                    className="w-20 h-20 rounded-full object-cover border-2 border-border shadow-md bg-muted"
                  />
                  <div>
                    <h4 className="font-bold text-white text-base">{musico.nombre}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {musico.instrumento || 'Músico'}
                    </p>
                  </div>

                  {musico.instagram_url && (
                    <a
                      href={musico.instagram_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-sky-400 hover:underline inline-flex items-center gap-1 pt-1"
                    >
                      🔗 Ver Red Social
                    </a>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic col-span-full">
                No se cargaron los integrantes de esta banda.
              </p>
            )}
          </div>
        </section>

        {/* Canciones / Material Audiovisual */}
        {banda.canciones && banda.canciones.length > 0 && (
          <section className="space-y-6">
            <h3
              className="text-xs font-bold uppercase tracking-widest pb-2 border-b border-border/60"
              style={{ color: temaActivo.primary }}
            >
              🎧 Material Audiovisual
            </h3>

            <div className="space-y-6">
              {banda.canciones.map((cancion) => {
                const spotifyEmbed = formatearSpotifyEmbed(cancion.spotify_embed_url);
                const youtubeEmbed = formatearYouTubeEmbed(cancion.youtube_embed_url);

                return (
                  <div
                    key={cancion.id}
                    className="bg-card/40 border border-border/80 p-5 md:p-6 rounded-2xl backdrop-blur-sm space-y-4"
                  >
                    <h4 className="font-bold text-lg text-white">{cancion.titulo}</h4>

                    {/* Spotify Embed */}
                    {spotifyEmbed && (
                      <div className="rounded-xl overflow-hidden shadow-md">
                        <iframe
                          src={spotifyEmbed}
                          width="100%"
                          height="152"
                          allow="encrypted-media"
                          className="border-0 w-full"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* YouTube Embed */}
                    {youtubeEmbed && (
                      <div className="rounded-xl overflow-hidden aspect-video w-full shadow-md">
                        <iframe
                          src={youtubeEmbed}
                          width="100%"
                          height="100%"
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          loading="lazy"
                        />
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