import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface Banda {
  id: string | number;
  nombre?: string | null;
  genero?: string | null;
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
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    let cancelado = false;

    const obtenerBandas = async () => {
      try {
        setCargando(true);
        setErrorMsg(null);

        // Consulta optimizada ultraligera
        const { data, error } = await supabase
          .from('bandas')
          .select('id, nombre, genero, foto_portada')
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

  // Filtrado reactivo en tiempo real por Nombre o Género/Estilo
  const bandasFiltradas = useMemo(() => {
    const query = busqueda.trim().toLowerCase();
    if (!query) return bandas;

    return bandas.filter((banda) => {
      const nombre = (banda.nombre || '').toLowerCase();
      const genero = (banda.genero || '').toLowerCase();
      return nombre.includes(query) || genero.includes(query);
    });
  }, [bandas, busqueda]);

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
          className="px-4 py-2 bg-primary text-white text-xs font-bold uppercase rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
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
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Encabezado del catálogo con Contador */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <h2 className="text-2xl font-black uppercase tracking-wider text-white">
          <span className="text-primary">///</span> Artistas & Bandas
        </h2>
        <span className="self-start sm:self-auto text-xs font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full">
          {bandasFiltradas.length} {bandasFiltradas.length === 1 ? 'resultado' : 'resultados'}
        </span>
      </div>

      {/* Input del Buscador */}
      <div className="relative">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre de banda o estilo musical..."
          className="w-full bg-card/60 border border-border/70 rounded-xl px-4 py-3 pl-11 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors backdrop-blur-md shadow-sm"
        />
        {/* Ícono de Lupa */}
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-base">
          🔍
        </span>

        {/* Botón para limpiar búsqueda */}
        {busqueda && (
          <button
            type="button"
            onClick={() => setBusqueda('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-white bg-muted/60 px-2 py-0.5 rounded-md transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Lista de Resultados */}
      {bandasFiltradas.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-border/40 rounded-xl space-y-2">
          <p className="text-white font-medium">No se encontraron bandas</p>
          <p className="text-muted-foreground text-xs">
            No coinciden bandas con la búsqueda "{busqueda}".
          </p>
        </div>
      ) : (
        <div className="flex flex-col space-y-6">
          {bandasFiltradas.map((banda, idx) => {
            const nombreBanda = banda.nombre || 'Sin nombre';
            const inicial = nombreBanda.charAt(0).toUpperCase();
            const tieneFoto =
              typeof banda.foto_portada === 'string' && banda.foto_portada.trim().length > 0;
            const keyUnica = banda.id ? String(banda.id) : `banda-${idx}`;

            return (
              <article
                key={keyUnica}
                onClick={() => handleSeleccionar(banda.id)}
                className="group relative rounded-2xl border border-border/50 bg-card overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between h-[400px]"
              >
                {/* Cabecera / Contenedor con ALTURA UNIFORME FIJA (h-64) */}
                <div className="relative w-full h-64 bg-slate-950/80 overflow-hidden flex items-center justify-center p-4">
                  {tieneFoto ? (
                    <>
                      {/* Fondo desenfocado de relleno ambiental */}
                      <img
                        src={banda.foto_portada!}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover opacity-20 blur-xl pointer-events-none scale-125"
                      />

                      {/* Imagen principal: object-contain para mostrarla 100% ENTERA sin cortar bordes */}
                      <img
                        src={banda.foto_portada!}
                        alt={nombreBanda}
                        loading="lazy"
                        decoding="async"
                        className="relative z-10 max-w-full max-h-full object-contain rounded-lg drop-shadow-md group-hover:scale-102 transition-transform duration-300"
                      />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-card">
                      <span className="text-5xl font-black text-primary/40 uppercase">
                        {inicial}
                      </span>
                    </div>
                  )}
                </div>

                {/* Pie / Contenido de la Tarjeta */}
                <div className="p-5 flex flex-col justify-between flex-1 space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors line-clamp-1">
                      {nombreBanda}
                    </h3>

                    {/* Tag de Género */}
                    {banda.genero && (
                      <div>
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-md border border-border/40">
                          {banda.genero}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border/30 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-primary group-hover:text-white transition-colors">
                    <span>Ver legajo completo</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}