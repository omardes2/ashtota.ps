"use client";
import Link from "next/link";
import { useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import { useBranchStore } from "@/store/useBranchStore";
import { useHydrated } from "@/lib/useHydrated";
import { getBranch } from "@/data/branches";
import CartItemRow from "@/components/cart/CartItemRow";
import OrderSummary from "@/components/cart/OrderSummary";
import EmptyState from "@/components/shared/EmptyState";
import { formatPrice } from "@/lib/currency";

export default function CartPage() {
  const hydrated = useHydrated();
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const subtotal = items.reduce((a, i) => a + i.unitPrice * i.qty, 0);
  const branch = getBranch(useBranchStore((s) => s.branchId));
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(0);

  function applyCode() {
    if (code.trim().toUpperCase() === "WELCOME20") {
      setDiscount(Math.round(subtotal * 0.2));
    } else {
      setDiscount(0);
      alert("كود الخصم غير صالح");
    }
  }

  if (!hydrated) return <div className="container-p py-10 text-center text-gray-400">…</div>;

  if (items.length === 0) {
    return (
      <div className="container-p">
        <EmptyState emoji="🛒" title="سلة المشتريات فارغة" subtitle="أضف بعض الحلويات اللذيذة لتبدأ طلبك" actionLabel="تصفّح المنتجات" actionHref="/products" />
      </div>
    );
  }

  const deliveryFee = branch?.deliveryFeeFrom ?? 0;

  return (
    <div className="container-p py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-black text-ink">سلة المشتريات</h1>
        <button onClick={clear} className="text-sm font-bold text-red-500 hover:underline">تفريغ السلة</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {items.map((it) => (
            <CartItemRow key={it.key} item={it} />
          ))}
        </div>

        <div className="space-y-3">
          <div className="card p-4">
            <div className="mb-3 flex gap-2">
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="كود الخصم" className="w-full rounded-full border-2 border-cloud px-4 py-2 text-sm outline-none focus:border-brand-light" />
              <button onClick={applyCode} className="btn-ghost">تطبيق</button>
            </div>
            <OrderSummary subtotal={subtotal} discount={discount} deliveryFee={deliveryFee} />
            <Link href="/checkout" className="btn-primary mt-4 w-full">متابعة الطلب</Link>
            <Link href="/products" className="mt-2 block text-center text-sm font-bold text-brand hover:underline">أضف المزيد</Link>
          </div>
          {branch && subtotal < branch.minOrder && (
            <p className="rounded-xl2 bg-accent/15 p-3 text-center text-sm font-bold text-amber-700">
              الحد الأدنى للطلب في {branch.name} هو {formatPrice(branch.minOrder)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
