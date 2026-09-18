"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { supabase } from "@/lib/supabase";
import type { Deposit } from "@/lib/types";

function DepositRow({
  deposit,
  onChanged,
}: {
  deposit: Deposit;
  onChanged: () => void;
}) {
  const [amount, setAmount] = useState(deposit.amount);
  const [date, setDate] = useState(deposit.paid_date);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    const { error: updateError } = await supabase
      .from("deposits")
      .update({ amount, paid_date: date })
      .eq("id", deposit.id);
    setSaving(false);
    if (updateError) {
      setError("저장 실패: " + updateError.message);
      return;
    }
    onChanged();
  }

  async function handleDelete() {
    if (!confirm("이 입금 내역을 삭제하시겠습니까?")) return;
    setSaving(true);
    setError("");
    const { error: deleteError } = await supabase
      .from("deposits")
      .delete()
      .eq("id", deposit.id);
    setSaving(false);
    if (deleteError) {
      setError("삭제 실패: " + deleteError.message);
      return;
    }
    onChanged();
  }

  return (
    <div className="space-y-2 rounded-lg border border-gray-200 p-3">
      <div className="flex gap-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 rounded-lg bg-blue-600 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          저장
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={saving}
          className="flex-1 rounded-lg bg-rose-50 py-1.5 text-xs font-medium text-rose-500 hover:bg-rose-100 disabled:opacity-50"
        >
          삭제
        </button>
      </div>
    </div>
  );
}

export default function DepositCellModal({
  title,
  deposits,
  onClose,
  onChanged,
}: {
  title: string;
  deposits: Deposit[];
  onClose: () => void;
  onChanged: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-3">
        {deposits.length === 0 ? (
          <p className="text-sm text-gray-400">등록된 입금 내역이 없습니다.</p>
        ) : (
          deposits.map((d) => (
            <DepositRow key={d.id} deposit={d} onChanged={onChanged} />
          ))
        )}
      </div>
    </Modal>
  );
}
