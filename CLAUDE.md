# QuizSnap — AI 문제지 자동 생성 서비스

## 프로젝트 개요
AI로 학교 문제지를 자동 생성하는 SaaS 서비스 (문제뚝딱).
Turborepo 기반 모노레포, 플랜별 구독 과금 + PDF 출력.

- **서비스명**: 문제뚝딱 (QuizSnap)
- **타겟**: 초/중/고 교사, 학부모, 학생
- **브랜드 컬러**: primary — tailwind neutral (shadcn 기본)

## 모노레포 구조
```
quiz-snap/
├── apps/
│   ├── frontend/   ← React 18 + Vite + TypeScript + TailwindCSS + shadcn/ui
│   └── backend/    ← Hono v4 + TypeScript (Node.js)
├── packages/
│   └── shared/     ← 공통 타입 (ApiResponse, Worksheet, Question 등)
├── supabase/
│   └── schema.sql  ← DB 스키마 (Supabase SQL Editor에서 실행)
├── CLAUDE.md
├── PLAN.md
└── turbo.json
```

## 기술 스택

### Frontend (`apps/frontend`)
- React 18 + TypeScript + Vite 5
- TailwindCSS 3 + shadcn/ui (neutral 테마, CSS variables)
- TanStack Query v5 — `useSuspenseQuery` 기본 사용
- React Router v6
- Supabase Auth (인증)
- axios (API 클라이언트, 인터셉터)
- react-error-boundary + Suspense (로딩/에러 처리)
- sonner (토스트 알림)
- @react-pdf/renderer (PDF 출력, 6단계)

### Backend (`apps/backend`)
- Hono v4 + TypeScript + @hono/node-server
- Supabase (DB + Auth 토큰 검증)
- Anthropic Claude API (claude-sonnet-4-6, 문제 생성)
- Stripe (구독 결제, 5단계)

### Shared (`packages/shared`)
- 공통 타입: `Question`, `Worksheet`, `GenerateWorksheetRequest/Response`
- QuestionType: `'multiple-choice' | 'short-answer' | 'essay'`
  - 한국어: 객관식 | 주관식 | 서술형

## 플랜 정책
| 플랜 | 가격 | 월 생성 횟수 | 저장 |
|------|------|-------------|------|
| free | 무료 | 5회 | 제한 |
| basic | 9,900원/월 | 무제한 | 무제한 |
| pro | 19,900원/월 | 무제한 | 무제한 |

## 폴더 관례 (Frontend)
```
src/
├── api/              ← API 호출 함수 (axios 사용)
│   └── worksheets.ts
├── hooks/            ← TanStack Query 훅 (useSuspenseQuery 기본)
│   └── useWorksheets.ts
├── pages/            ← 라우트별 페이지 (Suspense + ErrorBoundary 래핑)
├── components/
│   ├── ui/           ← shadcn 원시 컴포넌트 (직접 수정 가능)
│   ├── skeletons/    ← 페이지별 스켈레톤 UI
│   ├── Header.tsx
│   ├── ProtectedRoute.tsx
│   ├── LoadingSpinner.tsx
│   └── SuspenseBoundary.tsx
├── lib/
│   ├── supabase.ts   ← Supabase 클라이언트
│   ├── axios.ts      ← axios 인스턴스 + 인터셉터
│   ├── queryClient.ts
│   └── utils.ts      ← cn() shadcn 유틸
└── types/
    └── api.ts        ← ApiResponse<T> 타입
```

## 폴더 관례 (Backend)
```
src/
├── routes/
│   ├── worksheets.ts ← 문제지 CRUD + 사용량
│   └── payments.ts   ← 토스페이먼츠 결제
├── middleware/
│   ├── auth.ts       ← JWT 검증
│   └── error.ts      ← 공통 에러 핸들러
├── services/
│   ├── supabase.ts        ← Supabase admin 클라이언트
│   ├── claude.ts          ← Claude API 호출
│   └── tosspayments.ts    ← 토스페이먼츠 승인 API
├── types.ts          ← AppVariables, ok(), fail() 헬퍼
└── index.ts
```

