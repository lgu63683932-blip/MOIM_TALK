"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { useAdmin } from "@/lib/AdminContext";

export default function AdminLoginModal({ onClose }: { onClose: () => void }) {
  const { loginWithPin } = useAdmin();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const ok = await loginWithPin(pin);
    setLoading(false);
    if (ok) {
      onClose();
    } else {
      setError("핀번호가 올바르지 않습니다.");
    }
  }

  return (
    <Modal title="총무 로그인" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            관리자 핀번호
          </label>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-lg tracking-widest focus:border-blue-500 focus:outline-none"
            placeholder="••••"
          />
          {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
        <button
          type="submit"
          disabled={loading || !pin}
          className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "확인 중..." : "로그인"}
        </button>
      </form>
    </Modal>
  );
}
