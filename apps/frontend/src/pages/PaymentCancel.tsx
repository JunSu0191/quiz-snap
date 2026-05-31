import { Link } from 'react-router-dom'
import { XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function PaymentCancel() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <CardTitle>결제가 취소됐어요</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">
            결제를 취소하셨거나 오류가 발생했습니다.
            <br />
            언제든지 다시 시도할 수 있어요.
          </p>
          <Button asChild className="w-full">
            <Link to="/pricing">요금제 다시 보기</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link to="/dashboard">대시보드로 돌아가기</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
