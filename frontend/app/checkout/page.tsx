"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { useBranchStore } from "@/store/useBranchStore";
import { useUiStore } from "@/store/useUiStore";
import { useHydrated } from "@/lib/useHydrated";
import { getBranch } from "@/data/branches";
import OrderSummary from "@/components/cart/OrderSummary";
import EmptyState from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import type { OrderMode, PaymentMethod } from "@/types";

export default function CheckoutPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const branch = getBranch(useBranchStore((s) => s.branchId));
  const showToast = useUiStore((s) => s.showToast);
  const subtotal = items.reduce((a, i) => a + i.unitPrice * i.qty, 0);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<OrderMode>("delivery");
  const [area, setArea] = useState("");
  const [street, setStreet] = useState("");
  const [building, setBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [landmark, setLandmark] = useState("");
  const [timing, setTiming] = useState<"now" | "later">("now");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [note, setNote] = useState("");

  if (!hydrated) return <div className="container-p py-10 text-center text-gray-400">…</div>;
  if (items.length === 0) {
    return <div className="container-p"><EmptyState title="لا توجد منتجات لإتمام الطلب" actionLabel="تصفّح المنتجات" actionHref="/products" /></div>;
  }

  const deliveryFee = mode === "delivery" ? branch?.deliveryFeeFrom ?? 0 : 0;

  function confirm() {
    if (!name.trim() || !phone.trim()) return showToast("يرجى إدخال الاسم ورقم الهاتف", "error");
    if (mode === "delivery" && (!area.trim() || !street.trim())) return showToast("يرجى إكمال عنوان التوصيل", "error");

    const order = {
      orderNo: "Q" + Date.now().toString().slice(-6),
      branchName: branch?.name ?? "",
      mode,
      customer: { name, phone },
      items: items.map((i) => ({ name: i.name, qty: i.qty, total: i.unitPrice * i.qty, size: i.size?.name, extras: i.extras.map((e) => e.name) })),
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      createdAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem("qashtoota-last-order", JSON.stringify(order));
    } catch {}
    clear();
    router.push("/order-success");
  }

  return (
    <div className="container-p py-6">
      <h1 className="mb-4 text-2xl font-black text-ink">إتمام الطلب</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Section title="معلومات العميل">
            <Field label="الاسم" value={name} onChange={setName} placeholder="اسمك الكامل" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="رقم الهاتف" value={phone} onChange={setPhone} placeholder="05xxxxxxxx" type="tel" />
              <Field label="البريد الإلكتروني (اختياري)" value={email} onChange={setEmail} placeholder="email@example.com" type="email" />
            </div>
          </Section>

          <Section title="طريقة الاستلام">
            <div className="grid grid-cols-2 gap-2">
              <Seg active={mode === "delivery"} onClick={() => setMode("delivery")}>🛵 توصيل</Seg>
              <Seg active={mode === "pickup"} onClick={() => setMode("pickup")}>🏬 استلام من الفرع</Seg>
            </div>
          </Section>

          {mode === "delivery" && (
            <Section title="عنوان التوصيل">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="المنطقة" value={area} onChange={setArea} />
                <Field label="الحي / الشارع" value={street} onChange={setStreet} />
                <Field label="رقم البناية" value={building} onChange={setBuilding} />
                <Field label="الطابق" value={floor} onChange={setFloor} />
              </div>
              <Field label="علامة مميزة" value={landmark} onChange={setLandmark} placeholder="بجانب…" />
            </Section>
          )}

          <Section title="وقت الطلب">
            <div className="grid grid-cols-2 gap-2">
              <Seg active={timing === "now"} onClick={() => setTiming("now")}>في أقرب وقت</Seg>
              <Seg active={timing === "later"} onClick={() => setTiming("later")}>تحديد وقت لاحق</Seg>
            </div>
          </Section>

          <Section title="طريقة الدفع">
            <div className="space-y-2">
              <PayOption active={payment === "cash"} onClick={() => setPayment("cash")} label="💵 الدفع نقدًا عند الاستلام" />
              <PayOption disabled label="💳 بطاقة بنكية" soon />
              <PayOption disabled label="📱 محفظة إلكترونية" soon />
            </div>
          </Section>

          <Section title="ملاحظات الطلب">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="أي ملاحظة إضافية…" className="min-h-[70px] w-full rounded-xl2 border-2 border-cloud p-3 outline-none focus:border-brand-light" />
          </Section>
        </div>

        <div>
          <div className="card sticky top-20 p-4">
            <h3 className="mb-3 font-extrabold text-ink">ملخص الطلب</h3>
            <div className="mb-3 max-h-40 space-y-1 overflow-y-auto text-sm">
              {items.map((i) => (
                <div key={i.key} className="flex justify-between text-gray-600">
                  <span>{i.name} ×{i.qty}</span>
                  <span>{(i.unitPrice * i.qty).toFixed(0)} ₪</span>
                </div>
              ))}
            </div>
            <OrderSummary subtotal={subtotal} deliveryFee={deliveryFee} showDelivery={mode === "delivery"} />
            <button onClick={confirm} className="btn-primary mt-4 w-full text-base">تأكيد الطلب</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <h3 className="mb-3 font-extrabold text-brand-dark">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-ink">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl2 border-2 border-cloud px-3 py-2 outline-none focus:border-brand-light" />
    </label>
  );
}
function Seg({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("rounded-xl2 border-2 py-3 font-extrabold transition", active ? "border-brand bg-brand/5 text-brand-dark" : "border-cloud text-gray-500")}>
      {children}
    </button>
  );
}
function PayOption({ active, onClick, label, soon, disabled }: { active?: boolean; onClick?: () => void; label: string; soon?: boolean; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className={cn("flex w-full items-center justify-between rounded-xl2 border-2 p-3 text-right font-bold transition", active ? "border-brand bg-brand/5" : "border-cloud", disabled && "opacity-60")}>
      <span>{label}</span>
      {soon && <span className="chip bg-accent/20 text-amber-700">قريبًا</span>}
    </button>
  );
}
