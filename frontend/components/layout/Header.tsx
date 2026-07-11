"use client";
import Link from "next/link";
import { useState } from "react";
import Logo from "@/components/shared/Logo";
import MobileMenu from "@/components/layout/MobileMenu";
import { useBranchStore } from "@/store/useBranchStore";
import { useCartStore } from "@/store/useCartStore";
import { useUiStore } from "@/store/useUiStore";
import { useHydrated } from "@/lib/useHydrated";
import { useMenuStore } from "@/store/useMenuStore";

const NAV = [
  { href: "/", label: "الرئيسية" },
  { href: "/products", label: "المنتجات" },
  { href: "/offers", label: "العروض" },
  { href: "/branches", label: "الفروع" },
  { href: "/about", label: "من نحن" },
  { href: "/contact", label: "تواصل معنا" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const hydrated = useHydrated();
  const branchId = useBranchStore((s) => s.branchId);
  const count = useCartStore((s) => s.items.reduce((a, i) => a + i.qty, 0));
  const openBranchModal = useUiStore((s) => s.openBranchModal);
  const branch = useMenuStore((s) => s.branches.find((b) => b.id === branchId));

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-cloud bg-white/90 backdrop-blur">
        <div className="container-p flex h-16 items-center gap-3">
          {/* موبايل: قائمة */}
          <button
            className="grid h-10 w-10 place-items-center rounded-xl bg-cloud text-xl text-brand-dark md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="القائمة"
          >
            ☰
          </button>

          <Logo />

          {/* روابط سطح المكتب */}
          <nav className="mx-auto hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="rounded-full px-3 py-2 text-sm font-bold text-ink transition hover:bg-cloud hover:text-brand"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          {/* اختيار الفرع */}
          <button
            onClick={openBranchModal}
            className="hidden items-center gap-1 rounded-full bg-cloud px-3 py-2 text-sm font-bold text-brand-dark md:inline-flex"
          >
            <span aria-hidden="true">📍</span>
            <span className="max-w-28 truncate">
              {hydrated && branch ? branch.name : "اختر الفرع"}
            </span>
            <span aria-hidden="true">▾</span>
          </button>

          {/* أيقونات */}
          <div className="mr-auto flex items-center gap-1 md:mr-0">
            <Link
              href="/products"
              aria-label="بحث"
              className="grid h-10 w-10 place-items-center rounded-xl text-lg text-ink transition hover:bg-cloud"
            >
              🔍
            </Link>
            <Link
              href="/account"
              aria-label="حسابي"
              className="grid h-10 w-10 place-items-center rounded-xl text-lg text-ink transition hover:bg-cloud"
            >
              👤
            </Link>
            <Link
              href="/cart"
              aria-label="السلة"
              className="relative grid h-10 w-10 place-items-center rounded-xl text-lg text-ink transition hover:bg-cloud"
            >
              🛒
              {hydrated && count > 0 && (
                <span className="absolute -top-1 right-0 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-black text-ink">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* شريط الفرع للموبايل */}
        <button
          onClick={openBranchModal}
          className="flex w-full items-center justify-center gap-1 bg-brand/5 py-1.5 text-xs font-bold text-brand-dark md:hidden"
        >
          <span aria-hidden="true">📍</span>
          {hydrated && branch ? `تطلب من: ${branch.name}` : "اضغط لاختيار الفرع"}
        </button>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} nav={NAV} />
    </>
  );
}
