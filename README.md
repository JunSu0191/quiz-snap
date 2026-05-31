# 문제뚝딱 (QuizSnap)

> AI로 학교 문제지를 30초 만에 자동 생성하는 SaaS 서비스

## 주요 기능

- **AI 문제 자동 생성** — 과목·학년·단원을 입력하면 Claude AI가 객관식·주관식·서술형 문제지를 즉시 생성
- **개발/IT 지원** — 정보처리기사, CS 기초, 알고리즘 등 개발 직군 시험 대비 문제도 생성
- **백그라운드 생성** — 생성 중 다른 페이지로 이동해도 계속 진행, 완료 시 확인 가능
- **인쇄/PDF 출력** — 정답·해설 포함 문제지를 클릭 한 번으로 출력
- **플랜 구독** — Free(월 5회) / Basic(9,900원) / Pro(19,900원) 플랜

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18 · TypeScript · Vite · TailwindCSS · shadcn/ui · TanStack Query |
| Backend | Hono v4 · TypeScript · Node.js |
| AI | Anthropic Claude (claude-sonnet-4-6) |
| DB / Auth | Supabase (PostgreSQL + Row Level Security) |
| 결제 | TossPayments |
| 배포 | Vercel (Frontend) · Railway (Backend) |

## 모노레포 구조

```
quiz-snap/
├── apps/
│   ├── frontend/   — React + Vite (Vercel)
│   └── backend/    — Hono + Node.js (Railway)
├── packages/
│   └── shared/     — 공통 타입
└── supabase/
    ├── schema.sql  — 전체 DB 스키마
    └── migrations/ — 버전 관리 마이그레이션
```

## 개발 환경 설정

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
# 각 .env 파일에 실제 키 입력

# 개발 서버 실행 (frontend :5173 / backend :3000)
npm run dev
```

## 플랜 정책

| 플랜 | 가격 | 월 생성 횟수 |
|------|------|-------------|
| Free | 무료 | 5회 |
| Basic | 9,900원/월 | 무제한 |
| Pro | 19,900원/월 | 무제한 + 우선 지원 |
