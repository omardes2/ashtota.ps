"use client";
import { useEffect } from "react";
import { useUiStore } from "@/store/useUiStore";

export default function Toast() {
  const toast = useUiStore((s) => s.toast);
  const clear = useUiStore((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clear, 2400);
    return () => clearTimeout(t);
  }, [toast, clear]);

  if (!toast) return null;

  const color =
    toast.type === "error"
      ? "bg-red-500"
      : toast.type === "info"
      ? "bg-brand-dark"
      : "bg-brand";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[90] flex justify-center px-4 md:bottom-8">
      <div
        role="status"
        className={`animate-pop-in rounded-full px-6 py-3 font-bold text-white shadow-lift ${color}`}
      >
        {toast.message}
      </div>
    </div>
  );
}
