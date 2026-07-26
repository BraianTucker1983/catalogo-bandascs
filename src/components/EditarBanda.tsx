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

  // Guardamos IDs originales para saber cuáles borrar individualmente
  const [idsIntegrantesOriginales, setIdsIntegrantesOriginales] = useState<(string | number)[]>([]);
  const [idsCancionesOriginales, setIdsCancionesOriginales] = useState<(string | number)[]>([]);

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenUrl = urlParams.get('token');
    if (tokenUrl) {
      setTokenInput(tokenUrl);
      cargarDatosBanda(tokenUrl);
    }
  }, []);

  const cargarDatosBanda = async (token: string) => {
    const tokenLimpio = token.trim().toLowerCase();

    if (!tokenLimpio) {
      setMensaje({ tipo: 'error', texto: 'Por favor, introduce un código secreto válido.' });
      return;
    }

    setCargando(true);
    setMensaje(null);

    try {
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

      setBandaId(bandaData.id);
      setNombre(bandaData.nombre || '');
      setGenero(bandaData.genero || '');
      setHistoria(bandaData.historia || '');

      const intData = integrantesRes.data || [];
      const cancData = cancionesRes.data || [];

      setIdsIntegrantesOriginales(intData.map((i) => i.id));
      setIdsCancionesOriginales(cancData.map((c) => c.id));

      setIntegrantes(
        intData.length > 0
          ? intData.map((i) => ({
              id: i.id,
              nombre: i.nombre || '',
              instrumento: i.instrumento || '',
            }))
          : [{ nombre: '', instrumento: '' }]
      );

      setCanciones(
        cancData.length > 0
          ? cancData.map((c) => ({
              id: c.id,
              titulo: c.titulo || '',
              spotify_embed_url: c.spotify_embed_url || '',
              youtube_embed_url: c.youtube_embed_url || '',
            }))
          : [{ titulo: '', spotify_embed_url: '', youtube_embed_url: '' }]
      );

      setAutenticado(true);
      setMensaje(null);

      // Limpiar el token de la URL por privacidad
      if (window.history.replaceState) {
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
      }
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
      // 1. Actualizar datos generales de la banda
      const { error: errorBanda } = await supabase
        .from('bandas')
        .update({ nombre, genero, historia })
        .eq('id', bandaId);

      if (errorBanda) throw new Error(`Banda: ${errorBanda.message}`);

      // 2. Procesar Integrantes (Upsert + Delete selectivo)
      const integrantesValidos = integrantes.filter((i) => i.nombre.trim() !== '');
      const idsActualesIntegrantes = integrantesValidos.map((i) => i.id).filter(Boolean);
      const idsABorrarIntegrantes = idsIntegrantesOriginales.filter(
        (id) => !idsActualesIntegrantes.includes(id)
      );

      if (idsABorrarIntegrantes.length > 0) {
        const { error: errDelInt } = await supabase
          .from('integrantes')
          .delete()
          .in('id', idsABorrarIntegrantes);
        if (errDelInt) throw new Error(`Borrar integrantes: ${errDelInt.message}`);
      }

      if (integrantesValidos.length > 0) {
        const payloadIntegrantes = integrantesValidos.map((i) => ({
          ...(i.id ? { id: i.id } : {}),
          banda_id: bandaId,
          nombre: i.nombre.trim(),
          instrumento: i.instrumento.trim() || null,
        }));

        const { error: errorInt } = await supabase
          .from('integrantes')
          .upsert(payloadIntegrantes);
        if (errorInt) throw new Error(`Guardar integrantes: ${errorInt.message}`);
      }

      // 3. Procesar Canciones (Upsert + Delete selectivo)
      const cancionesValidas = canciones.filter((c) => c.titulo.trim() !== '');
      const idsActualesCanciones = cancionesValidas.map((c) => c.id).filter(Boolean);
      const idsABorrarCanciones = idsCancionesOriginales.filter(
        (id) => !idsActualesCanciones.includes(id)
      );

      if (idsABorrarCanciones.length > 0) {
        const { error: errDelCanc } = await supabase
          .from('canciones')
          .delete()
          .in('id', idsABorrarCanciones);
        if (errDelCanc) throw new Error(`Borrar canciones: ${errDelCanc.message}`);
      }

      if (cancionesValidas.length > 0) {
        const payloadCanciones = cancionesValidas.map((c) => ({
          ...(c.id ? { id: c.id } : {}),
          banda_id: bandaId,
          titulo: c.titulo.trim(),
          spotify_embed_url: c.spotify_embed_url.trim() || null,
          youtube_embed_url: c.youtube_embed_url.trim() || null,
        }));

        const { error: errorCanc } = await supabase
          .from('canciones')
          .upsert(payloadCanciones);
        if (errorCanc) throw new Error(`Guardar canciones: ${errorCanc.message}`);
      }

      // Refrescar la vista con los nuevos datos/IDs
      await cargarDatosBanda(tokenInput);
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.625rem 0.875rem',
    borderRadius: '0.5rem',
    border: '1px solid #d1d5db',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#f9fafb',
    color: '#111827',
  };

  if (!autenticado) {
    return (
      <div
        style={{
          maxWidth: '440px',
          margin: '3rem auto',
          padding: '2rem',
          borderRadius: '1rem',
          backgroundColor: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
          border: '1px solid #f3f4f6',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              margin: '0 auto 0.75rem',
            }}
          >
            🔑
          </div>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>
            Modificar mi Banda
          </h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.4 }}>
            Introduce la palabra clave secreta enviada a tu correo para habilitar la edición.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            cargarDatosBanda(tokenInput);
          }}
        >
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Ej: metallica-2024"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: cargando ? '#93c5fd' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: cargando ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            {cargando ? 'Verificando...' : 'Acceder al Perfil'}
          </button>
        </form>

        {mensaje && (
          <div
            style={{
              marginTop: '1.25rem',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              backgroundColor: mensaje.tipo === 'error' ? '#fef2f2' : '#f0fdf4',
              color: mensaje.tipo === 'error' ? '#991b1b' : '#166534',
              border: `1px solid ${mensaje.tipo === 'error' ? '#fecaca' : '#bbf7d0'}`,
            }}
          >
            {mensaje.texto}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: '680px',
        margin: '2rem auto',
        padding: '2rem',
        borderRadius: '1rem',
        backgroundColor: '#ffffff',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
        border: '1px solid #f3f4f6',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
          Editar Perfil: <span style={{ color: '#2563eb' }}>{nombre || 'Mi Banda'}</span>
        </h2>
      </div>

      {mensaje && (
        <div
          style={{
            padding: '0.875rem 1rem',
            marginBottom: '1.5rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            backgroundColor: mensaje.tipo === 'exito' ? '#f0fdf4' : '#fef2f2',
            color: mensaje.tipo === 'exito' ? '#166534' : '#991b1b',
            border: `1px solid ${mensaje.tipo === 'exito' ? '#bbf7d0' : '#fecaca'}`,
          }}
        >
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleGuardarCambios}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
              Nombre de la Banda
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
              Género Musical
            </label>
            <input
              type="text"
              required
              value={genero}
              onChange={(e) => setGenero(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
            Biografía / Historia
          </label>
          <textarea
            rows={4}
            value={historia}
            onChange={(e) => setHistoria(e.target.value)}
            style={{
              ...inputStyle,
              resize: 'vertical',
              minHeight: '100px',
            }}
          />
        </div>

        {/* Sección Integrantes */}
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1.25rem',
            borderRadius: '0.75rem',
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
          }}
        >
          <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
            👥 Integrantes
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {integrantes.map((int, i) => (
              <div key={int.id || i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Nombre"
                  value={int.nombre}
                  onChange={(e) => actualizarIntegrante(i, 'nombre', e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <input
                  type="text"
                  placeholder="Instrumento"
                  value={int.instrumento}
                  onChange={(e) => actualizarIntegrante(i, 'instrumento', e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                {integrantes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => eliminarIntegrante(i)}
                    style={{
                      padding: '0.625rem 0.75rem',
                      backgroundColor: '#fef2f2',
                      color: '#ef4444',
                      border: '1px solid #fecaca',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.875rem',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIntegrantes([...integrantes, { nombre: '', instrumento: '' }])}
            style={{
              marginTop: '0.875rem',
              padding: '0.5rem 0.875rem',
              backgroundColor: '#ffffff',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            + Añadir Integrante
          </button>
        </div>

        {/* Sección Multimedia */}
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1.25rem',
            borderRadius: '0.75rem',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
          }}
        >
          <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600, color: '#166534' }}>
            🎵 Multimedia & Links
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {canciones.map((can, i) => (
              <div
                key={can.id || i}
                style={{
                  padding: '0.875rem',
                  backgroundColor: '#ffffff',
                  borderRadius: '0.5rem',
                  border: '1px solid #dcfce7',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.02)',
                }}
              >
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Título de la canción"
                    value={can.titulo}
                    onChange={(e) => actualizarCancion(i, 'titulo', e.target.value)}
                    style={{ ...inputStyle, fontWeight: 600 }}
                  />
                  {canciones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => eliminarCancion(i)}
                      style={{
                        padding: '0.625rem 0.75rem',
                        backgroundColor: '#fef2f2',
                        color: '#ef4444',
                        border: '1px solid #fecaca',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <input
                    type="text"
                    placeholder="Link / Embed de Spotify"
                    value={can.spotify_embed_url}
                    onChange={(e) => actualizarCancion(i, 'spotify_embed_url', e.target.value)}
                    style={{ ...inputStyle, fontSize: '0.8125rem' }}
                  />
                  <input
                    type="text"
                    placeholder="Link / Embed de YouTube"
                    value={can.youtube_embed_url}
                    onChange={(e) => actualizarCancion(i, 'youtube_embed_url', e.target.value)}
                    style={{ ...inputStyle, fontSize: '0.8125rem' }}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              setCanciones([
                ...canciones,
                { titulo: '', spotify_embed_url: '', youtube_embed_url: '' },
              ])
            }
            style={{
              marginTop: '0.875rem',
              padding: '0.5rem 0.875rem',
              backgroundColor: '#ffffff',
              color: '#15803d',
              border: '1px solid #86efac',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            + Añadir Canción
          </button>
        </div>

        <button
          type="submit"
          disabled={cargando}
          style={{
            width: '100%',
            padding: '0.875rem',
            backgroundColor: cargando ? '#86efac' : '#22c55e',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: cargando ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 6px -1px rgba(34, 197, 94, 0.2)',
          }}
        >
          {cargando ? 'Guardando Cambios...' : 'Guardar Cambios Oficiales'}
        </button>
      </form>
    </div>
  );
}