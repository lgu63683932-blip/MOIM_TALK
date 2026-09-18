"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { supabase } from "@/lib/supabase";
import type { Withdrawal } from "@/lib/types";

function WithdrawalRow({
  withdrawal,
  onChanged,
}: {
  withdrawal: Withdrawal;
  onChanged: () => void;
}) {
  const [content, setContent] = useState(withdrawal.content);
  const [amount, setAmount] = useState(withdrawal.amount);
  const [date, setDate] = useState(withdrawal.spent_date);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    const { error: updateError } = await supabase
      .from("withdrawals")
      .update({ content, amount, spent_date: date })
      .eq("id", withdrawal.id);
    setSaving(false);
    if (updateError) {
      setError("저장 실패: " + updateError.message);
      return;
    }
    onChanged();
  }

  async function handleDelete() {
    if (!confirm("이 지출 내역을 삭제하시겠습니까?")) return;
    setSaving(true);
    setError("");
    const { error: deleteError } = await supabase
      .from("withdrawals")
      .delete()
      .eq("id", withdrawal.id);
    setSaving(false);
    if (deleteError) {
      setError("삭제 실패: " + deleteError.message);
      return;
    }
    onChanged();
  }

  return (
    <div className="space-y-2 rounded-lg border border-gray-200 p-3">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
      />
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
      {withdrawal.receipt_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={withdrawal.receipt_image_url}
          alt="영수증"
          className="h-24 rounded-lg border border-gray-200 object-contain"
        />
      )}
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

export default function WithdrawalCellModal({
  title,
  withdrawals,
  onClose,
  onChanged,
}: {
  title: string;
  withdrawals: Withdrawal[];
  onClose: () => void;
  onChanged: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-3">
        {withdrawals.length === 0 ? (
          <p className="text-sm text-gray-400">등록된 지출 내역이 없습니다.</p>
        ) : (
          withdrawals.map((w) => (
            <WithdrawalRow key={w.id} withdrawal={w} onChanged={onChanged} />
          ))
        )}
      </div>
    </Modal>
  );
}
