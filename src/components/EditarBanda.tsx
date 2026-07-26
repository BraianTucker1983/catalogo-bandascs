import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface IntegranteInput {
  id?: string | number;
  nombre: string;
  instrumento: string;
}

interface CancionInput {
  id?: string | number;
  titulo: string;
  spotify_embed_url: string;
  youtube_embed_url: string;
}

export default function EditarBanda() {
  const [tokenInput, setTokenInput] = useState('');
  const [autenticado, setAutenticado] = useState(false);
  const [bandaId, setBandaId] = useState('');

  const [nombre, setNombre] = useState('');
  const [genero, setGenero] = useState('');
  const [historia, setHistoria] = useState('');
  const [integrantes, setIntegrantes] = useState<IntegranteInput[]>([
    { nombre: '', instrumento: '' },
  ]);
  const [canciones, setCanciones] = useState<CancionInput[]>([
    { titulo: '', spotify_embed_url: '', youtube_embed_url: '' },
  ]);

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  // Detección automática de token en la URL si acceden por link
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenUrl = urlParams.get('token');
    if (tokenUrl) {
      setTokenInput(tokenUrl);
      cargarDatosBanda(tokenUrl);
    }
  }, []);

  const cargarDatosBanda = async (token: string) => {
    // 1. Limpiamos espacios y pasamos a minúsculas
    const tokenLimpio = token.trim().toLowerCase();

    if (!tokenLimpio) {
      setMensaje({ tipo: 'error', texto: 'Por favor, introduce un código secreto válido.' });
      return;
    }

    setCargando(true);
    setMensaje(null);

    try {
      // 🔒 Buscamos apuntando a la columna exacta: 'palabra_clave'
      const { data: bandaData, error: bandaError } = await supabase
        .from('bandas')
        .select('id, nombre, genero, historia, palabra_clave')
        .eq('palabra_clave', tokenLimpio)
        .maybeSingle();

      if (bandaError) throw bandaError;

      if (!bandaData) {
        setMensaje({
          tipo: 'error',
          texto: 'Código secreto inválido. Verifícalo e inténtalo de nuevo.',
        });
        setAutenticado(false);
        return;
      }

      // 2. Cargar integrantes y canciones de la banda encontrada...
      const [integrantesRes, cancionesRes] = await Promise.all([
        supabase
          .from('integrantes')
          .select('id, nombre, instrumento')
          .eq('banda_id', bandaData.id),
        supabase
          .from('canciones')
          .select('id, titulo, spotify_embed_url, youtube_embed_url')
          .eq('banda_id', bandaData.id),
      ]);

      if (integrantesRes.error) console.warn('Error integrantes:', integrantesRes.error.message);
      if (cancionesRes.error) console.warn('Error canciones:', cancionesRes.error.message);

      // 3. Setear estados
      setBandaId(bandaData.id);
      setNombre(bandaData.nombre || '');
      setGenero(bandaData.genero || '');
      setHistoria(bandaData.historia || '');

      setIntegrantes(
        integrantesRes.data && integrantesRes.data.length > 0
          ? integrantesRes.data.map((i) => ({
              id: i.id,
              nombre: i.nombre || '',
              instrumento: i.instrumento || '',
            }))
          : [{ nombre: '', instrumento: '' }]
      );

      setCanciones(
        cancionesRes.data && cancionesRes.data.length > 0
          ? cancionesRes.data.map((c) => ({
              id: c.id,
              titulo: c.titulo || '',
              spotify_embed_url: c.spotify_embed_url || '',
              youtube_embed_url: c.youtube_embed_url || '',
            }))
          : [{ titulo: '', spotify_embed_url: '', youtube_embed_url: '' }]
      );

      setAutenticado(true);
      setMensaje(null);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar los datos.';
      setMensaje({ tipo: 'error', texto: errorMsg });
      setAutenticado(false);
    } finally {
      setCargando(false);
    }
  };

  const handleGuardarCambios = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensaje(null);

    try {
      // A. Actualizar datos base de la banda
      const { error: errorBanda } = await supabase
        .from('bandas')
        .update({ nombre, genero, historia })
        .eq('id', bandaId);

      if (errorBanda) throw new Error(`Banda: ${errorBanda.message}`);

      // B. Sincronizar integrantes (DELETE anterior + INSERT nuevos)
      const { error: errDelInt } = await supabase
        .from('integrantes')
        .delete()
        .eq('banda_id', bandaId);
        
      if (errDelInt) throw new Error(`Eliminar integrantes: ${errDelInt.message}`);

      const nuevosIntegrantes = integrantes
        .filter((i) => i.nombre.trim() !== '')
        .map((i) => ({
          banda_id: bandaId,
          nombre: i.nombre.trim(),
          instrumento: i.instrumento.trim() !== '' ? i.instrumento.trim() : null,
        }));

      if (nuevosIntegrantes.length > 0) {
        const { error: errorInt } = await supabase
          .from('integrantes')
          .insert(nuevosIntegrantes);
        if (errorInt) throw new Error(`Insertar integrantes: ${errorInt.message}`);
      }

      // C. Sincronizar canciones
      const { error: errDelCanc } = await supabase
        .from('canciones')
        .delete()
        .eq('banda_id', bandaId);

      if (errDelCanc) throw new Error(`Eliminar canciones: ${errDelCanc.message}`);

      const nuevasCanciones = canciones
        .filter((c) => c.titulo.trim() !== '')
        .map((c) => ({
          banda_id: bandaId,
          titulo: c.titulo.trim(),
          spotify_embed_url: c.spotify_embed_url.trim() || null,
          youtube_embed_url: c.youtube_embed_url.trim() || null,
        }));

      if (nuevasCanciones.length > 0) {
        const { error: errorCanc } = await supabase
          .from('canciones')
          .insert(nuevasCanciones);
        if (errorCanc) throw new Error(`Insertar canciones: ${errorCanc.message}`);
      }

      setMensaje({ tipo: 'exito', texto: '¡Tu perfil musical ha sido actualizado con éxito!' });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al guardar cambios.';
      setMensaje({ tipo: 'error', texto: errorMsg });
    } finally {
      setCargando(false);
    }
  };

  const actualizarIntegrante = (index: number, campo: keyof IntegranteInput, valor: string) => {
    setIntegrantes((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [campo]: valor } : item))
    );
  };

  const eliminarIntegrante = (index: number) => {
    setIntegrantes((prev) => prev.filter((_, i) => i !== index));
  };

  const actualizarCancion = (index: number, campo: keyof CancionInput, valor: string) => {
    setCanciones((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [campo]: valor } : item))
    );
  };

  const eliminarCancion = (index: number) => {
    setCanciones((prev) => prev.filter((_, i) => i !== index));
  };

  // Vista 1: Formulario de Login / Verificación de Palabra Clave
  if (!autenticado) {
    return (
      <div
        style={{
          maxWidth: '500px',
          margin: '2rem auto',
          padding: '1.5rem',
          border: '1px solid #ccc',
          borderRadius: '8px',
          backgroundColor: '#fff',
          color: '#000',
        }}
      >
        <h3 style={{ marginTop: 0 }}>🔑 Modificar mi Banda</h3>
        <p style={{ fontSize: '14px', color: '#666' }}>
          Introduce tu palabra clave secreta enviada por correo para editar tu información.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            cargarDatosBanda(tokenInput);
          }}
        >
          <input
            type="text"
            placeholder="Ingresa tu palabra clave (ej: metallica)..."
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '10px',
              boxSizing: 'border-box',
            }}
            required
          />
          <button
            type="submit"
            disabled={cargando}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            {cargando ? 'Verificando...' : 'Editar Perfil'}
          </button>
        </form>

        {mensaje && (
          <p
            style={{
              color: mensaje.tipo === 'error' ? '#dc3545' : '#28a745',
              marginTop: '10px',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
          >
            {mensaje.texto}
          </p>
        )}
      </div>
    );
  }

  // Vista 2: Edición del Perfil habilitado
  return (
    <div
      style={{
        maxWidth: '600px',
        margin: '2rem auto',
        padding: '1.5rem',
        border: '1px solid #ccc',
        borderRadius: '8px',
        backgroundColor: '#fff',
        color: '#000',
      }}
    >
      <h2 style={{ marginTop: 0 }}>Editar Perfil: {nombre}</h2>

      {mensaje && (
        <div
          style={{
            padding: '10px',
            marginBottom: '15px',
            backgroundColor: mensaje.tipo === 'exito' ? '#d4edda' : '#f8d7da',
            color: mensaje.tipo === 'exito' ? '#155724' : '#721c24',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleGuardarCambios}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontWeight: 'bold' }}>Nombre de la Banda</label>
          <input
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              marginTop: '5px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontWeight: 'bold' }}>Género</label>
          <input
            type="text"
            required
            value={genero}
            onChange={(e) => setGenero(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              marginTop: '5px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontWeight: 'bold' }}>Biografía / Historia</label>
          <textarea
            rows={4}
            value={historia}
            onChange={(e) => setHistoria(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              marginTop: '5px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Sección Integrantes */}
        <div style={{ marginBottom: '1.5rem', padding: '10px', border: '1px solid #ddd' }}>
          <h4 style={{ marginTop: 0 }}>Integrantes actuales</h4>
          {integrantes.map((int, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
              <input
                type="text"
                placeholder="Nombre"
                value={int.nombre}
                onChange={(e) => actualizarIntegrante(i, 'nombre', e.target.value)}
                style={{ flex: 1, padding: '6px' }}
              />
              <input
                type="text"
                placeholder="Instrumento"
                value={int.instrumento}
                onChange={(e) => actualizarIntegrante(i, 'instrumento', e.target.value)}
                style={{ flex: 1, padding: '6px' }}
              />
              {integrantes.length > 1 && (
                <button
                  type="button"
                  onClick={() => eliminarIntegrante(i)}
                  style={{
                    backgroundColor: '#dc3545',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0 10px',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setIntegrantes([...integrantes, { nombre: '', instrumento: '' }])}
            style={{ marginTop: '5px', cursor: 'pointer' }}
          >
            + Añadir Integrante
          </button>
        </div>

        {/* Sección Multimedia */}
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '10px',
            border: '1px solid #22c55e',
            backgroundColor: '#f0fdf4',
          }}
        >
          <h4 style={{ color: '#16a34a', marginTop: 0 }}>Multimedia 🎵</h4>
          {canciones.map((can, i) => (
            <div
              key={i}
              style={{
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: '1px solid #cce2d3',
              }}
            >
              <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                <input
                  type="text"
                  placeholder="Título"
                  value={can.titulo}
                  onChange={(e) => actualizarCancion(i, 'titulo', e.target.value)}
                  style={{ flex: 1, padding: '6px', boxSizing: 'border-box' }}
                />
                {canciones.length > 1 && (
                  <button
                    type="button"
                    onClick={() => eliminarCancion(i)}
                    style={{
                      backgroundColor: '#dc3545',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0 8px',
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder="Link Spotify"
                value={can.spotify_embed_url}
                onChange={(e) => actualizarCancion(i, 'spotify_embed_url', e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px',
                  marginBottom: '4px',
                  fontSize: '12px',
                  boxSizing: 'border-box',
                }}
              />
              <input
                type="text"
                placeholder="Link YouTube"
                value={can.youtube_embed_url}
                onChange={(e) => actualizarCancion(i, 'youtube_embed_url', e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px',
                  fontSize: '12px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setCanciones([
                ...canciones,
                { titulo: '', spotify_embed_url: '', youtube_embed_url: '' },
              ])
            }
            style={{ cursor: 'pointer' }}
          >
            + Añadir Canción
          </button>
        </div>

        <button
          type="submit"
          disabled={cargando}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#22c55e',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          {cargando ? 'Guardando...' : 'Guardar Cambios Oficiales'}
        </button>
      </form>
    </div>
  );
}