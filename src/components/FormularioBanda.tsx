import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface IntegranteInput {
  nombre: string;
  instrumento: string;
}

interface CancionInput {
  titulo: string;
  spotify_embed_url: string;
  youtube_embed_url: string;
}

export default function FormularioBanda() {
  const [nombre, setNombre] = useState('');
  const [genero, setGenero] = useState('');
  const [historia, setHistoria] = useState('');
  const [plan, setPlan] = useState<'gratis' | 'premium'>('gratis');
  
  const [integrantes, setIntegrantes] = useState<IntegranteInput[]>([
    { nombre: '', instrumento: '' }
  ]);

  const [canciones, setCanciones] = useState<CancionInput[]>([
    { titulo: '', spotify_embed_url: '', youtube_embed_url: '' }
  ]);

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  const handleAgregarIntegrante = () => {
    setIntegrantes([...integrantes, { nombre: '', instrumento: '' }]);
  };

  const handleIntegranteChange = (index: number, campo: keyof IntegranteInput, valor: string) => {
    const nuevos = [...integrantes];
    nuevos[index][campo] = valor;
    setIntegrantes(nuevos);
  };

  const handleEliminarIntegrante = (index: number) => {
    setIntegrantes(integrantes.filter((_, i) => i !== index));
  };

  const handleAgregarCancion = () => {
    setCanciones([...canciones, { titulo: '', spotify_embed_url: '', youtube_embed_url: '' }]);
  };

  const handleCancionChange = (index: number, campo: keyof CancionInput, valor: string) => {
    const nuevas = [...canciones];
    nuevas[index][campo] = valor;
    setCanciones(nuevas);
  };

  const handleEliminarCancion = (index: number) => {
    setCanciones(canciones.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensaje(null);

    try {
      const { data: nuevaBanda, error: errorBanda } = await supabase
        .from('bandas')
        .insert([
          {
            nombre,
            genero,
            historia,
            plan,
            aprobado: false
          }
        ])
        .select()
        .single();

      if (errorBanda) throw errorBanda;

      const bandaId = nuevaBanda.id;

      // CORRECCIÓN: Ahora guardamos el instrumento para TODOS los planes
      const integrantesFiltrados = integrantes
        .filter(i => i.nombre.trim() !== '')
        .map(i => ({
          banda_id: bandaId,
          nombre: i.nombre,
          instrumento: i.instrumento.trim() !== '' ? i.instrumento : null
        }));

      if (integrantesFiltrados.length > 0) {
        const { error: errorIntegrantes } = await supabase
          .from('integrantes')
          .insert(integrantesFiltrados);
        
        if (errorIntegrantes) throw errorIntegrantes;
      }

      if (plan === 'premium') {
        const cancionesFiltradas = canciones
          .filter(c => c.titulo.trim() !== '')
          .map(c => ({
            banda_id: bandaId,
            titulo: c.titulo,
            spotify_embed_url: c.spotify_embed_url || null,
            youtube_embed_url: c.youtube_embed_url || null
          }));

        if (cancionesFiltradas.length > 0) {
          const { error: errorCanciones } = await supabase
            .from('canciones')
            .insert(cancionesFiltradas);

          if (errorCanciones) throw errorCanciones;
        }
      }

      const { data: bandaCreada } = await supabase
        .from('bandas')
        .select('access_token')
        .eq('id', bandaId)
        .single();

      const linkSecreto = `${window.location.origin}?token=${bandaCreada?.access_token}`;

      setMensaje({ 
        tipo: 'exito', 
        texto: `¡Banda registrada con éxito! Pendiente de aprobación. IMPORTANTE: Guardá este enlace secreto para editar tu perfil cuando quieras: ${linkSecreto}` 
      });
      
      setNombre('');
      setGenero('');
      setHistoria('');
      setPlan('gratis');
      setIntegrantes([{ nombre: '', instrumento: '' }]);
      setCanciones([{ titulo: '', spotify_embed_url: '', youtube_embed_url: '' }]);

    } catch (error: any) {
      console.error(error);
      setMensaje({ tipo: 'error', texto: `Error al registrar: ${error.message}` });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1.5rem', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'sans-serif' }}>
      <h2>Registrar Banda en Coronel Suárez</h2>
      
      {mensaje && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '15px', 
          borderRadius: '4px', 
          backgroundColor: mensaje.tipo === 'exito' ? '#d4edda' : '#f8d7da',
          color: mensaje.tipo === 'exito' ? '#155724' : '#721c24',
          wordBreak: 'break-word'
        }}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Selecciona tu Plan:</label>
          <div style={{ display: 'flex', gap: '20px' }}>
            <label>
              <input type="radio" name="plan" value="gratis" checked={plan === 'gratis'} onChange={() => setPlan('gratis')} /> Gratis 🆓
            </label>
            <label>
              <input type="radio" name="plan" value="premium" checked={plan === 'premium'} onChange={() => setPlan('premium')} /> Premium 👑
            </label>
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: 'bold' }}>Nombre de la Banda *</label>
          <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px' }}/>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: 'bold' }}>Género Musical *</label>
          <input type="text" placeholder="ej. Rock, Folklore, Cumbia..." required value={genero} onChange={(e) => setGenero(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px' }}/>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: 'bold' }}>Historia / Descripción</label>
          <textarea rows={4} value={historia} onChange={(e) => setHistoria(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px' }}/>
        </div>

        <div style={{ marginBottom: '1.5rem', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Integrantes</h4>
          {integrantes.map((integrante, index) => (
            <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="Nombre" 
                required
                value={integrante.nombre}
                onChange={(e) => handleIntegranteChange(index, 'nombre', e.target.value)}
                style={{ flex: 1, padding: '6px' }}
              />
              
              {/* CORRECCIÓN: El campo instrumento ahora se muestra SIEMPRE */}
              <input 
                type="text" 
                placeholder="Instrumento (ej. Batería)" 
                value={integrante.instrumento}
                onChange={(e) => handleIntegranteChange(index, 'instrumento', e.target.value)}
                style={{ flex: 1, padding: '6px' }}
              />

              {integrantes.length > 1 && (
                <button type="button" onClick={() => handleEliminarIntegrante(index)} style={{ padding: '6px', cursor: 'pointer' }}>❌</button>
              )}
            </div>
          ))}
          <button type="button" onClick={handleAgregarIntegrante} style={{ marginTop: '5px', cursor: 'pointer' }}>
            + Añadir Integrante
          </button>
        </div>

        {plan === 'premium' && (
          <div style={{ marginBottom: '1.5rem', padding: '10px', border: '1px solid #ffd700', borderRadius: '4px', backgroundColor: '#fffdf0' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#b8860b' }}>Contenido Multimedia 👑</h4>
            {canciones.map((cancion, index) => (
              <div key={index} style={{ marginBottom: '15px', borderBottom: '1px dashed #ccc', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
                  <input type="text" placeholder="Título de la canción" value={cancion.titulo} onChange={(e) => handleCancionChange(index, 'titulo', e.target.value)} style={{ flex: 1, padding: '6px' }}/>
                  {canciones.length > 1 && (
                    <button type="button" onClick={() => handleEliminarCancion(index)} style={{ padding: '6px', cursor: 'pointer' }}>❌</button>
                  )}
                </div>
                <input type="text" placeholder="Link de Embed Spotify (opcional)" value={cancion.spotify_embed_url} onChange={(e) => handleCancionChange(index, 'spotify_embed_url', e.target.value)} style={{ width: '100%', padding: '6px', marginBottom: '5px', fontSize: '12px' }}/>
                <input type="text" placeholder="Link de Embed YouTube (opcional)" value={cancion.youtube_embed_url} onChange={(e) => handleCancionChange(index, 'youtube_embed_url', e.target.value)} style={{ width: '100%', padding: '6px', fontSize: '12px' }}/>
              </div>
            ))}
            <button type="button" onClick={handleAgregarCancion} style={{ cursor: 'pointer' }}>+ Añadir Canción</button>
          </div>
        )}

        <button type="submit" disabled={cargando} style={{ width: '100%', padding: '12px', backgroundColor: cargando ? '#ccc' : '#007bff', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: cargando ? 'not-allowed' : 'pointer' }}>
          {cargando ? 'Registrando...' : 'Registrar Banda'}
        </button>
      </form>
    </div>
  );
}