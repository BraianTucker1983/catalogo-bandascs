import { useState } from 'react';
import { Radio, ExternalLink, Search, ChevronDown, ChevronUp, X } from 'lucide-react';

interface BuscadorSidebarProps {
  busqueda: string;
  onBusquedaChange: (val: string) => void;
  generosDisponibles: string[];
  generoFiltro: string;
  onGeneroChange: (gen: string) => void;
}

interface AnuncioRadio {
  id: string;
  nombre: string;
  frecuencia: string;
  slogan: string;
  url: string;
  imagenFondo?: string;
}

const RADIOS_PATROCINADORAS: AnuncioRadio[] = [
  {
    id: 'rad-1',
    nombre: 'Radio Rock & Pop Local',
    frecuencia: 'FM 98.5',
    slogan: 'La voz del rock independiente',
    url: 'https://ejemplo.com',
    imagenFondo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'rad-2',
    nombre: 'Estación Cultural',
    frecuencia: 'FM 102.1',
    slogan: 'Apoyando la música local',
    url: 'https://www.radiomega.fm/',
  },
];

export function BuscadorSidebar({
  busqueda,
  onBusquedaChange,
  generosDisponibles,
  generoFiltro,
  onGeneroChange,
}: BuscadorSidebarProps) {
  const [desplegarRadiosMobile, setDesplegarRadiosMobile] = useState(false);
  const [mostrarBuscadorMovil, setMostrarBuscadorMovil] = useState(false);

  return (
    <aside className="w-full md:w-80 bg-card/40 border-b md:border-b-0 md:border-r border-border/60 p-4 md:p-6 flex flex-col gap-4 md:gap-6 shrink-0 md:h-full overflow-x-hidden md:overflow-y-auto">
      
      {/* 1. PUBLICIDAD DE RADIOS (AHORA PRIMERO) */}

      {/* A) VERSIÓN MÓVIL (COMPACTA) */}
      <div className="block md:hidden bg-amber-500/5 border border-amber-500/20 rounded-xl p-2.5 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-xs font-bold text-amber-300">Radios Amigas</span>
            <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              {RADIOS_PATROCINADORAS.length}
            </span>
          </div>
          
          <button
            type="button"
            onClick={() => setDesplegarRadiosMobile(!desplegarRadiosMobile)}
            className="text-[11px] font-bold text-amber-400 flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded-lg transition-colors cursor-pointer"
          >
            {desplegarRadiosMobile ? 'Ocultar' : 'Escuchar'}
            {desplegarRadiosMobile ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Desplegable Móvil con Fondos */}
        {desplegarRadiosMobile && (
          <div className="flex flex-col gap-2 mt-3 pt-2.5 border-t border-amber-500/20 animate-in fade-in slide-in-from-top-1 duration-200">
            {RADIOS_PATROCINADORAS.map((radio) => (
              <a
                key={radio.id}
                href={radio.url}
                target="_blank"
                rel="noreferrer"
                className="relative overflow-hidden bg-amber-500/10 hover:bg-amber-500/20 p-2.5 rounded-xl flex items-center justify-between gap-2 transition-all border border-amber-500/30 group"
                style={
                  radio.imagenFondo
                    ? {
                        backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.75)), url(${radio.imagenFondo})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : undefined
                }
              >
                <div className="min-w-0 relative z-10">
                  <p className="text-xs font-bold text-white truncate drop-shadow">{radio.nombre}</p>
                  <p className="text-[10px] text-amber-300/90 drop-shadow">{radio.frecuencia} • {radio.slogan}</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-amber-400 shrink-0 relative z-10" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* B) VERSIÓN DESKTOP (TARJETA COMPLETA CON FONDOS) */}
      <div className="hidden md:flex bg-card/60 border border-border/80 rounded-2xl p-5 shadow-lg flex-col gap-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Radios Amigas</span>
          </h2>
          <span className="text-[9px] uppercase tracking-widest text-amber-400/70 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            Sponsors
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {RADIOS_PATROCINADORAS.map((radio) => (
            <a
              key={radio.id}
              href={radio.url}
              target="_blank"
              rel="noreferrer"
              className="group relative overflow-hidden bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/20 hover:border-amber-500/50 p-3.5 rounded-xl transition-all duration-300 flex items-center justify-between gap-2.5 shadow-md hover:shadow-amber-500/10 hover:-translate-y-0.5"
              style={
                radio.imagenFondo
                  ? {
                      backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.95) 20%, rgba(15, 23, 42, 0.7)), url(${radio.imagenFondo})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
            >
              <div className="min-w-0 flex-1 relative z-10">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate drop-shadow-md">
                    {radio.nombre}
                  </span>
                  <span className="text-[9px] font-black text-amber-400 shrink-0 bg-slate-950/80 px-1.5 py-0.5 rounded border border-amber-500/30 backdrop-blur-sm">
                    {radio.frecuencia}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 truncate mt-0.5 drop-shadow">
                  {radio.slogan}
                </p>
              </div>

              <ExternalLink className="w-3.5 h-3.5 text-amber-400/80 group-hover:text-amber-300 shrink-0 transition-colors relative z-10" />
            </a>
          ))}
        </div>
      </div>

      {/* 2. SECCIÓN DE BÚSQUEDA Y FILTROS */}
      <div className="relative flex flex-col gap-3">
        {/* Título en Desktop */}
        <h2 className="hidden md:flex text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-1 items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-primary" />
          <span>Explorar</span>
        </h2>

        {/* Botón Minimizado para Móvil */}
        {!mostrarBuscadorMovil && (
          <button
            type="button"
            onClick={() => setMostrarBuscadorMovil(true)}
            className="md:hidden flex items-center justify-between w-full bg-card/80 border border-border/80 rounded-xl px-3.5 py-2.5 text-sm text-muted-foreground hover:text-white hover:border-primary/50 transition-all shadow-inner cursor-pointer group"
            aria-label="Abrir búsqueda y filtros"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Search className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-medium text-muted-foreground group-hover:text-white truncate">
                {busqueda ? `"${busqueda}"` : 'Buscar o filtrar por género...'}
              </span>
            </div>

            {/* Badge de género seleccionado al estar minimizado */}
            {generoFiltro && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-md shrink-0 ml-2">
                {generoFiltro}
              </span>
            )}
          </button>
        )}

        {/* Input de Búsqueda */}
        <div className={`${mostrarBuscadorMovil ? 'block' : 'hidden'} md:block relative w-full animate-in fade-in slide-in-from-top-1 duration-200`}>
          <input
            type="text"
            placeholder="Buscar banda o género..."
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            className="w-full bg-card/80 border border-border/80 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-white placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
            autoFocus={mostrarBuscadorMovil}
          />
          
          {/* Botón para cerrar la búsqueda y filtros en móvil */}
          {mostrarBuscadorMovil && (
            <button
              type="button"
              onClick={() => setMostrarBuscadorMovil(false)}
              className="md:hidden absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white p-1 rounded-md hover:bg-card/80 transition-colors"
              aria-label="Cerrar búsqueda y filtros"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3. LISTA DE GÉNEROS */}
      {generosDisponibles.length > 1 && (
        <div className={`${mostrarBuscadorMovil ? 'flex' : 'hidden md:flex'} flex-col gap-2 md:gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200`}>
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground px-1">
            Filtrar por Género
          </h2>
          
          <div className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0 scrollbar-none">
            {generosDisponibles.map((gen) => (
              <button
                key={gen}
                type="button"
                onClick={() => onGeneroChange(gen)}
                className={`whitespace-nowrap px-3.5 py-1.5 md:py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 text-left ${
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