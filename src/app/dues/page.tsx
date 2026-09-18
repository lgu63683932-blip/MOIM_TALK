"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/lib/AdminContext";
import { formatDate, formatWon } from "@/lib/format";
import type { Deposit, Member, Withdrawal } from "@/lib/types";
import DepositCellModal from "@/components/DepositCellModal";
import WithdrawalCellModal from "@/components/WithdrawalCellModal";

function monthsForRange(startYear: number, endYear: number): string[] {
  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth() + 1;
  const months: string[] = [];
  for (let year = startYear; year <= endYear; year++) {
    const maxMonth = year === curY ? curM : year < curY ? 12 : 0;
    for (let m = 1; m <= maxMonth; m++) {
      months.push(`${year}-${String(m).padStart(2, "0")}`);
    }
  }
  return months;
}

function monthShortLabel(month: string): string {
  const [y, m] = month.split("-");
  return `${y}.${m}`;
}

type DepositModalState = { title: string; deposits: Deposit[] };
type WithdrawalModalState = { title: string; withdrawals: Withdrawal[] };

// table-design-spec.md 토큰
const HEADER_BG = "#E3ECFB";
const HEADER_TEXT = "#334155";
const BORDER = "#D0DDF3";

const thBase = `px-2.5 py-1.5 text-[14px] font-semibold whitespace-nowrap sticky top-0 z-20 border-b border-r`;
const thSub = `px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap sticky top-[33px] z-20 border-b border-r`;
const tdBase = `px-2.5 py-1.5 text-[14px] whitespace-nowrap border-b border-r`;

const zebraRow = (idx: number) =>
  idx % 2 === 0 ? "bg-white" : "bg-[#F5F8FF]";

