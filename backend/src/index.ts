import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { pool } from './db.js'
import { bandaRoutes } from './routes/bandaRoutes'
import { adminRoutes } from './routes/adminRoutes.js'
import { radioRoutes } from './routes/radioRoutes.js'

const app = new Hono()

app.use('*', cors({
  origin: 'http://localhost:5173',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
}))

const routes = app
  .get('/api/health', (c) => c.json({ status: 'ok' }))
  .get('/api/bandas', async (c) => {
    try {
      const query = `
        SELECT 
          b.id, b.nombre, b.genero, b.bio, b.historia, 
          b.url_portada, b.color_tema, b.aprobado,
          COALESCE(
            json_agg(
              json_build_object('id', i.id, 'nombre', i.nombre, 'rol', i.rol)
            ) FILTER (WHERE i.id IS NOT NULL), '[]'::json
          ) AS integrantes
        FROM bandas b
        LEFT JOIN integrantes i ON i.banda_id = b.id
        WHERE b.aprobado = true
        GROUP BY b.id
        ORDER BY b.nombre ASC
      `
      const { rows } = await pool.query(query)
      return c.json(rows)
    } catch (error) {
      return c.json({ error: 'Error interno de la base de datos' }, 500)
    }
  })
  .get('/api/bandas/:id', async (c) => {
    try {
      const id = c.req.param('id')
      const query = `
        SELECT 
          b.*,
          COALESCE((SELECT json_agg(json_build_object('id', i.id, 'nombre', i.nombre, 'rol', i.rol, 'foto_url', i.foto_url, 'instagram', i.instagram)) FROM integrantes i WHERE i.banda_id = b.id), '[]'::json) AS integrantes,
          COALESCE((SELECT json_agg(json_build_object('id', c_sub.id, 'titulo', c_sub.titulo, 'url_audio', c_sub.url_audio, 'spotify_id', c_sub.spotify_id)) FROM canciones c_sub WHERE c_sub.banda_id = b.id), '[]'::json) AS canciones
        FROM bandas b
        WHERE b.id = $1
      `
      const { rows } = await pool.query(query, [id])
      if (rows.length === 0) return c.json({ error: 'Banda no encontrada' }, 404)
      return c.json(rows[0])
    } catch (error) {
      return c.json({ error: 'Error interno de la base de datos' }, 500)
    }
  })
  .route('/api/bandas', bandaRoutes)
  .route('/api/radios', radioRoutes)
  .route('/api/admin', adminRoutes) // Monta las subrutas de bandaRoutes

export type AppType = typeof routes

serve({ fetch: app.fetch, port: 3000 }, () => {
  console.log('Servidor Hono corriendo en http://localhost:3000')
})