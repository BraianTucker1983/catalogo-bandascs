import { useState } from 'react';
import { Edit3 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface FooterProps {
  isAdmin: boolean;
  onLogout: () => void;
  onNavegar: (destino: 'formulario' | 'editar' | 'admin' | 'catalogo') => void;
  mostrarDebug?: boolean;
  setMostrarDebug?: (valor: boolean) => void;
  testError?: string | boolean | null;
  testCount?: number | null;
}

export default function Footer({
  isAdmin,
  onLogout,
  onNavegar,
  mostrarDebug = false,
  setMostrarDebug,
  testError,
  testCount,
}: FooterProps) {
  return (
    <footer className="w-full bg-card/60 backdrop-blur-md border-t border-border mt-20 text-muted-foreground relative z-20">
      {/* Glow decorativo superior */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">

          {/* Columna 1: Identidad del proyecto */}
          <div className="space-y-3">
            <button 
              type="button"
              onClick={() => onNavegar('catalogo')}
              className="flex items-center gap-3 group cursor-pointer text-left focus:outline-none"
            >
              <img 
                src={`${import.meta.env.BASE_URL}logo.png`} 
                alt="Catálogo de Bandas" 
                className="h-20 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
              />        
            </button>
            <p className="text-xs leading-relaxed text-muted-foreground max-w-sm">
              Archivo histórico y registro cultural de la escena musical de Coronel Suárez y toda la zona.
            </p>
          </div>

          {/* Columna 2: Registro e Interacción para Bandas */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">
              ¿Tenés una banda?
            </h4>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Sumá tu banda al registro público.
            </p>
            <div className="flex flex-col gap-2 items-start">
              <button
                type="button"
                onClick={() => onNavegar('formulario')}
                className="relative p-[1.5px] rounded-full bg-gradient-to-r from-primary via-emerald-400 to-primary transition-all hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-primary/20 cursor-pointer"
              >
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-background text-white font-bold text-xs uppercase tracking-wider hover:bg-background/80 transition-colors">
                  <span className="animate-bounce">🎸</span>
                  <span>Inscribir mi Banda o modificar datos</span>
                </div>
              </button>              
            </div>
          </div>

          {/* Columna 3: Información cultural / Localidad */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">
              Escena Regional
            </h4>
            <p className="text-xs text-muted-foreground">
              Coronel Suárez, Buenos Aires.
            </p>
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Catálogo Activo
            </span>
          </div>

        </div>

        {/* Separador inferior */}
        <div className="border-t border-border/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">

          <p className="text-white/40">
            © {new Date().getFullYear()} Catálogo de Bandas. Todos los derechos reservados.
          </p>

          {/* Área sutil de Administración */}
          <div>
            {!isAdmin ? (
              <button
                type="button"
                onClick={() => onNavegar('admin')}
                className="text-white/30 hover:text-white/70 text-[11px] tracking-wide transition-colors cursor-pointer select-none"
              >
                Gestión de legajos
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-card/80 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                <button
                  type="button"
                  onClick={() => onNavegar('admin')}
                  className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5 hover:underline cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Panel Admin
                </button>

                {setMostrarDebug && (
                  <button
                    type="button"
                    onClick={() => setMostrarDebug(!mostrarDebug)}
                    className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors px-2 py-0.5 rounded border border-border/40 bg-background/50 cursor-pointer"
                    title="Alternar estado de conexión"
                  >
                    {testError ? '🔴 Error DB' : `🟢 DB: ${testCount ?? '...'}`}
                  </button>
                )}

                <button
                  type="button"
                  onClick={onLogout}
                  className="text-[10px] uppercase tracking-wider bg-destructive/20 text-destructive hover:bg-destructive hover:text-white px-2 py-0.5 rounded transition-all cursor-pointer font-bold"
                >
                  Salir
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </footer>
  );
}