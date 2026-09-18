-- 은행이자처럼 특정 친구에게 속하지 않는 공통 입금을 등록할 수 있도록
-- deposits.member_id를 필수(NOT NULL)에서 선택 항목으로 변경합니다.
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.

alter table deposits alter column member_id drop not null;
