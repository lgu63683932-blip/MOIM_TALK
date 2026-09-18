"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/lib/AdminContext";
import { formatDate, formatMonthsRemark, formatWon } from "@/lib/format";
import type { Deposit, Member, Withdrawal } from "@/lib/types";
import { ColumnHeader, type SortState } from "@/components/table/ColumnHeader";
import DepositCellModal from "@/components/DepositCellModal";
import WithdrawalCellModal from "@/components/WithdrawalCellModal";

type Row = {
  id: string;
  kind: "입금" | "출금";
  date: string;
  depositAmount: number | null;
  withdrawalAmount: number | null;
  content: string;
  remark: string;
  receiptUrl?: string | null;
  depositRecords?: Deposit[];
  withdrawalRecord?: Withdrawal;
};

const rowCls = (idx: number) =>
  (idx % 2 === 0
    ? "bg-white hover:bg-[#DCE8FA]"
    : "bg-[#F5F8FF] hover:bg-[#DCE8FA]") + " transition-colors";

const thCls =
  "px-2.5 py-1.5 text-[14px] font-semibold text-[#334155] whitespace-nowrap sticky top-0 z-20 bg-[#E3ECFB] border-b border-r border-[#D0DDF3]";
const thNumCls = thCls + " text-right";
const tdCls =
  "px-2.5 py-1.5 text-[14px] text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis border-b border-r border-[#D0DDF3]";
const tdNumCls = tdCls + " text-right";

