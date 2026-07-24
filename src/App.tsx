import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';

// Importación de componentes principales
import Header from './components/Header'; // 👈 IMPORTANTE: Importamos el Header
import ListaBandas from './components/ListaBandas';
import LandingBanda from './components/LandingBanda'; 
import FormularioBanda from './components/FormularioBanda'; 
import AdminPanel from './components/PanelAdmin'; 
import Footer from './components/Footer';

// Definición de las vistas posibles en la app
type Vista = 'catalogo' | 'detalle' | 'formulario' | 'editar' | 'admin';

export default function App() {
  // Estado de navegación
  const [vista, setVista] = useState<Vista>('catalogo');
  const [bandaId, setBandaId] = useState<string | null>(null);

  // Estado de autenticación
  const [isAdmin, setIsAdmin] = useState(false);

  // Estados de diagnóstico de conexión
  const [testCount, setTestCount] = useState<number | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [mostrarDebug, setMostrarDebug] = useState(false);

  // 1. Escuchar la sesión de Supabase en tiempo real
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdmin(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const autenticado = !!session;
      setIsAdmin(autenticado);

      if (!autenticado && vista === 'admin') {
        setVista('catalogo');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [vista]);

  // 2. Probar conexión inicial con Supabase
  useEffect(() => {
    async function probarConexion() {
      try {
        const { data, error } = await supabase.from('bandas').select('id', { count: 'exact' });
        if (error) {
          setTestError(error.message);
        } else {
          setTestCount(data ? data.length : 0);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al conectar';
        setTestError(msg);
      }
    }
    probarConexion();
  }, []);

  // Handlers de navegación
  const handleSeleccionarBanda = (id: string) => {
    setBandaId(id);
    setVista('detalle');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavegar = (nuevaVista: Vista) => {
    if (nuevaVista !== 'detalle') {
      setBandaId(null);
    }
    setVista(nuevaVista);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setVista('catalogo');
    setBandaId(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-primary selection:text-white relative overflow-x-hidden">
      
      {/* Glow de fondo decorativo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[120px] pointer-events-none rounded-full" />

      {/* 🚀 HEADER INTEGRADO */}
      <Header onNavegar={handleNavegar} vistaActual={vista} />

      {/* Barra de estado rápido/Debug (Opcional) */}
      <div className="w-full max-w-6xl mx-auto px-6 pt-3 flex justify-end">
        <button
          type="button"
          onClick={() => setMostrarDebug(!mostrarDebug)}
          className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors px-2 py-0.5 rounded border border-border/30 bg-card/40 cursor-pointer"
          title="Alternar estado de conexión"
        >
          {testError ? '🔴 Error DB' : `🟢 DB: ${testCount ?? '...'}`}
        </button>
      </div>

      {/* Panel de Diagnóstico Colapsable */}
      {mostrarDebug && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 py-2 px-6 text-xs font-mono text-yellow-300/90 flex items-center justify-between max-w-6xl mx-auto w-full z-30 my-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span><strong>Registros DB:</strong> {testCount !== null ? testCount : 'Cargando...'}</span>
            <span>|</span>
            <span><strong>Vista Actual:</strong> {vista}</span>
            {bandaId && <span>| <strong>ID Banda:</strong> {bandaId}</span>}
            {testError && <span className="text-red-400">| <strong>Error:</strong> {testError}</span>}
          </div>
          <button 
            type="button" 
            onClick={() => setMostrarDebug(false)}
            className="text-yellow-400 hover:text-white ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Contenido Principal Dinámico */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 relative z-10">
        
        {/* Vista 1: Detalle de Banda */}
        {vista === 'detalle' && bandaId && (
          <LandingBanda 
            bandaId={bandaId} 
            onVolver={() => handleNavegar('catalogo')} 
          />
        )}

        {/* Vista 2: Catálogo Principal */}
        {vista === 'catalogo' && (
          <ListaBandas 
            onSeleccionarBanda={handleSeleccionarBanda} 
          />
        )}

        {/* Vista 3: Formulario de Postulación de Banda */}
        {vista === 'formulario' && (
          <FormularioBanda 
            onExito={() => handleNavegar('catalogo')}
            onCancelar={() => handleNavegar('catalogo')}
          />
        )}

        {/* Vista 4: Solicitud de Edición */}
        {vista === 'editar' && (
          <div className="max-w-2xl mx-auto text-center py-12 space-y-4">
            <h2 className="text-2xl font-bold">Solicitar modificación de datos</h2>
            <p className="text-sm text-muted-foreground">
              Para actualizar la biografía, integrantes o material multimedia de tu banda, ponete en contacto con el equipo de administración.
            </p>
            <button
              type="button"
              onClick={() => handleNavegar('catalogo')}
              className="px-4 py-2 bg-card border border-border rounded-xl text-xs font-bold uppercase tracking-wider hover:border-primary transition-colors cursor-pointer"
            >
              ← Volver al catálogo
            </button>
          </div>
        )}

        {/* Vista 5: Panel de Administración */}
        {vista === 'admin' && (
          <AdminPanel />
        )}

      </main>

      {/* Pie de Página */}
      <Footer 
        isAdmin={isAdmin}
        onLogout={handleLogout}
        onNavegar={handleNavegar}
      />

    </div>
  );
}