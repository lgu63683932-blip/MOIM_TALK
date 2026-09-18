"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/lib/AdminContext";
import { formatDate, formatWon } from "@/lib/format";
import type { Deposit, Member, Withdrawal } from "@/lib/types";
import DepositCellModal from "@/components/DepositCellModal";
import WithdrawalCellModal from "@/components/WithdrawalCellModal";

function monthsForYear(year: number): string[] {
  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth() + 1;
  const maxMonth = year === curY ? curM : year < curY ? 12 : 0;
  const months: string[] = [];
  for (let m = 1; m <= maxMonth; m++) {
    months.push(`${year}-${String(m).padStart(2, "0")}`);
  }
  return months;
}

function monthShortLabel(month: string): string {
  return `${Number(month.slice(5, 7))}월`;
}

type DepositModalState = { title: string; deposits: Deposit[] };
type WithdrawalModalState = { title: string; withdrawals: Withdrawal[] };

export default function DuesPage() {
  const { isAdmin } = useAdmin();
  const [members, setMembers] = useState<Member[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  const [depositModal, setDepositModal] = useState<DepositModalState | null>(
    null
  );
  const [withdrawalModal, setWithdrawalModal] =
    useState<WithdrawalModalState | null>(null);

  async function load() {
    const [{ data: memberData }, { data: depositData }, { data: withdrawalData }] =
      await Promise.all([
        supabase.from("members").select("*").order("created_at"),
        supabase.from("deposits").select("*"),
        supabase.from("withdrawals").select("*"),
      ]);
    setMembers((memberData ?? []) as Member[]);
    setDeposits((depositData ?? []) as Deposit[]);
    setWithdrawals((withdrawalData ?? []) as Withdrawal[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const years = useMemo(() => {
    const set = new Set<number>();
    set.add(new Date().getFullYear());
    deposits.forEach((d) => set.add(Number(d.month.slice(0, 4))));
    withdrawals.forEach((w) => set.add(Number(w.month.slice(0, 4))));
    return Array.from(set).sort((a, b) => b - a);
  }, [deposits, withdrawals]);

  const months = useMemo(() => monthsForYear(year), [year]);

  function depositsFor(month: string, memberId: string | null, type?: string) {
    return deposits.filter(
      (d) =>
        d.month === month &&
        d.member_id === memberId &&
        (type ? d.type === type : true)
    );
  }

  function withdrawalsFor(month: string) {
    return withdrawals.filter((w) => w.month === month);
  }

  function balanceUpTo(month: string): number {
    const dep = deposits
      .filter((d) => d.month <= month)
      .reduce((s, d) => s + d.amount, 0);
    const wd = withdrawals
      .filter((w) => w.month <= month)
      .reduce((s, w) => s + w.amount, 0);
    return dep - wd;
  }

  function handleDataChanged() {
    load();
    setDepositModal(null);
    setWithdrawalModal(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">월별 회비 납부 현황</h1>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}년
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm text-gray-400">불러오는 중...</p>}
      {!loading && members.length === 0 && (
        <p className="text-sm text-gray-400">
          등록된 친구가 없습니다. 친구 관리에서 먼저 등록해주세요.
        </p>
      )}
      {!loading && members.length > 0 && months.length === 0 && (
        <p className="text-sm text-gray-400">해당 연도에는 아직 데이터가 없습니다.</p>
      )}

      {!isAdmin && !loading && members.length > 0 && months.length > 0 && (
        <p className="text-xs text-gray-400">
          총무로 로그인하면 각 항목을 눌러 수정/삭제할 수 있습니다.
        </p>
      )}

      {!loading && members.length > 0 && months.length > 0 && (
        <div className="overflow-x-auto rounded-2xl bg-white p-5 shadow-sm">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="text-gray-500">
                <th
                  rowSpan={2}
                  className="sticky left-0 z-10 border-b border-r border-gray-200 bg-gray-50 px-2 py-2 text-left font-medium"
                >
                  월
                </th>
                {members.map((m) => (
                  <th
                    key={m.id}
                    colSpan={2}
                    className="border-b border-r border-gray-200 bg-gray-50 px-2 py-2 text-center font-medium"
                  >
                    {m.name}
                  </th>
                ))}
                <th
                  rowSpan={2}
                  className="border-b border-r border-gray-200 bg-gray-50 px-2 py-2 text-center font-medium"
                >
                  은행이자
                </th>
                <th
                  rowSpan={2}
                  className="border-b border-r border-gray-200 bg-gray-50 px-2 py-2 text-center font-medium"
                >
                  입금합계금액
                </th>
                <th
                  colSpan={3}
                  className="border-b border-r border-gray-200 bg-gray-50 px-2 py-2 text-center font-medium"
                >
                  지출내용
                </th>
                <th
                  rowSpan={2}
                  className="border-b border-r border-gray-200 bg-gray-50 px-2 py-2 text-center font-medium"
                >
                  지출합계
                </th>
                <th
                  rowSpan={2}
                  className="border-b border-gray-200 bg-gray-50 px-2 py-2 text-center font-medium"
                >
                  잔액
                </th>
              </tr>
              <tr className="text-gray-400">
                {members.map((m) => (
                  <Fragment key={m.id}>
                    <th className="border-b border-r border-gray-200 bg-gray-50 px-2 py-1.5 text-center text-xs font-medium">
                      입금액
                    </th>
                    <th className="border-b border-r border-gray-200 bg-gray-50 px-2 py-1.5 text-center text-xs font-medium">
                      일자
                    </th>
                  </Fragment>
                ))}
                <th className="border-b border-r border-gray-200 bg-gray-50 px-2 py-1.5 text-center text-xs font-medium">
                  내용
                </th>
                <th className="border-b border-r border-gray-200 bg-gray-50 px-2 py-1.5 text-center text-xs font-medium">
                  일자
                </th>
                <th className="border-b border-r border-gray-200 bg-gray-50 px-2 py-1.5 text-center text-xs font-medium">
                  금액
                </th>
              </tr>
            </thead>
            <tbody>
              {months.map((month) => {
                const monthWithdrawals = withdrawalsFor(month);
                const depositTotal = deposits
                  .filter((d) => d.month === month)
                  .reduce((s, d) => s + d.amount, 0);
                const withdrawalTotal = monthWithdrawals.reduce(
                  (s, w) => s + w.amount,
                  0
                );
                const interestDeposits = depositsFor(month, null, "은행이자");
                const interestTotal = interestDeposits.reduce(
                  (s, d) => s + d.amount,
                  0
                );
                return (
                  <tr key={month} className="align-top">
                    <td
                      className="sticky left-0 z-10 border-b border-r border-gray-100 bg-white px-2 py-2 font-medium text-gray-800"
                    >
                      {monthShortLabel(month)}
                    </td>
                    {members.map((m) => {
                      const memberDeposits = depositsFor(month, m.id, "회비");
                      const amt = memberDeposits.reduce(
                        (s, d) => s + d.amount,
                        0
                      );
                      const clickable = isAdmin;
                      return (
                        <Fragment key={m.id}>
                          <td
                            onClick={
                              clickable
                                ? () =>
                                    setDepositModal({
                                      title: `${m.name} · ${monthShortLabel(month)} 입금내역`,
                                      deposits: memberDeposits,
                                    })
                                : undefined
                            }
                            className={`border-b border-r border-gray-100 px-2 py-2 text-center ${
                              clickable ? "cursor-pointer hover:bg-blue-50" : ""
                            } ${
                              memberDeposits.length > 0
                                ? "text-blue-600 font-medium"
                                : "text-rose-400"
                            }`}
                          >
                            {memberDeposits.length > 0
                              ? formatWon(amt)
                              : "미납"}
                          </td>
                          <td
                            onClick={
                              clickable
                                ? () =>
                                    setDepositModal({
                                      title: `${m.name} · ${monthShortLabel(month)} 입금내역`,
                                      deposits: memberDeposits,
                                    })
                                : undefined
                            }
                            className={`border-b border-r border-gray-100 px-2 py-2 text-center text-gray-500 ${
                              clickable ? "cursor-pointer hover:bg-blue-50" : ""
                            }`}
                          >
                            {memberDeposits.length === 1
                              ? formatDate(memberDeposits[0].paid_date)
                              : memberDeposits.length > 1
                                ? `${memberDeposits.length}건`
                                : "-"}
                          </td>
                        </Fragment>
                      );
                    })}
                    <td
                      onClick={
                        isAdmin
                          ? () =>
                              setDepositModal({
                                title: `${monthShortLabel(month)} 은행이자`,
                                deposits: interestDeposits,
                              })
                          : undefined
                      }
                      className={`border-b border-r border-gray-100 px-2 py-2 text-center text-gray-600 ${
                        isAdmin ? "cursor-pointer hover:bg-blue-50" : ""
                      }`}
                    >
                      {interestTotal > 0 ? formatWon(interestTotal) : "-"}
                    </td>
                    <td
                      className="border-b border-r border-gray-100 px-2 py-2 text-center font-semibold text-gray-800"
                    >
                      {formatWon(depositTotal)}
                    </td>

                    {monthWithdrawals.length === 0 ? (
                      <>
                        <td className="border-b border-r border-gray-100 px-2 py-2 text-center text-gray-300">
                          -
                        </td>
                        <td className="border-b border-r border-gray-100 px-2 py-2 text-center text-gray-300">
                          -
                        </td>
                        <td className="border-b border-r border-gray-100 px-2 py-2 text-center text-gray-300">
                          -
                        </td>
                      </>
                    ) : (
                      <>
                        <td
                          onClick={
                            isAdmin
                              ? () =>
                                  setWithdrawalModal({
                                    title: `${monthShortLabel(month)} 지출내역`,
                                    withdrawals: monthWithdrawals,
                                  })
                              : undefined
                          }
                          className={`border-b border-r border-gray-100 px-2 py-2 text-gray-700 ${
                            isAdmin ? "cursor-pointer hover:bg-blue-50" : ""
                          }`}
                        >
                          {monthWithdrawals.map((w) => (
                            <div key={w.id} className="whitespace-nowrap">
                              {w.content}
                            </div>
                          ))}
                        </td>
                        <td
                          onClick={
                            isAdmin
                              ? () =>
                                  setWithdrawalModal({
                                    title: `${monthShortLabel(month)} 지출내역`,
                                    withdrawals: monthWithdrawals,
                                  })
                              : undefined
                          }
                          className={`border-b border-r border-gray-100 px-2 py-2 text-center text-gray-500 ${
                            isAdmin ? "cursor-pointer hover:bg-blue-50" : ""
                          }`}
                        >
                          {monthWithdrawals.map((w) => (
                            <div key={w.id} className="whitespace-nowrap">
                              {formatDate(w.spent_date)}
                            </div>
                          ))}
                        </td>
                        <td
                          onClick={
                            isAdmin
                              ? () =>
                                  setWithdrawalModal({
                                    title: `${monthShortLabel(month)} 지출내역`,
                                    withdrawals: monthWithdrawals,
                                  })
                              : undefined
                          }
                          className={`border-b border-r border-gray-100 px-2 py-2 text-right text-rose-500 ${
                            isAdmin ? "cursor-pointer hover:bg-blue-50" : ""
                          }`}
                        >
                          {monthWithdrawals.map((w) => (
                            <div key={w.id} className="whitespace-nowrap">
                              {formatWon(w.amount)}
                            </div>
                          ))}
                        </td>
                      </>
                    )}

                    <td
                      className="border-b border-r border-gray-100 px-2 py-2 text-center font-semibold text-rose-500"
                    >
                      {withdrawalTotal > 0 ? formatWon(withdrawalTotal) : "-"}
                    </td>
                    <td
                      className="border-b border-gray-100 px-2 py-2 text-center font-semibold text-blue-600"
                    >
                      {formatWon(balanceUpTo(month))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {depositModal && (
        <DepositCellModal
          title={depositModal.title}
          deposits={depositModal.deposits}
          onClose={() => setDepositModal(null)}
          onChanged={handleDataChanged}
        />
      )}
      {withdrawalModal && (
        <WithdrawalCellModal
          title={withdrawalModal.title}
          withdrawals={withdrawalModal.withdrawals}
          onClose={() => setWithdrawalModal(null)}
          onChanged={handleDataChanged}
        />
      )}
    </div>
  );
}
