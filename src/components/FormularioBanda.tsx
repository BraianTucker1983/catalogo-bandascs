import { useState } from 'react';
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

// Opciones de temas con luces y acentos dinámicos
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

export default function FormularioBanda() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [palabraClave, setPalabraClave] = useState('');
  const [historia, setHistoria] = useState('');
  const [generosSeleccionados, setGenerosSeleccionados] = useState<string[]>([]);
  const [temaColor, setTemaColor] = useState('purple');
  
  const [integrantes, setIntegrantes] = useState<{ nombre: string; instrumento: string }[]>([
    { nombre: '', instrumento: '' }
  ]);

  const [canciones, setCanciones] = useState<{ titulo: string; spotify: string; youtube: string }[]>([
    { titulo: '', spotify: '', youtube: '' }
  ]);

  const [enviando, setEnviando] = useState(false);

  const temaActivo = TEMAS_DISPONIBLES.find((t) => t.id === temaColor) || TEMAS_DISPONIBLES[0];

  const manejarCambioGenero = (genero: string) => {
    if (generosSeleccionados.includes(genero)) {
      setGenerosSeleccionados(generosSeleccionados.filter(g => g !== genero));
    } else {
      setGenerosSeleccionados([...generosSeleccionados, genero]);
    }
  };

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

    try {
      const generoFinalString = generosSeleccionados.join(', ');

      // 1. Guardar datos de la banda en Supabase
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
            aprobado: false
          }
        ])
        .select()
        .single();

      if (errorBanda) throw errorBanda;

      const bandaId = bandaInsertada.id;

      // 2. Guardar Integrantes
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

      // 3. Guardar Canciones
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

      // 4. Envío del correo vía EmailJS
      try {
        await emailjs.send(
          'service_lth9njw',   // <-- Colocá tu Service ID de EmailJS
          'template_o83d6ph',  // <-- Colocá tu Template ID de EmailJS
          {
            nombre_banda: nombre,      // Coincide con {{nombre_banda}}
            to_email: email,           // Campo "To Email" en la interfaz de EmailJS
            clave: palabraClave,       // Coincide con {{clave}}
            genero: generoFinalString,
          },
          'se4gVL7DjUFdcuO9f'    // <-- Colocá tu Public Key de EmailJS
        );
      } catch (errEmail) {
        console.error("Error al enviar email de confirmación:", errEmail);
        // Continuamos la ejecución para avisar que los datos sí se registraron correctamente
      }

      alert('¡Inscripción completada! Tu banda se envió para revisión del administrador y te enviamos un correo de confirmación con tu palabra clave.');
      
      // Reseteo de estados
      setNombre('');
      setEmail('');
      setPalabraClave('');
      setGenerosSeleccionados([]);
      setTemaColor('purple');
      setHistoria('');
      setIntegrantes([{ nombre: '', instrumento: '' }]);
      setCanciones([{ titulo: '', spotify: '', youtube: '' }]);

    } catch (error: any) {
      console.error(error.message);
      alert(`Hubo un error al guardar: ${error.message}`);
    } finally {
      setEnviando(false);
    }
  };

  const inputClass = "w-full p-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors text-sm";
  const labelClass = "block text-sm font-semibold tracking-wider uppercase text-white/80 mb-2";

  return (
    <div className="max-w-3xl mx-auto my-12 bg-card border border-border p-8 rounded-2xl shadow-2xl relative text-foreground">
      
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-black tracking-wide uppercase mb-2 text-white">
          Formulario de <span className="gradient-text">Inscripción</span>
        </h2>
        <p className="text-sm text-muted-foreground font-medium">
          Registrá los datos de tu proyecto musical en nuestro catálogo digital.
        </p>
      </div>

      <form onSubmit={manejarEnvio} className="space-y-6">
        
        {/* Nombre */}
        <div>
          <label className={labelClass}>Nombre de la Banda</label>
          <input 
            type="text" 
            value={nombre} 
            onChange={(e) => setNombre(e.target.value)} 
            required 
            placeholder="Ej: CLIMA"
            className={inputClass}
          />
        </div>

        {/* Credenciales de Contacto y Seguridad */}
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
          Guardá bien esta palabra clave. Te llegará a tu correo y la necesitarás si deseás modificar o actualizar los datos más adelante.
        </span>

        {/* Checkboxes de Géneros */}
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

        {/* Selector de Apariencia / Tema + Vista Previa */}
        <div className="pt-4 border-t border-border space-y-4">
          <div>
            <label className={labelClass}>Estilo Visual de su Página</label>
            <p className="text-xs text-muted-foreground mb-3">
              Seleccioná la paleta de colores para las luces de fondo y acentos cuando los usuarios visiten tu página individual.
            </p>
            
            {/* Presets de Color */}
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

          {/* Caja de Vista Previa Instantánea */}
          <div className="space-y-1 pt-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
              Vista previa de tu encabezado
            </span>

            <div className="relative overflow-hidden bg-[#0a0a0c] border border-border rounded-xl p-6 text-center transition-all duration-500">
              {/* Luz resplandeciente de fondo */}
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

                <p className="text-xs text-slate-400 max-w-md mx-auto line-clamp-2">
                  {historia || 'Así se verá la biografía y las luces de fondo cuando los usuarios entren a tu página.'}
                </p>

                <div className="pt-2">
                  <span 
                    className="inline-block text-[10px] font-bold uppercase tracking-widest text-white px-4 py-2 rounded-lg transition-all"
                    style={{ 
                      backgroundColor: temaActivo.primary,
                      boxShadow: `0 0 15px ${temaActivo.bgGlow}`
                    }}
                  >
                    Escuchar Canciones
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Biografía */}
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

        {/* Sección Integrantes */}
        <div className="pt-6 border-t border-border">
          <h3 className="text-base font-bold uppercase tracking-wider text-white mb-4">👥 Integrantes</h3>
          <div className="space-y-3">
            {integrantes.map((integrante, index) => (
              <div key={index} className="flex gap-3 items-center">
                <input 
                  type="text" 
                  placeholder="Nombre" 
                  value={integrante.nombre} 
                  onChange={(e) => cambiarIntegrante(index, 'nombre', e.target.value)}
                  className={inputClass}
                />
                <input 
                  type="text" 
                  placeholder="Instrumento" 
                  value={integrante.instrumento} 
                  onChange={(e) => cambiarIntegrante(index, 'instrumento', e.target.value)}
                  className={inputClass}
                />
                {integrantes.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => eliminarIntegrante(index)} 
                    className="p-3 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white rounded-lg transition-colors cursor-pointer text-sm"
                  >
                    ✕
                  </button>
                )}
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

        {/* Sección Canciones */}
        <div className="pt-6 border-t border-border">
          <h3 className="text-base font-bold uppercase tracking-wider text-white mb-4">🎧 Canciones / Enlaces</h3>
          <div className="space-y-4">
            {canciones.map((cancion, index) => (
              <div key={index} className="p-4 bg-background/40 border border-border rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pista #{index + 1}</span>
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

        {/* Botón de envío */}
        <div className="pt-6 text-center">
          <button 
            type="submit" 
            disabled={enviando}
            className="glow-button w-full sm:w-auto uppercase tracking-widest disabled:opacity-50"
          >
            {enviando ? 'Procesando...' : 'Asentarse en el catálogo'}
          </button>
        </div>
      </form>
    </div>
  );
}