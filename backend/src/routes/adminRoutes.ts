import { Hono } from 'hono'
import { pool } from '../db.js'

export const adminRoutes = new Hono()

// POST /api/admin/solicitar-otp
.post('/solicitar-otp', async (c) => {
  try {
    const { email } = await c.req.json()
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@ejemplo.com'

    if (email.toLowerCase().trim() !== adminEmail.toLowerCase().trim()) {
      return c.json({ error: 'El correo no corresponde a un administrador.' }, 403)
    }

    const tokenOTP = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000)

    // Guardar o actualizar OTP de admin
    await pool.query(
      `INSERT INTO admin_sessions (email, otp_codigo, otp_expira) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (email) DO UPDATE SET otp_codigo = $2, otp_expira = $3`,
      [adminEmail, tokenOTP, otpExpires]
    )

    return c.json({ message: 'Código enviado', tokenOTP })
  } catch (error) {
    return c.json({ error: 'Error procesando la solicitud' }, 500)
  }
})

// POST /api/admin/validar-otp
.post('/validar-otp', async (c) => {
  try {
    const { email, codigoOTP } = await c.req.json()
    const { rows } = await pool.query(
      `SELECT otp_codigo, otp_expira FROM admin_sessions WHERE LOWER(email) = LOWER($1)`,
      [email.trim()]
    )

    if (rows.length === 0) return c.json({ error: 'Sesión no encontrada' }, 404)

    const session = rows[0]
    if (session.otp_codigo !== codigoOTP.trim()) return c.json({ error: 'Código incorrecto' }, 400)
    if (new Date(session.otp_expira) < new Date()) return c.json({ error: 'Código expirado' }, 400)

    // Generar token simple de sesión
    const tokenSesion = crypto.randomUUID()
    await pool.query(`UPDATE admin_sessions SET token_sesion = $1, otp_codigo = NULL WHERE email = $2`, [tokenSesion, email.trim()])

    return c.json({ message: 'Autenticación exitosa', token: tokenSesion })
  } catch (error) {
    return c.json({ error: 'Error al validar OTP' }, 500)
  }
})

// GET /api/admin/bandas-pendientes
.get('/bandas-pendientes', async (c) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM bandas WHERE aprobado = false ORDER BY id DESC`)
    return c.json(rows)
  } catch (error) {
    return c.json({ error: 'Error al obtener bandas pendientes' }, 500)
  }
})

// PUT /api/admin/bandas/:id/aprobar
.put('/bandas/:id/aprobar', async (c) => {
  try {
    const id = c.req.param('id')
    await pool.query(`UPDATE bandas SET aprobado = true WHERE id = $1`, [id])
    return c.json({ message: 'Banda aprobada con éxito' })
  } catch (error) {
    return c.json({ error: 'Error al aprobar banda' }, 500)
  }
})

// DELETE /api/admin/bandas/:id
.delete('/bandas/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await pool.query(`DELETE FROM bandas WHERE id = $1`, [id])
    return c.json({ message: 'Banda rechazada/eliminada' })
  } catch (error) {
    return c.json({ error: 'Error al eliminar banda' }, 500)
  }
})