import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface Banda {
  id: string | number;
  nombre?: string | null;
  genero?: string | null;
  historia?: string | null;
  foto_portada?: string | null;
  instagram_url?: string | null;
  tema_color?: string | null;
}

interface ListaBandasProps {
  onSeleccionarBanda: (id: string) => void;
}

export default function ListaBandas({ onSeleccionarBanda }: ListaBandasProps) {
  const [bandas, setBandas] = useState<Banda[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    const obtenerBandas = async () => {
      try {
        setCargando(true);
        setErrorMsg(null);

        const { data, error } = await supabase
          .from('bandas')
          .select('*')
          .order('nombre', { ascending: true });

        if (error) {
          console.error('Error Supabase ListaBandas:', error);
          throw new Error(error.message);
        }

        if (!cancelado) {
          setBandas(data || []);
        }
      } catch (err: unknown) {
        if (!cancelado) {
          const mensaje = err instanceof Error ? err.message : String(err);
          setErrorMsg('No se pudieron obtener las bandas del catálogo.');
          console.error('Error detallado:', mensaje);
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    };

    obtenerBandas();

    return () => {
      cancelado = true;
    };
  }, []);

  const handleSeleccionar = (id: string | number) => {
    if (id !== undefined && id !== null && onSeleccionarBanda) {
      onSeleccionarBanda(String(id));
    }
  };

  if (cargando) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[300px] gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse text-sm uppercase tracking-wider">
          Cargando catálogo de bandas...
        </p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-md mx-auto my-10 p-6 rounded-xl border border-destructive/30 bg-destructive/10 text-center">
        <p className="text-destructive font-semibold text-sm mb-4">{errorMsg}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-white text-xs font-bold uppercase rounded-lg hover:opacity-90 transition-opacity"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (bandas.length === 0) {
    return (
      <div className="text-center py-16 px-4 border border-dashed border-border/40 rounded-xl">
        <p className="text-muted-foreground text-base italic">
          No hay bandas registradas en el catálogo aún.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <h2 className="text-2xl font-black uppercase tracking-wider text-white">
          <span className="text-primary">///</span> Artistas & Bandas
        </h2>
        <span className="text-xs font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full">
          {bandas.length} {bandas.length === 1 ? 'registrada' : 'registradas'}
        </span>
      </div>

      {/* Grid de Tarjetas de Bandas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {bandas.map((banda, idx) => {
          // Valores seguros defensivos
          const nombreBanda = banda.nombre || 'Sin nombre';
          const inicial = nombreBanda.charAt(0).toUpperCase();
          const tieneFoto = typeof banda.foto_portada === 'string' && banda.foto_portada.trim().length > 0;
          const keyUnica = banda.id ? String(banda.id) : `banda-${idx}`;

          return (
            <article
              key={keyUnica}
              onClick={() => handleSeleccionar(banda.id)}
              className="group relative rounded-2xl border border-border/50 bg-card overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer flex flex-col"
            >
              {/* Cabecera / Imagen de Portada */}
              <div className="relative h-44 w-full bg-muted/40 overflow-hidden">
                {tieneFoto ? (
                  <img
                    src={banda.foto_portada!}
                    alt={nombreBanda}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-card">
                    <span className="text-4xl font-black text-primary/40 uppercase">
                      {inicial}
                    </span>
                  </div>
                )}

                {/* Tag de Género */}
                {banda.genero && (
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white bg-black/60 backdrop-blur px-2.5 py-1 rounded-md border border-white/10">
                      {banda.genero}
                    </span>
                  </div>
                )}
              </div>

              {/* Contenido de la Tarjeta */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors line-clamp-1">
                    {nombreBanda}
                  </h3>
                  {banda.historia && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
                      {banda.historia}
                    </p>
                  )}
                </div>

                {/* Botón de Selección con Click Directo */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSeleccionar(banda.id);
                  }}
                  className="w-full pt-2 border-t border-border/30 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-primary hover:text-white transition-colors cursor-pointer"
                >
                  <span>Ver legajo completo</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}