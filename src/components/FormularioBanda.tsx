import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// Lista de géneros musicales típicos de la región para los checkboxes
const GENEROS_DISPONIBLES = [
  'Rock',
  'Pop',
  'Folclore',
  'Cuarteto / Cumbia',
  'Heavy Metal',
  'Punk',
  'Blues / Jazz',
  'Tango',
  'Alternativo'
];

export default function FormularioBanda() {
  const [nombre, setNombre] = useState('');
  const [historia, setHistoria] = useState('');
  
  // 1. Manejo de géneros mediante un Array de strings seleccionados
  const [generosSeleccionados, setGenerosSeleccionados] = useState<string[]>([]);
  
  // Estados para integrantes dinámicos
  const [integrantes, setIntegrantes] = useState<{ nombre: string; instrumento: string }[]>([
    { nombre: '', instrumento: '' }
  ]);

  // Estados para canciones dinámicas
  const [canciones, setCanciones] = useState<{ titulo: string; spotify: string; youtube: string }[]>([
    { titulo: '', spotify: '', youtube: '' }
  ]);

  const [enviando, setEnviando] = useState(false);

  // Manejar la selección/deselección de los checkboxes de género
  const manejarCambioGenero = (genero: string) => {
    if (generosSeleccionados.includes(genero)) {
      setGenerosSeleccionados(generosSeleccionados.filter(g => g !== genero));
    } else {
      setGenerosSeleccionados([...generosSeleccionados, genero]);
    }
  };

  // Manejadores para Integrantes
  const cambiarIntegrante = (index: number, campo: 'nombre' | 'instrumento', valor: string) => {
    const nuevos = [...integrantes];
    nuevos[index][campo] = valor;
    setIntegrantes(nuevos);
  };

  const agregarIntegrante = () => {
    setIntegrantes([...integrantes, { nombre: '', instrumento: '' }]);
  };

  const eliminarIntegrante = (index: number) => {
    if (integrantes.length > 1) {
      setIntegrantes(integrantes.filter((_, i) => i !== index));
    }
  };

  // Manejadores para Canciones
  const cambiarCancion = (index: number, campo: 'titulo' | 'spotify' | 'youtube', valor: string) => {
    const nuevas = [...canciones];
    nuevas[index][campo] = valor;
    setCanciones(nuevas);
  };

  const agregarCancion = () => {
    setCanciones([...canciones, { titulo: '', spotify: '', youtube: '' }]);
  };

  const eliminarCancion = (index: number) => {
    if (canciones.length > 1) {
      setCanciones(canciones.filter((_, i) => i !== index));
    }
  };

  // Enviar el formulario completo a Supabase
  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();

    if (generosSeleccionados.length === 0) {
      alert('Por favor, seleccioná al menos un género musical para la banda.');
      return;
    }

    setEnviando(true);

    try {
      // Convertimos el array de géneros seleccionados en un solo string (Ej: "Rock, Punk, Alternativo")
      const generoFinalString = generosSeleccionados.join(', ');

      // 1. Insertar la Banda en la tabla 'bandas'
      const { data: bandaInsertada, error: errorBanda } = await supabase
        .from('bandas')
        .insert([
          {
            nombre,
            genero: generoFinalString,
            historia,
            aprobado: false // Queda en revisión para el administrador
          }
        ])
        .select()
        .single();

      if (errorBanda) throw errorBanda;

      const bandaId = bandaInsertada.id;

      // 2. Insertar los Integrantes filtrando los que estén vacíos
      const integrantesFiltrados = integrantes
        .filter(i => i.nombre.trim() !== '')
        .map(i => ({
          banda_id: bandaId,
          nombre: i.nombre,
          instrumento: i.instrumento || null
        }));

      if (integrantesFiltrados.length > 0) {
        const { error: errorIntegrantes } = await supabase
          .from('integrantes')
          .insert(integrantesFiltrados);
        
        if (errorIntegrantes) throw errorIntegrantes;
      }

      // 3. Insertar las Canciones filtrando los títulos vacíos
      const cancionesFiltradas = canciones
        .filter(c => c.titulo.trim() !== '')
        .map(c => ({
          banda_id: bandaId,
          titulo: c.titulo,
          spotify_embed_url: c.spotify || null,
          youtube_embed_url: c.youtube || null
        }));

      if (cancionesFiltradas.length > 0) {
        const { error: errorCanciones } = await supabase
          .from('canciones')
          .insert(cancionesFiltradas);
        
        if (errorCanciones) throw errorCanciones;
      }

      alert('¡Inscripción completada con éxito! La banda quedó registrada en la base de datos y será visible en el catálogo una vez que el administrador la apruebe.');
      
      // Resetear formulario completo
      setNombre('');
      setGenerosSeleccionados([]);
      setHistoria('');
      setIntegrantes([{ nombre: '', instrumento: '' }]);
      setCanciones([{ titulo: '', spotify: '', youtube: '' }]);

    } catch (error: any) {
      console.error('Error al guardar en Supabase:', error.message);
      alert(`Hubo un problema al procesar la solicitud: ${error.message}`);
    } finally {
      setEnviando(false);
    }
  };

  // Objetos de estilos comunes para mantener la estética Vintage/Madera
  const estiloLabel = { display: 'block', margin: '15px 0 5px 0', color: '#d4af37', fontWeight: 'bold', fontSize: '1.1rem' };
  const estiloInputText = { width: '100%', padding: '10px', boxSizing: 'border-box' as const, backgroundColor: '#3e2723', color: '#f4ecd8', border: '1px solid #d4af37', borderRadius: '2px', fontFamily: 'Georgia, serif', fontSize: '1rem' };

  return (
    <div style={{
      maxWidth: '750px',
      margin: '2rem auto',
      backgroundColor: '#1c120c',
      border: '12px solid #3a1f13',
      outline: '3px solid #1a0a03',
      outlineOffset: '-15px',
      boxShadow: '0 15px 35px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.95)',
      padding: '2.5rem',
      fontFamily: 'Georgia, serif',
      color: '#f4ecd8',
      borderRadius: '4px'
    }}>
      <h2 style={{ textAlign: 'center', color: '#d4af37', fontSize: '2rem', borderBottom: '1px double #5d4037', paddingBottom: '15px', marginTop: 0 }}>
        📜 Formulario de Inscripción Musical
      </h2>
      <p style={{ textAlign: 'center', color: '#bcaaa4', fontStyle: 'italic', fontSize: '0.95rem', marginBottom: '2rem' }}>
        Registre los datos de su agrupación para ser incorporada al archivo histórico oficial de Coronel Suárez.
      </p>

      <form onSubmit={manejarEnvio}>
        {/* Nombre de la Banda */}
        <div>
          <label style={estiloLabel}>Nombre de la Agrupación:</label>
          <input 
            type="text" 
            value={nombre} 
            onChange={(e) => setNombre(e.target.value)} 
            required 
            placeholder="Ej: Los Suarenses del Rock"
            style={estiloInputText}
          />
        </div>

        {/* SECCIÓN NUEVA: Checkboxes de Géneros Musicales Estilizados */}
        <div>
          <label style={estiloLabel}>Géneros Musicales (Podés marcar varios):</label>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
            gap: '10px', 
            backgroundColor: '#2b1d16', 
            padding: '15px', 
            borderRadius: '2px', 
            border: '1px dashed #5d4037',
            marginTop: '5px'
          }}>
            {GENEROS_DISPONIBLES.map((genero) => {
              const estaSeleccionado = generosSeleccionados.includes(genero);
              return (
                <label 
                  key={genero} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    cursor: 'pointer',
                    color: estaSeleccionado ? '#d4af37' : '#bcaaa4',
                    fontWeight: estaSeleccionado ? 'bold' : 'normal',
                    fontSize: '0.95rem',
                    transition: 'color 0.2s'
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={estaSeleccionado}
                    onChange={() => manejarCambioGenero(genero)}
                    style={{ 
                      accentColor: '#d4af37', // Color vintage para el checkbox nativo
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer'
                    }}
                  />
                  {genero}
                </label>
              );
            })}
          </div>
        </div>

        {/* Reseña Histórica */}
        <div>
          <label style={estiloLabel}>Reseña Histórica / Biografía:</label>
          <textarea 
            value={historia} 
            onChange={(e) => setHistoria(e.target.value)} 
            rows={5}
            placeholder="Contanos cuándo se formó la banda, hitos importantes, discos grabados y trayectoria en la comunidad..."
            style={{ ...estiloInputText, resize: 'vertical' }}
          />
        </div>

        {/* SECCIÓN: Integrantes de la Orquesta */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid #5d4037', paddingTop: '1.5rem' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#d4af37', fontSize: '1.3rem' }}>👥 Nómina de Músicos / Integrantes</h3>
          
          {integrantes.map((integrante, index) => (
            <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="Nombre completo" 
                value={integrante.nombre} 
                onChange={(e) => cambiarIntegrante(index, 'nombre', e.target.value)}
                style={estiloInputText}
              />
              <input 
                type="text" 
                placeholder="Instrumento (Ej: Guitarra)" 
                value={integrante.instrumento} 
                onChange={(e) => cambiarIntegrante(index, 'instrumento', e.target.value)}
                style={estiloInputText}
              />
              {integrantes.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => eliminarIntegrante(index)} 
                  style={{ backgroundColor: '#b71c1c', color: '#fff', border: 'none', padding: '10px 12px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button 
            type="button" 
            onClick={agregarIntegrante} 
            style={{ backgroundColor: '#5d4037', color: '#f4ecd8', border: '1px solid #d4af37', padding: '6px 12px', cursor: 'pointer', fontSize: '0.9rem', marginTop: '5px' }}
          >
            + Añadir Músico
          </button>
        </div>

        {/* SECCIÓN: Obras / Archivos Multimedia */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid #5d4037', paddingTop: '1.5rem' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#d4af37', fontSize: '1.3rem' }}>🎧 Enlaces de Obras & Canciones</h3>
          
          {canciones.map((cancion, index) => (
            <div key={index} style={{ backgroundColor: '#2b1d16', padding: '15px', borderRadius: '2px', border: '1px dashed #5d4037', marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold', color: '#d4af37', fontSize: '0.9rem' }}>Canción N° {index + 1}</span>
                {canciones.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => eliminarCancion(index)} 
                    style={{ backgroundColor: '#b71c1c', color: '#fff', border: 'none', padding: '3px 8px', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    Quitar Canción
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="Título del tema" 
                  value={cancion.titulo} 
                  onChange={(e) => cambiarCancion(index, 'titulo', e.target.value)}
                  style={estiloInputText}
                />
                <input 
                  type="url" 
                  placeholder="URL de Spotify (Opcional)" 
                  value={cancion.spotify} 
                  onChange={(e) => cambiarCancion(index, 'spotify', e.target.value)}
                  style={estiloInputText}
                />
                <input 
                  type="url" 
                  placeholder="URL de YouTube (Opcional)" 
                  value={cancion.youtube} 
                  onChange={(e) => cambiarCancion(index, 'youtube', e.target.value)}
                  style={estiloInputText}
                />
              </div>
            </div>
          ))}
          <button 
            type="button" 
            onClick={agregarCancion} 
            style={{ backgroundColor: '#5d4037', color: '#f4ecd8', border: '1px solid #d4af37', padding: '6px 12px', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            + Registrar Otra Canción
          </button>
        </div>

        {/* Botón de Envío */}
        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
          <button 
            type="submit" 
            disabled={enviando}
            style={{ 
              backgroundColor: '#d4af37', 
              color: '#1a0f0a', 
              border: '1px solid #1a0a03', 
              padding: '12px 35px', 
              fontSize: '1.2rem', 
              fontWeight: 'bold', 
              cursor: enviando ? 'not-allowed' : 'pointer', 
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
              opacity: enviando ? 0.6 : 1,
              letterSpacing: '1px'
            }}
          >
            {enviando ? 'Guardando Registro...' : '🏛️ Asentar en el Registro Oficial'}
          </button>
        </div>
      </form>
    </div>
  );
}