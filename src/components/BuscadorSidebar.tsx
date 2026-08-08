import { Radio, ExternalLink, Search } from 'lucide-react';

interface BuscadorSidebarProps {
  busqueda: string;
  onBusquedaChange: (val: string) => void;
  generosDisponibles: string[];
  generoFiltro: string;
  onGeneroChange: (gen: string) => void;
}

const RADIOS_PATROCINADORAS = [
  {
    id: 'rad-1',
    nombre: 'Radio Rock & Pop Local',
    frecuencia: 'FM 98.5',
    slogan: 'La voz del rock independiente',
    url: 'https://ejemplo.com',
  },
  {
    id: 'rad-2',
    nombre: 'Estación Cultural',
    frecuencia: 'FM 102.1',
    slogan: 'Apoyando la música local',
    url: 'https://ejemplo.com',
  },
];

export function BuscadorSidebar({
  busqueda,
  onBusquedaChange,
  generosDisponibles,
  generoFiltro,
  onGeneroChange,
}: BuscadorSidebarProps) {
  return (
    <aside className="w-full md:w-80 bg-card/40 border-b md:border-b-0 md:border-r border-border/60 p-4 md:p-6 flex flex-col gap-6 shrink-0 md:h-full overflow-x-hidden md:overflow-y-auto">
      
      {/* CARD UNIFICADA: Búsqueda + Radios Amigas */}
      <div className="bg-card/60 border border-border/80 rounded-2xl p-4 md:p-5 shadow-lg flex flex-col gap-5 backdrop-blur-md">
        
        {/* 1. SECCIÓN BÚSQUEDA */}
        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-primary" />
            <span>Explorar</span>
          </h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar banda o género..."
              value={busqueda}
              onChange={(e) => onBusquedaChange(e.target.value)}
              className="w-full bg-background/80 border border-border/80 rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Separador Elegante */}
        <hr className="border-t border-border/50" />

        {/* 2. SECCIÓN PUBLICIDAD DE RADIOS */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Radios Amigas</span>
            </h2>
            <span className="text-[9px] uppercase tracking-widest text-amber-400/70 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Sponsors
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {RADIOS_PATROCINADORAS.map((radio) => (
              <a
                key={radio.id}
                href={radio.url}
                target="_blank"
                rel="noreferrer"
                className="group bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/20 hover:border-amber-500/40 p-3 rounded-xl transition-all duration-200 flex items-center justify-between gap-2.5 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition-colors truncate">
                      {radio.nombre}
                    </span>
                    <span className="text-[9px] font-black text-amber-400 shrink-0 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                      {radio.frecuencia}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {radio.slogan}
                  </p>
                </div>

                <ExternalLink className="w-3.5 h-3.5 text-amber-400/60 group-hover:text-amber-300 shrink-0 transition-colors" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* SECCIÓN INDEPENDIENTE: LISTA DE GÉNEROS */}
      {generosDisponibles.length > 1 && (
        <div className="flex flex-col gap-2.5">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground px-1">
            Filtrar por Género
          </h2>
          
          <div className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none">
            {generosDisponibles.map((gen) => (
              <button
                key={gen}
                type="button"
                onClick={() => onGeneroChange(gen)}
                className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 text-left ${
                  generoFiltro === gen
                    ? 'bg-primary text-primary-foreground shadow-md scale-[1.01]'
                    : 'bg-card/40 border border-border/60 text-muted-foreground hover:text-white hover:bg-card/80'
                }`}
              >
                {gen}
              </button>
            ))}
          </div>
        </div>
      )}

    </aside>
  );
}