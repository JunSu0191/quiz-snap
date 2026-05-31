import { Suspense, type ReactNode } from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { Button } from '@/components/ui/button'

function DefaultFallback({ error, resetErrorBoundary }: FallbackProps) {
  const message = error instanceof Error ? error.message : '데이터를 불러오지 못했습니다.'
  return (
    <div className="flex flex-col items-center gap-3 py-12">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" onClick={resetErrorBoundary}>
        다시 시도
      </Button>
    </div>
  )
}

interface Props {
  children: ReactNode
  fallback: ReactNode
  onReset?: () => void
}

export function SuspenseBoundary({ children, fallback, onReset }: Props) {
  return (
    <ErrorBoundary FallbackComponent={DefaultFallback} onReset={onReset}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}
