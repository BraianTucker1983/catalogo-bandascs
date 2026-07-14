import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient.ts';
import FormularioBanda from './components/FormularioBanda';
import PanelAdmin from './components/PanelAdmin';
import ListaBandas from './components/ListaBandas';
import EditarBanda from './components/EditarBanda'; // <-- 1. IMPORTAMOS EL NUEVO COMPONENTE

function App() {
  const [conexionOk, setConexionOk] = useState<boolean | null>(null);
  // 2. AMPLIAMOS EL ESTADO PARA INCLUIR LA PESTAÑA 'editar'
  const [pestaña, setPestaña] = useState<'catalogo' | 'formulario' | 'admin' | 'editar'>('catalogo'); 

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
  }, []);

  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif', color: '#fff', backgroundColor: '#1e1e24', minHeight: '100vh' }}>
      <h1>🎸 Catálogo de Bandas de Coronel Suárez</h1>
      
      {/* Estado de Conexión */}
      <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        {conexionOk === true && <span style={{ color: '#22c55e' }}>● Base de datos sincronizada</span>}
        {conexionOk === false && <span style={{ color: '#ef4444' }}>● Error de sincronización</span>}
      </div>

      {/* Navegación (4 Botones) */}
      {conexionOk === true && (
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

          {/* 3. NUEVO BOTÓN PARA IR A LA PESTAÑA DE EDICIÓN */}
          <button 
            onClick={() => setPestaña('editar')}
            style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: pestaña === 'editar' ? '#d97706' : '#333', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
          >
            Editar mi Banda ✏️
          </button>
          
          <button 
            onClick={() => setPestaña('admin')}
            style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: pestaña === 'admin' ? '#ef4444' : '#333', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
          >
            Panel de Admin 🛡️
          </button>
        </div>
      )}

      {/* Renderizado Condicional */}
      {conexionOk === true && (
        <div>
          {pestaña === 'catalogo' && (
            <div style={{ textAlign: 'left' }}>
              <ListaBandas />
            </div>
          )}

          {pestaña === 'formulario' && (
            <div style={{ backgroundColor: '#fff', color: '#000', padding: '1rem', borderRadius: '8px', textAlign: 'left' }}>
              <FormularioBanda />
            </div>
          )}

          {/* 4. RENDERIZAMOS EL COMPONENTE SI LA PESTAÑA SELECCIONADA ES 'editar' */}
          {pestaña === 'editar' && (
            <div style={{ textAlign: 'left' }}>
              <EditarBanda />
            </div>
          )}
          
          {pestaña === 'admin' && (
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