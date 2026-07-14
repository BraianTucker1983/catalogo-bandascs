import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface IntegranteInput { nombre: string; instrumento: string; }
interface CancionInput { titulo: string; spotify_embed_url: string; youtube_embed_url: string; }

export default function EditarBanda() {
  const [tokenInput, setTokenInput] = useState('');
  const [autenticado, setAutenticado] = useState(false);
  const [bandaId, setBandaId] = useState('');
  
  // Estados de los campos
  const [nombre, setNombre] = useState('');
  const [genero, setGenero] = useState('');
  const [historia, setHistoria] = useState('');
  const [plan, setPlan] = useState<'gratis' | 'premium'>('gratis');
  const [integrantes, setIntegrantes] = useState<IntegranteInput[]>([{ nombre: '', instrumento: '' }]);
  const [canciones, setCanciones] = useState<CancionInput[]>([{ titulo: '', spotify_embed_url: '', youtube_embed_url: '' }]);
  
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  // Leer si el token viene directo en la URL (?token=xxxx)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenUrl = urlParams.get('token');
    if (tokenUrl) {
      setTokenInput(tokenUrl);
      cargarDatosBanda(tokenUrl);
    }
  }, []);

  const cargarDatosBanda = async (token: string) => {
    setCargando(true);
    setMensaje(null);

    const { data: banda, error: errorBanda } = await supabase
      .from('bandas')
      .select(`
        id, nombre, genero, historia, plan,
        integrantes ( nombre, instrumento ),
        canciones ( titulo, spotify_embed_url, youtube_embed_url )
      `)
      .eq('access_token', token)
      .single();

    if (errorBanda || !banda) {
      setMensaje({ tipo: 'error', texto: 'Código secreto inválido. Revisalo e intentalo de nuevo.' });
      setAutenticado(false);
    } else {
      setBandaId(banda.id);
      setNombre(banda.nombre);
      setGenero(banda.genero);
      setHistoria(banda.historia || '');
      setPlan(banda.plan as 'gratis' | 'premium');
      if (banda.integrantes && banda.integrantes.length > 0) setIntegrantes(banda.integrantes as any);
      if (banda.canciones && banda.canciones.length > 0) setCanciones(banda.canciones as any);
      setAutenticado(true);
    }
    setCargando(false);
  };

  const handleGuardarCambios = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensaje(null);

    try {
      // 1. Actualizar datos de la banda
      await supabase.from('bandas').update({ nombre, genero, historia }).eq('id', bandaId);

      // 2. Actualizar Integrantes (Borrar viejos e insertar nuevos)
      await supabase.from('integrantes').delete().eq('banda_id', bandaId);
      
      // MODIFICACIÓN: Guarda instrumentos para cualquiera de los dos planes
      const nuevosIntegrantes = integrantes.filter(i => i.nombre.trim() !== '').map(i => ({
        banda_id: bandaId,
        nombre: i.nombre,
        instrumento: i.instrumento.trim() !== '' ? i.instrumento : null
      }));
      if (nuevosIntegrantes.length > 0) await supabase.from('integrantes').insert(nuevosIntegrantes);

      // 3. Actualizar Canciones (Solo Premium)
      await supabase.from('canciones').delete().eq('banda_id', bandaId);
      if (plan === 'premium') {
        const nuevasCanciones = canciones.filter(c => c.titulo.trim() !== '').map(c => ({
          banda_id: bandaId,
          titulo: c.titulo,
          spotify_embed_url: c.spotify_embed_url || null,
          youtube_embed_url: c.youtube_embed_url || null
        }));
        if (nuevasCanciones.length > 0) await supabase.from('canciones').insert(nuevasCanciones);
      }

      setMensaje({ tipo: 'exito', texto: '¡Tu perfil musical ha sido actualizado con éxito!' });
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: `Error al guardar: ${error.message}` });
    } finally {
      setCargando(false);
    }
  };

  if (!autenticado) {
    return (
      <div style={{ maxWidth: '500px', margin: '2rem auto', padding: '1.5rem', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fff', color: '#000' }}>
        <h3>🔑 Modificar mi Banda</h3>
        <p style={{ fontSize: '14px', color: '#666' }}>Introduce el código secreto o accede mediante el link que se te dio al registrar la banda.</p>
        <input 
          type="text" 
          placeholder="Pegar código secreto aquí..." 
          value={tokenInput} 
          onChange={(e) => setTokenInput(e.target.value)} 
          style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }}
        />
        <button onClick={() => cargarDatosBanda(tokenInput)} disabled={cargando} style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
          {cargando ? 'Verificando...' : 'Editar Perfil'}
        </button>
        {mensaje && <p style={{ color: 'red', marginTop: '10px' }}>{mensaje.texto}</p>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1.5rem', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fff', color: '#000' }}>
      <h2>Editar Perfil de: {nombre}</h2>
      {mensaje && <div style={{ padding: '10px', marginBottom: '15px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px' }}>{mensaje.texto}</div>}
      
      <form onSubmit={handleGuardarCambios}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontWeight: 'bold' }}>Nombre de la Banda</label>
          <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px' }}/>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontWeight: 'bold' }}>Género</label>
          <input type="text" required value={genero} onChange={(e) => setGenero(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px' }}/>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontWeight: 'bold' }}>Biografía / Historia</label>
          <textarea rows={4} value={historia} onChange={(e) => setHistoria(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px' }}/>
        </div>

        {/* Integrantes dinámicos (Permite instrumentos para todos) */}
        <div style={{ marginBottom: '1.5rem', padding: '10px', border: '1px solid #ddd' }}>
          <h4>Integrantes actuales</h4>
          {integrantes.map((int, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
              <input type="text" placeholder="Nombre" value={int.nombre} onChange={(e) => {
                const n = [...integrantes]; n[i].nombre = e.target.value; setIntegrantes(n);
              }} style={{ flex: 1, padding: '6px' }}/>
              
              <input type="text" placeholder="Instrumento" value={int.instrumento || ''} onChange={(e) => {
                const n = [...integrantes]; n[i].instrumento = e.target.value; setIntegrantes(n);
              }} style={{ flex: 1, padding: '6px' }}/>
            </div>
          ))}
          <button type="button" onClick={() => setIntegrantes([...integrantes, { nombre: '', instrumento: '' }])}>+ Añadir Integrante</button>
        </div>

        {/* Canciones (Solo Premium) */}
        {plan === 'premium' && (
          <div style={{ marginBottom: '1.5rem', padding: '10px', border: '1px solid #ffd700', backgroundColor: '#fffdf0' }}>
            <h4>Multimedia 👑</h4>
            {canciones.map((can, i) => (
              <div key={i} style={{ marginBottom: '10px' }}>
                <input type="text" placeholder="Título" value={can.titulo} onChange={(e) => {
                  const n = [...canciones]; n[i].titulo = e.target.value; setCanciones(n);
                }} style={{ width: '100%', padding: '6px', marginBottom: '3px' }}/>
                <input type="text" placeholder="Link Spotify" value={can.spotify_embed_url || ''} onChange={(e) => {
                  const n = [...canciones]; n[i].spotify_embed_url = e.target.value; setCanciones(n);
                }} style={{ width: '100%', padding: '6px', marginBottom: '3px', fontSize: '12px' }}/>
                <input type="text" placeholder="Link YouTube" value={can.youtube_embed_url || ''} onChange={(e) => {
                  const n = [...canciones]; n[i].youtube_embed_url = e.target.value; setCanciones(n);
                }} style={{ width: '100%', padding: '6px', fontSize: '12px' }}/>
              </div>
            ))}
            <button type="button" onClick={() => setCanciones([...canciones, { titulo: '', spotify_embed_url: '', youtube_embed_url: '' }])}>+ Añadir Canción</button>
          </div>
        )}

        <button type="submit" disabled={cargando} style={{ width: '100%', padding: '12px', backgroundColor: '#22c55e', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
          {cargando ? 'Guardando...' : 'Guardar Cambios Oficiales'}
        </button>
      </form>
    </div>
  );
}