-- ============================================================
-- QuizSnap DB Schema
-- Supabase 대시보드 → SQL Editor에서 전체 실행
--
-- ✅ 처음 실행: 모든 테이블·정책·트리거 생성
-- ✅ 재실행 안전: IF NOT EXISTS / IF EXISTS 처리됨
-- ✅ 기존 DB 마이그레이션: stripe 컬럼 제거 + payments 추가
-- ============================================================


-- ────────────────────────────────────────────────
-- 1. profiles 테이블
--    auth.users와 1:1 연동, plan 정보 보관
-- ────────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  full_name       text,
  plan            text not null default 'free' check (plan in ('free', 'basic', 'pro')),
  plan_expires_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 기존 DB에 stripe 컬럼이 남아 있으면 제거 (재실행 안전)
alter table public.profiles drop column if exists stripe_customer_id;
alter table public.profiles drop column if exists stripe_subscription_id;


-- ────────────────────────────────────────────────
-- 2. worksheets 테이블
--    생성된 문제지 저장
-- ────────────────────────────────────────────────
create table if not exists public.worksheets (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  title          text not null,
  subject        text not null,
  grade          text not null,
  topic          text not null,
  difficulty     text not null check (difficulty in ('easy', 'medium', 'hard')),
  question_count integer not null check (question_count between 5 and 30),
  question_types text[] not null,
  content        jsonb not null,   -- Claude API 응답 전체 JSON
  created_at     timestamptz not null default now()
);


-- ────────────────────────────────────────────────
-- 3. usage_logs 테이블
--    월별 생성 횟수 추적
-- ────────────────────────────────────────────────
create table if not exists public.usage_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  worksheet_id uuid references public.worksheets(id) on delete set null,
  year_month   text not null,   -- 'YYYY-MM' 형식
  created_at   timestamptz not null default now()
);


-- ────────────────────────────────────────────────
-- 4. payments 테이블
--    토스페이먼츠 결제 내역
-- ────────────────────────────────────────────────
create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  order_id     text unique not null,
  payment_key  text,
  plan         text not null check (plan in ('basic', 'pro')),
  amount       integer not null,
  status       text not null default 'pending'
               check (status in ('pending', 'done', 'canceled', 'failed')),
  created_at   timestamptz not null default now(),
  confirmed_at timestamptz
);


-- ────────────────────────────────────────────────
-- 4-1. worksheets 백그라운드 생성 상태 컬럼 (마이그레이션 안전)
-- ────────────────────────────────────────────────
alter table public.worksheets
  add column if not exists status text not null default 'done'
  check (status in ('pending', 'done', 'failed'));

-- 생성 진행률 (0~100), 폴링으로 프로그레스바에 활용
alter table public.worksheets
  add column if not exists progress integer not null default 0
  check (progress between 0 and 100);


-- ────────────────────────────────────────────────
-- 5. 인덱스
-- ────────────────────────────────────────────────
create index if not exists usage_logs_user_month_idx
  on public.usage_logs (user_id, year_month);

create index if not exists worksheets_user_created_idx
  on public.worksheets (user_id, created_at desc);

create index if not exists payments_user_created_idx
  on public.payments (user_id, created_at desc);

create index if not exists worksheets_user_pending_idx
  on public.worksheets (user_id, status)
  where status = 'pending';


-- ────────────────────────────────────────────────
-- 6. updated_at 자동 갱신 트리거
-- ────────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();


-- ────────────────────────────────────────────────
-- 7. auth.users → profiles 자동 생성 트리거
--    Supabase Auth 회원가입 시 profiles 행 자동 삽입
-- ────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ────────────────────────────────────────────────
-- 8. RLS 활성화
-- ────────────────────────────────────────────────
alter table public.profiles  enable row level security;
alter table public.worksheets enable row level security;
alter table public.usage_logs enable row level security;
alter table public.payments   enable row level security;


-- ────────────────────────────────────────────────
-- 9. profiles RLS 정책
-- ────────────────────────────────────────────────
drop policy if exists "profiles: 본인 조회" on public.profiles;
create policy "profiles: 본인 조회"
  on public.profiles for select
  using ((select auth.uid()) = id);

drop policy if exists "profiles: 본인 수정" on public.profiles;
create policy "profiles: 본인 수정"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);


-- ────────────────────────────────────────────────
-- 10. worksheets RLS 정책
-- ────────────────────────────────────────────────
drop policy if exists "worksheets: 본인 조회" on public.worksheets;
create policy "worksheets: 본인 조회"
  on public.worksheets for select
  using ((select auth.uid()) = user_id);

drop policy if exists "worksheets: 본인 삽입" on public.worksheets;
create policy "worksheets: 본인 삽입"
  on public.worksheets for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "worksheets: 본인 삭제" on public.worksheets;
create policy "worksheets: 본인 삭제"
  on public.worksheets for delete
  using ((select auth.uid()) = user_id);


-- ────────────────────────────────────────────────
-- 11. usage_logs RLS 정책
-- ────────────────────────────────────────────────
drop policy if exists "usage_logs: 본인 조회" on public.usage_logs;
create policy "usage_logs: 본인 조회"
  on public.usage_logs for select
  using ((select auth.uid()) = user_id);

drop policy if exists "usage_logs: 본인 삽입" on public.usage_logs;
create policy "usage_logs: 본인 삽입"
  on public.usage_logs for insert
  with check ((select auth.uid()) = user_id);


-- ────────────────────────────────────────────────
-- 12. payments RLS 정책
-- ────────────────────────────────────────────────
drop policy if exists "payments: 본인 조회" on public.payments;
create policy "payments: 본인 조회"
  on public.payments for select
  using ((select auth.uid()) = user_id);


-- ────────────────────────────────────────────────
-- 13. 이번 달 사용량 함수 (백엔드 service_role 전용)
-- ────────────────────────────────────────────────
create or replace function public.get_monthly_usage(p_user_id uuid, p_year_month text)
returns integer language sql security definer as $$
  select count(*)::integer
  from public.usage_logs
  where user_id = p_user_id
    and year_month = p_year_month;
$$;
