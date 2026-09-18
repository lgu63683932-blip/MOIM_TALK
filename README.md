# 친구 모임계 입출금 관리

친구들과 함께 운영하는 모임계(회비)의 입금·출금 내역을 등록하고, 잔액을 자동으로 계산해 공유하는 웹앱입니다.

## 기술 스택

- Next.js (App Router)
- Supabase (Database + Storage)
- Vercel (배포)

## 개발 환경 실행

```bash
npm install
npm run dev
```

`.env.local` 에 아래 값이 필요합니다.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## 데이터베이스 스키마

`supabase/schema.sql` 을 Supabase SQL Editor에서 실행하면 필요한 테이블과 스토리지 버킷이 생성됩니다.

## 기획 문서

자세한 기능 정의는 [모임계_입출금관리_프로그램_기획서.md](./모임계_입출금관리_프로그램_기획서.md) 를 참고하세요.
