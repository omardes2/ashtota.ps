"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useHydrated } from "@/lib/useHydrated";
import { products } from "@/data/products";
import { formatPrice } from "@/lib/currency";
import ProductGrid from "@/components/products/ProductGrid";
import EmptyState from "@/components/shared/EmptyState";

export default function AccountPage() {
  const hydrated = useHydrated();
  const wishIds = useWishlistStore((s) => s.ids);
  const [user, setUser] = useState<{ name?: string; phone?: string } | null>(null);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [tab, setTab] = useState<"orders" | "wishlist">("orders");

  useEffect(() => {
    try {
      const u = localStorage.getItem("qashtoota-user");
      if (u) setUser(JSON.parse(u));
      const o = localStorage.getItem("qashtoota-last-order");
      if (o) setLastOrder(JSON.parse(o));
    } catch {}
  }, []);

  const wished = products.filter((p) => wishIds.includes(p.id));

  if (!hydrated) return <div className="container-p py-10 text-center text-gray-400">…</div>;

  if (!user) {
    return (
      <div className="container-p">
        <EmptyState emoji="👤" title="لم تسجّل الدخول بعد" subtitle="سجّل الدخول لعرض حسابك وطلباتك" actionLabel="تسجيل الدخول" actionHref="/login" />
      </div>
    );
  }

  return (
    <div className="container-p py-6">
      <div className="mb-5 flex items-center gap-4 rounded-xl2 bg-gradient-to-l from-brand to-brand-dark p-5 text-white">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-white/20 text-3xl">👤</span>
        <div>
          <h1 className="text-xl font-black">{user.name || "عميل قشطوطة"}</h1>
          <p className="text-white/80" dir="ltr">{user.phone}</p>
        </div>
        <button
          onClick={() => { localStorage.removeItem("qashtoota-user"); setUser(null); }}
          className="mr-auto rounded-full bg-white/20 px-4 py-2 text-sm font-bold hover:bg-white/30"
        >
          خروج
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        <button onClick={() => setTab("orders")} className={`chip px-4 py-2 ${tab === "orders" ? "bg-brand text-white" : "bg-white text-brand-dark shadow-card"}`}>طلباتي</button>
        <button onClick={() => setTab("wishlist")} className={`chip px-4 py-2 ${tab === "wishlist" ? "bg-brand text-white" : "bg-white text-brand-dark shadow-card"}`}>المفضلة ({wished.length})</button>
      </div>

      {tab === "orders" ? (
        lastOrder ? (
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-black text-ink">طلب {lastOrder.orderNo}</div>
                <div className="text-sm text-gray-500">{lastOrder.branchName} · {lastOrder.mode === "pickup" ? "استلام" : "توصيل"}</div>
              </div>
              <div className="text-left">
                <div className="font-black text-brand">{formatPrice(lastOrder.total)}</div>
                <Link href="/track-order" className="text-sm font-bold text-brand hover:underline">تتبع الطلب</Link>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState emoji="🧾" title="لا توجد طلبات بعد" subtitle="ابدأ أول طلب لك الآن" actionLabel="تصفّح المنتجات" actionHref="/products" />
        )
      ) : wished.length > 0 ? (
        <ProductGrid products={wished} />
      ) : (
        <EmptyState emoji="❤️" title="لا توجد منتجات مفضلة" subtitle="أضف منتجاتك المفضلة لتجدها هنا" actionLabel="تصفّح المنتجات" actionHref="/products" />
      )}
    </div>
  );
}
