"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import { useBranchStore } from "@/store/useBranchStore";
import { useMenuStore } from "@/store/useMenuStore";
import { useCouponStore } from "@/store/useCouponStore";
import { useUiStore } from "@/store/useUiStore";
import { useHydrated } from "@/lib/useHydrated";
import { validateCoupon } from "@/lib/api";
import CartItemRow from "@/components/cart/CartItemRow";
import OrderSummary from "@/components/cart/OrderSummary";
import EmptyState from "@/components/shared/EmptyState";
import { formatPrice } from "@/lib/currency";

const COUPON_ERRORS: Record<string, string> = {
  not_found: "كود الخصم غير صحيح",
  inactive: "كود الخصم غير مفعّل",
  expired: "انتهت صلاحية كود الخصم",
  limit_reached: "تم استنفاد عدد مرات استخدام الكود",
  empty: "أدخل كود الخصم",
  network: "تعذّر التحقق من الكود",
};

export default function CartPage() {
  const hydrated = useHydrated();
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const subtotal = items.reduce((a, i) => a + i.unitPrice * i.qty, 0);
  const branchId = useBranchStore((s) => s.branchId);
  const branch = useMenuStore((s) => s.branches.find((b) => b.id === branchId));
  const storedCode = useCouponStore((s) => s.code);
  const setStoredCode = useCouponStore((s) => s.setCode);
  const clearCoupon = useCouponStore((s) => s.clear);
  const showToast = useUiStore((s) => s.showToast);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [applying, setApplying] = useState(false);

  // مزامنة حقل الإدخال مع الكود المحفوظ
  useEffect(() => { if (storedCode) setCode(storedCode); }, [storedCode]);

  // إعادة التحقق من الكود المحفوظ عند تغيّر المجموع
  useEffect(() => {
    if (!storedCode) { setDiscount(0); return; }
    let alive = true;
    validateCoupon(storedCode, subtotal).then((r) => {
      if (!alive) return;
      setDiscount(r.ok ? r.discount || 0 : 0);
    });
    return () => { alive = false; };
  }, [storedCode, subtotal]);

  async function applyCode() {
    const c = code.trim();
    if (!c) { clearCoupon(); setDiscount(0); return; }
    setApplying(true);
    const r = await validateCoupon(c, subtotal);
    setApplying(false);
    if (r.ok) {
      setStoredCode(r.code || c);
      setDiscount(r.discount || 0);
      showToast("تم تطبيق كود الخصم ✓", "success");
    } else {
      clearCoupon();
      setDiscount(0);
      const msg = r.error === "below_min" ? `الحد الأدنى لتطبيق الكود ${formatPrice(r.min || 0)}` : COUPON_ERRORS[r.error || ""] || "تعذّر تطبيق الكود";
      showToast(msg, "error");
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
              <button onClick={applyCode} disabled={applying} className="btn-ghost disabled:opacity-60">{applying ? "…" : "تطبيق"}</button>
            </div>
            {discount > 0 && (
              <p className="mb-2 text-xs font-bold text-green-600">✓ تم تطبيق كود «{storedCode}»</p>
            )}
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
