"use client";
import Link from "next/link";
import Logo from "@/components/shared/Logo";
import { useUiStore } from "@/store/useUiStore";

export default function MobileMenu({
  open,
  onClose,
  nav,
}: {
  open: boolean;
  onClose: () => void;
  nav: { href: string; label: string }[];
}) {
  const openBranchModal = useUiStore((s) => s.openBranchModal);
  return (
    <div
      className={`fixed inset-0 z-50 md:hidden ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-ink/50 transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-72 max-w-[80%] flex-col gap-2 bg-white p-4 shadow-lift transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <Logo />
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="grid h-9 w-9 place-items-center rounded-full bg-cloud text-lg"
          >
            ✕
          </button>
        </div>
        <button
          onClick={() => {
            onClose();
            openBranchModal();
          }}
          className="btn-ghost mt-2 justify-start"
        >
          📍 اختيار / تغيير الفرع
        </button>
        <nav className="mt-2 flex flex-col">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={onClose}
              className="rounded-xl px-3 py-3 font-bold text-ink transition hover:bg-cloud"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>
    </div>
  );
}
