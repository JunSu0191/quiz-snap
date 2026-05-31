import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useUsageQuery } from '@/hooks/useWorksheets'
import { useUpgradePlan } from '@/hooks/usePayment'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import { toast } from 'sonner'

const PLANS = [
  {
    key: 'free' as const,
    name: 'Free',
    price: '무료',
    description: '가볍게 시작해보세요',
    features: ['월 5회 문제지 생성', '기본 문제 유형', '인쇄 지원'],
    cta: '현재 플랜',
    highlight: false,
  },
  {
    key: 'basic' as const,
    name: 'Basic',
    price: '9,900원',
    period: '/월',
    description: '선생님과 학부모에게 최적',
    features: ['월 무제한 문제지 생성', '모든 문제 유형', '인쇄 지원', '문제지 저장 무제한'],
    cta: 'Basic으로 업그레이드',
    highlight: true,
  },
  {
    key: 'pro' as const,
    name: 'Pro',
    price: '19,900원',
    period: '/월',
    description: '전문 강사 및 학원용',
    features: [
      '월 무제한 문제지 생성',
      '모든 문제 유형',
      '인쇄 지원',
      '문제지 저장 무제한',
      '고급 난이도 조절',
      '우선 고객 지원',
    ],
    cta: 'Pro로 업그레이드',
    highlight: false,
  },
]

export function Pricing() {
  const navigate = useNavigate()
  const { data: usage } = useUsageQuery()
  const { startPayment } = useUpgradePlan()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const currentPlan = usage?.plan ?? 'free'

  const handleUpgrade = async (plan: 'basic' | 'pro') => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('로그인 후 이용해주세요.')
      navigate('/login')
      return
    }

    setLoadingPlan(plan)
    try {
      const name = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? '사용자'
      const email = user.email ?? ''
      await startPayment(plan, name, email)
    } catch {
      toast.error('결제 준비 중 오류가 발생했습니다.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight mb-3">요금제 선택</h1>
          <p className="text-muted-foreground text-lg">
            목적에 맞는 플랜을 선택하고 AI 문제지 생성을 시작하세요
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.key
            const isUpgradeable = plan.key !== 'free' && !isCurrent

            return (
              <Card
                key={plan.key}
                className={`relative flex flex-col ${plan.highlight ? 'border-primary shadow-md' : ''}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="px-3 py-1">인기</Badge>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    {isCurrent && <Badge variant="outline">현재 플랜</Badge>}
                  </div>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    )}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <Separator />

                <CardContent className="flex-1 pt-5">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {isUpgradeable ? (
                    <Button
                      className="w-full"
                      variant={plan.highlight ? 'default' : 'outline'}
                      disabled={loadingPlan !== null}
                      onClick={() => handleUpgrade(plan.key as 'basic' | 'pro')}
                    >
                      {loadingPlan === plan.key ? '처리 중...' : plan.cta}
                    </Button>
                  ) : (
                    <Button className="w-full" variant="ghost" disabled>
                      {isCurrent ? '현재 플랜' : '시작하기 (무료)'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          카드, 카카오페이, 토스페이, 네이버페이로 결제 가능 · 언제든지 해지 가능
        </p>
      </div>
    </div>
  )
}
