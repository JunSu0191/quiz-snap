import { Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary'
import { useWorksheets, useUsage } from '../hooks/useWorksheets'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton'

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: '쉬움', medium: '보통', hard: '어려움',
}

function UsageBanner() {
  const { data: usage } = useUsage()
  if (!usage) return null

  const usagePercent = usage.limit ? Math.round((usage.used / usage.limit) * 100) : null

  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">
        이번 달 <span className="font-semibold text-foreground">{usage.used}회</span> 사용
        {usage.limit ? ` / ${usage.limit}회` : ' (무제한)'}
        {' · '}
        <Badge variant="outline" className="text-xs capitalize">{usage.plan}</Badge>
      </p>
      {usagePercent !== null && <Progress value={usagePercent} className="h-1.5 w-48" />}
    </div>
  )
}

function WorksheetGrid({ page, onPageChange }: { page: number; onPageChange: (p: number) => void }) {
  const { data } = useWorksheets(page)

  if (data?.data?.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-4 py-16">
          <p className="text-muted-foreground">아직 생성한 문제지가 없어요.</p>
          <Button variant="outline" asChild>
            <Link to="/generate">첫 문제지 만들기</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.data?.map((ws: {
          id: string; subject: string; difficulty: string
          title: string; grade: string; question_count: number
          status: string; created_at: string
        }) => (
          <Link key={ws.id} to={`/worksheets/${ws.id}`}>
            <Card className={`h-full transition-shadow hover:shadow-md ${ws.status === 'pending' ? 'opacity-80' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{ws.subject}</Badge>
                  {ws.status === 'pending' ? (
                    <Badge variant="outline" className="animate-pulse text-xs">생성 중...</Badge>
                  ) : ws.status === 'failed' ? (
                    <Badge variant="destructive" className="text-xs">실패</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {DIFFICULTY_LABEL[ws.difficulty] ?? ws.difficulty}
                    </span>
                  )}
                </div>
                <CardTitle className="mt-1 line-clamp-2 text-sm">{ws.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{ws.grade} · {ws.question_count}문항</CardDescription>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(ws.created_at).toLocaleDateString('ko-KR')}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}>
            이전
          </Button>
          <span className="px-4 py-2 text-sm text-muted-foreground">
            {page} / {data.pagination.totalPages}
          </span>
          <Button variant="outline" size="sm" onClick={() => onPageChange(Math.min(data.pagination.totalPages, page + 1))} disabled={page === data.pagination.totalPages}>
            다음
          </Button>
        </div>
      )}
    </>
  )
}

export function Dashboard() {
  const [page, setPage] = useState(1)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">내 문제지</h1>
          <ErrorBoundary fallback={null}>
            <Suspense fallback={<div className="mt-2 h-8 w-48 animate-pulse rounded bg-muted" />}>
              <UsageBanner />
            </Suspense>
          </ErrorBoundary>
        </div>
        <Button asChild>
          <Link to="/generate">+ 문제지 생성</Link>
        </Button>
      </div>

      <ErrorBoundary fallback={
        <div className="flex h-40 items-center justify-center">
          <p className="text-sm text-muted-foreground">데이터를 불러오지 못했습니다.</p>
        </div>
      }>
        <Suspense fallback={<DashboardSkeleton />}>
          <WorksheetGrid page={page} onPageChange={setPage} />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
