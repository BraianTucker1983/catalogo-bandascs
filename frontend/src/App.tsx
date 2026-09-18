import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { client } from './lib/api'; // <-- Importamos tu cliente Hono RPC

import Header from './components/Header';
import ListaBandas from './components/ListaBandas';
import LandingBanda from './components/LandingBanda'; 
import { FormBanda } from "./components/FormularioBanda";
import AdminPanel from './components/PanelAdmin'; 
import Footer from './components/Footer';

type Vista = 'catalogo' | 'detalle' | 'formulario' | 'editar' | 'admin';

export default function App() {
  const [vista, setVista] = useState<Vista>('catalogo');
  const [bandaId, setBandaId] = useState<string | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);

  const [testCount, setTestCount] = useState<number | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [mostrarDebug, setMostrarDebug] = useState(false);

  useEffect(() => {
    // 1. Validar si el usuario tiene rol 'admin' al cargar (Supabase Auth)
    supabase.auth.getSession().then(({ data: { session } }) => {
      const esAdmin = session?.user?.app_metadata?.role === 'admin';
      setIsAdmin(Boolean(esAdmin));
    });

    // 2. Escuchar cambios de estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const esAdmin = session?.user?.app_metadata?.role === 'admin';
      setIsAdmin(Boolean(esAdmin));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Probar conexión a la base de datos A TRAVÉS del Backend Hono
    async function probarConexionBackend() {
      try {
        const res = await client.api.bandas.$get();
        if (res.ok) {
          const data = await res.json();
          setTestCount(Array.isArray(data) ? data.length : 0);
          setTestError(null);
        } else {
          setTestError(`Error HTTP ${res.status}`);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al conectar con el backend';
        setTestError(msg);
      }
    }

    probarConexionBackend();
  }, []);

  const handleSeleccionarBanda = (id: string) => {
    setBandaId(id);
    setVista('detalle');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavegar = (nuevaVista: Vista) => {
    if (nuevaVista !== 'detalle' && nuevaVista !== 'editar') {
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
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[120px] pointer-events-none rounded-full" />

      <Header onNavegar={handleNavegar} vistaActual={vista} />

      {mostrarDebug && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 py-2 px-6 text-xs font-mono text-yellow-300/90 flex items-center justify-between max-w-6xl mx-auto w-full z-30 my-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span><strong>Registros DB (vía Backend Hono):</strong> {testCount !== null ? testCount : 'Cargando...'}</span>
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

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 relative z-10">
        
        {vista === 'detalle' && bandaId && (
          <LandingBanda 
            bandaId={bandaId} 
            onVolver={() => handleNavegar('catalogo')} 
          />
        )}

        {vista === 'catalogo' && (
          <ListaBandas 
            onSeleccionarBanda={handleSeleccionarBanda} 
          />
        )}

        {vista === 'formulario' && (
          <FormBanda 
            onSuccess={() => handleNavegar('catalogo')}
            onVolver={() => handleNavegar('catalogo')}
          />
        )}        

        {vista === 'admin' && (
          <AdminPanel />
        )}

      </main>

      <Footer
        isAdmin={isAdmin}
        onLogout={handleLogout}
        onNavegar={handleNavegar}
        mostrarDebug={mostrarDebug}
        setMostrarDebug={setMostrarDebug}
        testError={testError}
        testCount={testCount}
      />

    </div>
  );
}