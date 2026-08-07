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

export interface BandaResumen {
  id: string;
  nombre: string;
  genero?: string | null;
  bio?: string | null;
  historia?: string | null;
  url_portada?: string | null;
  color_tema?: string | null;
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
  const [busqueda, setBusqueda] = useState('');
  const [generoFiltro, setGeneroFiltro] = useState<string>('todos');

  useEffect(() => {
    async function cargarBandas() {
      try {
        setCargando(true);
        const { data, error } = await supabase
          .from('bandas')
          .select('id, nombre, genero, bio, historia, url_portada, color_tema')
          .eq('aprobado', true)
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

  // Extrae y desduplica géneros individuales
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

  // Filtra por búsqueda o término exacto de género
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
    <div className="h-screen w-full flex flex-col bg-background text-foreground overflow-hidden">
      
      {/* Header Fijo Estilo Gmail */}
      <header className="shrink-0 border-b border-border/60 bg-card/20 px-6 py-4 flex items-center justify-between z-10">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">
            Catálogo de Bandas
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Explora las bandas registradas, escucha su música y conoce a sus integrantes.
          </p>
        </div>
        {onNuevaBanda && (
          <button
            onClick={onNuevaBanda}
            className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition-opacity"
          >
            + Nueva Banda
          </button>
        )}
      </header>

      {/* Estructura Central (Sidebar + Main) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Sidebar Fijo */}
        <BuscadorSidebar
          busqueda={busqueda}
          onBusquedaChange={setBusqueda}
          generosDisponibles={generosDisponibles}
          generoFiltro={generoFiltro}
          onGeneroChange={setGeneroFiltro}
        />

        {/* Sección de Cards con Scroll */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
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
                Intenta cambiar el término de búsqueda o aprueba las bandas desde el panel de administración.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto">
              {bandasFiltradas.map((banda) => {
                const colorHex =
                  banda.color_tema ||
                  TEMAS_MAPA[banda.color_tema?.toLowerCase() || 'indigo'] ||
                  '#6366f1';

                const textoTarjeta = banda.bio || banda.historia;

                return (
                  <div
                    key={banda.id}
                    onClick={() => onSeleccionarBanda(banda.id)}
                    className="group bg-card/40 border border-border/80 rounded-2xl overflow-hidden backdrop-blur-sm hover:border-primary/60 transition-all duration-300 flex flex-col sm:flex-row items-center cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-0.5"
                  >
                    {/* Portada compacta */}
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

                    {/* Contenido principal de la tarjeta */}
                    <div className="p-5 space-y-2 flex-1 w-full">
                      {banda.genero && (
                        <span
                          className="inline-block text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border bg-card/80"
                          style={{ color: colorHex, borderColor: `${colorHex}50` }}
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