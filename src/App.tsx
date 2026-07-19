import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient'; // Corregido: Sin extensión .ts para evitar errores de compilación en Vite
import FormularioBanda from './components/FormularioBanda';
import PanelAdmin from './components/PanelAdmin';
import ListaBandas from './components/ListaBandas';
import EditarBanda from './components/EditarBanda';
import DetalleBanda from './components/DetalleBanda';

function App() {
  const [conexionOk, setConexionOk] = useState<boolean | null>(null);
  const [pestaña, setPestaña] = useState<'catalogo' | 'formulario' | 'admin' | 'editar' | 'detalle'>('catalogo'); 
  const [bandaSeleccionadaId, setBandaSeleccionadaId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Efecto 1: Se ejecuta una sola vez al cargar la aplicación
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

    // Listener para los cambios de sesión (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session) => {
      const esAdminActivo = !!session?.user;
      setIsAdmin(esAdminActivo);
    });

    return () => subscription.unsubscribe();
  }, []); // Arreglo vacío: evita volver a validar la conexión cada vez que cambias de pestaña

  // Efecto 2: Protege la pestaña de administración si el usuario pierde la sesión de administrador
  useEffect(() => {
    if (!isAdmin && pestaña === 'admin') {
      setPestaña('catalogo');
    }
  }, [isAdmin, pestaña]);

  const verDetalleDeBanda = (id: string) => {
    setBandaSeleccionadaId(id);
    setPestaña('detalle');
  };

  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif', color: '#fff', backgroundColor: '#1e1e24', minHeight: '100vh' }}>
      <h1>🎸 Catálogo de Bandas de Coronel Suárez</h1>
      
      <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        {conexionOk === true && <span style={{ color: '#22c55e' }}>● Base de datos sincronizada</span>}
        {conexionOk === false && <span style={{ color: '#ef4444' }}>● Error de sincronización</span>}
      </div>

      {conexionOk === true && pestaña !== 'detalle' && (
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setPestaña('catalogo')}
            style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: pestaña === 'catalogo' ? '#22c55e' : '#333', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
          >
            Ver Catálogo Público 🎵
          </button>
          
          <button 
            onClick={() => setPestaña('formulario')}
            style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: pestaña === 'formulario' ? '#007bff' : '#333', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
          >
            Formulario de Registro
          </button>

          <button 
            onClick={() => setPestaña('editar')}
            style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: pestaña === 'editar' ? '#d97706' : '#333', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
          >
            Editar mi Banda ✏️
          </button>
          
          {isAdmin && (
            <button 
              onClick={() => setPestaña('admin')}
              style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: pestaña === 'admin' ? '#ef4444' : '#333', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
            >
              Panel de Admin 🛡️
            </button>
          )}
        </div>
      )}

      {conexionOk === true && (
        <div>
          {pestaña === 'catalogo' && (
            <div style={{ textAlign: 'left' }}>
              <ListaBandas onSeleccionarBanda={verDetalleDeBanda} />
            </div>
          )}

          {pestaña === 'formulario' && (
            <div style={{ backgroundColor: '#fff', color: '#000', padding: '1rem', borderRadius: '8px', textAlign: 'left' }}>
              <FormularioBanda />
            </div>
          )}

          {pestaña === 'editar' && (
            <div style={{ textAlign: 'left' }}>
              <EditarBanda />
            </div>
          )}
          
          {pestaña === 'detalle' && bandaSeleccionadaId && (
            <DetalleBanda 
              bandaId={bandaSeleccionadaId} 
              onVolver={() => setPestaña('catalogo')} 
            />
          )}
          
          {pestaña === 'admin' && isAdmin && (
            <div style={{ textAlign: 'left' }}>
              <PanelAdmin />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;