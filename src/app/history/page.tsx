"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDate, formatMonthLabel, formatWon } from "@/lib/format";
import type { Deposit, Withdrawal } from "@/lib/types";

type Row =
  | { kind: "입금"; id: string; date: string; label: string; sub: string; amount: number }
  | {
      kind: "출금";
      id: string;
      date: string;
      label: string;
      sub: string;
      amount: number;
      receiptUrl: string | null;
    };

export default function HistoryPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<string>("전체");
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [{ data: d }, { data: w }] = await Promise.all([
        supabase
          .from("deposits")
          .select("*, member:members(*)")
          .order("paid_date", { ascending: false }),
        supabase
          .from("withdrawals")
          .select("*")
          .order("spent_date", { ascending: false }),
      ]);
      setDeposits((d ?? []) as Deposit[]);
      setWithdrawals((w ?? []) as Withdrawal[]);
      setLoading(false);
    }
    load();
  }, []);

  const years = useMemo(() => {
    const set = new Set<string>();
    deposits.forEach((d) => set.add(d.month.slice(0, 4)));
    withdrawals.forEach((w) => set.add(w.month.slice(0, 4)));
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [deposits, withdrawals]);

  const monthGroups = useMemo(() => {
    const groups = new Map<string, Row[]>();

    for (const d of deposits) {
      if (year !== "전체" && !d.month.startsWith(year)) continue;
      const arr = groups.get(d.month) ?? [];
      arr.push({
        kind: "입금",
        id: d.id,
        date: d.paid_date,
        label: d.member?.name ?? "알 수 없음",
        sub: d.type,
        amount: d.amount,
      });
      groups.set(d.month, arr);
    }

    for (const w of withdrawals) {
      if (year !== "전체" && !w.month.startsWith(year)) continue;
      const arr = groups.get(w.month) ?? [];
      arr.push({
        kind: "출금",
        id: w.id,
        date: w.spent_date,
        label: w.content,
        sub: "",
        amount: w.amount,
        receiptUrl: w.receipt_image_url,
      });
      groups.set(w.month, arr);
    }

    return Array.from(groups.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([month, rows]) => ({
        month,
        rows: rows.sort((a, b) => (a.date < b.date ? 1 : -1)),
        depositTotal: rows
          .filter((r) => r.kind === "입금")
          .reduce((s, r) => s + r.amount, 0),
        withdrawalTotal: rows
          .filter((r) => r.kind === "출금")
          .reduce((s, r) => s + r.amount, 0),
      }));
  }, [deposits, withdrawals, year]);

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
      {!loading && monthGroups.length === 0 && (
        <p className="text-sm text-gray-400">등록된 내역이 없습니다.</p>
      )}

      {monthGroups.map((group) => (
        <section key={group.month} className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold text-gray-900">
              {formatMonthLabel(group.month)}
            </h2>
            <div className="flex gap-3 text-xs">
              <span className="text-blue-600">
                입금 {formatWon(group.depositTotal)}
              </span>
              <span className="text-rose-500">
                지출 {formatWon(group.withdrawalTotal)}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-400">
                  <th className="py-2 font-medium">날짜</th>
                  <th className="py-2 font-medium">구분</th>
                  <th className="py-2 font-medium">내용</th>
                  <th className="py-2 text-right font-medium">금액</th>
                  <th className="py-2 text-center font-medium">영수증</th>
                </tr>
              </thead>
              <tbody>
                {group.rows.map((r) => (
                  <tr key={`${r.kind}-${r.id}`} className="border-b border-gray-50">
                    <td className="py-2 text-gray-500">{formatDate(r.date)}</td>
                    <td className="py-2">
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
                    <td className="py-2 text-gray-700">
                      {r.label}
                      {r.sub && (
                        <span className="ml-1 text-xs text-gray-400">
                          ({r.sub})
                        </span>
                      )}
                    </td>
                    <td
                      className={`py-2 text-right font-semibold ${
                        r.kind === "입금" ? "text-blue-600" : "text-rose-500"
                      }`}
                    >
                      {r.kind === "입금" ? "+" : "-"}
                      {formatWon(r.amount)}
                    </td>
                    <td className="py-2 text-center">
                      {r.kind === "출금" && r.receiptUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.receiptUrl}
                          alt="영수증"
                          onClick={() => setLightbox(r.receiptUrl)}
                          className="mx-auto h-10 w-10 cursor-pointer rounded object-cover ring-1 ring-gray-200 hover:ring-blue-400"
                        />
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

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
    </div>
  );
}
