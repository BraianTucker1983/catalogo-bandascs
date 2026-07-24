import { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import { supabase } from '../lib/supabaseClient';

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

const TEMAS_DISPONIBLES = [
  { id: 'purple', nombre: 'Violeta Clima', primary: '#a855f7', bgGlow: 'rgba(168, 85, 247, 0.25)' },
  { id: 'emerald', nombre: 'Verde Neón', primary: '#10b981', bgGlow: 'rgba(16, 185, 129, 0.25)' },
  { id: 'amber', nombre: 'Fuego / Rock', primary: '#f59e0b', bgGlow: 'rgba(245, 158, 11, 0.25)' },
  { id: 'cyan', nombre: 'Cyberpunk', primary: '#06b6d4', bgGlow: 'rgba(6, 182, 212, 0.25)' },
  { id: 'rose', nombre: 'Magenta / Punk', primary: '#f43f5e', bgGlow: 'rgba(244, 63, 94, 0.25)' },
  { id: 'indigo', nombre: 'Azul Noche', primary: '#6366f1', bgGlow: 'rgba(99, 102, 241, 0.25)' },
  { id: 'crimson', nombre: 'Amarillo brillante', primary: '#efde44', bgGlow: 'rgba(239, 222, 68, 0.25)' },
  { id: 'lime', nombre: 'Verde Ácido', primary: '#84cc16', bgGlow: 'rgba(132, 204, 22, 0.25)' },
];

/** Clean/Sanitize string for filenames */
function sanitizarNombreArchivo(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_');
}

/**
 * Convierte cualquier imagen (PNG, JPG, etc.) a WebP y la comprime en el navegador.
 */
async function convertirAWebp(archivo: File, maxAncho = 1200, calidad = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(archivo);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
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
        if (!ctx) return reject(new Error('Error al obtener contexto Canvas'));

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Falló la conversión a WebP'));
          },
          'image/webp',
          calidad
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Subir un Blob a Supabase Storage y retornar su URL pública
 */
async function subirImagenSupabase(blob: Blob, rutaNombre: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('bandas')
    .upload(rutaNombre, blob, {
      contentType: 'image/webp',
      upsert: true,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('bandas')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

interface IntegranteEstado {
  nombre: string;
  instrumento: string;
  instagram_url: string;
  fotoFile: File | null;
  fotoPreviewUrl?: string | null;
}

// 1. Declarar las props aceptadas por el componente
interface FormularioBandaProps {
  onExito?: () => void;
  onCancelar?: () => void;
}

export default function FormularioBanda({ onExito, onCancelar }: FormularioBandaProps) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [palabraClave, setPalabraClave] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [historia, setHistoria] = useState('');
  const [generosSeleccionados, setGenerosSeleccionados] = useState<string[]>([]);
  const [temaColor, setTemaColor] = useState('purple');

  const [portadaFile, setPortadaFile] = useState<File | null>(null);
  const [portadaPreview, setPortadaPreview] = useState<string | null>(null);

  const [integrantes, setIntegrantes] = useState<IntegranteEstado[]>([
    { nombre: '', instrumento: '', instagram_url: '', fotoFile: null }
  ]);

  const [canciones, setCanciones] = useState<{ titulo: string; spotify: string; youtube: string }[]>([
    { titulo: '', spotify: '', youtube: '' }
  ]);

  const [enviando, setEnviando] = useState(false);

  // Limpiar URLs creadas con createObjectURL al desmontar
  useEffect(() => {
    return () => {
      if (portadaPreview) URL.revokeObjectURL(portadaPreview);
      integrantes.forEach((i) => {
        if (i.fotoPreviewUrl) URL.revokeObjectURL(i.fotoPreviewUrl);
      });
    };
  }, []);

  const temaActivo = TEMAS_DISPONIBLES.find((t) => t.id === temaColor) || TEMAS_DISPONIBLES[0];

  const manejarCambioGenero = (genero: string) => {
    if (generosSeleccionados.includes(genero)) {
      setGenerosSeleccionados(generosSeleccionados.filter(g => g !== genero));
    } else {
      setGenerosSeleccionados([...generosSeleccionados, genero]);
    }
  };

  const manejarSeleccionPortada = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (portadaPreview) URL.revokeObjectURL(portadaPreview);
      setPortadaFile(file);
      setPortadaPreview(URL.createObjectURL(file));
    }
  };

  const cambiarIntegrante = <K extends keyof IntegranteEstado>(
    index: number,
    campo: K,
    valor: IntegranteEstado[K]
  ) => {
    const nuevos = [...integrantes];
    
    if (campo === 'fotoFile' && valor instanceof File) {
      if (nuevos[index].fotoPreviewUrl) {
        URL.revokeObjectURL(nuevos[index].fotoPreviewUrl!);
      }
      nuevos[index].fotoPreviewUrl = URL.createObjectURL(valor);
    }

    nuevos[index] = { ...nuevos[index], [campo]: valor };
    setIntegrantes(nuevos);
  };

  const agregarIntegrante = () => {
    setIntegrantes([
      ...integrantes,
      { nombre: '', instrumento: '', instagram_url: '', fotoFile: null }
    ]);
  };

  const eliminarIntegrante = (index: number) => {
    if (integrantes.length > 1) {
      const aEliminar = integrantes[index];
      if (aEliminar.fotoPreviewUrl) URL.revokeObjectURL(aEliminar.fotoPreviewUrl);
      setIntegrantes(integrantes.filter((_, i) => i !== index));
    }
  };

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

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();

    if (generosSeleccionados.length === 0) {
      alert('Por favor, seleccioná al menos un género musical para la banda.');
      return;
    }

    setEnviando(true);

    let bandaIdInsertada: string | null = null;

    try {
      const generoFinalString = generosSeleccionados.join(', ');
      const timeStamp = Date.now();
      const slugNombre = sanitizarNombreArchivo(nombre);

      // A. Portada
      let fotoPortadaUrl: string | null = null;
      if (portadaFile) {
        const webpBlob = await convertirAWebp(portadaFile, 1400, 0.85);
        const ruta = `portadas/${timeStamp}_${slugNombre}.webp`;
        fotoPortadaUrl = await subirImagenSupabase(webpBlob, ruta);
      }

      // 1. Inserción de la banda
      const { data: bandaInsertada, error: errorBanda } = await supabase
        .from('bandas')
        .insert([
          {
            nombre,
            email,
            palabra_clave: palabraClave,
            genero: generoFinalString,
            historia,
            tema_color: temaColor,
            instagram_url: instagramUrl || null,
            foto_portada: fotoPortadaUrl,
            aprobado: false
          }
        ])
        .select()
        .single();

      if (errorBanda) throw errorBanda;
      bandaIdInsertada = bandaInsertada.id;

      // 2. Integrantes
      const integrantesFiltrados = integrantes.filter(i => i.nombre.trim() !== '');
      if (integrantesFiltrados.length > 0) {
        const integrantesParaInsertar = await Promise.all(
          integrantesFiltrados.map(async (m) => {
            let fotoMiembroUrl: string | null = null;

            if (m.fotoFile) {
              const webpBlob = await convertirAWebp(m.fotoFile, 600, 0.8);
              const slugMiembro = sanitizarNombreArchivo(m.nombre);
              const ruta = `integrantes/${bandaIdInsertada}_${Date.now()}_${slugMiembro}.webp`;
              fotoMiembroUrl = await subirImagenSupabase(webpBlob, ruta);
            }

            return {
              banda_id: bandaIdInsertada,
              nombre: m.nombre,
              instrumento: m.instrumento || null,
              instagram_url: m.instagram_url || null,
              foto_url: fotoMiembroUrl
            };
          })
        );

        const { error: errorIntegrantes } = await supabase
          .from('integrantes')
          .insert(integrantesParaInsertar);

        if (errorIntegrantes) throw errorIntegrantes;
      }

      // 3. Canciones
      const cancionesFiltradas = canciones
        .filter(c => c.titulo.trim() !== '')
        .map(c => ({
          banda_id: bandaIdInsertada,
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

      // 4. Email
      try {
        await emailjs.send(
          'service_lth9njw',
          'template_o83d6ph',
          {
            nombre_banda: nombre,
            to_email: email,
            clave: palabraClave,
            genero: generoFinalString,
          },
          'se4gVL7DjUFdcuO9f'
        );
      } catch (errEmail) {
        console.error("Error al enviar email de confirmación:", errEmail);
      }

      alert('¡Inscripción completada! Tu banda y las fotos comprimidas en WebP se subieron correctamente.');

      // Resetear estados
      setNombre('');
      setEmail('');
      setPalabraClave('');
      setInstagramUrl('');
      setGenerosSeleccionados([]);
      setTemaColor('purple');
      setHistoria('');
      setPortadaFile(null);
      if (portadaPreview) URL.revokeObjectURL(portadaPreview);
      setPortadaPreview(null);
      setIntegrantes([{ nombre: '', instrumento: '', instagram_url: '', fotoFile: null }]);
      setCanciones([{ titulo: '', spotify: '', youtube: '' }]);

      // 2. Ejecutar el callback de exito si fue provisto
      if (onExito) {
        onExito();
      }

    } catch (error: any) {
      console.error(error.message);
      
      // Rollback opcional en caso de fallo crítico en integrantes/canciones
      if (bandaIdInsertada) {
        await supabase.from('bandas').delete().eq('id', bandaIdInsertada);
      }

      alert(`Hubo un error al guardar: ${error.message}`);
    } finally {
      setEnviando(false);
    }
  };

  const inputClass = "w-full p-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors text-sm";
  const labelClass = "block text-sm font-semibold tracking-wider uppercase text-white/80 mb-2";

  return (
    <div className="max-w-3xl mx-auto my-12 bg-card border border-border p-8 rounded-2xl shadow-2xl relative text-foreground">
      
      {/* Botón opcional de cerrar/cancelar si la prop onCancelar existe */}
      {onCancelar && (
        <button
          type="button"
          onClick={onCancelar}
          className="absolute top-4 right-4 text-xs font-bold text-muted-foreground hover:text-white transition-colors"
        >
          ✕ Cerrar
        </button>
      )}

      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-black tracking-wide uppercase mb-2 text-white">
          Formulario de <span className="gradient-text">Inscripción</span>
        </h2>
        <p className="text-sm text-muted-foreground font-medium">
          Registrá los datos y la gráfica de tu proyecto musical en nuestro catálogo digital.
        </p>
      </div>

      <form onSubmit={manejarEnvio} className="space-y-6">
        <div>
          <label className={labelClass}>Nombre de la Banda</label>
          <input 
            type="text" 
            value={nombre} 
            onChange={(e) => setNombre(e.target.value)} 
            required 
            placeholder="Nombre de la banda"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Correo Electrónico</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="nombre@ejemplo.com"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Palabra Clave de Edición</label>
            <input 
              type="text" 
              value={palabraClave} 
              onChange={(e) => setPalabraClave(e.target.value)} 
              required 
              placeholder="Ej: miclavesecreta123"
              className={inputClass}
            />
          </div>
        </div>
        <span className="text-xs text-muted-foreground -mt-2 block">
          Guardá bien esta palabra clave. La necesitarás si deseás modificar o actualizar los datos más adelante.
        </span>

        <div>
          <label className={labelClass}>Instagram Oficial de la Banda</label>
          <input 
            type="url" 
            value={instagramUrl} 
            onChange={(e) => setInstagramUrl(e.target.value)} 
            placeholder="https://instagram.com/tubanda"
            className={inputClass}
          />
        </div>

        <div className="p-4 bg-background/50 border border-border rounded-xl space-y-3">
          <label className={labelClass}>🖼️ Foto de Portada / Header de la Banda</label>
          <p className="text-xs text-muted-foreground">
            Podés subir archivos en cualquier formato (PNG, JPG).
          </p>
          
          <input 
            type="file" 
            accept="image/*"
            onChange={manejarSeleccionPortada}
            className="block w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30 cursor-pointer"
          />

          {portadaPreview && (
            <div className="mt-3 relative h-36 rounded-lg overflow-hidden border border-border">
              <img 
                src={portadaPreview} 
                alt="Vista previa de portada" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        <div>
          <label className={labelClass}>Géneros Musicales</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-background/50 border border-border rounded-xl">
            {GENEROS_DISPONIBLES.map((genero) => {
              const activo = generosSeleccionados.includes(genero);
              return (
                <label 
                  key={genero} 
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border select-none transition-all text-xs font-semibold ${
                    activo 
                    ? 'border-primary/50 bg-primary/5 text-white' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    checked={activo}
                    onChange={() => manejarCambioGenero(genero)}
                    className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer accent-primary"
                  />
                  {genero}
                </label>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-border space-y-4">
          <div>
            <label className={labelClass}>Estilo Visual de su Página</label>
            <p className="text-xs text-muted-foreground mb-3">
              Seleccioná la paleta de colores para las luces de fondo y acentos.
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TEMAS_DISPONIBLES.map((t) => {
                const seleccionado = temaColor === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemaColor(t.id)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                      seleccionado 
                        ? 'border-white bg-white/10 scale-105 shadow-lg' 
                        : 'border-border bg-background/40 hover:border-muted-foreground opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div 
                      className="w-5 h-5 rounded-full border border-white/20" 
                      style={{ backgroundColor: t.primary }} 
                    />
                    <span className="text-xs font-medium text-foreground">{t.nombre}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1 pt-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
              Vista previa de tu encabezado
            </span>

            <div 
              className="relative overflow-hidden bg-[#0a0a0c] border border-border rounded-xl p-6 text-center transition-all duration-500 bg-cover bg-center"
              style={{
                backgroundImage: portadaPreview ? `linear-gradient(to top, rgba(10,10,12,0.95), rgba(10,10,12,0.3)), url(${portadaPreview})` : undefined
              }}
            >
              <div 
                className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-28 blur-2xl pointer-events-none transition-all duration-500"
                style={{ backgroundColor: temaActivo.bgGlow }}
              />

              <div className="relative z-10 space-y-2">
                <span 
                  className="inline-block text-[10px] font-bold uppercase tracking-widest bg-black/60 border border-border px-3 py-1 rounded-full transition-colors"
                  style={{ color: temaActivo.primary }}
                >
                  {generosSeleccionados.length > 0 ? generosSeleccionados.join(', ') : 'Género Musical'}
                </span>

                <h4 className="text-2xl md:text-3xl font-black uppercase text-white tracking-tight">
                  {nombre || 'Nombre de la Banda'}
                </h4>

                <p className="text-xs text-slate-300 max-w-md mx-auto line-clamp-2">
                  {historia || 'Así se verá la biografía y las luces de fondo cuando los usuarios entren a tu página.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>Reseña Histórica / Biografía</label>
          <textarea 
            value={historia} 
            onChange={(e) => setHistoria(e.target.value)} 
            rows={4}
            placeholder="Contanos la historia de la banda, lanzamientos, trayectoria..."
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="pt-6 border-t border-border">
          <h3 className="text-base font-bold uppercase tracking-wider text-white mb-4">👥 Integrantes</h3>
          <div className="space-y-4">
            {integrantes.map((integrante, index) => (
              <div key={index} className="p-4 bg-background/40 border border-border rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Integrante #{index + 1}
                  </span>
                  {integrantes.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => eliminarIntegrante(index)} 
                      className="text-xs font-bold text-destructive hover:underline cursor-pointer"
                    >
                      Remover
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input 
                    type="text" 
                    placeholder="Nombre y Apellido" 
                    value={integrante.nombre} 
                    onChange={(e) => cambiarIntegrante(index, 'nombre', e.target.value)}
                    className={inputClass}
                  />
                  <input 
                    type="text" 
                    placeholder="Instrumento (Ej: Guitarra)" 
                    value={integrante.instrumento} 
                    onChange={(e) => cambiarIntegrante(index, 'instrumento', e.target.value)}
                    className={inputClass}
                  />
                </div>

                <input 
                  type="url" 
                  placeholder="Instagram Personal (Opcional)" 
                  value={integrante.instagram_url} 
                  onChange={(e) => cambiarIntegrante(index, 'instagram_url', e.target.value)}
                  className={inputClass}
                />

                <div className="flex items-center gap-4 pt-1">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        cambiarIntegrante(index, 'fotoFile', e.target.files[0]);
                      }
                    }}
                    className="block w-full text-xs text-muted-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                  />

                  {integrante.fotoPreviewUrl && (
                    <img 
                      src={integrante.fotoPreviewUrl} 
                      alt="Avatar previa" 
                      className="w-10 h-10 rounded-full object-cover border border-border flex-shrink-0"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
          <button 
            type="button" 
            onClick={agregarIntegrante} 
            className="mt-3 text-xs font-bold text-primary hover:text-white transition-colors cursor-pointer"
          >
            + Añadir integrante
          </button>
        </div>

        <div className="pt-6 border-t border-border">
          <h3 className="text-base font-bold uppercase tracking-wider text-white mb-4">🎧 Canciones / Enlaces</h3>
          <div className="space-y-4">
            {canciones.map((cancion, index) => (
              <div key={index} className="p-4 bg-background/40 border border-border rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Pista #{index + 1}
                  </span>
                  {canciones.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => eliminarCancion(index)} 
                      className="text-xs font-bold text-destructive hover:underline cursor-pointer"
                    >
                      Remover
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <input 
                    type="text" 
                    placeholder="Título del tema" 
                    value={cancion.titulo} 
                    onChange={(e) => cambiarCancion(index, 'titulo', e.target.value)}
                    className={inputClass}
                  />
                  <input 
                    type="url" 
                    placeholder="Link embebido de Spotify" 
                    value={cancion.spotify} 
                    onChange={(e) => cambiarCancion(index, 'spotify', e.target.value)}
                    className={inputClass}
                  />
                  <input 
                    type="url" 
                    placeholder="Link embebido de YouTube" 
                    value={cancion.youtube} 
                    onChange={(e) => cambiarCancion(index, 'youtube', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            ))}
          </div>
          <button 
            type="button" 
            onClick={agregarCancion} 
            className="mt-3 text-xs font-bold text-primary hover:text-white transition-colors cursor-pointer"
          >
            + Agregar otra pista
          </button>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          {onCancelar && (
            <button
              type="button"
              onClick={onCancelar}
              className="w-full sm:w-auto px-6 py-3 border border-border rounded-xl text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-white hover:border-white transition-all"
            >
              Cancelar
            </button>
          )}
          <button 
            type="submit" 
            disabled={enviando}
            className="glow-button w-full sm:w-auto uppercase tracking-widest disabled:opacity-50"
          >
            {enviando ? 'Comprimiendo fotos y registrando...' : 'Asentarse en el catálogo'}
          </button>
        </div>
      </form>
    </div>
  );
}