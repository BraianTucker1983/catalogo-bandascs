import React from 'react';

interface BuscadorSidebarProps {
  busqueda: string;
  onBusquedaChange: (val: string) => void;
  generosDisponibles: string[];
  generoFiltro: string;
  onGeneroChange: (gen: string) => void;
}

export function BuscadorSidebar({
  busqueda,
  onBusquedaChange,
  generosDisponibles,
  generoFiltro,
  onGeneroChange,
}: BuscadorSidebarProps) {
  return (
    <aside className="w-full md:w-80 bg-card/40 border-b md:border-b-0 md:border-r border-border/60 p-4 md:p-6 flex flex-col gap-4 md:gap-6 shrink-0 md:h-full overflow-x-hidden md:overflow-y-auto">
      {/* Input de Búsqueda */}
      <div>
        <h2 className="hidden md:block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Buscar
        </h2>
        <input
          type="text"
          placeholder="Buscar banda o género..."
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
          className="w-full bg-card/60 border border-border/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Lista de Géneros */}
      {generosDisponibles.length > 1 && (
        <div className="flex flex-col gap-2">
          <h2 className="hidden md:block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
            Filtrar por Género
          </h2>
          
          {/* 
            EN MOBILE: Scroll horizontal suave (no ocupa espacio vertical).
            EN DESKTOP (md:): Columna vertical de botones.
          */}
          <div className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none">
            {generosDisponibles.map((gen) => (
              <button
                key={gen}
                type="button"
                onClick={() => onGeneroChange(gen)}
                className={`whitespace-nowrap px-3.5 py-1.5 md:py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                  generoFiltro === gen
                    ? 'bg-primary text-primary-foreground'
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