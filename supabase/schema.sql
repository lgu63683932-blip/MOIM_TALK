-- 모임계(친구) 입출금 관리 프로그램 - 초기 스키마
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 실행하세요.

-- 확장 (uuid 생성용, Supabase 프로젝트는 기본적으로 활성화되어 있습니다)
create extension if not exists "pgcrypto";

-- 1) 친구(회원)
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- 2) 입금내역
create table if not exists deposits (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  amount integer not null,
  paid_date date not null,
  type text not null default '회비', -- 회비 / 은행이자 등
  month text not null, -- 예: '2026-09'
  created_at timestamptz not null default now()
);

-- 3) 출금내역
create table if not exists withdrawals (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  amount integer not null,
  spent_date date not null,
  receipt_image_url text,
  month text not null, -- 예: '2026-09'
  created_at timestamptz not null default now()
);

-- 4) 공지사항
create table if not exists notices (
  id uuid primary key default gen_random_uuid(),
  author text not null,
  title text not null,
  content text not null,
  tag text not null default '일반', -- 중요 / 일반
  created_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- 5) 설정값 (회비 기본값, 관리자 핀번호)
create table if not exists settings (
  key text primary key,
  value text not null
);

insert into settings (key, value) values
  ('default_deposit_amount', '20000'),
  ('admin_pin', '0000')
on conflict (key) do nothing;

-- 인덱스
create index if not exists idx_deposits_month on deposits(month);
create index if not exists idx_withdrawals_month on withdrawals(month);

-- RLS 활성화
alter table members enable row level security;
alter table deposits enable row level security;
alter table withdrawals enable row level security;
alter table notices enable row level security;
alter table settings enable row level security;

-- 이 앱은 별도 로그인 없이 링크 공유로 접속하고, 총무 권한은 화면단 핀번호로만 구분합니다.
-- 그래서 모든 테이블에 대해 조회/쓰기를 공개로 허용합니다 (친구들끼리 쓰는 소규모 앱 용도).
drop policy if exists "public read members" on members;
create policy "public read members" on members for select using (true);
drop policy if exists "public write members" on members;
create policy "public write members" on members for all using (true) with check (true);

drop policy if exists "public read deposits" on deposits;
create policy "public read deposits" on deposits for select using (true);
drop policy if exists "public write deposits" on deposits;
create policy "public write deposits" on deposits for all using (true) with check (true);

drop policy if exists "public read withdrawals" on withdrawals;
create policy "public read withdrawals" on withdrawals for select using (true);
drop policy if exists "public write withdrawals" on withdrawals;
create policy "public write withdrawals" on withdrawals for all using (true) with check (true);

drop policy if exists "public read notices" on notices;
create policy "public read notices" on notices for select using (true);
drop policy if exists "public write notices" on notices;
create policy "public write notices" on notices for all using (true) with check (true);

drop policy if exists "public read settings" on settings;
create policy "public read settings" on settings for select using (true);
drop policy if exists "public write settings" on settings;
create policy "public write settings" on settings for all using (true) with check (true);

-- 영수증 이미지 저장용 Storage 버킷
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

drop policy if exists "public read receipts" on storage.objects;
create policy "public read receipts" on storage.objects
  for select using (bucket_id = 'receipts');

drop policy if exists "public upload receipts" on storage.objects;
create policy "public upload receipts" on storage.objects
  for insert with check (bucket_id = 'receipts');
