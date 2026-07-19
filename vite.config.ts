import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // <-- 1. Importamos el compilador nativo v4

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(), // <-- 2. Añadimos Tailwind v4 aquí
    react(),
  ],
  base: '/catalogo-bandascs/', // Mantener tu configuración base intacta
})