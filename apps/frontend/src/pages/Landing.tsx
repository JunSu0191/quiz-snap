import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Check, Zap, Target, Printer, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, inView }
}

const FEATURES = [
  {
    icon: <Zap className="h-5 w-5" />,
    title: '30초 만에 완성',
    desc: '과목·학년·주제를 선택하면 AI가 즉시 문제지를 만들어 드립니다.',
  },
  {
    icon: <Target className="h-5 w-5" />,
    title: '난이도 맞춤 설정',
    desc: '쉬움·보통·어려움 3단계로 학생 수준에 꼭 맞는 문제를 생성합니다.',
  },
  {
    icon: <Printer className="h-5 w-5" />,
    title: '즉시 인쇄 가능',
    desc: '정답·해설 포함, 클릭 한 번으로 완성된 문제지를 바로 출력하세요.',
  },
]

const STEPS = [
  { num: '01', title: '과목·학년 선택', desc: '원하는 과목과 학년, 단원명을 입력합니다.' },
  { num: '02', title: 'AI 문제 생성', desc: '30초 안에 객관식·주관식·서술형 문제가 완성됩니다.' },
  { num: '03', title: '인쇄 & 저장', desc: '정답·해설 포함된 문제지를 바로 출력하거나 저장합니다.' },
]

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: '무료',
    desc: '가볍게 시작해보세요',
    features: ['월 5회 문제지 생성', '객관식·주관식·서술형', '인쇄 지원'],
    highlight: false,
    cta: (loggedIn: boolean) => loggedIn ? '문제지 만들기' : '무료로 시작',
    href: (loggedIn: boolean) => loggedIn ? '/generate' : '/signup',
  },
  {
    key: 'basic',
    name: 'Basic',
    price: '9,900원',
    period: '/월',
    desc: '선생님·학부모에게 최적',
    features: ['무제한 문제지 생성', '모든 문제 유형', '인쇄 지원', '문제지 저장 무제한'],
    highlight: true,
    cta: (loggedIn: boolean) => loggedIn ? 'Basic으로 업그레이드' : 'Basic 시작하기',
    href: (loggedIn: boolean) => loggedIn ? '/pricing' : '/signup',
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '19,900원',
    period: '/월',
    desc: '학원·전문 강사용',
    features: ['무제한 문제지 생성', '모든 문제 유형', '인쇄 지원', '문제지 저장 무제한', '고급 난이도 조절', '우선 고객 지원'],
    highlight: false,
    cta: (loggedIn: boolean) => loggedIn ? 'Pro로 업그레이드' : 'Pro 시작하기',
    href: (loggedIn: boolean) => loggedIn ? '/pricing' : '/signup',
  },
]

