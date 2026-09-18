"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatWon } from "@/lib/format";
import type { Deposit, Member } from "@/lib/types";

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

export default function DuesPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    async function load() {
      const [{ data: memberData }, { data: depositData }] = await Promise.all([
        supabase.from("members").select("*").order("created_at"),
        supabase.from("deposits").select("*").eq("type", "회비"),
      ]);
      setMembers((memberData ?? []) as Member[]);
      setDeposits((depositData ?? []) as Deposit[]);
      setLoading(false);
    }
    load();
  }, []);

  const years = useMemo(() => {
    const set = new Set<number>();
    set.add(new Date().getFullYear());
    deposits.forEach((d) => set.add(Number(d.month.slice(0, 4))));
    return Array.from(set).sort((a, b) => b - a);
  }, [deposits]);

  const months = useMemo(() => monthsForYear(year), [year]);

  const table = useMemo(() => {
    const map = new Map<string, Map<string, { amount: number; count: number }>>();
    for (const m of members) map.set(m.id, new Map());

    for (const d of deposits) {
      if (!months.includes(d.month)) continue;
      const memberMap = map.get(d.member_id);
      if (!memberMap) continue;
      const existing = memberMap.get(d.month);
      if (existing) {
        existing.amount += d.amount;
        existing.count += 1;
      } else {
        memberMap.set(d.month, { amount: d.amount, count: 1 });
      }
    }
    return map;
  }, [members, deposits, months]);

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

      {!loading && members.length > 0 && months.length > 0 && (
        <div className="overflow-x-auto rounded-2xl bg-white p-5 shadow-sm">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-400">
                <th className="sticky left-0 bg-white py-2 pr-3 font-medium">
                  이름
                </th>
                {months.map((m) => (
                  <th key={m} className="px-2 py-2 text-center font-medium">
                    {monthShortLabel(m)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b border-gray-50">
                  <td className="sticky left-0 bg-white py-2 pr-3 font-medium text-gray-800">
                    {member.name}
                  </td>
                  {months.map((m) => {
                    const cell = table.get(member.id)?.get(m);
                    return (
                      <td key={m} className="px-2 py-2 text-center">
                        {cell ? (
                          <span className="inline-flex flex-col items-center rounded-lg bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600">
                            {formatWon(cell.amount)}
                            {cell.count > 1 && (
                              <span className="text-[10px] text-blue-400">
                                {cell.count}건
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="inline-block rounded-lg bg-rose-50 px-2 py-1 text-xs font-medium text-rose-400">
                            미납
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
