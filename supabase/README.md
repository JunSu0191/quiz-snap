# Supabase 설정 가이드

## 실행 순서

1. [Supabase 대시보드](https://supabase.com) → 프로젝트 생성
2. **SQL Editor** → `schema.sql` 내용 전체 복사 후 실행
3. **Settings → API** → `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` 복사

## 환경 변수 설정

### `apps/backend/.env`
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### `apps/frontend/.env`
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## 테이블 구조

| 테이블 | 역할 |
|--------|------|
| `profiles` | 유저 정보 + 플랜 (auth.users 미러) |
| `worksheets` | 생성된 문제지 (content: jsonb) |
| `usage_logs` | 월별 생성 횟수 (year_month: 'YYYY-MM') |

## 플랜별 제한
- `free`: 월 5회
- `basic` / `pro`: 무제한
