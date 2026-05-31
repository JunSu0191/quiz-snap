import type { Context, Next } from 'hono'
import { fail } from '../types.js'

export async function errorMiddleware(c: Context, next: Next) {
  try {
    await next()
  } catch (err) {
    console.error('[Error]', err)
    const message = err instanceof Error ? err.message : '서버 오류가 발생했습니다.'
    return c.json(fail('INTERNAL_SERVER_ERROR', message), 500)
  }
}
