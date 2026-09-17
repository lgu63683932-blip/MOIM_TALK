"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/lib/AdminContext";
import AdminLoginModal from "@/components/AdminLoginModal";

export default function SettingsPage() {
  const { isAdmin } = useAdmin();
  const [defaultAmount, setDefaultAmount] = useState<number | "">("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("settings")
        .select("key, value")
        .in("key", ["default_deposit_amount"]);
      const amountRow = data?.find((r) => r.key === "default_deposit_amount");
      if (amountRow) setDefaultAmount(Number(amountRow.value));
      setLoading(false);
    }
    load();
  }, []);

  async function handleSaveAmount(e: React.FormEvent) {
    e.preventDefault();
    if (defaultAmount === "") return;
    setError("");
    setMessage("");
    const { error: updateError } = await supabase
      .from("settings")
      .update({ value: String(defaultAmount) })
      .eq("key", "default_deposit_amount");
    if (updateError) {
      setError("저장에 실패했습니다: " + updateError.message);
      return;
    }
    setMessage("회비 기본값이 저장되었습니다.");
  }

  async function handleChangePin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (pin.length < 4) {
      setError("핀번호는 4자리 이상 입력해주세요.");
      return;
    }
    if (pin !== pinConfirm) {
      setError("핀번호가 서로 일치하지 않습니다.");
      return;
    }
    const { error: updateError } = await supabase
      .from("settings")
      .update({ value: pin })
      .eq("key", "admin_pin");
    if (updateError) {
      setError("저장에 실패했습니다: " + updateError.message);
      return;
    }
    setPin("");
    setPinConfirm("");
    setMessage("관리자 핀번호가 변경되었습니다.");
  }

  if (!isAdmin) {
    return (
      <div className="space-y-4 rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">설정</h1>
        <p className="text-sm text-gray-500">
          설정 변경은 총무만 가능합니다. 먼저 총무로 로그인해주세요.
        </p>
        <button
          onClick={() => setShowLogin(true)}
          className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          총무 로그인
        </button>
        {showLogin && <AdminLoginModal onClose={() => setShowLogin(false)} />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">설정</h1>

      {message && <p className="text-sm text-emerald-600">{message}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <form
        onSubmit={handleSaveAmount}
        className="space-y-3 rounded-2xl bg-white p-5 shadow-sm"
      >
        <h2 className="font-bold text-gray-900">회비 기본값</h2>
        <p className="text-sm text-gray-400">
          입금 등록 시 금액란에 자동으로 채워지는 기본 회비 금액입니다.
        </p>
        {loading ? (
          <p className="text-sm text-gray-400">불러오는 중...</p>
        ) : (
          <div className="flex gap-2">
            <input
              type="number"
              value={defaultAmount}
              onChange={(e) =>
                setDefaultAmount(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              저장
            </button>
          </div>
        )}
      </form>

      <form
        onSubmit={handleChangePin}
        className="space-y-3 rounded-2xl bg-white p-5 shadow-sm"
      >
        <h2 className="font-bold text-gray-900">관리자 핀번호 변경</h2>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="새 핀번호"
            className="rounded-lg border border-gray-300 px-3 py-2 text-center tracking-widest focus:border-blue-500 focus:outline-none"
          />
          <input
            type="password"
            inputMode="numeric"
            value={pinConfirm}
            onChange={(e) => setPinConfirm(e.target.value)}
            placeholder="새 핀번호 확인"
            className="rounded-lg border border-gray-300 px-3 py-2 text-center tracking-widest focus:border-blue-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700"
        >
          핀번호 변경
        </button>
      </form>
    </div>
  );
}
