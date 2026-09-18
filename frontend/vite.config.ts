import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  // Usa la subruta solo si está compilando el Action de GitHub Pages; en Cloudflare usa '/'
  base: process.env.GITHUB_ACTIONS ? '/catalogo-bandascs/' : '/',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Reemplazá 3000 por el puerto donde corre tu backend local
        changeOrigin: true,
      },
    },
  },
});