function FadeSection({ children, delay = 0, className = '' }: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

export function Landing() {
  const { user } = useAuth()
  const pricingRef = useRef<HTMLDivElement>(null)

  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-emerald-50/40 to-teal-50/30 dark:bg-none dark:bg-gray-950 px-4 py-32 text-center">
        {/* 라이트모드: 은은한 emerald 배경 그라데이션 */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center dark:hidden">
          <div className="h-[500px] w-[500px] rounded-full bg-emerald-400/20 blur-[100px]" />
        </div>
        {/* 다크모드: 기존 glow */}
        <div className="pointer-events-none absolute inset-0 hidden items-center justify-center dark:flex">
          <div className="h-[600px] w-[600px] rounded-full bg-emerald-500/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-3xl">
          <div className="animate-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            AI 문제지 자동 생성 서비스
          </div>

          <h1 className="animate-fade-up mt-2 text-5xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            문제지 만드는 데<br />
            <span className="bg-gradient-to-r from-emerald-500 to-teal-400 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
              더 이상 시간 낭비 없이
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-gray-600 dark:text-gray-400">
            과목과 학년만 선택하면 AI가 맞춤형 문제지를 30초 만에 생성합니다.
            <br className="hidden sm:block" />
            객관식·주관식·서술형, 정답·해설까지 한 번에.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild className="gap-2 rounded-xl px-8 text-base shadow-lg shadow-emerald-500/20">
              <Link to={user ? '/generate' : '/signup'}>
                무료로 시작하기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={scrollToPricing}
              className="rounded-xl border-gray-300 bg-white/70 px-8 text-base text-gray-700 hover:bg-white hover:border-gray-400 dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:hover:border-white/40 dark:hover:text-white transition-all"
            >
              요금제 보기
            </Button>
          </div>

          <p className="mt-5 text-sm text-gray-500 dark:text-gray-500">
            무료 플랜 — 신용카드 없이 월 5회 이용
          </p>

          <div className="mt-16 flex flex-wrap justify-center gap-10 border-t border-gray-200 dark:border-white/10 pt-10 text-center">
            {[
              { label: '문제 유형', value: '3가지' },
              { label: '평균 생성 시간', value: '30초' },
              { label: '시작 비용', value: '무료' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
                <div className="mt-1 text-sm text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-background px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <FadeSection className="mb-14 text-center">
            <Badge variant="secondary" className="mb-4">기능</Badge>
            <h2 className="text-3xl font-bold tracking-tight">필요한 건 다 있어요</h2>
          </FadeSection>

          <div className="grid gap-6 sm:grid-cols-3">
            {FEATURES.map(({ icon, title, desc }, i) => (
              <FadeSection key={title} delay={i * 100}>
                <div className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 transition-colors group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900">
                    {icon}
                  </div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-muted/30 px-4 py-24">
        <div className="mx-auto max-w-4xl">
          <FadeSection className="mb-14 text-center">
            <Badge variant="secondary" className="mb-4">사용 방법</Badge>
            <h2 className="text-3xl font-bold tracking-tight">딱 3단계면 끝</h2>
          </FadeSection>

          <div className="relative">
            <div className="absolute left-8 top-10 hidden h-[calc(100%-80px)] w-px bg-gradient-to-b from-emerald-300 dark:from-emerald-700 to-transparent sm:block" />

            <div className="space-y-8">
              {STEPS.map(({ num, title, desc }, i) => (
                <FadeSection key={num} delay={i * 120}>
                  <div className="flex items-start gap-6">
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-500/20">
                      {num}
                    </div>
                    <div className="pt-3">
                      <h3 className="text-lg font-semibold">{title}</h3>
                      <p className="mt-1 text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                </FadeSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section ref={pricingRef} id="pricing" className="bg-background px-4 py-24 scroll-mt-16">
        <div className="mx-auto max-w-5xl">
          <FadeSection className="mb-14 text-center">
            <Badge variant="secondary" className="mb-4">요금제</Badge>
            <h2 className="text-3xl font-bold tracking-tight">합리적인 가격으로 시작하세요</h2>
            <p className="mt-3 text-muted-foreground">
              카드·카카오페이·토스페이·네이버페이 결제 가능 · 언제든지 해지 가능
            </p>
          </FadeSection>

          <div className="grid gap-6 sm:grid-cols-3">
            {PLANS.map((plan, i) => (
              <FadeSection key={plan.key} delay={i * 100}>
                <Card className={`relative flex flex-col h-full ${plan.highlight ? 'border-primary shadow-lg shadow-emerald-500/10' : ''}`}>
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="px-3 py-1 shadow-sm">가장 인기</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
                    </div>
                    <CardDescription>{plan.desc}</CardDescription>
                  </CardHeader>
                  <Separator />
                  <CardContent className="flex flex-1 flex-col pt-5">
                    <ul className="flex-1 space-y-2.5 mb-6">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      asChild
                      className="w-full"
                      variant={plan.highlight ? 'default' : 'outline'}
                    >
                      <Link to={plan.href(!!user)}>{plan.cta(!!user)}</Link>
                    </Button>
                  </CardContent>
                </Card>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA (항상 emerald) ── */}
      <FadeSection>
        <section className="relative overflow-hidden bg-emerald-600 px-4 py-24 text-center">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[400px] w-[400px] rounded-full bg-white/5 blur-[80px]" />
          </div>
          <div className="relative mx-auto max-w-xl">
            <h2 className="text-3xl font-extrabold text-white">지금 바로 시작해보세요</h2>
            <p className="mt-4 text-emerald-100">
              무료 플랜으로 시작, 필요하면 언제든 업그레이드.
            </p>
            <Button
              size="lg"
              asChild
              className="mt-8 gap-2 rounded-xl bg-white px-8 text-base font-semibold text-emerald-700 hover:bg-emerald-50 shadow-xl"
            >
              <Link to={user ? '/generate' : '/signup'}>
                무료로 시작하기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </FadeSection>

    </div>
  )
}