export default function DuesPage() {
  const { isAdmin } = useAdmin();
  const [members, setMembers] = useState<Member[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [endYear, setEndYear] = useState(new Date().getFullYear());

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
    return Array.from(set).sort((a, b) => a - b);
  }, [deposits, withdrawals]);

  useEffect(() => {
    if (years.length === 0) return;
    setStartYear(years[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [years.length]);

  const months = useMemo(
    () => monthsForRange(Math.min(startYear, endYear), Math.max(startYear, endYear)),
    [startYear, endYear]
  );

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
        <div className="flex items-center gap-2">
          <select
            value={startYear}
            onChange={(e) => setStartYear(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </select>
          <span className="text-gray-400">~</span>
          <select
            value={endYear}
            onChange={(e) => setEndYear(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <p className="text-sm text-gray-400">불러오는 중...</p>}
      {!loading && members.length === 0 && (
        <p className="text-sm text-gray-400">
          등록된 친구가 없습니다. 친구 관리에서 먼저 등록해주세요.
        </p>
      )}
      {!loading && members.length > 0 && months.length === 0 && (
        <p className="text-sm text-gray-400">해당 기간에는 아직 데이터가 없습니다.</p>
      )}

      {!isAdmin && !loading && members.length > 0 && months.length > 0 && (
        <p className="text-xs text-gray-400">
          총무로 로그인하면 각 항목을 눌러 수정/삭제할 수 있습니다.
        </p>
      )}

      {!loading && members.length > 0 && months.length > 0 && (
        <div
          className="max-h-[70vh] overflow-auto rounded-xl border"
          style={{ borderColor: BORDER }}
        >
          <table
            className="w-full min-w-[900px] border-separate"
            style={{ borderSpacing: 0 }}
          >
            <thead>
              <tr>
                <th
                  rowSpan={2}
                  className={`${thBase} left-0 text-left`}
                  style={{ backgroundColor: HEADER_BG, color: HEADER_TEXT, borderColor: BORDER }}
                >
                  월
                </th>
                {members.map((m) => (
                  <th
                    key={m.id}
                    colSpan={2}
                    className={`${thBase} text-center`}
                    style={{ backgroundColor: HEADER_BG, color: HEADER_TEXT, borderColor: BORDER }}
                  >
                    {m.name}
                  </th>
                ))}
                <th
                  rowSpan={2}
                  className={`${thBase} text-right`}
                  style={{ backgroundColor: HEADER_BG, color: HEADER_TEXT, borderColor: BORDER }}
                >
                  은행이자
                </th>
                <th
                  rowSpan={2}
                  className={`${thBase} text-right`}
                  style={{ backgroundColor: HEADER_BG, color: HEADER_TEXT, borderColor: BORDER }}
                >
                  입금합계금액
                </th>
                <th
                  colSpan={3}
                  className={`${thBase} text-center`}
                  style={{ backgroundColor: HEADER_BG, color: HEADER_TEXT, borderColor: BORDER }}
                >
                  지출내용
                </th>
                <th
                  rowSpan={2}
                  className={`${thBase} text-right`}
                  style={{ backgroundColor: HEADER_BG, color: HEADER_TEXT, borderColor: BORDER }}
                >
                  지출합계
                </th>
                <th
                  rowSpan={2}
                  className={`${thBase} text-right`}
                  style={{ backgroundColor: HEADER_BG, color: HEADER_TEXT, borderColor: BORDER }}
                >
                  잔액
                </th>
              </tr>
              <tr>
                {members.map((m) => (
                  <Fragment key={m.id}>
                    <th
                      className={`${thSub} text-right`}
                      style={{ backgroundColor: HEADER_BG, color: "#64748b", borderColor: BORDER }}
                    >
                      입금액
                    </th>
                    <th
                      className={`${thSub} text-center`}
                      style={{ backgroundColor: HEADER_BG, color: "#64748b", borderColor: BORDER }}
                    >
                      일자
                    </th>
                  </Fragment>
                ))}
                <th
                  className={`${thSub} text-center`}
                  style={{ backgroundColor: HEADER_BG, color: "#64748b", borderColor: BORDER }}
                >
                  내용
                </th>
                <th
                  className={`${thSub} text-center`}
                  style={{ backgroundColor: HEADER_BG, color: "#64748b", borderColor: BORDER }}
                >
                  일자
                </th>
                <th
                  className={`${thSub} text-right`}
                  style={{ backgroundColor: HEADER_BG, color: "#64748b", borderColor: BORDER }}
                >
                  금액
                </th>
              </tr>
            </thead>
            <tbody>
              {months.map((month, idx) => {
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
                const rowBg = zebraRow(idx);
                const rowBgHex = idx % 2 === 0 ? "#FFFFFF" : "#F5F8FF";
                return (
                  <tr
                    key={month}
                    className={`group align-top ${rowBg} hover:bg-[#DCE8FA] transition-colors`}
                  >
                    <td
                      className={`${tdBase} left-0 sticky z-10 font-medium text-gray-800 group-hover:bg-[#DCE8FA]`}
                      style={{ backgroundColor: rowBgHex, borderColor: BORDER }}
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
                            className={`${tdBase} text-right ${
                              clickable ? "cursor-pointer hover:bg-[#DCE8FA]" : ""
                            } ${
                              memberDeposits.length > 0
                                ? "text-blue-600 font-medium"
                                : "text-rose-400"
                            }`}
                            style={{ borderColor: BORDER }}
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
                            className={`${tdBase} text-center text-gray-500 ${
                              clickable ? "cursor-pointer hover:bg-[#DCE8FA]" : ""
                            }`}
                            style={{ borderColor: BORDER }}
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
                      className={`${tdBase} text-right text-gray-600 ${
                        isAdmin ? "cursor-pointer hover:bg-[#DCE8FA]" : ""
                      }`}
                      style={{ borderColor: BORDER }}
                    >
                      {interestTotal > 0 ? formatWon(interestTotal) : "-"}
                    </td>
                    <td
                      className={`${tdBase} text-right font-semibold text-gray-800`}
                      style={{ borderColor: BORDER }}
                    >
                      {formatWon(depositTotal)}
                    </td>

                    {monthWithdrawals.length === 0 ? (
                      <>
                        <td
                          className={`${tdBase} text-center text-gray-300`}
                          style={{ borderColor: BORDER }}
                        >
                          -
                        </td>
                        <td
                          className={`${tdBase} text-center text-gray-300`}
                          style={{ borderColor: BORDER }}
                        >
                          -
                        </td>
                        <td
                          className={`${tdBase} text-right text-gray-300`}
                          style={{ borderColor: BORDER }}
                        >
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
                          className={`${tdBase} text-gray-700 ${
                            isAdmin ? "cursor-pointer hover:bg-[#DCE8FA]" : ""
                          }`}
                          style={{ borderColor: BORDER }}
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
                          className={`${tdBase} text-center text-gray-500 ${
                            isAdmin ? "cursor-pointer hover:bg-[#DCE8FA]" : ""
                          }`}
                          style={{ borderColor: BORDER }}
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
                          className={`${tdBase} text-right text-rose-500 ${
                            isAdmin ? "cursor-pointer hover:bg-[#DCE8FA]" : ""
                          }`}
                          style={{ borderColor: BORDER }}
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
                      className={`${tdBase} text-right font-semibold text-rose-500`}
                      style={{ borderColor: BORDER }}
                    >
                      {withdrawalTotal > 0 ? formatWon(withdrawalTotal) : "-"}
                    </td>
                    <td
                      className={`${tdBase} text-right font-semibold text-blue-600 border-r-0`}
                      style={{ borderColor: BORDER }}
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
