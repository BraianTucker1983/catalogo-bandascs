import React, { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';

// --- TIPOS ---
type Paso = 1 | 2 | 3;

interface IntegranteInput {
  id?: string | number;
  tempId?: string;
  nombre: string;
  instrumento: string;
  foto?: File | null;
  fotoPreviewUrl?: string | null;
}

interface CancionInput {
  id?: string | number;
  tempId?: string;
  titulo: string;
  spotify_embed_url: string;
  youtube_embed_url: string;
}

export default function EditarBanda() {
  // Autenticación por palabra clave
  const [tokenInput, setTokenInput] = useState('');
  const [autenticado, setAutenticado] = useState(false);
  const [bandaId, setBandaId] = useState('');

  // Estados del Formulario por Pasos
  const [pasoActual, setPasoActual] = useState<Paso>(1);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  // Datos Generales
  const [nombre, setNombre] = useState('');
  const [genero, setGenero] = useState('');
  const [historia, setHistoria] = useState('');

  // Portada
  const [portada, setPortada] = useState<File | null>(null);
  const [portadaPreviewUrl, setPortadaPreviewUrl] = useState<string | null>(null);

  // Colecciones
  const [integrantes, setIntegrantes] = useState<IntegranteInput[]>([
    { tempId: crypto.randomUUID(), nombre: '', instrumento: '', foto: null, fotoPreviewUrl: null },
  ]);
  const [canciones, setCanciones] = useState<CancionInput[]>([
    { tempId: crypto.randomUUID(), titulo: '', spotify_embed_url: '', youtube_embed_url: '' },
  ]);

  // Respaldos para saber qué borrar en Supabase
  const [idsIntegrantesOriginales, setIdsIntegrantesOriginales] = useState<(string | number)[]>([]);
  const [idsCancionesOriginales, setIdsCancionesOriginales] = useState<(string | number)[]>([]);

  // --- UTILIDAD: CONVERSIÓN Y OPTIMIZACIÓN A WEBP ---
  const optimizarEConvertirAWebP = (archivo: File, maxAncho = 1200, calidad = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(archivo);
      img.src = objectUrl;

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let { width, height } = img;

        if (width > maxAncho) {
          height = Math.round((height * maxAncho) / width);
          width = maxAncho;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('No se pudo obtener el contexto Canvas 2D'));

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Error al comprimir la imagen'));
            const nombreSinExt = archivo.name.substring(0, archivo.name.lastIndexOf('.')) || archivo.name;
            const archivoOptimizado = new File([blob], `${nombreSinExt}.webp`, { type: 'image/webp' });
            resolve(archivoOptimizado);
          },
          'image/webp',
          calidad
        );
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      };
    });
  };

  // Detectar token en URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenUrl = urlParams.get('token');
    if (tokenUrl) {
      setTokenInput(tokenUrl);
      cargarDatosBanda(tokenUrl);
    }
  }, []);

  // --- CARGA DE DATOS DESDE SUPABASE ---
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
        .select('id, nombre, genero, historia, portada_url, palabra_clave')
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
          .select('id, nombre, instrumento, foto_url')
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
      if (bandaData.portada_url) {
        setPortadaPreviewUrl(bandaData.portada_url);
      }

      const intData = integrantesRes.data || [];
      const cancData = cancionesRes.data || [];

      setIdsIntegrantesOriginales(intData.map((i) => i.id));
      setIdsCancionesOriginales(cancData.map((c) => c.id));

      setIntegrantes(
        intData.length > 0
          ? intData.map((i) => ({
              id: i.id,
              tempId: crypto.randomUUID(),
              nombre: i.nombre || '',
              instrumento: i.instrumento || '',
              foto: null,
              fotoPreviewUrl: i.foto_url || null,
            }))
          : [{ tempId: crypto.randomUUID(), nombre: '', instrumento: '', foto: null, fotoPreviewUrl: null }]
      );

      setCanciones(
        cancData.length > 0
          ? cancData.map((c) => ({
              id: c.id,
              tempId: crypto.randomUUID(),
              titulo: c.titulo || '',
              spotify_embed_url: c.spotify_embed_url || '',
              youtube_embed_url: c.youtube_embed_url || '',
            }))
          : [{ tempId: crypto.randomUUID(), titulo: '', spotify_embed_url: '', youtube_embed_url: '' }]
      );

      setAutenticado(true);
      setMensaje(null);

      if (window.history.replaceState) {
        const cleanUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
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

  // --- NAVEGACIÓN PASOS ---
  const cambiarPaso = (delta: number) => {
    setPasoActual((prev) => {
      const nuevoPaso = prev + delta;
      if (nuevoPaso >= 1 && nuevoPaso <= 3) {
        return nuevoPaso as Paso;
      }
      return prev;
    });
  };

  // --- MANEJO DE PORTADA ---
  const manejarSeleccionPortada = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const archivoOriginal = e.target.files[0];

    try {
      setCargando(true);
      const archivoOptimizado = await optimizarEConvertirAWebP(archivoOriginal);

      if (portadaPreviewUrl && portadaPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(portadaPreviewUrl);
      }

      const previewUrl = URL.createObjectURL(archivoOptimizado);
      setPortada(archivoOptimizado);
      setPortadaPreviewUrl(previewUrl);
    } catch (error) {
      console.error('Error procesando portada:', error);
      alert('Error al procesar la imagen de portada.');
    } finally {
      setCargando(false);
    }
  };

  const eliminarPortada = () => {
    if (portadaPreviewUrl && portadaPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(portadaPreviewUrl);
    }
    setPortada(null);
    setPortadaPreviewUrl(null);
  };

  // --- MANEJO DE INTEGRANTES ---
  const actualizarIntegrante = (index: number, campo: keyof IntegranteInput, valor: any) => {
    setIntegrantes((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [campo]: valor } : item))
    );
  };

  const manejarFotoIntegrante = async (index: number, e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const archivoOriginal = e.target.files[0];
    const integranteActual = integrantes[index];

    try {
      setCargando(true);
      const archivoOptimizado = await optimizarEConvertirAWebP(archivoOriginal, 800, 0.75);

      if (integranteActual?.fotoPreviewUrl && integranteActual.fotoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(integranteActual.fotoPreviewUrl);
      }

      const previewUrl = URL.createObjectURL(archivoOptimizado);
      actualizarIntegrante(index, 'foto', archivoOptimizado);
      actualizarIntegrante(index, 'fotoPreviewUrl', previewUrl);
    } catch (error) {
      console.error('Error optimizando foto del integrante:', error);
      alert('Error al procesar la imagen del integrante.');
    } finally {
      setCargando(false);
    }
  };

  const eliminarIntegrante = (index: number) => {
    const integrante = integrantes[index];
    if (integrante?.fotoPreviewUrl && integrante.fotoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(integrante.fotoPreviewUrl);
    }
    setIntegrantes((prev) => prev.filter((_, i) => i !== index));
  };

  // --- MANEJO DE CANCIONES ---
  const actualizarCancion = (index: number, campo: keyof CancionInput, valor: string) => {
    setCanciones((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [campo]: valor } : item))
    );
  };

  const eliminarCancion = (index: number) => {
    setCanciones((prev) => prev.filter((_, i) => i !== index));
  };

  // --- GUARDADO FINAL A SUPABASE ---
  const handleGuardarCambios = async (e: FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensaje(null);

    try {
      // 1. Subir nueva portada si fue cambiada
      let urlPortadaFinal = portadaPreviewUrl;
      if (portada) {
        const rutaArchivo = `portadas/${Date.now()}_${portada.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('bandas')
          .upload(rutaArchivo, portada);

        if (uploadError) throw new Error(`Subida portada: ${uploadError.message}`);

        const { data: publicUrlData } = supabase.storage.from('bandas').getPublicUrl(uploadData.path);
        urlPortadaFinal = publicUrlData.publicUrl;
      }

      // 2. Actualizar datos generales de la banda
      const { error: errorBanda } = await supabase
        .from('bandas')
        .update({
          nombre,
          genero,
          historia,
          portada_url: urlPortadaFinal,
        })
        .eq('id', bandaId);

      if (errorBanda) throw new Error(`Banda: ${errorBanda.message}`);

      // 3. Procesar Integrantes
      const integrantesValidos = integrantes.filter((i) => i.nombre.trim() !== '');
      const idsActualesIntegrantes = integrantesValidos.map((i) => i.id).filter(Boolean) as (string | number)[];
      const idsABorrarIntegrantes = idsIntegrantesOriginales.filter(
        (id) => !idsActualesIntegrantes.includes(id)
      );

      // Borrar eliminados
      if (idsABorrarIntegrantes.length > 0) {
        const { error: errDelInt } = await supabase
          .from('integrantes')
          .delete()
          .in('id', idsABorrarIntegrantes);
        if (errDelInt) throw new Error(`Borrar integrantes: ${errDelInt.message}`);
      }

      // Insertar o actualizar integrantes
      for (const integrante of integrantesValidos) {
        let urlFotoIntegrante = integrante.fotoPreviewUrl || null;

        if (integrante.foto) {
          const rutaFoto = `integrantes/${Date.now()}_${integrante.foto.name}`;
          const { data: uploadFoto, error: errorFoto } = await supabase.storage
            .from('bandas')
            .upload(rutaFoto, integrante.foto);

          if (errorFoto) throw new Error(`Subida foto integrante: ${errorFoto.message}`);

          const { data: publicUrlFoto } = supabase.storage.from('bandas').getPublicUrl(uploadFoto.path);
          urlFotoIntegrante = publicUrlFoto.publicUrl;
        }

        const payload = {
          banda_id: bandaId,
          nombre: integrante.nombre.trim(),
          instrumento: integrante.instrumento.trim() || null,
          foto_url: urlFotoIntegrante,
        };

        if (integrante.id !== undefined) {
          const { error: errUpd } = await supabase.from('integrantes').update(payload).eq('id', integrante.id);
          if (errUpd) throw new Error(`Actualizar integrante: ${errUpd.message}`);
        } else {
          const { error: errIns } = await supabase.from('integrantes').insert([payload]);
          if (errIns) throw new Error(`Insertar integrante: ${errIns.message}`);
        }
      }

      // 4. Procesar Canciones
      const cancionesValidas = canciones.filter((c) => c.titulo.trim() !== '');
      const idsActualesCanciones = cancionesValidas.map((c) => c.id).filter(Boolean) as (string | number)[];
      const idsABorrarCanciones = idsCancionesOriginales.filter(
        (id) => !idsActualesCanciones.includes(id)
      );

      // Borrar canciones eliminadas
      if (idsABorrarCanciones.length > 0) {
        const { error: errDelCanc } = await supabase
          .from('canciones')
          .delete()
          .in('id', idsABorrarCanciones);
        if (errDelCanc) throw new Error(`Borrar canciones: ${errDelCanc.message}`);
      }

      // Insertar o actualizar canciones
      for (const cancion of cancionesValidas) {
        const payload = {
          banda_id: bandaId,
          titulo: cancion.titulo.trim(),
          spotify_embed_url: cancion.spotify_embed_url.trim() || null,
          youtube_embed_url: cancion.youtube_embed_url.trim() || null,
        };

        if (cancion.id !== undefined) {
          const { error: errUpd } = await supabase.from('canciones').update(payload).eq('id', cancion.id);
          if (errUpd) throw new Error(`Actualizar canción: ${errUpd.message}`);
        } else {
          const { error: errIns } = await supabase.from('canciones').insert([payload]);
          if (errIns) throw new Error(`Insertar canción: ${errIns.message}`);
        }
      }

      await cargarDatosBanda(tokenInput);
      setMensaje({ tipo: 'exito', texto: '¡El perfil de la banda ha sido actualizado con éxito!' });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al guardar los cambios.';
      setMensaje({ tipo: 'error', texto: errorMsg });
    } finally {
      setCargando(false);
    }
  };

  // --- ESTILOS EN LÍNEA COHERENTES CON EL FORMULARIO ---
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

  // VISTA NO AUTENTICADO
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
            Introduce la palabra clave secreta para acceder a la edición.
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

  // VISTA EDICIÓN AUTENTICADO
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
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
          Editar Perfil: <span style={{ color: '#2563eb' }}>{nombre || 'Mi Banda'}</span>
        </h2>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280' }}>
          Paso {pasoActual} de 3
        </span>
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
        {/* PASO 1: INFORMACIÓN GENERAL Y PORTADA */}
        {pasoActual === 1 && (
          <div>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>
              Paso 1: Información General y Portada
            </h3>

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

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
                Imagen de Portada
              </label>
              <input type="file" accept="image/*" onChange={manejarSeleccionPortada} style={inputStyle} />

              {portadaPreviewUrl && (
                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img
                    src={portadaPreviewUrl}
                    alt="Vista previa portada"
                    style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}
                  />
                  <button
                    type="button"
                    onClick={eliminarPortada}
                    style={{
                      padding: '0.375rem 0.75rem',
                      backgroundColor: '#fef2f2',
                      color: '#ef4444',
                      border: '1px solid #fecaca',
                      borderRadius: '0.375rem',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                    }}
                  >
                    Eliminar Portada
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => cambiarPaso(1)}
                disabled={!nombre || !genero}
                style={{
                  padding: '0.625rem 1.25rem',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: INTEGRANTES */}
        {pasoActual === 2 && (
          <div>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>
              Paso 2: Integrantes
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {integrantes.map((int, index) => (
                <div
                  key={int.id || int.tempId}
                  style={{
                    padding: '1rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '0.75rem',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                      Integrante #{index + 1}
                    </span>
                    {integrantes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarIntegrante(index)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#fef2f2',
                          color: '#ef4444',
                          border: '1px solid #fecaca',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                      >
                        ✕ Eliminar
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Nombre"
                      value={int.nombre}
                      onChange={(e) => actualizarIntegrante(index, 'nombre', e.target.value)}
                      style={inputStyle}
                    />
                    <input
                      type="text"
                      placeholder="Instrumento / Rol"
                      value={int.instrumento}
                      onChange={(e) => actualizarIntegrante(index, 'instrumento', e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ marginTop: '0.5rem' }}>
                    <input type="file" accept="image/*" onChange={(e) => manejarFotoIntegrante(index, e)} style={inputStyle} />
                    {int.fotoPreviewUrl && (
                      <img
                        src={int.fotoPreviewUrl}
                        alt="Foto integrante"
                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50%', marginTop: '0.5rem' }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setIntegrantes([
                  ...integrantes,
                  { tempId: crypto.randomUUID(), nombre: '', instrumento: '', foto: null, fotoPreviewUrl: null },
                ])
              }
              style={{
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

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => cambiarPaso(-1)}
                style={{
                  padding: '0.625rem 1.25rem',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={() => cambiarPaso(1)}
                style={{
                  padding: '0.625rem 1.25rem',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: CANCIONES Y MULTIMEDIA */}
        {pasoActual === 3 && (
          <div>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>
              Paso 3: Canciones & Links Multimedia
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {canciones.map((can, index) => (
                <div
                  key={can.id || can.tempId}
                  style={{
                    padding: '1rem',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '0.75rem',
                    border: '1px solid #bbf7d0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Título de la canción"
                      value={can.titulo}
                      onChange={(e) => actualizarCancion(index, 'titulo', e.target.value)}
                      style={{ ...inputStyle, fontWeight: 600 }}
                    />
                    {canciones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarCancion(index)}
                        style={{
                          marginLeft: '0.5rem',
                          padding: '0.625rem 0.75rem',
                          backgroundColor: '#fef2f2',
                          color: '#ef4444',
                          border: '1px solid #fecaca',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Link / Embed de Spotify"
                      value={can.spotify_embed_url}
                      onChange={(e) => actualizarCancion(index, 'spotify_embed_url', e.target.value)}
                      style={{ ...inputStyle, fontSize: '0.8125rem' }}
                    />
                    <input
                      type="text"
                      placeholder="Link / Embed de YouTube"
                      value={can.youtube_embed_url}
                      onChange={(e) => actualizarCancion(index, 'youtube_embed_url', e.target.value)}
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
                  { tempId: crypto.randomUUID(), titulo: '', spotify_embed_url: '', youtube_embed_url: '' },
                ])
              }
              style={{
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

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
              <button
                type="button"
                onClick={() => cambiarPaso(-1)}
                style={{
                  padding: '0.625rem 1.25rem',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Atrás
              </button>
              <button
                type="submit"
                disabled={cargando}
                style={{
                  padding: '0.75rem 1.5rem',
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
            </div>
          </div>
        )}
      </form>
    </div>
  );
}