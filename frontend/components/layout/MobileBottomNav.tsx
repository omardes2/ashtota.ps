"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { useHydrated } from "@/lib/useHydrated";

const ITEMS = [
  { href: "/", label: "الرئيسية", icon: "🏠" },
  { href: "/products", label: "المنتجات", icon: "🍮" },
  { href: "/account", label: "الطلبات", icon: "🧾" },
  { href: "/account", label: "المفضلة", icon: "❤️", key: "wish" },
  { href: "/account", label: "الحساب", icon: "👤", key: "acc" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const count = useCartStore((s) => s.items.reduce((a, i) => a + i.qty, 0));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-cloud bg-white/95 backdrop-blur md:hidden">
      <div className="grid grid-cols-5">
        {ITEMS.map((it, i) => {
          const active = pathname === it.href && i < 2;
          return (
            <Link
              key={i}
              href={it.href}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold ${
                active ? "text-brand" : "text-gray-500"
              }`}
            >
              <span className="relative text-xl" aria-hidden="true">
                {it.icon}
                {it.href === "/cart" && hydrated && count > 0 && (
                  <span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] text-ink">
                    {count}
                  </span>
                )}
              </span>
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