## 라우팅 구조
```
/               → 랜딩
/login          → 로그인 (shadcn Card + Input + Button)
/signup         → 회원가입
/dashboard      → 내 문제지 목록 (인증 필요, Suspense + Skeleton)
/generate       → 문제지 생성 (인증 필요)
/worksheets/:id → 문제지 상세/인쇄 (인증 필요, Suspense + Skeleton)
/pricing        → 플랜 비교 (5단계)
/payment/success → 결제 성공 (5단계)
/payment/cancel  → 결제 취소 (5단계)
```

## API 엔드포인트
```
POST /api/worksheets/generate       ← 문제 생성 (플랜 체크)
GET  /api/worksheets                ← 목록 (페이지네이션)
GET  /api/worksheets/usage/current  ← 이번 달 사용량
GET  /api/worksheets/:id            ← 상세
POST /api/payments/initialize               ← 주문 생성 (토스페이먼츠)
POST /api/payments/confirm                  ← 결제 승인 + 플랜 업데이트
GET  /api/payments/history                  ← 결제 내역
```

## 공통 API 응답 규격 (백엔드 → 프론트)
```ts
// 성공
{ success: true, data: T, message?: string }

// 실패
{ success: false, error: { code: string, message: string } }
```

백엔드: `ok(data, message?)` / `fail(code, message)` 헬퍼 사용 (`src/types.ts`)

### 에러 코드
- `BAD_REQUEST` — 입력 검증 실패 (400)
- `UNAUTHORIZED` — 인증 실패 (401)
- `PLAN_LIMIT_EXCEEDED` — 플랜 제한 초과 (403)
- `NOT_FOUND` — 리소스 없음 (404)
- `INTERNAL_SERVER_ERROR` — 서버 오류 (500)

## 프론트엔드 데이터 흐름
```
컴포넌트 (Suspense 래핑)
  → useSuspenseQuery / useMutation 훅
    → api 함수 (axios)
      → axios 인터셉터 (토큰 자동 주입)
        → 백엔드 API
      ← axios 인터셉터 (401→redirect, 403→toast, 500→toast)
    ← data만 반환
  ← 로딩: Skeleton | 에러: ErrorBoundary | 성공: 컴포넌트
```

## Skeleton 패턴
- `src/components/skeletons/DashboardSkeleton.tsx`
- `src/components/skeletons/WorksheetDetailSkeleton.tsx`
- 추가 페이지 스켈레톤도 같은 폴더에 생성

## shadcn 설치 컴포넌트
button, input, label, select, card, badge, separator, sonner,
form, dialog, sheet, skeleton, progress, tabs

## 환경 변수

### Backend (`apps/backend/.env`)
```
SUPABASE_URL=https://erzdxtkyjznzbkifewmt.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
TOSSPAYMENTS_SECRET_KEY=      ← 미입력, 토스페이먼츠 개발자센터에서 발급
FRONTEND_URL=http://localhost:5173
PORT=3000
```

### Frontend (`apps/frontend/.env`)
```
VITE_SUPABASE_URL=https://erzdxtkyjznzbkifewmt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_BASE_URL=http://localhost:3000
VITE_TOSSPAYMENTS_CLIENT_KEY=  ← 미입력, 토스페이먼츠 개발자센터에서 발급
```

## 개발 명령어
```bash
npm run dev      # 전체 (turbo) — frontend :5173, backend :3000
cd apps/frontend && npm run dev
cd apps/backend && npm run dev
```

## DB 테이블 (Supabase)
- `profiles` — auth.users 연동, plan + plan_expires_at
- `worksheets` — 생성된 문제지 (content: jsonb)
- `usage_logs` — 월별 사용량 (year_month: 'YYYY-MM')

## Claude API 문제 생성 응답 형식
```json
{
  "title": "string",
  "subject": "string",
  "grade": "string",
  "questions": [
    {
      "id": 1,
      "type": "객관식|주관식|서술형",
      "question": "문제 내용",
      "options": ["① 보기1", "② 보기2", "③ 보기3", "④ 보기4"] ,
      "answer": "① 보기1",
      "explanation": "풀이 설명"
    }
  ]
}
```
