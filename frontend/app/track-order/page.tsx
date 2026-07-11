"use client";
import { useCallback, useEffect, useState } from "react";
import OrderStatusTimeline from "@/components/shared/OrderStatusTimeline";
import { trackOrder, confirmDelivery, type TrackOrderResult } from "@/lib/api";

// تحويل حالة الطلب في قاعدة البيانات إلى موضع على شريط التتبع (5 مراحل)
const STATUS_INDEX: Record<string, number> = {
  new: 0,
  confirmed: 1,
  preparing: 2,
  ready: 2,
  out_for_delivery: 3,
  delivering: 3,
  delivered: 4,
  completed: 4,
};
const STATUS_LABEL: Record<string, string> = {
  new: "تم استلام الطلب",
  confirmed: "تم تأكيد الطلب",
  preparing: "الطلب قيد التحضير",
  ready: "الطلب قيد التحضير",
  out_for_delivery: "الطلب قيد التوصيل",
  delivering: "الطلب قيد التوصيل",
  delivered: "تم تسليم الطلب",
  completed: "تم تسليم الطلب",
  cancelled: "تم إلغاء الطلب",
  rejected: "تم رفض الطلب",
};

export default function TrackOrderPage() {
  const [orderNo, setOrderNo] = useState("");
  const [input, setInput] = useState("");
  const [data, setData] = useState<TrackOrderResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const refresh = useCallback(async (no: string) => {
    if (!no) return;
    setLoading(true);
    setNotFound(false);
    const res = await trackOrder(no);
    if (res.ok) {
      setData(res);
    } else {
      setData(null);
      setNotFound(true);
    }
    setLoading(false);
  }, []);

  // عند فتح الصفحة: اقرأ رقم الطلب الأخير من التخزين المحلي وابدأ التتبع
  useEffect(() => {
    try {
      const raw = localStorage.getItem("qashtoota-last-order");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.orderNo) {
          setOrderNo(String(parsed.orderNo));
          setInput(String(parsed.orderNo));
        }
      }
    } catch {}
  }, []);

  // جلب الحالة وتحديثها تلقائيًا كل 20 ثانية لتطابق لوحة التحكم
  useEffect(() => {
    if (!orderNo) return;
    refresh(orderNo);
    const t = setInterval(() => refresh(orderNo), 20000);
    return () => clearInterval(t);
  }, [orderNo, refresh]);

  const status = data?.status ?? "";
  const isCancelled = status === "cancelled" || status === "rejected";
  const currentIndex = STATUS_INDEX[status] ?? 0;
  const canConfirm = status === "out_for_delivery";

  async function onConfirmDelivery() {
    if (!orderNo) return;
    setLoading(true);
    const res = await confirmDelivery(orderNo);
    setLoading(false);
    if (res.ok) refresh(orderNo);
  }

  return (
    <div className="container-p py-6">
      <h1 className="mb-4 text-2xl font-black text-ink">تتبع الطلب</h1>

      {/* البحث برقم الطلب */}
      <form
        className="mb-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const v = input.trim();
          if (v) setOrderNo(v);
        }}
      >
        <input
          className="w-full flex-1 rounded-xl2 border-2 border-cloud px-3 py-2 outline-none focus:border-brand-light"
          placeholder="أدخل رقم الطلب"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          inputMode="numeric"
        />
        <button type="submit" className="btn-primary whitespace-nowrap">
          تتبع
        </button>
      </form>

      {notFound && (
        <div className="card mb-6 border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-600">
          لم يتم العثور على طلب بهذا الرقم.
        </div>
      )}

      {data && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="card p-5 md:col-span-2">
            {isCancelled ? (
              <div className="rounded-xl bg-red-50 p-4 text-center font-extrabold text-red-600">
                {STATUS_LABEL[status] ?? "تم إلغاء الطلب"}
              </div>
            ) : (
              <OrderStatusTimeline
                currentIndex={currentIndex}
                mode={data.mode === "pickup" ? "pickup" : "delivery"}
              />
            )}
          </div>
          <div className="space-y-3">
            <div className="card p-4 text-sm">
              <Info label="رقم الطلب" value={data.orderNo ?? "—"} />
              <Info label="الفرع" value={data.branchName ?? "—"} />
              <Info label="الحالة" value={STATUS_LABEL[status] ?? "—"} />
              <Info
                label="نوع الطلب"
                value={data.mode === "pickup" ? "استلام من الفرع" : "توصيل"}
              />
            </div>

            {canConfirm && (
              <button
                type="button"
                className="btn-primary w-full"
                onClick={onConfirmDelivery}
                disabled={loading}
              >
                ✅ تأكيد استلام الطلب
              </button>
            )}

            <button
              type="button"
              className="btn-outline w-full"
              onClick={() => refresh(orderNo)}
              disabled={loading}
            >
              {loading ? "جارٍ التحديث…" : "🔄 تحديث الحالة"}
            </button>
          </div>
        </div>
      )}

      {!data && !notFound && !loading && (
        <p className="text-gray-500">أدخل رقم طلبك لعرض حالته.</p>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-cloud py-2 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-bold text-ink">{value}</span>
    </div>
  );
}
