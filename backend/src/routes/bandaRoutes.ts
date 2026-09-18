import { Hono } from 'hono'
import { pool } from '../db'

export const bandaRoutes = new Hono()

// GET /api/bandas/buscar?clave=...
.get('/buscar', async (c) => {
  try {
    const clave = c.req.query('clave')
    if (!clave) return c.json({ error: 'La palabra clave es requerida' }, 400)

    const query = `
      SELECT b.*,
        COALESCE((SELECT json_agg(json_build_object('id', i.id, 'nombre', i.nombre, 'rol', i.rol, 'foto_url', i.foto_url, 'instagram', i.instagram)) FROM integrantes i WHERE i.banda_id = b.id), '[]'::json) AS integrantes,
        COALESCE((SELECT json_agg(json_build_object('id', c_sub.id, 'titulo', c_sub.titulo, 'url_audio', c_sub.url_audio, 'spotify_id', c_sub.spotify_id)) FROM canciones c_sub WHERE c_sub.banda_id = b.id), '[]'::json) AS canciones
      FROM bandas b
      WHERE b.palabra_clave = $1
    `
    const { rows } = await pool.query(query, [clave.trim()])
    if (rows.length === 0) return c.json({ error: 'No se encontró la banda' }, 404)

    return c.json(rows[0])
  } catch (error) {
    return c.json({ error: 'Error al buscar la banda' }, 500)
  }
})

// POST /api/bandas/solicitar-otp
.post('/solicitar-otp', async (c) => {
  try {
    const { email } = await c.req.json()
    if (!email) return c.json({ error: 'Email requerido' }, 400)

    const findQuery = `SELECT id, nombre FROM bandas WHERE LOWER(email) = LOWER($1)`
    const { rows } = await pool.query(findQuery, [email.trim()])
    if (rows.length === 0) return c.json({ error: 'Email no registrado' }, 404)

    const tokenOTP = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000)

    await pool.query(
      `UPDATE bandas SET otp_codigo = $1, otp_expira = $2 WHERE id = $3`,
      [tokenOTP, otpExpires, rows[0].id]
    )

    return c.json({ message: 'OTP generado', tokenOTP, nombreBanda: rows[0].nombre })
  } catch (error) {
    return c.json({ error: 'Error al procesar OTP' }, 500)
  }
})

// POST /api/bandas/restablecer-clave
.post('/restablecer-clave', async (c) => {
  try {
    const { email, codigoOTP, nuevaClave } = await c.req.json()

    const { rows } = await pool.query(
      `SELECT id, otp_codigo, otp_expira FROM bandas WHERE LOWER(email) = LOWER($1)`,
      [email.trim()]
    )
    if (rows.length === 0) return c.json({ error: 'Banda no encontrada' }, 404)

    const banda = rows[0]
    if (banda.otp_codigo !== codigoOTP.trim()) return c.json({ error: 'Código inválido' }, 400)
    if (new Date(banda.otp_expira) < new Date()) return c.json({ error: 'Código expirado' }, 400)

    await pool.query(
      `UPDATE bandas SET palabra_clave = $1, otp_codigo = NULL, otp_expira = NULL WHERE id = $2`,
      [nuevaClave.trim(), banda.id]
    )

    return c.json({ message: 'Clave actualizada' })
  } catch (error) {
    return c.json({ error: 'Error al restablecer la clave' }, 500)
  }
})

// POST /api/bandas (Crear banda)
.post('/', async (c) => {
  const client = await pool.connect()
  try {
    const body = await c.req.json()
    await client.query('BEGIN')

    const insertBandaQuery = `
      INSERT INTO bandas (nombre, email, palabra_clave, genero, bio, historia, color_tema, url_portada, spotify_url, instagram_url, youtube_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `
    const bandaRes = await client.query(insertBandaQuery, [
      body.nombre, body.email, body.palabraClave, body.genero, body.bio,
      body.historia, body.colorTema, body.urlPortada, body.spotifyUrl,
      body.instagramUrl, body.youtubeUrl
    ])
    const bandaId = bandaRes.rows[0].id

    if (body.integrantes?.length) {
      for (const i of body.integrantes) {
        await client.query(
          `INSERT INTO integrantes (banda_id, nombre, rol, foto_url, instagram) VALUES ($1, $2, $3, $4, $5)`,
          [bandaId, i.nombre, i.rol, i.foto_url, i.instagram]
        )
      }
    }

    if (body.canciones?.length) {
      for (const cn of body.canciones) {
        await client.query(
          `INSERT INTO canciones (banda_id, titulo, url_audio, spotify_id) VALUES ($1, $2, $3, $4)`,
          [bandaId, cn.titulo, cn.url_audio, cn.spotify_id]
        )
      }
    }

    await client.query('COMMIT')
    return c.json({ message: 'Banda registrada exitosamente', id: bandaId }, 201)
  } catch (error) {
    await client.query('ROLLBACK')
    return c.json({ error: 'Error registrando la banda' }, 500)
  } finally {
    client.release()
  }
})

// PUT /api/bandas/:id (Editar banda)
.put('/:id', async (c) => {
  const id = c.req.param('id')
  const client = await pool.connect()
  try {
    const body = await c.req.json()
    const check = await client.query(`SELECT palabra_clave FROM bandas WHERE id = $1`, [id])
    
    if (check.rows.length === 0) return c.json({ error: 'Banda no encontrada' }, 404)
    if (check.rows[0].palabra_clave !== body.palabraClave) {
      return c.json({ error: 'Palabra clave incorrecta' }, 403)
    }

    await client.query('BEGIN')

    const nuevaClave = body.nuevaPalabraClave || body.palabraClave
    await client.query(
      `UPDATE bandas SET nombre=$1, email=$2, genero=$3, bio=$4, historia=$5, color_tema=$6, url_portada=$7, spotify_url=$8, instagram_url=$9, youtube_url=$10, palabra_clave=$11 WHERE id=$12`,
      [body.nombre, body.email, body.genero, body.bio, body.historia, body.colorTema, body.urlPortada, body.spotifyUrl, body.instagramUrl, body.youtubeUrl, nuevaClave, id]
    )

    await client.query(`DELETE FROM integrantes WHERE banda_id = $1`, [id])
    if (body.integrantes?.length) {
      for (const i of body.integrantes) {
        await client.query(
          `INSERT INTO integrantes (banda_id, nombre, rol, foto_url, instagram) VALUES ($1, $2, $3, $4, $5)`,
          [id, i.nombre, i.rol, i.foto_url, i.instagram]
        )
      }
    }

    await client.query(`DELETE FROM canciones WHERE banda_id = $1`, [id])
    if (body.canciones?.length) {
      for (const cn of body.canciones) {
        await client.query(
          `INSERT INTO canciones (banda_id, titulo, url_audio, spotify_id) VALUES ($1, $2, $3, $4)`,
          [id, cn.titulo, cn.url_audio, cn.spotify_id]
        )
      }
    }

    await client.query('COMMIT')
    return c.json({ message: 'Banda actualizada' })
  } catch (error) {
    await client.query('ROLLBACK')
    return c.json({ error: 'Error al actualizar banda' }, 500)
  } finally {
    client.release()
  }
})