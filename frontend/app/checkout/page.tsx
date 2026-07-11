"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { useBranchStore } from "@/store/useBranchStore";
import { useUiStore } from "@/store/useUiStore";
import { useMenuStore } from "@/store/useMenuStore";
import { useHydrated } from "@/lib/useHydrated";
import { submitOrder } from "@/lib/api";
import OrderSummary from "@/components/cart/OrderSummary";
import EmptyState from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import type { OrderMode, PaymentMethod } from "@/types";

export default function CheckoutPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const branchId = useBranchStore((s) => s.branchId);
  const branch = useMenuStore((s) => s.branches.find((b) => b.id === branchId));
  const allZones = useMenuStore((s) => s.zones);
  const zones = allZones.filter((z) => z.branchId === branchId);
  const showToast = useUiStore((s) => s.showToast);
  const subtotal = items.reduce((a, i) => a + i.unitPrice * i.qty, 0);
  const [zoneId, setZoneId] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const zone = zones.find((z) => z.id === zoneId);
  const deliveryFee =
    mode === "delivery"
      ? zone
        ? zone.freeOver && subtotal >= zone.freeOver
          ? 0
          : zone.fee
        : branch?.deliveryFeeFrom ?? 0
      : 0;

  function saveAndGo(orderNo: string, total: number) {
    try {
      localStorage.setItem(
        "qashtoota-last-order",
        JSON.stringify({ orderNo, branchName: branch?.name ?? "", mode, total, createdAt: new Date().toISOString() })
      );
    } catch {}
    clear();
    router.push("/order-success");
  }

  async function confirm() {
    if (!branchId || !branch) return showToast("اختر الفرع أولًا", "error");
    if (!name.trim() || !phone.trim()) return showToast("يرجى إدخال الاسم ورقم الهاتف", "error");
    if (mode === "delivery") {
      if (zones.length > 0 && !zoneId) return showToast("يرجى اختيار منطقة التوصيل", "error");
      if (!street.trim() && !area.trim()) return showToast("يرجى إكمال عنوان التوصيل", "error");
    }

    const addressText = [area, street, building && `عمارة ${building}`, floor && `طابق ${floor}`, landmark]
      .filter(Boolean)
      .join("، ");

    setSubmitting(true);
    const res = await submitOrder({
      branchId,
      name,
      phone,
      mode,
      zoneId: mode === "delivery" ? zoneId || null : null,
      address: addressText,
      note,
      items: items.map((i) => ({
        productId: i.productId,
        qty: i.qty,
        sizeId: i.size?.id ?? null,
        options: i.extras.map((e) => ({ id: e.id })),
        note: i.note,
      })),
    });
    setSubmitting(false);

    if (res.ok) {
      saveAndGo(res.orderNo || "Q" + Date.now().toString().slice(-6), res.total ?? subtotal + deliveryFee);
      return;
    }
    const map: Record<string, string> = {
      below_min: "قيمة الطلب أقل من الحد الأدنى للمنطقة",
      unavailable: "أحد المنتجات لم يعد متوفرًا في الفرع",
      missing_zone: "يرجى اختيار منطقة التوصيل",
      missing_address: "يرجى إدخال العنوان",
      invalid_zone: "منطقة التوصيل غير صحيحة",
      invalid_branch: "الفرع غير صالح",
    };
    if (res.error && map[res.error]) return showToast(map[res.error], "error");
    if (res.error === "network") {
      // الـ backend غير متاح — حفظ محلي كخطة بديلة
      saveAndGo("Q" + Date.now().toString().slice(-6), subtotal + deliveryFee);
      return;
    }
    showToast("تعذّر إرسال الطلب، يرجى المحاولة مجددًا", "error");
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
              {zones.length > 0 && (
                <label className="block">
                  <span className="mb-1 block text-sm font-bold text-ink">منطقة التوصيل</span>
                  <select
                    value={zoneId}
                    onChange={(e) => setZoneId(e.target.value)}
                    className="w-full rounded-xl2 border-2 border-cloud px-3 py-2 outline-none focus:border-brand-light"
                  >
                    <option value="">— اختر المنطقة —</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} (توصيل {z.fee} ₪)
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="المنطقة / الحي" value={area} onChange={setArea} />
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
            <button onClick={confirm} disabled={submitting} className="btn-primary mt-4 w-full text-base disabled:opacity-70">
              {submitting ? "جارٍ الإرسال…" : "تأكيد الطلب"}
            </button>
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
