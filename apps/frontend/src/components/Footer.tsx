import { Separator } from '@/components/ui/separator'

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="space-y-1 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">문제뚝딱</p>
          <p>대표: 홍길동 &nbsp;|&nbsp; 사업자등록번호: 000-00-00000</p>
          <p>주소: 서울특별시 강남구 테헤란로 000, 00층</p>
          <p>이메일: contact@quizsnap.kr &nbsp;|&nbsp; 전화: 02-0000-0000</p>
        </div>

        <Separator className="my-4" />

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} 문제뚝딱. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
