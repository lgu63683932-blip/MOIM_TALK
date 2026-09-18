"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";

export type SortState = { col: string; dir: "asc" | "desc" } | null;

const ACCENT = "#534AB7";

function SortIcon({ col, sort }: { col: string; sort: SortState }) {
  if (sort?.col !== col)
    return <span className="text-gray-300 text-[10px]">⇅</span>;
  return (
    <span className="text-[10px]" style={{ color: ACCENT }}>
      {sort.dir === "asc" ? "↑" : "↓"}
    </span>
  );
}

export function ColumnHeader({
  label,
  sortCol,
  sort,
  onSort,
  options,
  selected,
  onChange,
  align = "left",
}: {
  label: string;
  sortCol?: string;
  sort?: SortState;
  onSort?: () => void;
  options?: string[];
  selected?: string[];
  onChange?: (v: string[]) => void;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(selected ?? []);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, alignRight: false });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) setDraft(selected ?? []);
  }, [selected, open]);

  function openMenu(e: React.MouseEvent) {
    e.stopPropagation();
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      const alignRight = r.left + 180 > window.innerWidth;
      setMenuPos({
        top: r.bottom + 4,
        left: alignRight ? r.right : r.left,
        alignRight,
      });
    }
    setDraft(selected ?? []);
    setOpen((p) => !p);
  }

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function toggle(opt: string) {
    if (opt === "__all__") {
      setDraft([]);
      return;
    }
    setDraft((prev) =>
      prev.includes(opt) ? prev.filter((s) => s !== opt) : [...prev, opt]
    );
  }

  function apply() {
    onChange?.(draft);
    setOpen(false);
  }

  function reset() {
    setDraft([]);
    onChange?.([]);
    setOpen(false);
  }

  const isActive = (selected?.length ?? 0) > 0;
  const isAllDraft = draft.length === 0;

  return (
    <span
      className={`inline-flex items-center gap-0.5 cursor-pointer select-none ${
        align === "right" ? "justify-end w-full" : ""
      }`}
    >
      <span className="whitespace-nowrap" onClick={onSort}>
        {label}
      </span>
      {sortCol && (
        <span onClick={onSort}>
          <SortIcon col={sortCol} sort={sort ?? null} />
        </span>
      )}
      {options && (
        <button
          ref={triggerRef}
          type="button"
          onClick={openMenu}
          className="text-[9px] px-0.5 ml-0.5 leading-none transition-colors flex-shrink-0"
          style={{ color: isActive ? ACCENT : "#d1d5db" }}
        >
          ▼
        </button>
      )}
      {isActive && (
        <span
          className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-white text-[8px] font-bold"
          style={{ backgroundColor: ACCENT }}
        >
          {selected!.length}
        </span>
      )}
      {open &&
        options &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: menuPos.top,
              ...(menuPos.alignRight
                ? { right: window.innerWidth - menuPos.left }
                : { left: menuPos.left }),
              zIndex: 9999,
              width: 180,
            }}
            className="bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 flex flex-col"
          >
            <div className="overflow-y-auto" style={{ maxHeight: 260 }}>
              <label
                className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-50 rounded-md mx-1"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={isAllDraft}
                  onChange={() => toggle("__all__")}
                  className="w-3.5 h-3.5 rounded"
                  style={{ accentColor: ACCENT }}
                />
                <span
                  className="text-[13px]"
                  style={{
                    color: isAllDraft ? ACCENT : "#374151",
                    fontWeight: isAllDraft ? 600 : 400,
                  }}
                >
                  전체
                </span>
              </label>
              <div className="border-t border-gray-100 my-1" />
              {options.length === 0 ? (
                <p className="px-3 py-2 text-[12px] text-gray-400 text-center">
                  값 없음
                </p>
              ) : (
                options.map((opt) => (
                  <label
                    key={opt}
                    className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-50 rounded-md mx-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={draft.includes(opt)}
                      onChange={() => toggle(opt)}
                      className="w-3.5 h-3.5 rounded"
                      style={{ accentColor: ACCENT }}
                    />
                    <span
                      className="text-[13px] truncate"
                      style={{
                        color: draft.includes(opt) ? ACCENT : "#374151",
                        fontWeight: draft.includes(opt) ? 600 : 400,
                      }}
                    >
                      {opt}
                    </span>
                  </label>
                ))
              )}
            </div>
            <div className="border-t border-gray-100 mt-1.5 pt-1.5 px-2 pb-0.5 flex gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  apply();
                }}
                className="flex-1 py-1 text-[12px] text-white rounded-lg font-medium transition-colors"
                style={{ backgroundColor: ACCENT }}
              >
                적용
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  reset();
                }}
                className="flex-1 py-1 text-[12px] border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                초기화
              </button>
            </div>
          </div>,
          document.body
        )}
    </span>
  );
}
