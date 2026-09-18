import React, { useState, useEffect, useRef } from 'react';
import emailjs from '@emailjs/browser';
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
  Mail,
  Key,
  RefreshCw,
  Copy,
  Check,
  Search,
  Eye,
  EyeOff,
  X
} from 'lucide-react';

const InstagramIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

interface FormBandaProps {
  onVolver?: () => void;
  onSuccess?: () => void;
  palabraClaveEdicion?: string;
}

interface Integrante {
  id: string;
  nombre: string;
  rol: string;
  foto_file: File | null;
  foto_preview: string | null;
  instagram?: string; 
  facebook?: string;
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

const generarTokenAleatorio = () => Math.random().toString(36).substring(2, 10).toUpperCase();

const sanitizarInstagramUrl = (input: string): string => {
  const limpio = input.trim();
  if (!limpio) return '';
  if (limpio.startsWith('http://') || limpio.startsWith('https://')) return limpio;
  if (limpio.startsWith('instagram.com/')) return `https://${limpio}`;
  const usuario = limpio.replace(/^@/, '');
  return `https://instagram.com/${usuario}`;
};

export const FormBanda: React.FC<FormBandaProps> = ({ onVolver, onSuccess, palabraClaveEdicion }) => {
  const [esModoEdicion, setEsModoEdicion] = useState(false);
  const [bandaId, setBandaId] = useState<string | null>(null);
  const [cargandoDatos, setCargandoDatos] = useState(false);

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [palabraClave, setPalabraClave] = useState(''); 
  const [nuevaPalabraClave, setNuevaPalabraClave] = useState('');
  const [mostrarClave, setMostrarClave] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [genero, setGenero] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [historia, setHistoria] = useState('');
  const [colorTema, setColorTema] = useState('#6366f1');

  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const [portadaFile, setPortadaFile] = useState<File | null>(null);
  const [portadaPreview, setPortadaPreview] = useState<string | null>(null);

  const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
  const [canciones, setCanciones] = useState<Cancion[]>([]);

  const [loading, setLoading] = useState(false);
  const [mensajeEstado, setMensajeEstado] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [pasoActual, setPasoActual] = useState<1 | 2 | 3>(1);

  const [mostrarModalRecuperar, setMostrarModalRecuperar] = useState(false);
  const [pasoRecuperacion, setPasoRecuperacion] = useState<'email' | 'codigo'>('email');
  const [codigoOTP, setCodigoOTP] = useState('');
  const [nuevaClavePersonalizada, setNuevaClavePersonalizada] = useState('');
  const [cargandoOTP, setCargandoOTP] = useState(false);

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

  const cargarBandaPorClave = async (claveABuscar: string) => {
    if (!claveABuscar.trim()) {
      setMensajeEstado({ tipo: 'error', texto: 'Ingresa una palabra clave válida.' });
      return;
    }

    setCargandoDatos(true);
    setMensajeEstado(null);

    try {
      const res = await fetch(`/api/bandas/buscar?clave=${encodeURIComponent(claveABuscar.trim())}`);
      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message || 'No se encontró ninguna banda con esa palabra clave.');
      }

      const data = responseData.data;
      setBandaId(data.id);
      setEsModoEdicion(true);
      setNombre(data.nombre || '');
      setEmail(data.email || '');
      setPalabraClave(claveABuscar.trim());
      setNuevaPalabraClave('');
      setBio(data.bio || '');
      setHistoria(data.historia || '');
      setColorTema(data.color_tema || '#6366f1');
      setSpotifyUrl(data.spotify_url || '');
      setInstagramUrl(data.instagram_url || '');
      setYoutubeUrl(data.youtube_url || '');
      setPortadaPreview(data.url_portada || null);

      setGenero(data.genero ? data.genero.split(', ').map((g: string) => g.trim()).filter(Boolean) : []);
      setIntegrantes(data.integrantes?.map((i: any) => ({
        id: i.id || crypto.randomUUID(),
        nombre: i.nombre || '',
        rol: i.rol || '',
        foto_file: null,
        foto_preview: i.foto_url || null,
        instagram: i.instagram || '',
        facebook: i.facebook || '',
      })) || []);

      setCanciones(data.canciones?.map((c: any) => ({
        id: c.id || crypto.randomUUID(),
        titulo: c.titulo || '',
        url_audio: c.url_audio || '',
        spotify_id: c.spotify_id || '',
      })) || []);

      setMensajeEstado({ tipo: 'exito', texto: `¡Datos de "${data.nombre}" cargados correctamente!` });
    } catch (err: any) {
      setMensajeEstado({ tipo: 'error', texto: err.message || 'Ocurrió un error al consultar la banda.' });
    } finally {
      setCargandoDatos(false);
    }
  };

  const enviarCodigoRecuperacion = async () => {
    if (!email.trim() || !email.includes('@')) {
      setMensajeEstado({ tipo: 'error', texto: 'Ingresa un correo electrónico válido.' });
      return;
    }

    setCargandoOTP(true);
    setMensajeEstado(null);

    try {
      const res = await fetch('/api/bandas/solicitar-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), nombre: nombre.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al enviar código de recuperación.');

      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (serviceId && templateId && publicKey && data.tokenOTP) {
        await emailjs.send(
          serviceId,
          templateId,
          {
            to_email: email.trim().toLowerCase(),
            nombre_banda: data.nombreBanda,
            codigo_otp: data.tokenOTP,
            clave: data.tokenOTP,
          },
          publicKey
        );
      }

      setPasoRecuperacion('codigo');
    } catch (err: any) {
      setMensajeEstado({ tipo: 'error', texto: err.message || 'Error al procesar la solicitud.' });
    } finally {
      setCargandoOTP(false);
    }
  };

  const confirmarNuevaClaveConOTP = async () => {
    if (!codigoOTP.trim() || nuevaClavePersonalizada.trim().length < 6) {
      setMensajeEstado({ tipo: 'error', texto: 'El código debe tener 6 dígitos y la clave mínimo 6 caracteres.' });
      return;
    }

    setCargandoOTP(true);
    setMensajeEstado(null);

    try {
      const res = await fetch('/api/bandas/restablecer-clave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          codigoOTP: codigoOTP.trim(),
          nuevaClave: nuevaClavePersonalizada.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'No se pudo actualizar la palabra clave.');

      setPalabraClave(nuevaClavePersonalizada.trim());
      await cargarBandaPorClave(nuevaClavePersonalizada.trim());

      setMostrarModalRecuperar(false);
      setPasoRecuperacion('email');
      setCodigoOTP('');
      setNuevaClavePersonalizada('');
    } catch (err: any) {
      setMensajeEstado({ tipo: 'error', texto: err.message });
    } finally {
      setCargandoOTP(false);
    }
  };

  useEffect(() => {
    if (palabraClaveEdicion) cargarBandaPorClave(palabraClaveEdicion);
  }, [palabraClaveEdicion]);

  const copiarClave = () => {
    if (!palabraClave) return;
    navigator.clipboard.writeText(palabraClave);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const toggleGenero = (g: string) => {
    if (genero.includes(g)) setGenero(genero.filter((item) => item !== g));
    else if (genero.length < 3) setGenero([...genero, g]);
  };

  const manejarSeleccionPortada = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (portadaPreview && !portadaPreview.startsWith('http')) revocarObjectUrl(portadaPreview);
      setPortadaFile(file);
      setPortadaPreview(crearObjectUrl(file));
    }
  };

  const agregarIntegrante = () => {
    setIntegrantes([...integrantes, {
      id: crypto.randomUUID(),
      nombre: '',
      rol: '',
      foto_file: null,
      foto_preview: null,
      instagram: '',
      facebook: '',
    }]);
  };

  const actualizarIntegrante = (id: string, campo: keyof Integrante, valor: any) => {
    setIntegrantes(integrantes.map((item) => {
      if (item.id === id) {
        if (campo === 'foto_file' && valor instanceof File) {
          if (item.foto_preview && !item.foto_preview.startsWith('http')) revocarObjectUrl(item.foto_preview);
          return { ...item, foto_file: valor, foto_preview: crearObjectUrl(valor) };
        }
        return { ...item, [campo]: valor };
      }
      return item;
    }));
  };

  const eliminarIntegrante = (id: string) => {
    const int = integrantes.find((i) => i.id === id);
    if (int?.foto_preview && !int.foto_preview.startsWith('http')) revocarObjectUrl(int.foto_preview);
    setIntegrantes(integrantes.filter((i) => i.id !== id));
  };

  const agregarCancion = () => {
    setCanciones([...canciones, { id: crypto.randomUUID(), titulo: '', url_audio: '', spotify_id: '' }]);
  };

  const actualizarCancion = (id: string, campo: keyof Cancion, valor: string) => {
    setCanciones(canciones.map((c) => (c.id === id ? { ...c, [campo]: valor } : c)));
  };

  const eliminarCancion = (id: string) => setCanciones(canciones.filter((c) => c.id !== id));

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
        if (!ctx) return reject(new Error('Error de contexto 2D canvas'));

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Error conversión WebP')), 'image/webp', calidad);
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      };
      img.src = objectUrl;
    });
  };

  const subirImagenASupabase = async (file: File, carpeta: string, maxAncho = 1200): Promise<string> => {
    const webpBlob = await convertirAWebp(file, maxAncho, 0.85);
    const fileName = `${carpeta}/${crypto.randomUUID()}.webp`;
    
    const { error } = await supabase.storage
      .from('bandas-images')
      .upload(fileName, webpBlob, { contentType: 'image/webp', upsert: true });

    if (error) throw new Error(`Error al subir imagen: ${error.message}`);
    return supabase.storage.from('bandas-images').getPublicUrl(fileName).data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim() || !email.trim() || !email.includes('@') || !palabraClave.trim()) {
      setMensajeEstado({ tipo: 'error', texto: 'Por favor completa todos los campos obligatorios (*).' });
      setPasoActual(1);
      return;
    }

    setLoading(true);
    setMensajeEstado(null);

    try {
      let urlPortadaFinal: string | null = portadaPreview;
      if (portadaFile) {
        urlPortadaFinal = await subirImagenASupabase(portadaFile, 'portadas', 1200);
      }

      const integrantesProcesados = [];
      for (const item of integrantes) {
        if (!item.nombre.trim()) continue;
        let fotoUrl: string | null = item.foto_preview;
        if (item.foto_file) {
          fotoUrl = await subirImagenASupabase(item.foto_file, 'integrantes', 600);
        }
        integrantesProcesados.push({
          nombre: item.nombre.trim(),
          rol: item.rol.trim(),
          foto_url: fotoUrl,
          instagram: item.instagram ? sanitizarInstagramUrl(item.instagram) : null,
          facebook: item.facebook?.trim() || null,
        });
      }

      const cancionesProcesadas = canciones
        .filter((c) => c.titulo.trim() !== '')
        .map((c) => ({
          titulo: c.titulo.trim(),
          url_audio: c.url_audio.trim(),
          spotify_id: c.spotify_id.trim(),
        }));

      const payload = {
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        palabraClave: palabraClave.trim(),
        nuevaPalabraClave: nuevaPalabraClave.trim() || undefined,
        genero: genero.join(', '),
        bio: bio.trim(),
        historia: historia.trim(),
        colorTema,
        urlPortada: urlPortadaFinal,
        spotifyUrl: spotifyUrl.trim(),
        instagramUrl: sanitizarInstagramUrl(instagramUrl),
        youtubeUrl: youtubeUrl.trim(),
        integrantes: integrantesProcesados,
        canciones: cancionesProcesadas,
      };

      const endpoint = esModoEdicion && bandaId ? `/api/bandas/${bandaId}` : '/api/bandas';
      const method = esModoEdicion ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || 'Error al procesar el formulario.');

      if (!esModoEdicion && resData.data) {
        const linkVerificacion = `${window.location.origin}/validar-email?token=${resData.data.tokenVerificacion}&id=${resData.data.id}`;
        
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

        if (serviceId && templateId && publicKey) {
          await emailjs.send(
            serviceId,
            templateId,
            {
              to_email: payload.email,
              nombre_banda: payload.nombre,
              clave: payload.palabraClave,
              link_verificacion: linkVerificacion,
              fecha_registro: new Date().toLocaleString('es-AR'),
            },
            publicKey
          );
        }
      }

      setMensajeEstado({
        tipo: 'exito',
        texto: esModoEdicion 
          ? `¡Información de "${nombre.trim()}" actualizada exitosamente!`
          : `¡Banda registrada con éxito! Te enviamos un correo de verificación a ${email.trim()}.`,
      });

      if (onSuccess) setTimeout(onSuccess, 2500);

    } catch (err: any) {
      setMensajeEstado({ tipo: 'error', texto: err.message || 'Ocurrió un error inesperado.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-slate-900 text-slate-100 rounded-2xl shadow-2xl overflow-hidden border border-slate-800 my-8">

      {/* HEADER */}
      <div 
        className="relative p-8 transition-all duration-300 bg-cover bg-center"
        style={{
          backgroundColor: colorTema,
          backgroundImage: portadaPreview 
            ? `linear-gradient(to bottom, rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.95)), url(${portadaPreview})` 
            : `linear-gradient(to bottom, rgba(15, 23, 42, 0.2), rgba(15, 23, 42, 0.95))`
        }}
      >
        {onVolver && (
          <div className="mb-6 relative z-10 flex items-center">
            <button
              type="button"
              onClick={onVolver}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-colors bg-slate-900/60 border border-slate-700/80 px-4 py-2 rounded-xl backdrop-blur-md hover:border-indigo-500/50 cursor-pointer shadow-sm"
            >
              ← Volver al catálogo
            </button>
          </div>
        )}

        <div className="flex justify-between items-start relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white">
                <Sparkles className="w-3.5 h-3.5" /> Ficha de Banda
              </span>
              {esModoEdicion && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/30 text-amber-200 border border-amber-500/40 backdrop-blur-md">
                  Modo Edición
                </span>
              )}
            </div>

            <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
              {nombre || 'Nombre de tu Banda'}
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              {genero.length > 0 ? genero.join(' • ') : 'Selecciona hasta 3 géneros principales'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-8 relative z-10 w-full max-w-full">      
          {[
            { id: 1, label: 'Información Básica', icon: Users },
            { id: 2, label: `Integrantes (${integrantes.length})`, icon: Users },
            { id: 3, label: 'Música y Redes', icon: Music },
          ].map((paso) => {
            const Icon = paso.icon;
            const activo = pasoActual === paso.id;
            return (
              <button
                key={paso.id}
                type="button"
                onClick={() => setPasoActual(paso.id as any)}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 sm:px-4 rounded-lg text-xs sm:text-sm transition-all text-center cursor-pointer ${
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

      {/* FORMULARIO */}
      <form onSubmit={handleSubmit} className="p-8">
        
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
                  placeholder="Ej: Los Pericos, Soda Stereo..."
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Instagram Oficial de la Banda
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-pink-400">
                    <InstagramIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="@nombredebanda o https://instagram.com/nombredebanda"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Correo Electrónico <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contacto@banda.com"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
                    required
                  />
                </div>

                <div className="mt-1.5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarModalRecuperar(true);
                      setPasoRecuperacion('email');
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline transition bg-transparent border-0 p-0 cursor-pointer"
                  >
                    ¿Olvidaste tu palabra clave?
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Palabra Clave / Token de Edición <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Key className="w-4 h-4 text-indigo-400 absolute left-3 z-10 pointer-events-none" />
                  <input
                    type={mostrarClave ? "text" : "password"}
                    value={palabraClave}
                    onChange={(e) => setPalabraClave(e.target.value)}
                    placeholder="Ej: MiBanda2026!"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-60 py-2.5 text-slate-100 font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    required
                  />
                  
                  <div className="absolute right-2 flex items-center gap-1 z-10">
                    <button
                      type="button"
                      onClick={() => setMostrarClave(!mostrarClave)}
                      title={mostrarClave ? "Ocultar clave" : "Mostrar clave"}
                      className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition cursor-pointer"
                    >
                      {mostrarClave ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPalabraClave(generarTokenAleatorio());
                        setMostrarClave(true);
                      }}
                      title="Generar clave aleatoria"
                      className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded transition flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3 text-indigo-400" />
                      <span className="hidden sm:inline">Aleatoria</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => cargarBandaPorClave(palabraClave)}
                      disabled={cargandoDatos}
                      title="Cargar datos con esta clave"
                      className="px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded transition flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      {cargandoDatos ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      <span>Cargar</span>
                    </button>

                    <button
                      type="button"
                      onClick={copiarClave}
                      disabled={!palabraClave}
                      title="Copiar palabra clave"
                      className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition disabled:opacity-40 cursor-pointer"
                    >
                      {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Escribe tu propia contraseña personalizada (mínimo 6 caracteres) o haz clic en <strong>"Aleatoria"</strong>.
                </span>

                {esModoEdicion && (
                  <div className="mt-4 p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Cambiar Palabra Clave (Opcional)
                    </label>
                    <input
                      type={mostrarClave ? "text" : "password"}
                      value={nuevaPalabraClave}
                      onChange={(e) => setNuevaPalabraClave(e.target.value)}
                      placeholder="Nueva clave personalizada (mínimo 6 caracteres)"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Color de Marca / Tema</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={colorTema}
                    onChange={(e) => setColorTema(e.target.value)}
                    className="h-10 w-20 bg-slate-800 border border-slate-700 rounded cursor-pointer"
                  />
                  <span className="text-xs text-slate-400">Personalizar encabezado</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Biografía Corta</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Resumen rápido..."
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Géneros Musicales (Máx. 3)</label>
              <div className="flex flex-wrap gap-2">
                {GENEROS_DISPONIBLES.map((g) => {
                  const seleccionado = genero.includes(g);
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleGenero(g)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
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

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Imagen de Portada</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-800/30 hover:bg-slate-800/60 transition group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-slate-500 group-hover:text-indigo-400 transition" />
                    <p className="text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">Haz clic para subir</span> o arrastra y suelta
                    </p>
                  </div>
                  <input type="file" accept="image/*" onChange={manejarSeleccionPortada} className="hidden" />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Historia / Trayectoria</label>
              <textarea
                rows={4}
                value={historia}
                onChange={(e) => setHistoria(e.target.value)}
                placeholder="Cuenta los orígenes de la banda..."
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
          </div>
        )}

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
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition shadow cursor-pointer"
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
                      className="absolute top-3 right-3 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <label className="relative w-16 h-16 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center cursor-pointer overflow-hidden border border-slate-600 group-hover:border-indigo-500 transition">
                      {item.foto_preview ? (
                        <img src={item.foto_preview} alt={item.nombre || 'Integrante'} className="w-full h-full object-cover" />
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
                        placeholder="Rol / Instrumento"
                        value={item.rol}
                        onChange={(e) => actualizarIntegrante(item.id, 'rol', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <div>
                          <input
                            type="text"
                            placeholder="Instagram"
                            value={item.instagram || ''}
                            onChange={(e) => actualizarIntegrante(item.id, 'instagram', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100 placeholder-slate-500"
                          />
                        </div>

                        <div>
                          <input
                            type="url"
                            placeholder="Facebook"
                            value={item.facebook || ''}
                            onChange={(e) => actualizarIntegrante(item.id, 'facebook', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100 placeholder-slate-500"
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {pasoActual === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-200">Enlaces y Redes</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Spotify URL</label>
                  <input
                    type="url"
                    value={spotifyUrl}
                    onChange={(e) => setSpotifyUrl(e.target.value)}
                    placeholder="https://open.spotify.com/..."
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Instagram URL</label>
                  <input
                    type="text"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="@nombredebanda"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">YouTube URL</label>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-800 my-6" />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-slate-200">Canciones / Singles</h3>
                  <p className="text-xs text-slate-400">Enlaza tus temas promocionales</p>
                </div>
                <button
                  type="button"
                  onClick={agregarCancion}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition shadow cursor-pointer"
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
                    <div key={cancion.id} className="flex flex-col sm:flex-row gap-3 items-center bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                      <input
                        type="text"
                        placeholder="Título de la canción"
                        value={cancion.titulo}
                        onChange={(e) => actualizarCancion(cancion.id, 'titulo', e.target.value)}
                        className="flex-1 w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-100"
                      />
                      <input
                        type="url"
                        placeholder="URL audio MP3 (opcional)"
                        value={cancion.url_audio}
                        onChange={(e) => actualizarCancion(cancion.id, 'url_audio', e.target.value)}
                        className="flex-1 w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-100"
                      />
                      <input
                        type="text"
                        placeholder="ID o Link Spotify"
                        value={cancion.spotify_id}
                        onChange={(e) => actualizarCancion(cancion.id, 'spotify_id', e.target.value)}
                        className="flex-1 w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => eliminarCancion(cancion.id)}
                        className="p-2 text-slate-500 hover:text-rose-400 transition cursor-pointer"
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

        <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center">
          <div>
            {pasoActual > 1 && (
              <button
                type="button"
                onClick={() => setPasoActual((pasoActual - 1) as any)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition cursor-pointer"
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
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition shadow-lg cursor-pointer"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-lg text-sm font-semibold transition shadow-lg disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> {esModoEdicion ? 'Guardar Cambios' : 'Publicar Banda'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </form>

      {mostrarModalRecuperar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              type="button"
              onClick={() => setMostrarModalRecuperar(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Restablecer Palabra Clave</h3>
                <p className="text-xs text-slate-400">
                  {pasoRecuperacion === 'email' ? 'Paso 1 de 2: Verificación' : 'Paso 2 de 2: Nueva Clave'}
                </p>
              </div>
            </div>

            {pasoRecuperacion === 'email' ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-300">
                  Ingresa tu correo para recibir un código de seguridad temporal de 6 dígitos.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Correo de la banda</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contacto@banda.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setMostrarModalRecuperar(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={cargandoOTP || !email.trim()}
                    onClick={enviarCodigoRecuperacion}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    {cargandoOTP ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    Enviar Código
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-300">
                  Código enviado a <span className="text-indigo-400 font-medium">{email}</span>.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Código de 6 dígitos</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={codigoOTP}
                    onChange={(e) => setCodigoOTP(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-center text-lg font-mono tracking-widest text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Tu Nueva Palabra Clave</label>
                  <input
                    type="text"
                    value={nuevaClavePersonalizada}
                    onChange={(e) => setNuevaClavePersonalizada(e.target.value)}
                    placeholder="Escribe tu nueva contraseña"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100"
                  />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setPasoRecuperacion('email')}
                    className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    ← Cambiar email
                  </button>
                  <button
                    type="button"
                    disabled={cargandoOTP || codigoOTP.length < 6 || nuevaClavePersonalizada.length < 6}
                    onClick={confirmarNuevaClaveConOTP}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    {cargandoOTP ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Guardar y Entrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};