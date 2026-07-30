import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

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

export interface BandaResumen {
  id: string;
  nombre: string;
  genero?: string | null;
  historia?: string | null;
  foto_portada?: string | null;
  tema_color?: string | null;
}

interface CatalogoBandasProps {
  onSeleccionarBanda: (id: string) => void;
  onNuevaBanda: () => void;
}

export default function CatalogoBandas({
  onSeleccionarBanda,
  onNuevaBanda,
}: CatalogoBandasProps) {
  const [bandas, setBandas] = useState<BandaResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [generoFiltro, setGeneroFiltro] = useState<string>('todos');

  useEffect(() => {
    async function cargarBandas() {
      try {
        setCargando(true);
        const { data, error } = await supabase
          .from('bandas')
          .select('id, nombre, genero, historia, foto_portada, tema_color')
          .order('nombre', { ascending: true });

        if (error) throw error;
        setBandas(data || []);
      } catch (err) {
        console.error('Error al cargar catálogo de bandas:', err);
      } finally {
        setCargando(false);
      }
    }
    cargarBandas();
  }, []);

  const generosDisponibles = useMemo(() => {
    const lista = bandas
      .map((b) => b.genero?.trim())
      .filter((g): g is string => Boolean(g));
    return ['todos', ...Array.from(new Set(lista))];
  }, [bandas]);

  const bandasFiltradas = useMemo(() => {
    return bandas.filter((banda) => {
      const coincideBusqueda =
        banda.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (banda.genero && banda.genero.toLowerCase().includes(busqueda.toLowerCase()));

      const coincideGenero =
        generoFiltro === 'todos' ||
        banda.genero?.toLowerCase() === generoFiltro.toLowerCase();

      return coincideBusqueda && coincideGenero;
    });
  }, [bandas, busqueda, generoFiltro]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">
            Catálogo de Bandas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Explora las bandas registradas, escucha su música y conoce a sus integrantes.
          </p>
        </div>        
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <input
          type="text"
          placeholder="Buscar por nombre o género..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full md:w-80 bg-card/60 border border-border/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
        />

        {generosDisponibles.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {generosDisponibles.map((gen) => (
              <button
                key={gen}
                type="button"
                onClick={() => setGeneroFiltro(gen)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                  generoFiltro === gen
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card/60 border border-border/80 text-muted-foreground hover:text-white'
                }`}
              >
                {gen}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Listado / Grid */}
      {cargando ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            Cargando catálogo...
          </p>
        </div>
      ) : bandasFiltradas.length === 0 ? (
        <div className="text-center py-16 bg-card/20 border border-border/60 rounded-2xl space-y-2">
          <p className="text-white font-medium">No se encontraron bandas.</p>
          <p className="text-xs text-muted-foreground">
            Intenta cambiar el término de búsqueda o agrega una nueva banda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bandasFiltradas.map((banda) => {
            const colorTema =
              TEMAS_MAPA[banda.tema_color?.toLowerCase() || 'purple'] ||
              TEMAS_MAPA.purple;

            return (
              <div
                key={banda.id}
                onClick={() => onSeleccionarBanda(banda.id)}
                className="group bg-card/40 border border-border/80 rounded-2xl overflow-hidden backdrop-blur-sm hover:border-primary/60 transition-all duration-300 flex flex-col justify-between cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-1"
              >
                <div>
                  <div className="relative w-full h-48 bg-slate-950 overflow-hidden">
                    {banda.foto_portada ? (
                      <img
                        src={banda.foto_portada}
                        alt={banda.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs uppercase font-bold tracking-wider">
                        Sin Portada
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
                  </div>

                  <div className="p-5 space-y-3">
                    {banda.genero && (
                      <span
                        className="inline-block text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border bg-card/80"
                        style={{ color: colorTema, borderColor: `${colorTema}50` }}
                      >
                        {banda.genero}
                      </span>
                    )}
                    <h3 className="text-xl font-black uppercase tracking-tight text-white group-hover:text-primary transition-colors">
                      {banda.nombre}
                    </h3>
                    {banda.historia && (
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {banda.historia}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div
                    className="w-full py-2.5 text-center text-xs font-bold uppercase tracking-wider rounded-xl border border-border/80 group-hover:border-primary/50 text-white transition-colors"
                    style={{ backgroundColor: `${colorTema}15` }}
                  >
                    Ver Legajo Completo →
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}