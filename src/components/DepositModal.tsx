"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { supabase } from "@/lib/supabase";
import { currentMonth, monthChipLabel, recentMonths, todayStr } from "@/lib/format";
import type { DepositType, Member } from "@/lib/types";

export default function DepositModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [amount, setAmount] = useState(20000);
  const [date, setDate] = useState(todayStr());
  const [type, setType] = useState<DepositType>("회비");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const monthOptions = recentMonths(12);
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(
    () => new Set([currentMonth()])
  );

  useEffect(() => {
    async function load() {
      const [{ data: memberData }, { data: settingData }] = await Promise.all([
        supabase.from("members").select("*").order("name"),
        supabase
          .from("settings")
          .select("value")
          .eq("key", "default_deposit_amount")
          .single(),
      ]);
      if (memberData) setMembers(memberData);
      if (settingData) setAmount(Number(settingData.value));
    }
    load();
  }, []);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleMonth(m: string) {
    setSelectedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.size === 0) {
      setError("입금자를 한 명 이상 선택해주세요.");
      return;
    }
    if (selectedMonths.size === 0) {
      setError("적용할 월을 한 개 이상 선택해주세요.");
      return;
    }
    setSaving(true);
    setError("");

    const rows = Array.from(selected).flatMap((member_id) =>
      Array.from(selectedMonths).map((month) => ({
        member_id,
        amount,
        paid_date: date,
        type,
        month,
      }))
    );

    const { error: insertError } = await supabase.from("deposits").insert(rows);
    setSaving(false);

    if (insertError) {
      setError("저장에 실패했습니다: " + insertError.message);
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <Modal title="입금 등록" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            입금자 선택
          </label>
          {members.length === 0 ? (
            <p className="text-sm text-gray-400">
              등록된 친구가 없습니다. 친구 관리에서 먼저 등록해주세요.
            </p>
          ) : (
            <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-gray-200 p-2">
              {members.map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${
                    selected.has(m.id)
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(m.id)}
                    onChange={() => toggle(m.id)}
                    className="h-4 w-4"
                  />
                  {m.name}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              금액 (1인당)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              구분
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as DepositType)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            >
              <option value="회비">회비</option>
              <option value="은행이자">은행이자</option>
              <option value="기타">기타</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            입금일자 <span className="font-normal text-gray-400">(실제 입금한 날)</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            적용 월{" "}
            <span className="font-normal text-gray-400">
              (여러 달 치를 한 번에 낸 경우 여러 개 선택)
            </span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {monthOptions.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => toggleMonth(m)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  selectedMonths.has(m)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {monthChipLabel(m)}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving
            ? "저장 중..."
            : `${selected.size || 0}명 × ${selectedMonths.size || 0}개월 입금 등록`}
        </button>
      </form>
    </Modal>
  );
}
