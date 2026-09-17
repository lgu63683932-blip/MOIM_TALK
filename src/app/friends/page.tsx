"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/lib/AdminContext";
import { formatDate } from "@/lib/format";
import type { Member } from "@/lib/types";

export default function FriendsPage() {
  const { isAdmin } = useAdmin();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("members").select("*").order("created_at");
    setMembers((data ?? []) as Member[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    setError("");
    const { error: insertError } = await supabase
      .from("members")
      .insert({ name: newName.trim() });
    setSaving(false);
    if (insertError) {
      setError("추가에 실패했습니다: " + insertError.message);
      return;
    }
    setNewName("");
    load();
  }

  async function handleUpdate(id: string) {
    if (!editingName.trim()) return;
    const { error: updateError } = await supabase
      .from("members")
      .update({ name: editingName.trim() })
      .eq("id", id);
    if (updateError) {
      setError("수정에 실패했습니다: " + updateError.message);
      return;
    }
    setEditingId(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("이 친구를 삭제하시겠습니까? 관련 입금 내역도 함께 삭제됩니다.")) return;
    const { error: deleteError } = await supabase.from("members").delete().eq("id", id);
    if (deleteError) {
      setError("삭제에 실패했습니다: " + deleteError.message);
      return;
    }
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">친구 관리</h1>

      {isAdmin && (
        <form onSubmit={handleAdd} className="flex gap-2 rounded-2xl bg-white p-4 shadow-sm">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="새 친구 이름"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={saving || !newName.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            추가
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        {loading && <p className="text-sm text-gray-400">불러오는 중...</p>}
        {!loading && members.length === 0 && (
          <p className="text-sm text-gray-400">등록된 친구가 없습니다.</p>
        )}
        <ul className="divide-y divide-gray-100">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between py-3">
              {editingId === m.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => handleUpdate(m.id)}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <p className="font-medium text-gray-800">{m.name}</p>
                    <p className="text-xs text-gray-400">
                      등록일 {formatDate(m.created_at)}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(m.id);
                          setEditingName(m.name);
                        }}
                        className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-500 hover:bg-rose-100"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      {!isAdmin && (
        <p className="text-center text-xs text-gray-400">
          친구 등록/수정/삭제는 총무만 가능합니다. 상단의 &apos;총무 로그인&apos;을 이용해주세요.
        </p>
      )}
    </div>
  );
}
