import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import emailjs from '@emailjs/browser';
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
  HelpCircle,
  Eye,
  Disc,
  X
} from 'lucide-react';

interface FormBandaProps {
  onCancel?: () => void;
  onSuccess?: () => void;
}

interface Integrante {
  id: string;
  nombre: string;
  rol: string;
  foto_file: File | null;
  foto_preview: string | null;
}

interface Cancion {
  id: string;
  titulo: string;
  url_audio: string;
  spotify_id: string;
}

const GENEROS_DISPONIBLES = [
  'Rock', 'Pop', 'Indie', 'Alternative', 'Heavy Metal', 'Punk', 
  'Jazz', 'Blues', 'Hip Hop', 'Trap', 'Electronic', 'Reggae', 
  'Folk', 'Cumbia', 'Ska', 'Funk', 'Soul', 'R&B'
];

export const FormBanda: React.FC<FormBandaProps> = ({ onCancel, onSuccess }) => {
  // --- ESTADOS BÁSICOS ---
  const [nombre, setNombre] = useState('');
  const [genero, setGenero] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [historia, setHistoria] = useState('');
  const [colorTema, setColorTema] = useState('#6366f1'); // Indigo por defecto

  // --- REDES SOCIALES ---
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  // --- IMÁGENES / ARCHIVOS ---
  const [portadaFile, setPortadaFile] = useState<File | null>(null);
  const [portadaPreview, setPortadaPreview] = useState<string | null>(null);

  // --- INTEGRANTES Y CANCIONES ---
  const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
  const [canciones, setCanciones] = useState<Cancion[]>([]);

  // --- UI & FEEDBACK ---
  const [loading, setLoading] = useState(false);
  const [mensajeEstado, setMensajeEstado] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [pasoActual, setPasoActual] = useState<1 | 2 | 3>(1);

  // --- GESTIÓN DE MEMORIA (URLs de Previsualización) ---
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

  // Limpieza total al desmontar el componente (Previene Fugas de Memoria)
  useEffect(() => {
    return () => {
      activeObjectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      activeObjectUrls.current.clear();
    };
  }, []);

  // --- MANEJADORES DE GÉNEROS ---
  const toggleGenero = (g: string) => {
    if (genero.includes(g)) {
      setGenero(genero.filter((item) => item !== g));
    } else {
      if (genero.length < 3) {
        setGenero([...genero, g]);
      }
    }
  };

  // --- MANEJADOR DE PORTADA ---
  const manejarSeleccionPortada = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (portadaPreview) {
        revocarObjectUrl(portadaPreview);
      }
      const newPreviewUrl = crearObjectUrl(file);
      setPortadaFile(file);
      setPortadaPreview(newPreviewUrl);
    }
  };

  // --- MANEJADORES DE INTEGRANTES ---
  const agregarIntegrante = () => {
    const nuevo: Integrante = {
      id: crypto.randomUUID(),
      nombre: '',
      rol: '',
      foto_file: null,
      foto_preview: null,
    };
    setIntegrantes([...integrantes, nuevo]);
  };

  const actualizarIntegrante = (id: string, campo: keyof Integrante, valor: any) => {
    setIntegrantes(
      integrantes.map((item) => {
        if (item.id === id) {
          if (campo === 'foto_file' && valor instanceof File) {
            if (item.foto_preview) {
              revocarObjectUrl(item.foto_preview);
            }
            const previewUrl = crearObjectUrl(valor);
            return { ...item, foto_file: valor, foto_preview: previewUrl };
          }
          return { ...item, [campo]: valor };
        }
        return item;
      })
    );
  };

  const eliminarIntegrante = (id: string) => {
    const integrante = integrantes.find((i) => i.id === id);
    if (integrante?.foto_preview) {
      revocarObjectUrl(integrante.foto_preview);
    }
    setIntegrantes(integrantes.filter((i) => i.id !== id));
  };

  // --- MANEJADORES DE CANCIONES ---
  const agregarCancion = () => {
    const nueva: Cancion = {
      id: crypto.randomUUID(),
      titulo: '',
      url_audio: '',
      spotify_id: '',
    };
    setCanciones([...canciones, nueva]);
  };

  const actualizarCancion = (id: string, campo: keyof Cancion, valor: string) => {
    setCanciones(
      canciones.map((c) => (c.id === id ? { ...c, [campo]: valor } : c))
    );
  };

  const eliminarCancion = (id: string) => {
    setCanciones(canciones.filter((c) => c.id !== id));
  };

  // --- CONVERSIÓN DE IMAGEN A WEBP (Optimizada en Cliente) ---
  const convertirAWebp = (file: File, maxAncho = 1200, calidad = 0.8): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxAncho) {
          height = Math.round((height * maxAncho) / width);
          width = maxAncho;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto 2D del Canvas'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Error en la conversión a WebP'));
            }
          },
          'image/webp',
          calidad
        );
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      };

      img.src = objectUrl;
    });
  };

  // --- ENVÍO DE EMAIL DE NOTIFICACIÓN ---
  const enviarEmailNotificacion = async (nombreBanda: string) => {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      console.warn('EmailJS no está configurado correctamente en las variables de entorno.');
      return;
    }

    try {
      await emailjs.send(
        serviceId,
        templateId,
        {
          nombre_banda: nombreBanda,
          fecha_registro: new Date().toLocaleString('es-AR'),
          mensaje: `Se ha registrado exitosamente la banda "${nombreBanda}".`
        },
        publicKey
      );
    } catch (error) {
      console.error('Error al enviar notificación por EmailJS:', error);
    }
  };

  // --- GUARDAR BANDA (SUBMIT CON ROLLBACK) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setMensajeEstado({ tipo: 'error', texto: 'El nombre de la banda es obligatorio.' });
      return;
    }

    setLoading(true);
    setMensajeEstado(null);

    let bandaIdCreada: string | null = null;
    const archivosSubidosStorage: string[] = [];

    try {
      // 1. Subir Portada si existe
      let urlPortadaFinal: string | null = null;
      if (portadaFile) {
        const webpBlob = await convertirAWebp(portadaFile, 1200, 0.85);
        const fileName = `portadas/${crypto.randomUUID()}.webp`;
        
        const { error: uploadErr } = await supabase.storage
          .from('bandas')
          .upload(fileName, webpBlob, { contentType: 'image/webp', upsert: true });

        if (uploadErr) throw new Error(`Error al subir la portada: ${uploadErr.message}`);
        
        archivosSubidosStorage.push(fileName);
        
        const { data: publicUrlData } = supabase.storage
          .from('bandas')
          .getPublicUrl(fileName);

        urlPortadaFinal = publicUrlData.publicUrl;
      }

      // 2. Insertar Banda en Base de Datos
      const { data: bandaData, error: bandaErr } = await supabase
        .from('bandas')
        .insert([
          {
            nombre,
            genero: genero.join(', '),
            bio,
            historia,
            color_tema: colorTema,
            url_portada: urlPortadaFinal,
            spotify_url: spotifyUrl,
            instagram_url: instagramUrl,
            youtube_url: youtubeUrl,
          },
        ])
        .select()
        .single();

      if (bandaErr) throw new Error(`Error al guardar la banda: ${bandaErr.message}`);
      bandaIdCreada = bandaData.id;

      // 3. Procesar e Insertar Integrantes
      if (integrantes.length > 0) {
        const integrantesParaInsertar = [];

        for (const integrante of integrantes) {
          if (!integrante.nombre.trim()) continue;

          let urlFotoIntegrante: string | null = null;

          if (integrante.foto_file) {
            const webpBlob = await convertirAWebp(integrante.foto_file, 600, 0.8);
            const fileName = `integrantes/${crypto.randomUUID()}.webp`;

            const { error: uploadIntErr } = await supabase.storage
              .from('bandas')
              .upload(fileName, webpBlob, { contentType: 'image/webp', upsert: true });

            if (uploadIntErr) throw new Error(`Error al subir la foto de ${integrante.nombre}`);
            
            archivosSubidosStorage.push(fileName);

            const { data: publicUrlData } = supabase.storage
              .from('bandas')
              .getPublicUrl(fileName);

            urlFotoIntegrante = publicUrlData.publicUrl;
          }

          integrantesParaInsertar.push({
            banda_id: bandaIdCreada,
            nombre: integrante.nombre,
            rol: integrante.rol,
            foto_url: urlFotoIntegrante,
          });
        }

        if (integrantesParaInsertar.length > 0) {
          const { error: intInsertErr } = await supabase
            .from('integrantes')
            .insert(integrantesParaInsertar);

          if (intInsertErr) throw new Error(`Error al guardar integrantes: ${intInsertErr.message}`);
        }
      }

      // 4. Insertar Canciones
      const cancionesValidas = canciones
        .filter((c) => c.titulo.trim() !== '')
        .map((c) => ({
          banda_id: bandaIdCreada,
          titulo: c.titulo,
          url_audio: c.url_audio,
          spotify_id: c.spotify_id,
        }));

      if (cancionesValidas.length > 0) {
        const { error: cancErr } = await supabase
          .from('canciones')
          .insert(cancionesValidas);

        if (cancErr) throw new Error(`Error al guardar canciones: ${cancErr.message}`);
      }

      // 5. Notificación por EmailJS
      await enviarEmailNotificacion(nombre);

      setMensajeEstado({ tipo: 'exito', texto: '¡Banda publicada con éxito!' });
      
      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }

    } catch (err: any) {
      console.error('Error durante el proceso de guardado:', err);
      
      // Rollback: Eliminar imágenes subidas si falló
      if (archivosSubidosStorage.length > 0) {
        await supabase.storage.from('bandas').remove(archivosSubidosStorage);
      }

      // Rollback: Eliminar registro de banda si se alcanzó a crear
      if (bandaIdCreada) {
        await supabase.from('bandas').delete().eq('id', bandaIdCreada);
      }

      setMensajeEstado({
        tipo: 'error',
        texto: err.message || 'Ocurrió un error inesperado. Por favor reintenta.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-slate-900 text-slate-100 rounded-2xl shadow-2xl overflow-hidden border border-slate-800 my-8">
      
      {/* HEADER CON PREVISUALIZACIÓN DE COLOR DE TEMA Y PORTADA */}
      <div 
        className="relative p-8 transition-all duration-300 bg-cover bg-center"
        style={{
          backgroundColor: colorTema,
          backgroundImage: portadaPreview 
            ? `linear-gradient(to bottom, rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.95)), url(${portadaPreview})` 
            : `linear-gradient(to bottom, rgba(15, 23, 42, 0.2), rgba(15, 23, 42, 0.95))`
        }}
      >
        <div className="flex justify-between items-start relative z-10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Ficha de Banda
            </span>
            <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
              {nombre || 'Nombre de tu Banda'}
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              {genero.length > 0 ? genero.join(' • ') : 'Selecciona hasta 3 géneros principales'}
            </p>
          </div>

          {onCancel && (
            <button 
              onClick={onCancel}
              className="p-2 rounded-full bg-slate-900/50 hover:bg-slate-900/80 text-slate-300 hover:text-white transition-colors backdrop-blur-sm"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* CONTROLES DE NAVEGACIÓN ENTRE PASOS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-8 relative z-10 w-full max-w-full">
          {[
            { id: 1, label: 'Información Básica', icon: Users },
            { id: 2, label: 'Integrantes', icon: Users },
            { id: 3, label: 'Música y Redes', icon: Music },
          ].map((paso) => {
            const Icon = paso.icon;
            const activo = pasoActual === paso.id;
            return (
              <button
                key={paso.id}
                type="button"
                onClick={() => setPasoActual(paso.id as any)}
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

      {/* FORMULARIO PRINCIPAL */}
      <form onSubmit={handleSubmit} className="p-8">
        
        {/* MENSAJES DE ESTADO */}
        {mensajeEstado && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            mensajeEstado.tipo === 'exito' 
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}>
            {mensajeEstado.tipo === 'exito' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <p className="text-sm font-medium">{mensajeEstado.texto}</p>
          </div>
        )}

        {/* PASO 1: INFORMACIÓN BÁSICA */}
        {pasoActual === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre de la Banda <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Los Pericos, Soda Stereo..."
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  required
                />
              </div>

              {/* Color Personalizado */}
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
                    Este color personalizará el encabezado y detalles de tu ficha.
                  </span>
                </div>
              </div>
            </div>

            {/* Selector de Géneros */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Géneros Musicales (Máx. 3)
              </label>
              <div className="flex flex-wrap gap-2">
                {GENEROS_DISPONIBLES.map((g) => {
                  const seleccionado = genero.includes(g);
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleGenero(g)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        seleccionado
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subida de Portada */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Imagen de Portada
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-800/30 hover:bg-slate-800/60 transition group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-slate-500 group-hover:text-indigo-400 transition" />
                    <p className="text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">Haz clic para subir</span> o arrastra y suelta
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">PNG, JPG o WEBP (Se convertirá automáticamente a WebP)</p>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={manejarSeleccionPortada} 
                    className="hidden" 
                  />
                </label>
              </div>
            </div>

            {/* Bio Corta */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Biografía Corta
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Resumen rápido de la banda para la tarjeta de presentación..."
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            {/* Historia Completa */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Historia / Trayectoria
              </label>
              <textarea
                rows={4}
                value={historia}
                onChange={(e) => setHistoria(e.target.value)}
                placeholder="Cuenta los orígenes de la banda, discos lanzados, giras importantes..."
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
                <p className="text-xs text-slate-400">Añade a los músicos que conforman la agrupación</p>
              </div>
              <button
                type="button"
                onClick={agregarIntegrante}
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
                {integrantes.map((item) => (
                  <div key={item.id} className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl flex gap-4 items-start relative group">
                    <button
                      type="button"
                      onClick={() => eliminarIntegrante(item.id)}
                      className="absolute top-3 right-3 text-slate-500 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Previsualización Foto de Integrante */}
                    <label className="relative w-16 h-16 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center cursor-pointer overflow-hidden border border-slate-600 group-hover:border-indigo-500 transition">
                      {item.foto_preview ? (
                        <img src={item.foto_preview} alt="Integrante" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-400" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            actualizarIntegrante(item.id, 'foto_file', e.target.files[0]);
                          }
                        }}
                      />
                    </label>

                    <div className="flex-1 space-y-2 pr-6">
                      <input
                        type="text"
                        placeholder="Nombre del músico"
                        value={item.nombre}
                        onChange={(e) => actualizarIntegrante(item.id, 'nombre', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder="Rol / Instrumento (Ej: Voz, Guitarra)"
                        value={item.rol}
                        onChange={(e) => actualizarIntegrante(item.id, 'rol', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PASO 3: MÚSICA Y REDES */}
        {pasoActual === 3 && (
          <div className="space-y-6 animate-fade-in">
            {/* Redes Sociales */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-200">Enlaces y Redes</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Spotify URL</label>
                  <input
                    type="url"
                    value={spotifyUrl}
                    onChange={(e) => setSpotifyUrl(e.target.value)}
                    placeholder="https://open.spotify.com/artist/..."
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Instagram URL</label>
                  <input
                    type="url"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/..."
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">YouTube URL</label>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-800 my-6" />

            {/* Seccion Canciones */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-slate-200">Canciones / Singles</h3>
                  <p className="text-xs text-slate-400">Enlaza tus temas promocionales</p>
                </div>
                <button
                  type="button"
                  onClick={agregarCancion}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition shadow"
                >
                  <Plus className="w-4 h-4" /> Añadir Canción
                </button>
              </div>

              {canciones.length === 0 ? (
                <div className="text-center py-8 bg-slate-800/20 rounded-xl border border-slate-800">
                  <Disc className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No has agregado canciones en la lista.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {canciones.map((cancion) => (
                    <div key={cancion.id} className="flex gap-3 items-center bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                      <input
                        type="text"
                        placeholder="Título de la canción"
                        value={cancion.titulo}
                        onChange={(e) => actualizarCancion(cancion.id, 'titulo', e.target.value)}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder="ID de Spotify o URL Audio"
                        value={cancion.spotify_id}
                        onChange={(e) => actualizarCancion(cancion.id, 'spotify_id', e.target.value)}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => eliminarCancion(cancion.id)}
                        className="p-2 text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ACCIONES DE BOTONES INFERIORES */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center">
          <div>
            {pasoActual > 1 && (
              <button
                type="button"
                onClick={() => setPasoActual((pasoActual - 1) as any)}
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
                onClick={() => setPasoActual((pasoActual + 1) as any)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition shadow-lg"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-lg text-sm font-semibold transition shadow-lg disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Publicar Banda
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </form>
    </div>
  );
};