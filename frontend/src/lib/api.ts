import { hc } from 'hono/client'
import type { AppType } from '../../../backend/src/index' // Importación relativa del tipo

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// El tipo solo se usa en tiempo de compilación, no añade código extra a tu bundle
export const client = hc<AppType>(API_URL)