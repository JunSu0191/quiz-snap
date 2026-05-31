-- worksheets에 백그라운드 생성 상태 및 진행률 컬럼 추가
alter table public.worksheets
  add column if not exists status text not null default 'done'
  check (status in ('pending', 'done', 'failed'));

alter table public.worksheets
  add column if not exists progress integer not null default 0
  check (progress between 0 and 100);

-- pending 상태 조회용 인덱스
create index if not exists worksheets_user_pending_idx
  on public.worksheets (user_id, status)
  where status = 'pending';
