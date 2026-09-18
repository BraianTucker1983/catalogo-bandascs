import { Hono } from 'hono'
import { pool } from '../db.js'

export const radioRoutes = new Hono()

// GET /api/radios - Obtener radios activas para el público
.get('/', async (c) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
        id, 
        nombre, 
        frecuencia, 
        slogan, 
        url, 
        instagram_url AS "instagramUrl", 
        imagen_fondo AS "imagenFondo" 
       FROM radios_patrocinadoras 
       WHERE activo = true 
       ORDER BY id DESC`
    )
    return c.json(rows)
  } catch (error) {
    return c.json({ error: 'Error al obtener las radios' }, 500)
  }
})

// POST /api/radios - Crear nueva radio (Panel de Admin)
.post('/', async (c) => {
  try {
    const { nombre, frecuencia, slogan, url, instagramUrl, imagenFondo } = await c.req.json()
    const { rows } = await pool.query(
      `INSERT INTO radios_patrocinadoras (nombre, frecuencia, slogan, url, instagram_url, imagen_fondo)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nombre, frecuencia, slogan, url, instagramUrl, imagenFondo]
    )
    return c.json(rows[0], 201)
  } catch (error) {
    return c.json({ error: 'Error al crear la radio' }, 500)
  }
})

// DELETE /api/radios/:id - Eliminar radio (Panel de Admin)
.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await pool.query('DELETE FROM radios_patrocinadoras WHERE id = $1', [id])
    return c.json({ message: 'Radio eliminada correctamente' })
  } catch (error) {
    return c.json({ error: 'Error al eliminar la radio' }, 500)
  }
})