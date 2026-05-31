import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useWorksheetPolling, useRetryWorksheet } from '../hooks/useWorksheets'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { WorksheetDetailSkeleton } from '@/components/skeletons/WorksheetDetailSkeleton'
import type { WorksheetDetail as WsDetail } from '@/api/worksheets'

// 생성 시작 시각 기준으로 경과 시간 → 추정 진행률 계산 (35초 = 90%)
// DB 값이 더 앞서 있으면 DB 값을 우선
function useTimeBasedProgress(createdAt: string, dbProgress: number, isPending: boolean) {
  const calc = () => {
    const elapsed = (Date.now() - new Date(createdAt).getTime()) / 1000
    const timeBased = Math.min((elapsed / 35) * 90, 90)
    return Math.max(timeBased, dbProgress)
  }

  const [display, setDisplay] = useState(calc)

  useEffect(() => {
    if (!isPending) return
    const id = setInterval(() => setDisplay(calc), 300)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdAt, isPending])

  // DB 값이 갑자기 앞서면 즉시 반영
  useEffect(() => {
    setDisplay((prev) => Math.max(prev, dbProgress))
  }, [dbProgress])

  return display
}

function getStepLabel(progress: number): string {
  if (progress < 20) return '요청 접수됨'
  if (progress < 60) return 'AI가 문제를 구성하는 중...'
  if (progress < 90) return '문제지를 마무리하는 중...'
  return '거의 다 됐어요!'
}

// 생성 중 프로그레스 UI
function GeneratingView({ ws }: { ws: WsDetail }) {
  const displayProgress = useTimeBasedProgress(ws.created_at, ws.progress, true)

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <div className="text-4xl">✏️</div>
          <h2 className="text-xl font-bold">AI가 문제를 만들고 있어요</h2>
          <p className="text-sm text-muted-foreground">
            {ws.subject} {ws.grade} — {ws.topic}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{getStepLabel(ws.progress)}</span>
            <span>{Math.round(displayProgress)}%</span>
          </div>
          <Progress value={displayProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            보통 20~40초 정도 걸려요. 다른 페이지로 이동해도 계속 생성됩니다.
          </p>
        </div>

        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard">내 문제지 목록으로</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/generate">새 문제지 만들기</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

// 생성 실패 UI
function FailedView({ ws }: { ws: WsDetail }) {
  const { mutate: retry, isPending } = useRetryWorksheet(ws.id)

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <div className="text-4xl">😔</div>
        <h2 className="text-xl font-bold">문제지 생성에 실패했어요</h2>
        <p className="text-sm text-muted-foreground">
          {ws.subject} {ws.grade} — {ws.topic}
        </p>
        <div className="flex justify-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/dashboard">목록으로</Link>
          </Button>
          <Button onClick={() => retry()} disabled={isPending}>
            {isPending ? '재시도 중...' : '같은 설정으로 다시 시도'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// 완성된 문제지 UI
function DoneView({ ws }: { ws: WsDetail }) {
  const content = ws.content

  return (
    <>
      <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b bg-background/90 px-6 py-3 backdrop-blur">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard">← 목록으로</Link>
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{ws.subject}</Badge>
          <Badge variant="outline">{ws.grade}</Badge>
          <Button size="sm" onClick={() => window.print()}>인쇄 / PDF</Button>
        </div>
      </div>

      <div className="print-area mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">{content.title}</h1>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>과목: <strong className="text-foreground">{ws.subject}</strong></span>
            <span>학년: <strong className="text-foreground">{ws.grade}</strong></span>
            <span>날짜: <strong className="text-foreground">{new Date(ws.created_at).toLocaleDateString('ko-KR')}</strong></span>
          </div>
          <div className="mt-4 flex gap-8 text-sm">
            <span className="flex items-center gap-2">
              이름: <span className="inline-block w-32 border-b border-foreground/30">&nbsp;</span>
            </span>
            <span className="flex items-center gap-2">
              점수: <span className="inline-block w-20 border-b border-foreground/30">&nbsp;</span>
            </span>
          </div>
        </div>

        <Separator className="mb-8" />

        <div className="space-y-8">
          {content.questions?.map((q: {
            id: number; type: string; question: string
            options: string[] | null; answer: string; explanation: string
          }) => (
            <div key={q.id}>
              <p className="font-semibold leading-relaxed">
                <span className="mr-1 text-primary">{q.id}.</span>
                {q.question}
                <Badge variant="outline" className="ml-2 text-xs font-normal">{q.type}</Badge>
              </p>
              {q.options ? (
                <ul className="mt-3 space-y-1.5 pl-6">
                  {q.options.map((opt: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground">{opt}</li>
                  ))}
                </ul>
              ) : (
                <div className="mt-3 h-16 rounded-lg border border-dashed border-border" />
              )}
            </div>
          ))}
        </div>

        <div className="answer-section page-break-before mt-16">
          <Separator className="mb-8" />
          <h2 className="mb-6 text-xl font-bold">정답 및 해설</h2>
          <div className="space-y-4">
            {content.questions?.map((q: { id: number; answer: string; explanation: string }) => (
              <div key={q.id} className="rounded-lg bg-muted/50 p-4">
                <p className="font-semibold">
                  {q.id}번 정답: <span className="text-primary">{q.answer}</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{q.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export function WorksheetDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: ws, isLoading, isError } = useWorksheetPolling(id ?? '')

  if (!id) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">잘못된 접근입니다.</p>
      </div>
    )
  }

  if (isLoading) return <WorksheetDetailSkeleton />

  if (isError || !ws) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">문제지를 찾을 수 없습니다.</p>
        <Button variant="outline" asChild>
          <Link to="/dashboard">대시보드로 돌아가기</Link>
        </Button>
      </div>
    )
  }

  if (ws.status === 'pending') return <GeneratingView ws={ws} />
  if (ws.status === 'failed') return <FailedView ws={ws} />
  return <DoneView ws={ws} />
}
