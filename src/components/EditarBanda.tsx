import React, { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Users, 
  Music, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Upload, 
  Save, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles,   
  Disc,
  Key,
  Mail,
  X
} from 'lucide-react';

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
  // Autenticación por email + palabra clave
  const [emailInput, setEmailInput] = useState('');
  const [palabraClaveInput, setPalabraClaveInput] = useState('');
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
  const [colorTema, setColorTema] = useState('#6366f1');

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

  // Gestión de Memoria (URLs de previsualización blob)
  const activeObjectUrls = useRef<Set<string>>(new Set());

  const crearObjectUrl = (file: File): string => {
    const url = URL.createObjectURL(file);
    activeObjectUrls.current.add(url);
    return url;
  };

  const revocarObjectUrl = (url?: string | null) => {
    if (url && activeObjectUrls.current.has(url)) {
      URL.revokeObjectURL(url);
      activeObjectUrls.current.delete(url);
    }
  };

  useEffect(() => {
    return () => {
      activeObjectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      activeObjectUrls.current.clear();
    };
  }, []);

  // --- OPTIMIZACIÓN A WEBP ---
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

  // Detectar token o email en URL si fuera necesario
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailUrl = urlParams.get('email');
    const tokenUrl = urlParams.get('token');
    
    if (emailUrl && tokenUrl) {
      setEmailInput(emailUrl);
      setPalabraClaveInput(tokenUrl);
      cargarDatosBanda(emailUrl, tokenUrl);
    }
  }, []);

  // --- CARGA DE DATOS DESDE SUPABASE ---
  const cargarDatosBanda = async (email: string, palabraClave: string) => {
    const emailLimpio = email.trim().toLowerCase();
    const palabraClaveLimpia = palabraClave.trim().toLowerCase();

    if (!emailLimpio || !palabraClaveLimpia) {
      setMensaje({ tipo: 'error', texto: 'Por favor, ingresa tu email y palabra clave.' });
      return;
    }

    setCargando(true);
    setMensaje(null);

    try {
      const { data: bandaData, error: bandaError } = await supabase
        .from('bandas')
        .select('id, nombre, genero, historia, url_portada, color_tema, palabra_clave, email')
        .eq('email', emailLimpio)
        .eq('palabra_clave', palabraClaveLimpia)
        .maybeSingle();

      if (bandaError) throw bandaError;

      if (!bandaData) {
        setMensaje({
          tipo: 'error',
          texto: 'Email o palabra clave incorrectos. Verifícalos e inténtalo de nuevo.',
        });
        setAutenticado(false);
        return;
      }

      const [integrantesRes, cancionesRes] = await Promise.all([
        supabase
          .from('integrantes')
          .select('id, nombre, instrumento, rol, foto_url')
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
      if (bandaData.color_tema) setColorTema(bandaData.color_tema);
      if (bandaData.url_portada) {
        setPortadaPreviewUrl(bandaData.url_portada);
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
              instrumento: i.instrumento || i.rol || '',
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

  // --- MANEJO DE PORTADA ---
  const manejarSeleccionPortada = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const archivoOriginal = e.target.files[0];

    try {
      setCargando(true);
      const archivoOptimizado = await optimizarEConvertirAWebP(archivoOriginal);
      revocarObjectUrl(portadaPreviewUrl);

      const previewUrl = crearObjectUrl(archivoOptimizado);
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
    revocarObjectUrl(portadaPreviewUrl);
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

      revocarObjectUrl(integranteActual?.fotoPreviewUrl);

      const previewUrl = crearObjectUrl(archivoOptimizado);
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
    revocarObjectUrl(integrante?.fotoPreviewUrl);
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
          .from('Bandas')
          .upload(rutaArchivo, portada, { contentType: 'image/webp', upsert: true });

        if (uploadError) throw new Error(`Subida portada: ${uploadError.message}`);

        const { data: publicUrlData } = supabase.storage.from('Bandas').getPublicUrl(uploadData.path);
        urlPortadaFinal = publicUrlData.publicUrl;
      }

      // 2. Actualizar datos generales
      const { error: errorBanda } = await supabase
        .from('bandas')
        .update({
          nombre,
          genero,
          historia,
          color_tema: colorTema,
          url_portada: urlPortadaFinal,
        })
        .eq('id', bandaId);

      if (errorBanda) throw new Error(`Banda: ${errorBanda.message}`);

      // 3. Procesar Integrantes
      const integrantesValidos = integrantes.filter((i) => i.nombre.trim() !== '');
      const idsActualesIntegrantes = integrantesValidos.map((i) => i.id).filter(Boolean) as (string | number)[];
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

      for (const integrante of integrantesValidos) {
        let urlFotoIntegrante = integrante.fotoPreviewUrl || null;

        if (integrante.foto) {
          const rutaFoto = `integrantes/${Date.now()}_${integrante.foto.name}`;
          const { data: uploadFoto, error: errorFoto } = await supabase.storage
            .from('Bandas')
            .upload(rutaFoto, integrante.foto, { contentType: 'image/webp', upsert: true });

          if (errorFoto) throw new Error(`Subida foto integrante: ${errorFoto.message}`);

          const { data: publicUrlFoto } = supabase.storage.from('Bandas').getPublicUrl(uploadFoto.path);
          urlFotoIntegrante = publicUrlFoto.publicUrl;
        }

        const payload = {
          banda_id: bandaId,
          nombre: integrante.nombre.trim(),
          instrumento: integrante.instrumento.trim() || null,
          rol: integrante.instrumento.trim() || null,
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

      if (idsABorrarCanciones.length > 0) {
        const { error: errDelCanc } = await supabase
          .from('canciones')
          .delete()
          .in('id', idsABorrarCanciones);
        if (errDelCanc) throw new Error(`Borrar canciones: ${errDelCanc.message}`);
      }

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

      await cargarDatosBanda(emailInput, palabraClaveInput);
      setMensaje({ tipo: 'exito', texto: '¡El perfil de la banda ha sido actualizado con éxito!' });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al guardar los cambios.';
      setMensaje({ tipo: 'error', texto: errorMsg });
    } finally {
      setCargando(false);
    }
  };

  // --- VISTA ACCESO (NO AUTENTICADO) ---
  if (!autenticado) {
    return (
      <div className="max-w-md mx-auto my-12 bg-slate-900 text-slate-100 p-8 rounded-2xl shadow-2xl border border-slate-800">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center text-xl mx-auto mb-3 border border-indigo-500/20">
            <Key className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-extrabold text-white">Modificar mi Banda</h3>
          <p className="text-slate-400 text-sm mt-1">
            Ingresa tu email y palabra clave para acceder a la edición.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            cargarDatosBanda(emailInput, palabraClaveInput);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-400" /> Correo Electrónico
            </label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-400" /> Palabra Clave
            </label>
            <input
              type="password"
              placeholder="Tu palabra clave personalizada"
              value={palabraClaveInput}
              onChange={(e) => setPalabraClaveInput(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-lg font-semibold text-sm transition shadow-lg flex items-center justify-center gap-2 mt-2"
          >
            {cargando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Verificando...
              </>
            ) : (
              'Acceder al Perfil'
            )}
          </button>
        </form>

        {mensaje && (
          <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${
            mensaje.tipo === 'exito' 
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}>
            {mensaje.tipo === 'exito' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <p className="text-sm font-medium">{mensaje.texto}</p>
          </div>
        )}
      </div>
    );
  }

  // --- VISTA PANEL EDICIÓN (AUTENTICADO) ---
  return (
    <div className="max-w-5xl mx-auto bg-slate-900 text-slate-100 rounded-2xl shadow-2xl overflow-hidden border border-slate-800 my-8">
      
      {/* HEADER DINÁMICO */}
      <div 
        className="relative p-8 transition-all duration-300 bg-cover bg-center"
        style={{
          backgroundColor: colorTema,
          backgroundImage: portadaPreviewUrl 
            ? `linear-gradient(to bottom, rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.95)), url(${portadaPreviewUrl})` 
            : `linear-gradient(to bottom, rgba(15, 23, 42, 0.2), rgba(15, 23, 42, 0.95))`
        }}
      >
        <div className="flex justify-between items-start relative z-10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Edición de Perfil
            </span>
            <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
              {nombre || 'Mi Banda'}
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              {genero ? genero : 'Personaliza la información de tu banda'}
            </p>
          </div>
        </div>

        {/* NAVEGACIÓN PASOS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-8 relative z-10 w-full max-w-full">
          {[
            { id: 1, label: 'Información Básica', icon: Users },
            { id: 2, label: 'Integrantes', icon: Users },
            { id: 3, label: 'Música y Links', icon: Music },
          ].map((paso) => {
            const Icon = paso.icon;
            const activo = pasoActual === paso.id;
            return (
              <button
                key={paso.id}
                type="button"
                onClick={() => setPasoActual(paso.id as Paso)}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 sm:px-4 rounded-lg text-xs sm:text-sm transition-all text-center ${
                  activo 
                    ? 'bg-white text-slate-900 shadow-lg font-bold' 
                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 backdrop-blur-sm'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{paso.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FORMULARIO DE EDICIÓN */}
      <form onSubmit={handleGuardarCambios} className="p-8">
        
        {/* MENSAJES DE ESTADO */}
        {mensaje && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            mensaje.tipo === 'exito' 
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}>
            {mensaje.tipo === 'exito' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <p className="text-sm font-medium">{mensaje.texto}</p>
          </div>
        )}

        {/* PASO 1: INFORMACIÓN BÁSICA Y PORTADA */}
        {pasoActual === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre de la Banda <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Género Musical
                </label>
                <input
                  type="text"
                  value={genero}
                  onChange={(e) => setGenero(e.target.value)}
                  placeholder="Ej: Rock, Pop, Metal..."
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Color de Marca / Tema
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={colorTema}
                  onChange={(e) => setColorTema(e.target.value)}
                  className="h-10 w-20 bg-slate-800 border border-slate-700 rounded cursor-pointer"
                />
                <span className="text-xs text-slate-400">
                  Ajusta el color que identificará tu ficha en la plataforma.
                </span>
              </div>
            </div>

            {/* Subida y Previsualización de Portada */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Imagen de Portada
              </label>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-800/30 hover:bg-slate-800/60 transition group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-slate-500 group-hover:text-indigo-400 transition" />
                      <p className="text-xs text-slate-400">
                        <span className="font-semibold text-slate-300">Haz clic para cambiar imagen</span> o arrastra y suelta
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">PNG, JPG o WEBP (Se optimizará automáticamente)</p>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={manejarSeleccionPortada} 
                      className="hidden" 
                    />
                  </label>
                </div>

                {portadaPreviewUrl && (
                  <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border border-slate-700/60">
                    <div className="flex items-center gap-3">
                      <img
                        src={portadaPreviewUrl}
                        alt="Portada"
                        className="w-16 h-12 object-cover rounded-lg border border-slate-700"
                      />
                      <span className="text-xs text-slate-300">Imagen de portada seleccionada</span>
                    </div>
                    <button
                      type="button"
                      onClick={eliminarPortada}
                      className="p-2 text-slate-400 hover:text-rose-400 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Biografía / Historia
              </label>
              <textarea
                rows={4}
                value={historia}
                onChange={(e) => setHistoria(e.target.value)}
                placeholder="Cuenta la trayectoria, discos, novedades..."
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
          </div>
        )}

        {/* PASO 2: INTEGRANTES */}
        {pasoActual === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-200">Miembros de la Banda</h3>
                <p className="text-xs text-slate-400">Gestiona la formación actual</p>
              </div>
              <button
                type="button"
                onClick={() => setIntegrantes([...integrantes, { tempId: crypto.randomUUID(), nombre: '', instrumento: '', foto: null, fotoPreviewUrl: null }])}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition shadow"
              >
                <Plus className="w-4 h-4" /> Agregar Miembro
              </button>
            </div>

            {integrantes.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/20 rounded-xl border border-slate-800">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No has añadido integrantes todavía.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrantes.map((int, index) => (
                  <div key={int.id || int.tempId} className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl flex gap-4 items-start relative group">
                    <button
                      type="button"
                      onClick={() => eliminarIntegrante(index)}
                      className="absolute top-3 right-3 text-slate-500 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <label className="relative w-16 h-16 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center cursor-pointer overflow-hidden border border-slate-600 group-hover:border-indigo-500 transition">
                      {int.fotoPreviewUrl ? (
                        <img src={int.fotoPreviewUrl} alt="Integrante" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-400" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => manejarFotoIntegrante(index, e)}
                      />
                    </label>

                    <div className="flex-1 space-y-2 pr-6">
                      <input
                        type="text"
                        placeholder="Nombre del integrante"
                        value={int.nombre}
                        onChange={(e) => actualizarIntegrante(index, 'nombre', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder="Instrumento / Rol"
                        value={int.instrumento}
                        onChange={(e) => actualizarIntegrante(index, 'instrumento', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PASO 3: CANCIONES Y MULTIMEDIA */}
        {pasoActual === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-200">Canciones y Enlaces</h3>
                <p className="text-xs text-slate-400">Enlaza tus temas o reproductores</p>
              </div>
              <button
                type="button"
                onClick={() => setCanciones([...canciones, { tempId: crypto.randomUUID(), titulo: '', spotify_embed_url: '', youtube_embed_url: '' }])}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition shadow"
              >
                <Plus className="w-4 h-4" /> Añadir Canción
              </button>
            </div>

            {canciones.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/20 rounded-xl border border-slate-800">
                <Disc className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No has agregado canciones en la lista.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {canciones.map((can, index) => (
                  <div key={can.id || can.tempId} className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-3 relative">
                    <div className="flex justify-between items-center gap-3">
                      <input
                        type="text"
                        placeholder="Título de la canción"
                        value={can.titulo}
                        onChange={(e) => actualizarCancion(index, 'titulo', e.target.value)}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm font-semibold text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => eliminarCancion(index)}
                        className="p-2 text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Embed / Link de Spotify"
                        value={can.spotify_embed_url}
                        onChange={(e) => actualizarCancion(index, 'spotify_embed_url', e.target.value)}
                        className="w-full bg-slate-800/80 border border-slate-700/80 rounded px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder="Embed / Link de YouTube"
                        value={can.youtube_embed_url}
                        onChange={(e) => actualizarCancion(index, 'youtube_embed_url', e.target.value)}
                        className="w-full bg-slate-800/80 border border-slate-700/80 rounded px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ACCIONES DE BOTONES INFERIORES */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center">
          <div>
            {pasoActual > 1 && (
              <button
                type="button"
                onClick={() => setPasoActual((pasoActual - 1) as Paso)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition"
              >
                <ArrowLeft className="w-4 h-4" /> Anterior
              </button>
            )}
          </div>

          <div className="flex gap-3">
            {pasoActual < 3 ? (
              <button
                type="button"
                onClick={() => setPasoActual((pasoActual + 1) as Paso)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition shadow-lg"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="submit"
                disabled={cargando}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-lg text-sm font-semibold transition shadow-lg disabled:cursor-not-allowed"
              >
                {cargando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Guardar Cambios
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </form>
    </div>
  );
}