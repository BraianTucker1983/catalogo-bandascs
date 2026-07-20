import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient'; 
import FormularioBanda from './components/FormularioBanda';
import PanelAdmin from './components/PanelAdmin';
import ListaBandas from './components/ListaBandas';
import EditarBanda from './components/EditarBanda';
import DetalleBanda from './components/DetalleBanda';
import Footer from './components/Footer';

function App() {
  const [conexionOk, setConexionOk] = useState<boolean | null>(null);
  const [pestaña, setPestaña] = useState<'catalogo' | 'formulario' | 'admin' | 'editar' | 'detalle'>('catalogo'); 
  const [bandaSeleccionadaId, setBandaSeleccionadaId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Efecto 1: Verificar conexión a Supabase y escuchar auth
  useEffect(() => {
    const verificarConexion = async () => {
      const { error } = await supabase.from('bandas').select('*').limit(1);
      if (error) {
        console.error('Error de conexión:', error.message);
        setConexionOk(false);
      } else {
        setConexionOk(true);
      }
    };

    verificarConexion();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session) => {
      const esAdminActivo = !!session?.user;
      setIsAdmin(esAdminActivo);
      // Si se loguea como admin, lo llevamos automáticamente al panel admin
      if (esAdminActivo) {
        setPestaña('admin');
      }
    });

    return () => subscription.unsubscribe();
  }, []); 

  // Efecto 2: Proteger pestaña admin
  useEffect(() => {
    if (!isAdmin && pestaña === 'admin') {
      setPestaña('catalogo');
    }
  }, [isAdmin, pestaña]);

  const verDetalleDeBanda = (id: string) => {
    setBandaSeleccionadaId(id);
    setPestaña('detalle');
  };

  const manejarLogout = async () => {
    await supabase.auth.signOut();
    setPestaña('catalogo');
  };

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground overflow-x-hidden antialiased flex flex-col justify-between">
      
      {/* Luces Ambientales (Glows de CLIMA) */}
      <div
        className="absolute top-[-10%] left-1/4 w-[600px] h-[600px] rounded-full opacity-15 blur-[130px] pointer-events-none z-0"
        style={{ background: "radial-gradient(circle, var(--glow-blue) 0%, transparent 75%)" }}
      />
      <div
        className="absolute bottom-10 right-[-5%] w-[500px] h-[500px] rounded-full opacity-10 blur-[120px] pointer-events-none z-0"
        style={{ background: "radial-gradient(circle, var(--glow-violet) 0%, transparent 75%)" }}
      />

      {/* Contenido Principal Wrappeado */}
      <div className="relative z-10 max-w-6xl mx-auto w-full text-center py-12 px-4 flex-1">
        
        {/* Título Principal */}
        <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase mb-2 text-white">
          🎸 Catálogo de Bandas de <span className="gradient-text">Coronel Suárez</span>
        </h1>
        
        {/* Estado de Sincronización */}
        <div className="mb-8 text-sm font-semibold tracking-wide">
          {conexionOk === true && (
            <span className="text-emerald-400 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Base de datos sincronizada
            </span>
          )}
          {conexionOk === false && (
            <span className="text-destructive flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-destructive" />
              Error de sincronización con el servidor
            </span>
          )}
        </div>

        {/* Menú de Navegación */}
        {conexionOk === true && pestaña !== 'detalle' && (
          <div className="mb-12 flex justify-center items-center gap-3 flex-wrap p-2 bg-card/40 border border-border rounded-xl backdrop-blur-md max-w-2xl mx-auto">
            <button 
              onClick={() => setPestaña('catalogo')}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                pestaña === 'catalogo' 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              Catálogo Público 🎵
            </button>
            
            <button 
              onClick={() => setPestaña('formulario')}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                pestaña === 'formulario' 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              Registrar Banda
            </button>

            <button 
              onClick={() => setPestaña('editar')}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                pestaña === 'editar' 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              Editar mi Banda ✏️
            </button>
            
            {isAdmin && (
              <button 
                onClick={() => setPestaña('admin')}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  pestaña === 'admin' 
                    ? 'bg-destructive text-white shadow-lg shadow-destructive/20' 
                    : 'text-destructive/80 hover:text-destructive hover:bg-destructive/10'
                }`}
              >
                Panel Admin 🛡️
              </button>
            )}
          </div>
        )}

        {/* Vistas Dinámicas */}
        {conexionOk === true && (
          <div className="w-full text-left transition-all duration-300">
            {pestaña === 'catalogo' && (
              <ListaBandas onSeleccionarBanda={verDetalleDeBanda} />
            )}

            {pestaña === 'formulario' && (
              <FormularioBanda />
            )}

            {pestaña === 'editar' && (
              <EditarBanda />
            )}
            
            {pestaña === 'detalle' && bandaSeleccionadaId && (
              <DetalleBanda 
                bandaId={bandaSeleccionadaId} 
                onVolver={() => setPestaña('catalogo')} 
              />
            )}
            
            {pestaña === 'admin' && isAdmin && (
              <PanelAdmin />
            )}
          </div>
        )}
      </div>

      {/* Footer Pro al final de la página */}
      <Footer 
        isAdmin={isAdmin} 
        onLogout={manejarLogout} 
        onNavegar={(destino) => setPestaña(destino)} 
      />
    </div>
  );
}

export default App;