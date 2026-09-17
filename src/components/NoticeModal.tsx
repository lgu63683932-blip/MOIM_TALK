"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { supabase } from "@/lib/supabase";
import type { NoticeTag } from "@/lib/types";

export default function NoticeModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tag, setTag] = useState<NoticeTag>("일반");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!author || !title || !content) {
      setError("작성자, 제목, 내용을 모두 입력해주세요.");
      return;
    }
    setSaving(true);
    setError("");

    const { error: insertError } = await supabase.from("notices").insert({
      author,
      title,
      content,
      tag,
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
    <Modal title="공지 작성" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              작성자
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="이름"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              태그
            </label>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value as NoticeTag)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            >
              <option value="일반">일반</option>
              <option value="중요">중요</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            제목
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            내용
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "저장 중..." : "공지 등록"}
        </button>
      </form>
    </Modal>
  );
}
