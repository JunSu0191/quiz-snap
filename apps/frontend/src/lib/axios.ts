import axios from 'axios'
import { toast } from 'sonner'
import { supabase } from './supabase'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL as string,
  timeout: 30000, // 30초
})

// 요청 인터셉터 — 토큰 자동 주입
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

// 응답 인터셉터 — 공통 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_CANCELED') {
      toast.error('요청 시간이 초과됐습니다. 잠시 후 다시 시도해 주세요.')
      return Promise.reject(error)
    }

    const status = error.response?.status
    const apiError = error.response?.data?.error

    if (status === 401) {
      supabase.auth.signOut()
      window.location.href = '/login'
    } else if (status === 403) {
      toast.error(apiError?.message ?? '플랜을 업그레이드해주세요.')
      window.location.href = '/pricing'
    } else if (status >= 500) {
      toast.error(apiError?.message ?? '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    }

    return Promise.reject(apiError ?? error)
  }
)
