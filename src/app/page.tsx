"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/lib/AdminContext";
import {
  currentMonth,
  formatDate,
  formatMonthsRemark,
  formatWon,
  percentChange,
  previousMonth,
} from "@/lib/format";
import type { Deposit, Notice, Withdrawal } from "@/lib/types";
import DepositModal from "@/components/DepositModal";
import WithdrawalModal from "@/components/WithdrawalModal";
import NoticeModal from "@/components/NoticeModal";
import AdminLoginModal from "@/components/AdminLoginModal";

type Transaction = {
  id: string;
  kind: "입금" | "출금";
  date: string;
  label: string;
  sub: string;
  amount: number;
};

export default function DashboardPage() {
  const { isAdmin } = useAdmin();

  const [balance, setBalance] = useState(0);
  const [monthDeposit, setMonthDeposit] = useState(0);
  const [monthWithdrawal, setMonthWithdrawal] = useState(0);
  const [withdrawalChange, setWithdrawalChange] = useState<number | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const month = currentMonth();
    const prevMonth = previousMonth(month);

    const [
      { data: allDeposits },
      { data: allWithdrawals },
      { data: noticeData },
    ] = await Promise.all([
      supabase.from("deposits").select("*, member:members(*)"),
      supabase.from("withdrawals").select("*"),
      supabase
        .from("notices")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4),
    ]);

    const deposits = (allDeposits ?? []) as Deposit[];
    const withdrawals = (allWithdrawals ?? []) as Withdrawal[];

    const totalDeposit = deposits.reduce((s, d) => s + d.amount, 0);
    const totalWithdrawal = withdrawals.reduce((s, w) => s + w.amount, 0);
    setBalance(totalDeposit - totalWithdrawal);

    const sumByMonth = (rows: { amount: number; month: string }[], m: string) =>
      rows.filter((r) => r.month === m).reduce((s, r) => s + r.amount, 0);

    // 입금합계는 회비가 적용되는 월(month)이 아니라 실제로 입금된 날짜(paid_date)
    // 기준으로 집계한다 — 몇 달치를 한 번에 낸 경우에도 실제 들어온 금액이 반영되도록.
    const sumDepositsByPaidMonth = (rows: Deposit[], m: string) =>
      rows
        .filter((r) => r.paid_date.slice(0, 7) === m)
        .reduce((s, r) => s + r.amount, 0);

    const curDep = sumDepositsByPaidMonth(deposits, month);
    const curWd = sumByMonth(withdrawals, month);
    const prevWd = sumByMonth(withdrawals, prevMonth);

    setMonthDeposit(curDep);
    setMonthWithdrawal(curWd);
    setWithdrawalChange(percentChange(curWd, prevWd));

    setNotices((noticeData ?? []) as Notice[]);

    const depositGroups = new Map<
      string,
      { date: string; label: string; type: string; amount: number; months: string[] }
    >();
    for (const d of deposits) {
      // created_at is identical for every row inserted in the same submission,
      // so a multi-month registration collapses into a single line here too.
      const key = `${d.member_id ?? "null"}|${d.type}|${d.created_at}`;
      const g = depositGroups.get(key);
      if (g) {
        g.amount += d.amount;
        g.months.push(d.month);
      } else {
        depositGroups.set(key, {
          date: d.paid_date,
          label: d.member?.name ?? d.type,
          type: d.type,
          amount: d.amount,
          months: [d.month],
        });
      }
    }
    const depositTx: Transaction[] = Array.from(depositGroups.entries()).map(
      ([key, g]) => ({
        id: `d-${key}`,
        kind: "입금",
        date: g.date,
        label: g.label,
        sub:
          g.months.length > 1
            ? `${g.type} · ${formatMonthsRemark(g.months)}`
            : g.type,
        amount: g.amount,
      })
    );
    const withdrawalTx: Transaction[] = withdrawals.map((w) => ({
      id: `w-${w.id}`,
      kind: "출금",
      date: w.spent_date,
      label: w.content,
      sub: "",
      amount: w.amount,
    }));

    const merged = [...depositTx, ...withdrawalTx]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 5);
    setTransactions(merged);

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function requireAdmin(action: () => void) {
    if (isAdmin) {
      action();
    } else {
      setShowLogin(true);
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-8 text-white">
        <h1 className="text-2xl font-bold">
          안녕하세요! 👋
        </h1>
        <p className="mt-1 text-blue-100">
          오늘도 좋은 하루 보내세요. 친구들과 함께하는 소중한 돈, 더 의미 있게.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-400">현재 잔액</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">
            {formatWon(balance)}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-400">이번 달 입금합계</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {formatWon(monthDeposit)}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-400">이번 달 지출합계</p>
          <p className="mt-2 text-2xl font-bold text-rose-500">
            {formatWon(monthWithdrawal)}
          </p>
          {withdrawalChange !== null && (
            <p className="mt-1 text-xs text-gray-400">
              지난 달보다 {withdrawalChange >= 0 ? "+" : ""}
              {withdrawalChange}%
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => requireAdmin(() => setShowDeposit(true))}
          className="rounded-2xl bg-blue-50 px-5 py-4 text-left text-blue-700 shadow-sm hover:bg-blue-100"
        >
          <div className="text-lg font-bold">+ 입금 등록</div>
          <div className="text-sm text-blue-400">함께하는 돈을 추가해요</div>
        </button>
        <button
          onClick={() => requireAdmin(() => setShowWithdrawal(true))}
          className="rounded-2xl bg-rose-50 px-5 py-4 text-left text-rose-600 shadow-sm hover:bg-rose-100"
        >
          <div className="text-lg font-bold">- 출금 등록</div>
          <div className="text-sm text-rose-300">지출 내역을 기록해요</div>
        </button>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">📢 공지사항</h2>
            <button
              onClick={() => setShowNotice(true)}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200"
            >
              + 공지 작성
            </button>
          </div>
          <ul className="divide-y divide-gray-100">
            {notices.length === 0 && (
              <li className="py-3 text-sm text-gray-400">
                등록된 공지사항이 없습니다.
              </li>
            )}
            {notices.map((n) => (
              <li key={n.id} className="flex items-center gap-2 py-3">
                <span
                  className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                    n.tag === "중요"
                      ? "bg-rose-100 text-rose-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {n.tag}
                </span>
                <span className="flex-1 truncate text-sm text-gray-700">
                  {n.title}
                </span>
                <span className="shrink-0 text-xs text-gray-400">
                  {formatDate(n.created_date)}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/notices"
            className="mt-2 block text-center text-sm text-blue-600 hover:underline"
          >
            전체 공지 보기 →
          </Link>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">📋 최근 내역</h2>
            <Link
              href="/history"
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              전체 내역 보기 →
            </Link>
          </div>
          <ul className="divide-y divide-gray-100">
            {!loading && transactions.length === 0 && (
              <li className="py-3 text-sm text-gray-400">
                등록된 내역이 없습니다.
              </li>
            )}
            {transactions.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-3">
                <span
                  className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                    t.kind === "입금"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-rose-100 text-rose-600"
                  }`}
                >
                  {t.kind}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-gray-800">{t.label}</p>
                  <p className="text-xs text-gray-400">
                    {formatDate(t.date)} {t.sub}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-sm font-semibold ${
                    t.kind === "입금" ? "text-blue-600" : "text-rose-500"
                  }`}
                >
                  {t.kind === "입금" ? "+" : "-"}
                  {formatWon(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {showDeposit && (
        <DepositModal onClose={() => setShowDeposit(false)} onSaved={loadData} />
      )}
      {showWithdrawal && (
        <WithdrawalModal
          onClose={() => setShowWithdrawal(false)}
          onSaved={loadData}
        />
      )}
      {showNotice && (
        <NoticeModal onClose={() => setShowNotice(false)} onSaved={loadData} />
      )}
      {showLogin && <AdminLoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}
