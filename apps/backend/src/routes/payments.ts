import { Hono } from 'hono'
import type { AppVariables } from '../types.js'
import { authMiddleware } from '../middleware/auth.js'
import { supabaseAdmin } from '../services/supabase.js'
import { confirmPayment } from '../services/tosspayments.js'
import { ok, fail } from '../types.js'

const PLAN_AMOUNTS: Record<string, number> = {
  basic: 9900,
  pro: 19900,
}

const PLAN_NAMES: Record<string, string> = {
  basic: '문제뚝딱 Basic 1개월',
  pro: '문제뚝딱 Pro 1개월',
}

const payments = new Hono<{ Variables: AppVariables }>()
payments.use('*', authMiddleware)

// POST /api/payments/initialize
payments.post('/initialize', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json<{ plan: string }>()

  if (!body.plan || !['basic', 'pro'].includes(body.plan)) {
    return c.json(fail('BAD_REQUEST', '올바른 플랜을 선택해주세요.'), 400)
  }

  const amount = PLAN_AMOUNTS[body.plan]
  const orderId = `order_${userId.slice(0, 8)}_${Date.now()}`
  const orderName = PLAN_NAMES[body.plan]

  const { error } = await supabaseAdmin
    .from('payments')
    .insert({ user_id: userId, order_id: orderId, plan: body.plan, amount, status: 'pending' })

  if (error) throw error

  return c.json(ok({ orderId, amount, orderName }), 201)
})

// POST /api/payments/confirm
payments.post('/confirm', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json<{ paymentKey: string; orderId: string; amount: number }>()

  if (!body.paymentKey || !body.orderId || !body.amount) {
    return c.json(fail('BAD_REQUEST', '결제 정보가 올바르지 않습니다.'), 400)
  }

  // 주문 조회 및 금액 검증 (위변조 방지)
  const { data: payment, error: fetchError } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('order_id', body.orderId)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .single()

  if (fetchError || !payment) {
    return c.json(fail('NOT_FOUND', '주문 정보를 찾을 수 없습니다.'), 404)
  }

  if (payment.amount !== body.amount) {
    return c.json(fail('BAD_REQUEST', '결제 금액이 일치하지 않습니다.'), 400)
  }

  // TossPayments 최종 승인
  await confirmPayment(body.paymentKey, body.orderId, body.amount)

  const now = new Date().toISOString()
  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + 1)

  await supabaseAdmin
    .from('payments')
    .update({ status: 'done', payment_key: body.paymentKey, confirmed_at: now })
    .eq('order_id', body.orderId)

  await supabaseAdmin
    .from('profiles')
    .update({ plan: payment.plan, plan_expires_at: expiresAt.toISOString() })
    .eq('id', userId)

  return c.json(ok({ plan: payment.plan }, '결제가 완료됐어요!'))
})

// GET /api/payments/history
payments.get('/history', async (c) => {
  const userId = c.get('userId')

  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('id, order_id, plan, amount, status, created_at, confirmed_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw error

  return c.json(ok(data ?? []))
})

export default payments
