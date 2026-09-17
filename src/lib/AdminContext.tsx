"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";

type AdminContextValue = {
  isAdmin: boolean;
  loginWithPin: (pin: string) => Promise<boolean>;
  logout: () => void;
};

const AdminContext = createContext<AdminContextValue | null>(null);

const STORAGE_KEY = "moim_is_admin";

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      setIsAdmin(sessionStorage.getItem(STORAGE_KEY) === "true");
    } catch {
      // sessionStorage unavailable, stay logged out
    }
  }, []);

  const loginWithPin = useCallback(async (pin: string) => {
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "admin_pin")
      .single();

    if (error || !data) return false;

    const ok = data.value === pin;
    if (ok) {
      setIsAdmin(true);
      try {
        sessionStorage.setItem(STORAGE_KEY, "true");
      } catch {
        // ignore
      }
    }
    return ok;
  }, []);

  const logout = useCallback(() => {
    setIsAdmin(false);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return (
    <AdminContext.Provider value={{ isAdmin, loginWithPin, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
