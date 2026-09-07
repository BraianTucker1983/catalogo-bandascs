import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { BuscadorSidebar } from './BuscadorSidebar';

const TEMAS_MAPA: Record<string, string> = {
  purple: '#a855f7',
  emerald: '#10b981',
  amber: '#f59e0b',
  cyan: '#06b6d4',
  rose: '#f43f5e',
  indigo: '#6366f1',
  crimson: '#dc2626',
  lime: '#84cc16',
};

function asegurarContrasteOscuro(hexColor?: string | null, defaultColor = '#6366f1'): string {
  if (!hexColor) return defaultColor;
  let hex = hexColor.trim();
  if (!hex.startsWith('#')) return hexColor;
  
  if (hex.length === 4) {
    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  if (hex.length !== 7) return defaultColor;

  const r = parseInt(hex.substring(1, 3), 16) || 0;
  const g = parseInt(hex.substring(3, 5), 16) || 0;
  const b = parseInt(hex.substring(5, 7), 16) || 0;

  const yiq = (r * 299 + g * 587 + b * 114) / 1000;

  if (yiq < 130) {
    const aclarar = (v: number) => Math.min(255, Math.round(v + (255 - v) * 0.65));
    const newR = aclarar(r).toString(16).padStart(2, '0');
    const newG = aclarar(g).toString(16).padStart(2, '0');
    const newB = aclarar(b).toString(16).padStart(2, '0');
    return `#${newR}${newG}${newB}`;
  }

  return hex;
}

export interface BandaResumen {
  id: string;
  nombre: string;
  genero?: string | null;
  bio?: string | null;
  historia?: string | null;
  url_portada?: string | null;
  color_tema?: string | null;
  aprobado?: boolean | null;
}

interface CatalogoBandasProps {
  onSeleccionarBanda: (id: string) => void;
  onNuevaBanda?: () => void;
}

export default function CatalogoBandas({
  onSeleccionarBanda,
  onNuevaBanda,
}: CatalogoBandasProps) {
  const [bandas, setBandas] = useState<BandaResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorQuery, setErrorQuery] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [generoFiltro, setGeneroFiltro] = useState<string>('todos');

  useEffect(() => {
    let cancelado = false;

    async function cargarBandas() {
      try {
        setCargando(true);
        setErrorQuery(null);

        // Trae únicamente las bandas aprobadas por el administrador
        const { data, error } = await supabase
          .from('bandas')
          .select('id, nombre, genero, bio, historia, url_portada, color_tema, aprobado')
          .eq('aprobado', true)
          .order('nombre', { ascending: true });

        if (error) throw error;

        if (!cancelado) {
          setBandas(data || []);
        }
      } catch (err) {
        if (!cancelado) {
          const msg = err instanceof Error ? err.message : 'Error al cargar catálogo.';
          console.error('Error:', msg);
          setErrorQuery(msg);
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    cargarBandas();

    return () => {
      cancelado = true;
    };
  }, []);

  const generosDisponibles = useMemo(() => {
    const generosSet = new Set<string>();

    bandas.forEach((b) => {
      if (b.genero) {
        const generosIndividuales = b.genero
          .split(/[\/,|-]/)
          .map((g) => g.trim().toLowerCase())
          .filter(Boolean);

        generosIndividuales.forEach((g) => generosSet.add(g));
      }
    });

    return ['todos', ...Array.from(generosSet)];
  }, [bandas]);

  const bandasFiltradas = useMemo(() => {
    return bandas.filter((banda) => {
      const coincideBusqueda =
        banda.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (banda.genero && banda.genero.toLowerCase().includes(busqueda.toLowerCase()));

      const coincideGenero =
        generoFiltro === 'todos' ||
        (banda.genero &&
          banda.genero
            .toLowerCase()
            .split(/[\/,|-]/)
            .map((g) => g.trim())
            .includes(generoFiltro.toLowerCase()));

      return coincideBusqueda && coincideGenero;
    });
  }, [bandas, busqueda, generoFiltro]);

  return (
    <div className="w-full flex flex-col bg-background text-foreground rounded-2xl border border-border/40 overflow-hidden shadow-xl">
      <header className="shrink-0 border-b border-border/60 bg-card/20 px-6 py-4 flex items-center justify-between z-10">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-white">
            Catálogo de Bandas
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Explora las bandas registradas, escucha su música y conoce a sus integrantes.
          </p>
        </div>
        {onNuevaBanda && (
          <button
            onClick={onNuevaBanda}
            className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
          >
            + Nueva Banda
          </button>
        )}
      </header>

      <div className="flex flex-col md:flex-row min-h-[500px]">
        <BuscadorSidebar
          busqueda={busqueda}
          onBusquedaChange={setBusqueda}
          generosDisponibles={generosDisponibles}
          generoFiltro={generoFiltro}
          onGeneroChange={setGeneroFiltro}
        />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {cargando ? (
            <div className="min-h-[300px] flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                Cargando catálogo...
              </p>
            </div>
          ) : errorQuery ? (
            <div className="text-center py-12 px-4 bg-destructive/10 border border-destructive/30 rounded-2xl space-y-3 max-w-md mx-auto">
              <p className="text-destructive font-bold text-sm">Error al consultar Supabase</p>
              <p className="text-xs text-muted-foreground font-mono bg-black/40 p-3 rounded-lg text-left break-words">
                {errorQuery}
              </p>
            </div>
          ) : bandasFiltradas.length === 0 ? (
            <div className="text-center py-16 bg-card/20 border border-border/60 rounded-2xl space-y-2">
              <p className="text-white font-medium">No se encontraron bandas aprobadas.</p>
              <p className="text-xs text-muted-foreground">
                Si acabas de registrar una banda, requiere la aprobación de un administrador para figurar en la lista.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto">
              {bandasFiltradas.map((banda) => {
                const rawColor = banda.color_tema || '#6366f1';
                const baseColor = rawColor.startsWith('#')
                  ? rawColor
                  : TEMAS_MAPA[rawColor.toLowerCase()] || '#6366f1';
                
                const colorHex = asegurarContrasteOscuro(baseColor);
                const textoTarjeta = banda.bio || banda.historia;

                return (
                  <div
                    key={banda.id}
                    onClick={() => onSeleccionarBanda(banda.id)}
                    className="group bg-card/40 border border-border/80 rounded-2xl overflow-hidden backdrop-blur-sm hover:border-primary/60 transition-all duration-300 flex flex-col sm:flex-row items-center cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-0.5"
                  >
                    <div className="relative w-full sm:w-40 h-36 sm:h-36 bg-slate-950 overflow-hidden shrink-0">
                      {banda.url_portada ? (
                        <img
                          src={banda.url_portada}
                          alt={banda.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs uppercase font-bold tracking-wider">
                          Sin Portada
                        </div>
                      )}
                    </div>

                    <div className="p-5 space-y-2 flex-1 w-full">
                      {banda.genero && (
                        <span
                          className="inline-block text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border bg-card/80"
                          style={{ color: colorHex, borderColor: `${colorHex}60` }}
                        >
                          {banda.genero}
                        </span>
                      )}
                      <h3 className="text-lg font-black uppercase tracking-tight text-white group-hover:text-primary transition-colors">
                        {banda.nombre}
                      </h3>

                      {textoTarjeta && (
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                          {textoTarjeta}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}