export type Member = {
  id: string;
  name: string;
  created_at: string;
};

export type DepositType = "회비" | "은행이자" | "기타";

export type Deposit = {
  id: string;
  member_id: string;
  amount: number;
  paid_date: string; // YYYY-MM-DD
  type: DepositType;
  month: string; // YYYY-MM
  created_at: string;
  member?: Member;
};

export type Withdrawal = {
  id: string;
  content: string;
  amount: number;
  spent_date: string; // YYYY-MM-DD
  receipt_image_url: string | null;
  month: string; // YYYY-MM
  created_at: string;
};

export type NoticeTag = "중요" | "일반";

export type Notice = {
  id: string;
  author: string;
  title: string;
  content: string;
  tag: NoticeTag;
  created_date: string; // YYYY-MM-DD
  created_at: string;
};

export type Settings = {
  default_deposit_amount: number;
  admin_pin: string;
};
