import 'dotenv/config'
import { Hono } from 'hono'
import type { AppVariables } from './types.js'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { errorMiddleware } from './middleware/error.js'
import worksheetsRoute from './routes/worksheets.js'
import paymentsRoute from './routes/payments.js'

const app = new Hono<{ Variables: AppVariables }>()

app.use('*', logger())
app.use('*', errorMiddleware)
app.use(
  '/api/*',
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
)

app.get('/api/health', (c) =>
  c.json({ status: 'ok', service: 'quiz-snap-backend', timestamp: new Date().toISOString() })
)

app.route('/api/worksheets', worksheetsRoute)
app.route('/api/payments', paymentsRoute)

const port = Number(process.env.PORT) || 3000
console.log(`Server running on http://localhost:${port}`)

serve({ fetch: app.fetch, port })
