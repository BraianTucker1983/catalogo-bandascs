import { useState } from 'react';
import { Edit3 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface FooterProps {
  isAdmin: boolean;
  onLogout: () => void;
  onNavegar: (destino: 'formulario' | 'editar' | 'admin' | 'catalogo') => void;
  // Añadimos opcionalmente los estados de debug por si deseas pasárselos desde App.tsx
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
  const [mostrarLoginForm, setMostrarLoginForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorLogin, setErrorLogin] = useState<string | null>(null);

  const manejarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setErrorLogin(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setErrorLogin('Credenciales inválidas');
      } else {
        setMostrarLoginForm(false);
        setEmail('');
        setPassword('');
        // Redirige automáticamente al panel de administración tras ingresar
        onNavegar('admin');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setErrorLogin(msg);
    } finally {
      setCargando(false);
    }
  };

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
              {/* Renderizado de tu logo de Canva */}
              <img 
                src={`${import.meta.env.BASE_URL}logo.png`} 
                alt="Catálogo de Bandas" 
                className="h-20 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
              />        
            </button>
            <p className="text-xs leading-relaxed text-muted-foreground max-w-sm">
              Archivo histórico y registro cultural de la escena musical de Coronel Suárez.
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
                  <span>Inscribir Banda</span>
                </div>
              </button>
              <p className="text-xs leading-relaxed text-muted-foreground">
              Actualizá los datos de tu banda.
            </p>
              <button
                type="button"
                onClick={() => onNavegar('editar')}
                className="relative p-[1.5px] rounded-full bg-gradient-to-r from-primary via-emerald-400 to-primary transition-all hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-primary/20 cursor-pointer"
              >
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-background text-white font-bold text-xs uppercase tracking-wider hover:bg-background/80 transition-colors">
                  <Edit3 className="w-3.5 h-3.5 text-primary" />
                  <span>Modificar Datos</span>
                </div>
              </button>
            </div>
          </div>

          {/* Columna 3: Información cultural / Localidad */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">
              Escena Local
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
            © {new Date().getFullYear()} Catálogo de Bandas CS. Todos los derechos reservados.
          </p>

          {/* Área sutil de Administración */}
          <div className="relative">
            {!isAdmin ? (
              <div>
                <button
                  type="button"
                  onClick={() => setMostrarLoginForm(!mostrarLoginForm)}
                  className="text-white/30 hover:text-white/70 text-[11px] tracking-wide transition-colors cursor-pointer select-none"
                >
                  Gestión de legajos
                </button>

                {/* Popover / Formulario Flotante de Login */}
                {mostrarLoginForm && (
                  <form
                    onSubmit={manejarLogin}
                    className="absolute bottom-8 right-0 p-4 bg-card rounded-xl border border-border flex flex-col gap-3 w-64 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-bottom-2"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Acceso Interno
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setMostrarLoginForm(false);
                          setErrorLogin(null);
                        }}
                        className="text-xs text-muted-foreground hover:text-white"
                      >
                        ✕
                      </button>
                    </div>

                    {errorLogin && (
                      <p className="text-[11px] text-destructive bg-destructive/10 p-1.5 rounded border border-destructive/20 text-center font-medium">
                        {errorLogin}
                      </p>
                    )}

                    <input
                      type="email"
                      placeholder="Email de gestión"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="p-2 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                    <input
                      type="password"
                      placeholder="Contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="p-2 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={cargando}
                      className="bg-primary hover:opacity-90 text-white py-2 rounded-lg text-xs font-bold transition-opacity cursor-pointer disabled:opacity-50"
                    >
                      {cargando ? 'Verificando...' : 'Ingresar'}
                    </button>
                  </form>
                )}
              </div>
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

                {/* 🟢 BOTÓN DE DEBUG SÓLO PARA ADMINS 🟢 */}
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