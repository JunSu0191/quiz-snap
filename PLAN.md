# QuizSnap 구현 계획

## 진행 현황 (2026-05-26 기준)
- [x] **1단계** — 프로젝트 세팅 (Turborepo 모노레포)
- [x] **2단계** — DB 스키마 설계 (`supabase/schema.sql` 작성 완료)
  - ⚠️ **Supabase SQL Editor에서 실행 필요**
- [x] **3단계** — 백엔드 API 구현 (Hono + Claude API)
- [x] **4단계** — 프론트엔드 구현 (shadcn/ui + Suspense + Skeleton)
- [x] **5단계** — 토스페이먼츠 과금 연동 (코드 완료, 키 입력 필요)
- [ ] **6단계** — PDF 출력 고도화 (선택)

---

## ⚠️ 현재 블로커 (다음 세션 시작 시 확인)

1. **토스페이먼츠 키 미입력**
   - `apps/backend/.env` → `TOSSPAYMENTS_SECRET_KEY=test_sk_...` 입력
   - `apps/frontend/.env` → `VITE_TOSSPAYMENTS_CLIENT_KEY=test_ck_...` 입력
   - 토스페이먼츠 개발자센터(https://developers.tosspayments.com)에서 발급

2. **Supabase payments 테이블 미실행**
   - Supabase 대시보드 → SQL Editor → `supabase/schema.sql` 하단 payments 테이블 부분 실행
   - 또는 schema.sql 전체 재실행 (IF NOT EXISTS이므로 안전)

3. **개발 서버 실행 방법**
   ```bash
   npm run dev
   # 또는 개별 실행
   cd apps/backend && npm run dev   # :3000
   cd apps/frontend && npm run dev  # :5173
   ```

3. **개발 서버 실행 방법**
   ```bash
   # 루트에서 전체 실행
   npm run dev
   # 또는 개별 실행
   cd apps/backend && npm run dev   # :3000
   cd apps/frontend && npm run dev  # :5173
   ```

---

## 2단계 — DB 스키마 (완료)

### 파일
- `supabase/schema.sql` — 전체 SQL
- `supabase/README.md` — 설정 가이드

### 포함 내용
- [x] `profiles` 테이블 (auth.users 연동, plan 포함)
- [x] `worksheets` 테이블 (content: jsonb)
- [x] `usage_logs` 테이블 (year_month: 'YYYY-MM')
- [x] RLS 정책 (본인 데이터만 접근)
- [x] auth.users → profiles 자동 생성 트리거
- [x] `get_monthly_usage()` 함수

---

## 3단계 — 백엔드 API (완료)

### 파일 구조
```
apps/backend/src/
├── index.ts                    ✅ dotenv, CORS, 라우트 마운트
├── types.ts                    ✅ AppVariables, ok(), fail()
├── middleware/
│   ├── auth.ts                 ✅ Supabase JWT 검증
│   └── error.ts                ✅ 공통 에러 핸들러
├── services/
│   ├── supabase.ts             ✅ admin 클라이언트
│   └── claude.ts               ✅ claude-sonnet-4-6, 프롬프트 설계
└── routes/
    └── worksheets.ts           ✅ 전체 API 구현
```

### 구현된 API
- [x] `POST /api/worksheets/generate` — 플랜 체크 + Claude 호출 + DB 저장
- [x] `GET  /api/worksheets` — 목록 (페이지네이션)
- [x] `GET  /api/worksheets/usage/current` — 이번 달 사용량
- [x] `GET  /api/worksheets/:id` — 상세

### 응답 규격 통일
```ts
// 성공: { success: true, data: T, message?: string }
// 실패: { success: false, error: { code: string, message: string } }
```
에러 코드: `BAD_REQUEST`, `UNAUTHORIZED`, `PLAN_LIMIT_EXCEEDED`, `NOT_FOUND`, `INTERNAL_SERVER_ERROR`

---

## 4단계 — 프론트엔드 (완료)

### 파일 구조
```
apps/frontend/src/
├── types/
│   └── api.ts                  ✅ ApiResponse<T> 타입
├── lib/
│   ├── supabase.ts             ✅
│   ├── axios.ts                ✅ 인터셉터 (토큰 주입, 에러 처리)
│   ├── queryClient.ts          ✅
│   └── utils.ts                ✅ cn()
├── api/
│   └── worksheets.ts           ✅ axios 기반 API 함수
├── hooks/
│   └── useWorksheets.ts        ✅ useSuspenseQuery + useMutation + toast
├── components/
│   ├── ui/                     ✅ shadcn 컴포넌트 (14개)
│   ├── skeletons/
│   │   ├── DashboardSkeleton.tsx       ✅
│   │   └── WorksheetDetailSkeleton.tsx ✅
│   ├── Header.tsx              ✅ shadcn Button/Badge
│   ├── ProtectedRoute.tsx      ✅
│   ├── LoadingSpinner.tsx      ✅
│   └── SuspenseBoundary.tsx    ✅ ErrorBoundary + Suspense 래퍼
└── pages/
    ├── Landing.tsx             ✅
    ├── Login.tsx               ✅ shadcn Card/Input/Button + sonner
    ├── Signup.tsx              ✅
    ├── Dashboard.tsx           ✅ Suspense + DashboardSkeleton + Pagination
    ├── Generate.tsx            ✅ shadcn 폼 전체
    └── WorksheetDetail.tsx     ✅ Suspense + WorksheetDetailSkeleton + 인쇄
```

### shadcn 설치 컴포넌트
button, input, label, select, card, badge, separator, sonner,
form, dialog, sheet, skeleton, progress, tabs

### 핵심 패턴
- `useSuspenseQuery` → 컴포넌트 상단에 Suspense + ErrorBoundary 래핑
- axios 인터셉터: 401 → 로그아웃+리다이렉트, 403 → toast.error, 500 → toast.error
- 모든 로딩 상태: Skeleton UI 사용 (spinner 최소화)

---

## 5단계 — 토스페이먼츠 과금 (코드 완료)

### 준비 필요
- [ ] 토스페이먼츠 개발자센터 계정 생성 및 테스트 키 발급
  - `TOSSPAYMENTS_SECRET_KEY` (backend)
  - `VITE_TOSSPAYMENTS_CLIENT_KEY` (frontend)
- [ ] Supabase SQL Editor에서 `payments` 테이블 실행 (schema.sql 하단)

### 구현 완료
#### Backend
- [x] `src/services/tosspayments.ts` — TossPayments 승인 API 호출
- [x] `src/routes/payments.ts`
  - [x] `POST /api/payments/initialize` — 주문 생성 (pending)
  - [x] `POST /api/payments/confirm` — 결제 승인 + 플랜 업데이트
  - [x] `GET  /api/payments/history` — 결제 내역

#### Frontend
- [x] `npm install @tosspayments/tosspayments-sdk`
- [x] `src/api/payments.ts` — API 호출 함수
- [x] `src/hooks/usePayment.ts` — useMutation 훅
- [x] `src/pages/Pricing.tsx` — 플랜 비교 테이블 (Free/Basic/Pro)
- [x] `src/pages/PaymentSuccess.tsx` — 결제 완료 처리
- [x] `src/pages/PaymentCancel.tsx` — 결제 취소 안내

### 결제 플로우
```
Pricing → 업그레이드 클릭
→ POST /api/payments/initialize (orderId 발급)
→ TossPayments 결제창 (카드/카카오페이/토스페이/네이버페이)
→ /payment/success?paymentKey=&orderId=&amount=
→ POST /api/payments/confirm (최종 승인 + plan 업데이트)
→ Dashboard 이동
```

---

## 6단계 — 백그라운드 생성 + 프로그레스 UI (완료, 개선됨)

### 구현 완료
#### Backend
- [x] `worksheets` 테이블에 `status` 컬럼 추가 (`pending | done | failed`)
  - `supabase/schema.sql` 4-1 섹션에 마이그레이션 SQL 추가
  - **Supabase SQL Editor에서 실행 필요** (기존 DB에 컬럼 추가)
- [x] `POST /api/worksheets/generate` — pending 행 즉시 생성 후 응답
  - Claude 호출은 `generateInBackground()` 로 비동기 처리 (await 없음)
  - 실패 시 `status: 'failed'`로 업데이트
- [x] `GET /api/worksheets` — `status` 컬럼 포함 조회

#### Frontend
- [x] `src/api/worksheets.ts` — `WorksheetStatus` 타입, `status` 필드 추가
- [x] `src/hooks/useWorksheets.ts` — `useWorksheetPolling` 훅
  - `status === 'pending'`이면 3초마다 자동 재조회
- [x] `src/pages/Generate.tsx` — 제출 즉시 워크시트 상세 페이지로 이동
- [x] `src/pages/WorksheetDetail.tsx` — 상태별 UI 분기
  - `pending` → 애니메이션 프로그레스바 + "다른 페이지 이동 가능" 안내
  - `failed` → 실패 안내 + 재시도 버튼
  - `done` → 기존 문제지 뷰
- [x] `src/pages/Dashboard.tsx` — 생성 중 카드에 "생성 중..." 펄스 뱃지

### 사용자 흐름
```
Generate 폼 제출
→ POST /generate (즉시 응답, pending 행 생성)
→ /worksheets/:id 이동
→ 프로그레스바 표시 (3초마다 폴링)
→ 다른 페이지로 이동해도 백그라운드 생성 계속
→ 완료 후 /worksheets/:id 재방문 시 문제지 표시
```

---

## 8단계 — 개발/IT 과목 지원 (완료)

### 구현 완료
- [x] `Generate.tsx` — 과목을 "학교 과목 / 개발·IT" 2개 카테고리로 분리
  - 개발 과목 선택 시 학년 선택 숨김 + `grade: '성인/취준'` 자동 설정
- [x] `claude.ts` — 개발 과목 감지 시 IT 전문가 시스템 프롬프트로 분기
  - 정보처리기사, 취업 면접, CS 심화 실전 문제 스타일로 출제
- [x] 프로그레스바 fake ticker 추가
  - pending 중 150ms마다 +0.4씩 상승 (상한 84%), done 시 즉시 100%

### 지원 과목
| 카테고리 | 과목 목록 |
|----------|-----------|
| 학교 과목 | 수학·영어·국어·과학·사회·역사·도덕·체육·음악·미술 |
| 개발 / IT | CS 기초·자료구조·알고리즘·운영체제·네트워크·데이터베이스·정보처리기사·웹 개발·소프트웨어공학 |

---

## 7단계 — PDF 출력 고도화 (선택)

### 구현 목록
- [ ] `npm install @react-pdf/renderer` (apps/frontend)
- [ ] `src/components/WorksheetPDF.tsx`
  - A4 기준 레이아웃
  - 상단: 제목, 학년, 과목, 날짜, 이름란
  - 문제 번호 + 보기 + 답란
  - 정답/해설 별도 페이지
- [ ] WorksheetDetail 페이지에 PDF 다운로드 버튼 추가

---

## 환경 변수 체크리스트

### Backend `apps/backend/.env`
- [x] SUPABASE_URL
- [x] SUPABASE_ANON_KEY
- [x] SUPABASE_SERVICE_ROLE_KEY
- [x] ANTHROPIC_API_KEY
- [ ] TOSSPAYMENTS_SECRET_KEY ← **필수, 미입력** (5단계)
- [x] FRONTEND_URL
- [x] PORT

### Frontend `apps/frontend/.env`
- [x] VITE_SUPABASE_URL
- [x] VITE_SUPABASE_ANON_KEY
- [x] VITE_API_BASE_URL
- [ ] VITE_TOSSPAYMENTS_CLIENT_KEY ← **필수, 미입력** (5단계)

---

## 설치된 스킬
```bash
npx skills add supabase/agent-skills@supabase -g
npx skills add supabase/agent-skills@supabase-postgres-best-practices -g
npx skills add docs.stripe.com@stripe-best-practices -g
npx skills add anthropics/skills@claude-api -g
```

---

## 추가 개선 아이디어 (미구현)

### UX / 기능

#### 9단계 — 문제지 복제·즐겨찾기
- [ ] `POST /api/worksheets/:id/duplicate` — 동일 설정으로 새 문제지 즉시 생성
- [ ] `worksheets` 테이블에 `is_starred boolean` 컬럼 추가
- [ ] Dashboard에서 즐겨찾기 필터 탭 (전체 / ★ 즐겨찾기 / 생성 중)
- **효과**: 같은 과목 반복 출제 시 클릭 1번으로 재생성 가능

#### 10단계 — 문제지 공유 링크
- [ ] `worksheets` 테이블에 `share_token uuid` 컬럼 + 공개 여부 `is_public`
- [ ] `GET /api/worksheets/share/:token` — 비인증 접근 허용 (RLS 예외)
- [ ] WorksheetDetail에 "공유 링크 복사" 버튼
- **효과**: 학생·학부모에게 링크만 전송 → 별도 계정 없이 열람

#### 11단계 — 생성 완료 이메일 알림
- [ ] Backend: `generateInBackground()` 완료 시 Supabase Edge Function으로 이메일 발송
- [ ] Supabase Auth 이메일 템플릿 또는 Resend SDK 활용
- [ ] 사용자 설정에서 알림 on/off 선택
- **효과**: 백그라운드 생성 중 다른 탭으로 이동해도 완료 인지 가능

#### 12단계 — 생성 설정 템플릿 저장
- [ ] `templates` 테이블 (`user_id, name, subject, grade, topic, difficulty, question_count, types`)
- [ ] Generate 페이지에 "이 설정 저장" 버튼 + 템플릿 불러오기 드롭다운
- **효과**: 매주 같은 과목 담당 교사 → 설정 반복 입력 제거

#### 13단계 — 문제 유형별 통계 대시보드
- [ ] `usage_logs` 활용 + `worksheets` 집계 쿼리
- [ ] Dashboard 상단에 미니 통계 카드: 총 생성 수 / 이번 달 / 과목별 Top3
- [ ] `GET /api/worksheets/stats` API 추가
- **효과**: 사용자가 자신의 패턴 파악 → 업그레이드 동기 부여

### 품질 / 기술

#### 14단계 — 프롬프트 캐싱 (비용 절감)
- [ ] `claude.ts` — Anthropic SDK의 `cache_control` 적용
  - 시스템 프롬프트 (변하지 않는 부분) → `"type": "ephemeral"` 마킹
  - 토큰 절감 목표: 요청당 ~60% 캐시 히트 시 입력 비용 90% 절감
- 참고: `claude-api` 스킬로 구현 가이드 확인 (`/claude-api`)

#### 15단계 — E2E 테스트 (Playwright)
- [ ] `apps/frontend/tests/` — 로그인 → 문제지 생성 → 상세 페이지 확인 시나리오
- [ ] GitHub Actions CI 파이프라인에 추가
- [ ] 핵심 플로우: 생성 폼 제출 → pending → done 전환 확인

#### 16단계 — 모바일 반응형 점검
- [ ] Generate 폼 — 모바일에서 select 박스 가독성 확인
- [ ] WorksheetDetail — 인쇄 미리보기 모바일 레이아웃
- [ ] Dashboard 카드 그리드 1열 확인 (sm 미만)

### 마케팅 / 성장

#### 17단계 — OG 태그 + SEO
- [ ] `index.html`에 Open Graph / Twitter Card 메타태그 추가
- [ ] 랜딩 페이지 주요 키워드: "AI 문제지 생성", "학교 시험 문제 자동 생성"
- [ ] Vite plugin으로 `sitemap.xml` 자동 생성

#### 18단계 — 레퍼럴 시스템
- [ ] `profiles`에 `referral_code`, `referred_by` 컬럼 추가
- [ ] 회원가입 시 레퍼럴 코드 입력 → 양쪽에 free 횟수 +3회 보너스
- **효과**: 입소문 기반 유저 획득

---

## 우선순위 제안 (다음 세션)

| 우선순위 | 항목 | 이유 |
|---------|------|------|
| ★★★ | 14단계 프롬프트 캐싱 | Claude API 비용 즉시 절감 |
| ★★★ | 7단계 PDF 고도화 | 교사 핵심 니즈 |
| ★★☆ | 10단계 공유 링크 | 바이럴 확산 |
| ★★☆ | 12단계 템플릿 저장 | 재방문율 향상 |
| ★☆☆ | 9단계 복제/즐겨찾기 | 편의 기능 |
