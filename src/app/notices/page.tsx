"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/format";
import type { Notice } from "@/lib/types";
import NoticeModal from "@/components/NoticeModal";

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotice, setShowNotice] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("notices")
      .select("*")
      .order("created_at", { ascending: false });
    setNotices((data ?? []) as Notice[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">공지사항</h1>
        <button
          onClick={() => setShowNotice(true)}
          className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          + 공지 작성
        </button>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        {loading && <p className="text-sm text-gray-400">불러오는 중...</p>}
        {!loading && notices.length === 0 && (
          <p className="text-sm text-gray-400">등록된 공지사항이 없습니다.</p>
        )}
        <ul className="divide-y divide-gray-100">
          {notices.map((n) => (
            <li key={n.id} className="py-3">
              <button
                onClick={() => setOpenId(openId === n.id ? null : n.id)}
                className="flex w-full items-center gap-2 text-left"
              >
                <span
                  className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                    n.tag === "중요"
                      ? "bg-rose-100 text-rose-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {n.tag}
                </span>
                <span className="flex-1 truncate text-sm font-medium text-gray-800">
                  {n.title}
                </span>
                <span className="shrink-0 text-xs text-gray-400">
                  {n.author} · {formatDate(n.created_date)}
                </span>
              </button>
              {openId === n.id && (
                <p className="mt-2 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                  {n.content}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>

      {showNotice && (
        <NoticeModal onClose={() => setShowNotice(false)} onSaved={load} />
      )}
    </div>
  );
}
