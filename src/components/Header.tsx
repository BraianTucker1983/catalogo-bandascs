interface HeaderProps {
  onNavegar: (destino: 'formulario' | 'editar' | 'admin' | 'catalogo') => void;
  vistaActual?: string;
}

export default function Header({ onNavegar, vistaActual }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo / Identidad (Ir al inicio / Catálogo) */}
        <button 
          type="button"
          onClick={() => onNavegar('catalogo')}
          className="flex items-center gap-2 group cursor-pointer text-left focus:outline-none"
        >
          <span className="text-xl font-black uppercase tracking-wider text-white group-hover:text-slate-200 transition-colors">
            Catálogo de <span className="text-primary group-hover:brightness-110">Bandas</span>
          </span>
        </button>

        {/* Navegación con accesos directos */}
        <nav className="flex items-center gap-3 sm:gap-4">
          
          {/* Opción Secundaria: Editar / Modificar */}
          <button
            type="button"
            onClick={() => onNavegar('editar')}
            className={`hidden md:inline-flex text-xs font-medium transition-colors cursor-pointer px-2 py-1 ${
              vistaActual === 'editar'
                ? 'text-white'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            Modificar datos
          </button>

          {/* Botón Principal Llamativo: Formulario de Inscripción */}
          <button
            type="button"
            onClick={() => onNavegar('formulario')}
            className="relative p-[1.5px] rounded-full bg-gradient-to-r from-primary via-emerald-400 to-primary transition-all hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-primary/20 cursor-pointer"
          >
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-background text-white font-bold text-xs uppercase tracking-wider hover:bg-background/80 transition-colors">
              <span className="animate-bounce">🎸</span>
              <span>Inscribir Banda</span>
            </div>
          </button>

        </nav>

      </div>
    </header>
  );
}