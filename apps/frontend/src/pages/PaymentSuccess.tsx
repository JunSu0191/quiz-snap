import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useConfirmPayment } from '@/hooks/usePayment'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { mutate: confirm, isPending, isSuccess, isError } = useConfirmPayment()
  const called = useRef(false)
  const [confirmedPlan, setConfirmedPlan] = useState<string | null>(null)

  useEffect(() => {
    if (called.current) return
    called.current = true

    const paymentKey = searchParams.get('paymentKey')
    const orderId = searchParams.get('orderId')
    const amount = Number(searchParams.get('amount'))

    if (!paymentKey || !orderId || !amount) {
      navigate('/pricing')
      return
    }

    confirm(
      { paymentKey, orderId, amount },
      {
        onSuccess: (data) => setConfirmedPlan(data.plan),
      }
    )
  }, [])

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <p className="text-muted-foreground">결제를 처리하고 있어요...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle>결제 처리 실패</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              결제 처리 중 오류가 발생했습니다. 다시 시도해 주세요.
            </p>
            <Button asChild className="w-full">
              <Link to="/pricing">요금제 페이지로 돌아가기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isSuccess) {
    const planLabel = confirmedPlan === 'basic' ? 'Basic' : 'Pro'
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-2" />
            <CardTitle>결제 완료!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              <span className="font-semibold text-foreground">{planLabel} 플랜</span>으로
              업그레이드됐어요.
              <br />
              이제 무제한으로 문제지를 생성할 수 있어요!
            </p>
            <Button className="w-full" onClick={() => navigate('/dashboard')}>
              내 문제지 보러가기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
