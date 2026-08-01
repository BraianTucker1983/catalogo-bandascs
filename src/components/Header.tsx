import { useState } from 'react';
import { Menu, X, Edit3, Disc } from 'lucide-react';

interface HeaderProps {
  onNavegar: (destino: 'formulario' | 'editar' | 'admin' | 'catalogo') => void;
  vistaActual?: string;
}

export default function Header({ onNavegar, vistaActual }: HeaderProps) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const handleNavegacionMobile = (destino: 'formulario' | 'editar' | 'admin' | 'catalogo') => {
    onNavegar(destino);
    setMenuAbierto(false); // Cierra el menú al hacer clic en una opción
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo / Identidad */}
        <button 
          type="button"
          onClick={() => handleNavegacionMobile('catalogo')}
          className="flex items-center gap-3 group cursor-pointer text-left focus:outline-none"
        >
          {/* Renderizado de tu logo de Canva */}
          <img 
            src="./public/logo.png" 
            alt="Catálogo de Bandas" 
            className="h-16 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
          />          
        </button>

        {/* --- NAVEGACIÓN EN PANTALLAS GRANDES (md en adelante) --- */}
        <nav className="hidden md:flex items-center gap-3">
          
          {/* Botón 1: Modificar Datos (Misma estética con degradado) */}
          <button
            type="button"
            onClick={() => onNavegar('editar')}
            className={`relative p-[1.5px] rounded-full bg-gradient-to-r from-primary via-emerald-400 to-primary transition-all hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-primary/20 cursor-pointer ${
              vistaActual === 'editar' ? 'ring-2 ring-emerald-400/50' : ''
            }`}
          >
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-background text-white font-bold text-xs uppercase tracking-wider hover:bg-background/80 transition-colors">
              <Edit3 className="w-3.5 h-3.5 text-primary" />
              <span>Modificar Datos</span>
            </div>
          </button>

          {/* Botón 2: Inscribir Banda */}
          <button
            type="button"
            onClick={() => onNavegar('formulario')}
            className={`relative p-[1.5px] rounded-full bg-gradient-to-r from-primary via-emerald-400 to-primary transition-all hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-primary/20 cursor-pointer ${
              vistaActual === 'formulario' ? 'ring-2 ring-emerald-400/50' : ''
            }`}
          >
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-background text-white font-bold text-xs uppercase tracking-wider hover:bg-background/80 transition-colors">
              <span className="animate-bounce">🎸</span>
              <span>Inscribir Banda</span>
            </div>
          </button>

        </nav>

        {/* --- BOTÓN HAMBURGUESA EN TELÉFONOS (se oculta en md) --- */}
        <div className="flex items-center md:hidden">
          <button
            type="button"
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="p-2 text-slate-300 hover:text-white rounded-lg focus:outline-none cursor-pointer"
            aria-label="Abrir menú"
          >
            {menuAbierto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* --- MENÚ DESPLEGABLE MOBILE --- */}
      {menuAbierto && (
        <div className="md:hidden border-b border-border bg-slate-900/95 backdrop-blur-lg px-4 pt-3 pb-5 space-y-3 shadow-2xl animate-in slide-in-from-top-2">
          
          <button
            type="button"
            onClick={() => handleNavegacionMobile('catalogo')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              vistaActual === 'catalogo' ? 'bg-primary/20 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Disc className="w-4 h-4 text-primary" />
            Catálogo de Bandas
          </button>

          <button
            type="button"
            onClick={() => handleNavegacionMobile('editar')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-primary/40 bg-slate-800/80 text-white font-bold text-xs uppercase tracking-wider shadow-lg cursor-pointer hover:bg-slate-800"
          >
            <Edit3 className="w-4 h-4 text-primary" />
            <span>Modificar Datos</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavegacionMobile('formulario')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg cursor-pointer"
          >
            <span>🎸</span>
            <span>Inscribir Banda</span>
          </button>

        </div>
      )}
    </header>
  );
}