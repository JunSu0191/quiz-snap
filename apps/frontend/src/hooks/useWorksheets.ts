import { useSuspenseQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  fetchWorksheets,
  fetchWorksheet,
  fetchUsage,
  generateWorksheet,
  retryWorksheet,
  type GeneratePayload,
} from '../api/worksheets'

// Suspense 모드 — Dashboard에서 사용
export function useWorksheets(page = 1) {
  return useSuspenseQuery({
    queryKey: ['worksheets', page],
    queryFn: () => fetchWorksheets(page),
  })
}

// 폴링 모드 — WorksheetDetail에서 status가 pending이면 3초마다 재조회
export function useWorksheetPolling(id: string) {
  return useQuery({
    queryKey: ['worksheet', id],
    queryFn: () => fetchWorksheet(id),
    refetchInterval: (query) =>
      query.state.data?.status === 'pending' ? 3000 : false,
  })
}

export function useWorksheet(id: string) {
  return useSuspenseQuery({
    queryKey: ['worksheet', id],
    queryFn: () => fetchWorksheet(id),
  })
}

export function useUsage() {
  return useSuspenseQuery({
    queryKey: ['usage'],
    queryFn: fetchUsage,
  })
}

// 일반 모드 — 에러를 직접 처리할 때
export function useUsageQuery() {
  return useQuery({
    queryKey: ['usage'],
    queryFn: fetchUsage,
  })
}

export function useRetryWorksheet(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => retryWorksheet(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['worksheet', id] })
    },
    onError: () => {
      toast.error('재시도에 실패했어요. 잠시 후 다시 시도해주세요.')
    },
  })
}

export function useGenerateWorksheet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: GeneratePayload) => generateWorksheet(payload),
    onSuccess: () => {
      toast.success('문제지가 생성됐어요!')
      qc.invalidateQueries({ queryKey: ['worksheets'] })
      qc.invalidateQueries({ queryKey: ['usage'] })
    },
    onError: (error: { message?: string }) => {
      toast.error(error?.message ?? '문제지 생성에 실패했어요.')
    },
  })
}
