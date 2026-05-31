import { Hono } from 'hono'
import { supabaseAdmin } from '../services/supabase.js'
import { generateWorksheet } from '../services/claude.js'
import type { GenerateParams } from '../services/claude.js'
import { authMiddleware } from '../middleware/auth.js'
import type { AppVariables } from '../types.js'
import { ok, fail } from '../types.js'
import { logger } from '../lib/logger.js'

const PLAN_LIMITS: Record<string, number | null> = {
  free: 5,
  basic: null,
  pro: null,
}

const worksheets = new Hono<{ Variables: AppVariables }>()
worksheets.use('*', authMiddleware)

async function setProgress(worksheetId: string, progress: number) {
  await supabaseAdmin.from('worksheets').update({ progress }).eq('id', worksheetId)
}

// 백그라운드에서 Claude 호출 후 워크시트 업데이트
async function generateInBackground(
  worksheetId: string,
  params: GenerateParams
) {
  try {
    await setProgress(worksheetId, 15)       // Claude 호출 시작
    const generated = await generateWorksheet(params)
    await setProgress(worksheetId, 85)       // Claude 응답 완료, DB 저장 중
    await supabaseAdmin
      .from('worksheets')
      .update({ title: generated.title, content: generated, status: 'done', progress: 100 })
      .eq('id', worksheetId)
  } catch (err) {
    logger.error('generateInBackground 실패', { worksheetId, error: String(err) })
    await supabaseAdmin
      .from('worksheets')
      .update({ status: 'failed', progress: 0 })
      .eq('id', worksheetId)
  }
}

// POST /api/worksheets/generate
worksheets.post('/generate', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()
  const { subject, grade, topic, questionCount, questionTypes } = body
  const difficulty = body.difficulty as 'easy' | 'medium' | 'hard'

  if (!subject || !grade || !topic || !difficulty || !questionCount || !questionTypes?.length) {
    return c.json(fail('BAD_REQUEST', '필수 항목이 누락되었습니다.'), 400)
  }
  if (!['easy', 'medium', 'hard'].includes(difficulty)) {
    return c.json(fail('BAD_REQUEST', '올바른 난이도를 선택해주세요.'), 400)
  }
  if (questionCount < 5 || questionCount > 30) {
    return c.json(fail('BAD_REQUEST', '문항 수는 5~30개 사이여야 합니다.'), 400)
  }

  // 프로필 조회 (없으면 자동 생성)
  let { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    const userEmail = c.get('userEmail')
    const { data: upserted, error: upsertError } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: userId, email: userEmail, plan: 'free' }, { onConflict: 'id' })
      .select('plan')
      .single()

    if (upsertError || !upserted) {
      return c.json(fail('INTERNAL_SERVER_ERROR', '프로필 초기화에 실패했습니다.'), 500)
    }
    profile = upserted
  }

  // 플랜 제한 확인
  const limit = PLAN_LIMITS[profile.plan]
  if (limit !== null) {
    const yearMonth = new Date().toISOString().slice(0, 7)
    const { count } = await supabaseAdmin
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('year_month', yearMonth)

    if ((count ?? 0) >= limit) {
      return c.json(
        fail('PLAN_LIMIT_EXCEEDED', `무료 플랜은 월 ${limit}회까지 생성 가능합니다. 플랜을 업그레이드하세요.`),
        403
      )
    }
  }

  // pending 상태로 워크시트 행 생성 (즉시 응답용)
  const { data: worksheet, error: wsError } = await supabaseAdmin
    .from('worksheets')
    .insert({
      user_id: userId,
      title: `${subject} ${grade} 문제지`,
      subject,
      grade,
      topic,
      difficulty,
      question_count: questionCount,
      question_types: questionTypes,
      content: {},
      status: 'pending',
      progress: 0,
    })
    .select()
    .single()

  if (wsError) throw new Error('문제지 저장 실패: ' + wsError.message)

  // 사용량 미리 기록 (플랜 슬롯 선점)
  const yearMonth = new Date().toISOString().slice(0, 7)
  await supabaseAdmin.from('usage_logs').insert({
    user_id: userId,
    worksheet_id: worksheet.id,
    year_month: yearMonth,
  })

  // Claude 호출은 백그라운드에서 (await 없음)
  generateInBackground(worksheet.id, { subject, grade, topic, difficulty, questionCount, questionTypes })

  return c.json(ok(worksheet, '문제지 생성이 시작됐어요!'), 201)
})

// GET /api/worksheets
worksheets.get('/', async (c) => {
  const userId = c.get('userId')
  const page = Number(c.req.query('page') ?? 1)
  const limit = Number(c.req.query('limit') ?? 10)
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabaseAdmin
    .from('worksheets')
    .select('id, title, subject, grade, topic, difficulty, question_count, status, created_at', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw new Error(error.message)

  return c.json({
    data,
    pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
  })
})

// GET /api/worksheets/usage/current
worksheets.get('/usage/current', async (c) => {
  const userId = c.get('userId')
  const yearMonth = new Date().toISOString().slice(0, 7)

  const [profileResult, usageResult] = await Promise.all([
    supabaseAdmin.from('profiles').select('plan').eq('id', userId).single(),
    supabaseAdmin
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('year_month', yearMonth),
  ])

  const plan = profileResult.data?.plan ?? 'free'
  const used = usageResult.count ?? 0
  const limit = PLAN_LIMITS[plan]

  return c.json(ok({
    plan,
    used,
    limit,
    remaining: limit === null ? null : Math.max(0, limit - used),
    yearMonth,
  }))
})

// POST /api/worksheets/:id/retry
worksheets.post('/:id/retry', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const { data: ws, error } = await supabaseAdmin
    .from('worksheets')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !ws) {
    return c.json(fail('NOT_FOUND', '문제지를 찾을 수 없습니다.'), 404)
  }
  if (ws.status !== 'failed') {
    return c.json(fail('BAD_REQUEST', '실패 상태의 문제지만 재시도할 수 있습니다.'), 400)
  }

  const { error: resetError } = await supabaseAdmin
    .from('worksheets')
    .update({ status: 'pending', progress: 0, content: {} })
    .eq('id', id)

  if (resetError) throw new Error('재시도 초기화 실패: ' + resetError.message)

  generateInBackground(id, {
    subject: ws.subject,
    grade: ws.grade,
    topic: ws.topic,
    difficulty: ws.difficulty as 'easy' | 'medium' | 'hard',
    questionCount: ws.question_count,
    questionTypes: ws.question_types,
  })

  return c.json(ok({ id }, '재시도를 시작했어요!'))
})

// GET /api/worksheets/:id
worksheets.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const { data, error } = await supabaseAdmin
    .from('worksheets')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return c.json(fail('NOT_FOUND', '문제지를 찾을 수 없습니다.'), 404)
  }

  return c.json(ok(data))
})

export default worksheets
