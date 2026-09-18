"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAdmin } from "@/lib/AdminContext";
import AdminLoginModal from "@/components/AdminLoginModal";

const NAV_ITEMS = [
  { href: "/", label: "대시보드" },
  { href: "/history", label: "내역보기" },
  { href: "/dues", label: "회비 현황" },
  { href: "/friends", label: "친구 관리" },
  { href: "/settings", label: "설정" },
];

export default function NavBar() {
  const pathname = usePathname();
  const { isAdmin, logout } = useAdmin();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10 xl:px-14">
        <Link href="/" className="flex items-center gap-2">
          <div className="leading-tight">
            <div className="text-sm font-bold text-gray-900">
              친구 모임계
            </div>
            <div className="text-[11px] text-gray-400">함께하는 회비 관리</div>
          </div>
        </Link>

        <nav className="hidden gap-1 sm:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                pathname === item.href
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAdmin ? (
            <button
              onClick={logout}
              className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
            >
              총무 모드 · 로그아웃
            </button>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              총무 로그인
            </button>
          )}
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-gray-100 px-4 py-2 sm:hidden">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium ${
              pathname === item.href
                ? "bg-blue-50 text-blue-600"
                : "text-gray-600"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {showLogin && <AdminLoginModal onClose={() => setShowLogin(false)} />}
    </header>
  );
}
