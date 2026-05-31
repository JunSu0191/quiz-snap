import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      // Suspense 모드: suspense: true를 개별 쿼리에서 설정
    },
  },
})
