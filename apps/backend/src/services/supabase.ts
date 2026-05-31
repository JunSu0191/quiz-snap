import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

const supabaseUrl = process.env.SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경 변수가 없습니다.')
}

// 백엔드 전용 — service role (RLS 우회, 사용자 데이터 관리)
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
})

// 사용자 JWT로 RLS 적용 클라이언트 생성
export function createUserClient(accessToken: string) {
  return createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws },
  })
}
