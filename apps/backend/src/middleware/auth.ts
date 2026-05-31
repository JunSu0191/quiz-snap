import type { Context, Next } from 'hono'
import { supabaseAdmin } from '../services/supabase.js'
import type { AppVariables } from '../types.js'

export async function authMiddleware(c: Context<{ Variables: AppVariables }>, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: '인증 토큰이 필요합니다.' }, 401)
  }

  const token = authHeader.slice(7)
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) {
    return c.json({ error: '유효하지 않은 토큰입니다.' }, 401)
  }

  c.set('userId', user.id)
  c.set('userEmail', user.email ?? '')
  c.set('accessToken', token)
  await next()
}