export default function HistoryPage() {
  const { isAdmin } = useAdmin();
  const [members, setMembers] = useState<Member[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<string>("전체");
  const [lightbox, setLightbox] = useState<string | null>(null);

  const [sort, setSort] = useState<SortState>({ col: "date", dir: "desc" });
  const [kindFilter, setKindFilter] = useState<string[]>([]);
  const [contentFilter, setContentFilter] = useState<string[]>([]);

  const [depositModal, setDepositModal] = useState<{
    title: string;
    deposits: Deposit[];
  } | null>(null);
  const [withdrawalModal, setWithdrawalModal] = useState<{
    title: string;
    withdrawals: Withdrawal[];
  } | null>(null);

  async function load() {
    const [{ data: m }, { data: d }, { data: w }] = await Promise.all([
      supabase.from("members").select("*"),
      supabase.from("deposits").select("*"),
      supabase.from("withdrawals").select("*"),
    ]);
    setMembers((m ?? []) as Member[]);
    setDeposits((d ?? []) as Deposit[]);
    setWithdrawals((w ?? []) as Withdrawal[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function handleDataChanged() {
    load();
    setDepositModal(null);
    setWithdrawalModal(null);
  }

  const memberById = useMemo(() => {
    const map = new Map<string, Member>();
    members.forEach((m) => map.set(m.id, m));
    return map;
  }, [members]);

  const years = useMemo(() => {
    const set = new Set<string>();
    deposits.forEach((d) => set.add(d.month.slice(0, 4)));
    withdrawals.forEach((w) => set.add(w.month.slice(0, 4)));
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [deposits, withdrawals]);

  const allRows = useMemo<Row[]>(() => {
    const groups = new Map<
      string,
      {
        member_id: string | null;
        paid_date: string;
        type: string;
        amount: number;
        months: string[];
        records: Deposit[];
      }
    >();
    for (const d of deposits) {
      // created_at is identical for every row inserted in the same submission
      // (same DB transaction), so it groups a multi-month registration into
      // one row while keeping separate submissions on the same date apart.
      const key = `${d.member_id ?? "null"}|${d.type}|${d.created_at}`;
      const g = groups.get(key);
      if (g) {
        g.amount += d.amount;
        g.months.push(d.month);
        g.records.push(d);
      } else {
        groups.set(key, {
          member_id: d.member_id,
          paid_date: d.paid_date,
          type: d.type,
          amount: d.amount,
          months: [d.month],
          records: [d],
        });
      }
    }

    const depositRows: Row[] = Array.from(groups.entries()).map(([key, g]) => {
      const member = g.member_id ? memberById.get(g.member_id) : undefined;
      const content = member
        ? g.type === "회비"
          ? member.name
          : `${member.name} (${g.type})`
        : g.type;
      return {
        id: `d-${key}`,
        kind: "입금",
        date: g.paid_date,
        depositAmount: g.amount,
        withdrawalAmount: null,
        content,
        remark: formatMonthsRemark(g.months),
        depositRecords: g.records,
      };
    });

    const withdrawalRows: Row[] = withdrawals.map((w) => ({
      id: `w-${w.id}`,
      kind: "출금",
      date: w.spent_date,
      depositAmount: null,
      withdrawalAmount: w.amount,
      content: w.content,
      remark: "",
      receiptUrl: w.receipt_image_url,
      withdrawalRecord: w,
    }));

    return [...depositRows, ...withdrawalRows];
  }, [deposits, withdrawals, memberById]);

  const yearFiltered = useMemo(
    () =>
      year === "전체" ? allRows : allRows.filter((r) => r.date.startsWith(year)),
    [allRows, year]
  );

  const contentOptions = useMemo(
    () => Array.from(new Set(yearFiltered.map((r) => r.content))).sort(),
    [yearFiltered]
  );

  const filtered = useMemo(() => {
    return yearFiltered.filter((r) => {
      if (kindFilter.length > 0 && !kindFilter.includes(r.kind)) return false;
      if (contentFilter.length > 0 && !contentFilter.includes(r.content))
        return false;
      return true;
    });
  }, [yearFiltered, kindFilter, contentFilter]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const dir = sort.dir === "asc" ? 1 : -1;
    const arr = [...filtered];
    arr.sort((a, b) => {
      switch (sort.col) {
        case "kind":
          return a.kind.localeCompare(b.kind) * dir;
        case "date":
          return a.date.localeCompare(b.date) * dir;
        case "depositAmount":
          return ((a.depositAmount ?? 0) - (b.depositAmount ?? 0)) * dir;
        case "withdrawalAmount":
          return ((a.withdrawalAmount ?? 0) - (b.withdrawalAmount ?? 0)) * dir;
        case "content":
          return a.content.localeCompare(b.content) * dir;
        case "remark":
          return a.remark.localeCompare(b.remark) * dir;
        default:
          return 0;
      }
    });
    return arr;
  }, [filtered, sort]);

  function toggleSort(col: string) {
    setSort((prev) => {
      if (!prev || prev.col !== col) return { col, dir: "asc" };
      if (prev.dir === "asc") return { col, dir: "desc" };
      return null;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">전체 내역</h1>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="전체">전체 기간</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}년
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm text-gray-400">불러오는 중...</p>}

      {!loading && (
        <div className="rounded-xl border border-[#D0DDF3] overflow-auto">
          <table
            className="border-separate w-full min-w-[720px]"
            style={{ borderSpacing: 0 }}
          >
            <thead>
              <tr>
                <th className={thCls}>
                  <ColumnHeader
                    label="구분"
                    sortCol="kind"
                    sort={sort}
                    onSort={() => toggleSort("kind")}
                    options={["입금", "출금"]}
                    selected={kindFilter}
                    onChange={setKindFilter}
                  />
                </th>
                <th className={thCls}>
                  <ColumnHeader
                    label="일자"
                    sortCol="date"
                    sort={sort}
                    onSort={() => toggleSort("date")}
                  />
                </th>
                <th className={thNumCls}>
                  <ColumnHeader
                    label="입금금액"
                    sortCol="depositAmount"
                    sort={sort}
                    onSort={() => toggleSort("depositAmount")}
                    align="right"
                  />
                </th>
                <th className={thNumCls}>
                  <ColumnHeader
                    label="출금금액"
                    sortCol="withdrawalAmount"
                    sort={sort}
                    onSort={() => toggleSort("withdrawalAmount")}
                    align="right"
                  />
                </th>
                <th className={thCls}>
                  <ColumnHeader
                    label="내용"
                    sortCol="content"
                    sort={sort}
                    onSort={() => toggleSort("content")}
                    options={contentOptions}
                    selected={contentFilter}
                    onChange={setContentFilter}
                  />
                </th>
                <th className={thCls}>
                  <ColumnHeader
                    label="비고"
                    sortCol="remark"
                    sort={sort}
                    onSort={() => toggleSort("remark")}
                  />
                </th>
                <th className={`${thCls} text-center`}>
                  <span>영수증</span>
                </th>
                {isAdmin && (
                  <th className={thCls}>
                    <span>관리</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr>
                  <td
                    colSpan={isAdmin ? 8 : 7}
                    className="px-2.5 py-6 text-center text-sm text-gray-400"
                  >
                    등록된 내역이 없습니다.
                  </td>
                </tr>
              )}
              {sorted.map((r, idx) => (
                <tr key={r.id} className={rowCls(idx)}>
                  <td className={tdCls}>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                        r.kind === "입금"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-rose-100 text-rose-600"
                      }`}
                    >
                      {r.kind}
                    </span>
                  </td>
                  <td className={tdCls}>{formatDate(r.date)}</td>
                  <td className={tdNumCls}>
                    {r.depositAmount != null ? (
                      <span className="font-medium text-blue-600">
                        +{formatWon(r.depositAmount)}
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className={tdNumCls}>
                    {r.withdrawalAmount != null ? (
                      <span className="font-medium text-rose-500">
                        -{formatWon(r.withdrawalAmount)}
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className={tdCls} title={r.content}>
                    {r.content}
                  </td>
                  <td className={tdCls} title={r.remark}>
                    {r.remark || <span className="text-gray-300">-</span>}
                  </td>
                  <td className={`${tdCls} text-center`}>
                    {r.receiptUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.receiptUrl}
                        alt="영수증"
                        onClick={() => setLightbox(r.receiptUrl!)}
                        className="mx-auto h-8 w-8 cursor-pointer rounded object-cover ring-1 ring-gray-200 hover:ring-blue-400"
                      />
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className={tdCls}>
                      <button
                        type="button"
                        onClick={() => {
                          if (r.kind === "입금" && r.depositRecords) {
                            setDepositModal({
                              title: `${r.content} · ${formatDate(r.date)} 입금내역`,
                              deposits: r.depositRecords,
                            });
                          } else if (r.kind === "출금" && r.withdrawalRecord) {
                            setWithdrawalModal({
                              title: `${r.content} · ${formatDate(r.date)} 지출내역`,
                              withdrawals: [r.withdrawalRecord],
                            });
                          }
                        }}
                        className="rounded-lg px-2 py-1 text-xs font-medium hover:bg-white"
                        style={{ color: "#534AB7" }}
                      >
                        수정
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="영수증 확대"
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
          />
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
