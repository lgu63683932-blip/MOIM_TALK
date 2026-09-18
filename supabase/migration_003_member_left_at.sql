-- 친구(회원)가 모임을 탈퇴한 날짜를 기록할 수 있도록 컬럼 추가.
-- null이면 재적 중, 값이 있으면 그 달까지만 회비 대상으로 취급합니다.
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.

alter table members add column if not exists left_at date;
