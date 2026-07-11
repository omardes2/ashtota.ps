"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { useHydrated } from "@/lib/useHydrated";
import { formatPrice } from "@/lib/currency";

export default function MobileCartBar() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const items = useCartStore((s) => s.items);
  const count = items.reduce((a, i) => a + i.qty, 0);
  const subtotal = items.reduce((a, i) => a + i.unitPrice * i.qty, 0);

  // لا يظهر في صفحتي السلة والدفع
  const hidden = pathname?.startsWith("/cart") || pathname?.startsWith("/checkout");

  if (!hydrated || count === 0 || hidden) return null;

  return (
    <div className="fixed inset-x-0 bottom-16 z-30 px-3 md:hidden">
      <Link
        href="/cart"
        className="flex items-center gap-3 rounded-full bg-brand px-4 py-3 text-white shadow-lift"
      >
        <span className="grid h-7 min-w-7 place-items-center rounded-full bg-white px-2 text-sm font-black text-brand">
          {count}
        </span>
        <span className="font-extrabold">عرض السلة</span>
        <span className="mr-auto font-black">{formatPrice(subtotal)}</span>
      </Link>
    </div>
  );
}
