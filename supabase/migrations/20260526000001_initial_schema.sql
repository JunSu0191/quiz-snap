-- ============================================================
-- 초기 스키마 베이스라인
-- 이미 운영 DB에 적용된 상태입니다.
-- supabase db push 시 이 파일은 마이그레이션 히스토리에만 기록되고
-- 실제 SQL은 실행되지 않습니다 (--include-all 없이 push하면 자동 skip).
-- ============================================================

-- profiles
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  full_name       text,
  plan            text not null default 'free' check (plan in ('free', 'basic', 'pro')),
  plan_expires_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- worksheets
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
  content        jsonb not null,
  created_at     timestamptz not null default now()
);

-- usage_logs
create table if not exists public.usage_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  worksheet_id uuid references public.worksheets(id) on delete set null,
  year_month   text not null,
  created_at   timestamptz not null default now()
);

-- payments
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

-- 인덱스
create index if not exists usage_logs_user_month_idx on public.usage_logs (user_id, year_month);
create index if not exists worksheets_user_created_idx on public.worksheets (user_id, created_at desc);
create index if not exists payments_user_created_idx on public.payments (user_id, created_at desc);

-- updated_at 트리거
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- 신규 가입 시 profiles 자동 생성 트리거
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS 활성화
alter table public.profiles   enable row level security;
alter table public.worksheets  enable row level security;
alter table public.usage_logs  enable row level security;
alter table public.payments    enable row level security;

-- RLS 정책
drop policy if exists "profiles: 본인 조회" on public.profiles;
create policy "profiles: 본인 조회" on public.profiles for select using ((select auth.uid()) = id);

drop policy if exists "profiles: 본인 수정" on public.profiles;
create policy "profiles: 본인 수정" on public.profiles for update
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "worksheets: 본인 조회" on public.worksheets;
create policy "worksheets: 본인 조회" on public.worksheets for select using ((select auth.uid()) = user_id);

drop policy if exists "worksheets: 본인 삽입" on public.worksheets;
create policy "worksheets: 본인 삽입" on public.worksheets for insert with check ((select auth.uid()) = user_id);

drop policy if exists "worksheets: 본인 삭제" on public.worksheets;
create policy "worksheets: 본인 삭제" on public.worksheets for delete using ((select auth.uid()) = user_id);

drop policy if exists "usage_logs: 본인 조회" on public.usage_logs;
create policy "usage_logs: 본인 조회" on public.usage_logs for select using ((select auth.uid()) = user_id);

drop policy if exists "usage_logs: 본인 삽입" on public.usage_logs;
create policy "usage_logs: 본인 삽입" on public.usage_logs for insert with check ((select auth.uid()) = user_id);

drop policy if exists "payments: 본인 조회" on public.payments;
create policy "payments: 본인 조회" on public.payments for select using ((select auth.uid()) = user_id);

-- 월별 사용량 함수
create or replace function public.get_monthly_usage(p_user_id uuid, p_year_month text)
returns integer language sql security definer as $$
  select count(*)::integer from public.usage_logs
  where user_id = p_user_id and year_month = p_year_month;
$$;
