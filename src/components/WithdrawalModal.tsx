"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { supabase } from "@/lib/supabase";
import { todayStr } from "@/lib/format";

export default function WithdrawalModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [content, setContent] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [date, setDate] = useState(todayStr());
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content || !amount) {
      setError("지출내용과 금액을 입력해주세요.");
      return;
    }
    setSaving(true);
    setError("");

    let receiptUrl: string | null = null;

    if (file) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(path, file);

      if (uploadError) {
        setSaving(false);
        setError("영수증 업로드에 실패했습니다: " + uploadError.message);
        return;
      }
      const { data: publicUrlData } = supabase.storage
        .from("receipts")
        .getPublicUrl(path);
      receiptUrl = publicUrlData.publicUrl;
    }

    const month = date.slice(0, 7);
    const { error: insertError } = await supabase.from("withdrawals").insert({
      content,
      amount,
      spent_date: date,
      receipt_image_url: receiptUrl,
      month,
    });

    setSaving(false);

    if (insertError) {
      setError("저장에 실패했습니다: " + insertError.message);
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <Modal title="출금 등록" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            지출내용
          </label>
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="예: 펜션비"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              금액
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              지출일자
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            영수증 첨부
          </label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm"
          />
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="영수증 미리보기"
              className="mt-2 max-h-48 rounded-lg border border-gray-200 object-contain"
            />
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-red-500 py-2.5 font-medium text-white hover:bg-red-600 disabled:opacity-50"
        >
          {saving ? "저장 중..." : "출금 등록"}
        </button>
      </form>
    </Modal>
  );
}
