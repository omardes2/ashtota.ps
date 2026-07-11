"use client";
import { useEffect, useState } from "react";
import OrderStatusTimeline from "@/components/shared/OrderStatusTimeline";

export default function TrackOrderPage() {
  const [order, setOrder] = useState<{ orderNo?: string; branchName?: string } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("qashtoota-last-order");
      if (raw) setOrder(JSON.parse(raw));
    } catch {}
  }, []);

  return (
    <div className="container-p py-6">
      <h1 className="mb-4 text-2xl font-black text-ink">تتبع الطلب</h1>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="card p-5 md:col-span-2">
          <OrderStatusTimeline currentIndex={2} />
        </div>
        <div className="space-y-3">
          <div className="card p-4 text-sm">
            <Info label="رقم الطلب" value={order?.orderNo ?? "—"} />
            <Info label="الفرع" value={order?.branchName ?? "—"} />
            <Info label="وقت التوصيل المتوقع" value="30 - 45 دقيقة" />
            <Info label="مندوب التوصيل" value="أحمد" />
            <Info label="رقم الهاتف" value="0599xxxxxx" />
          </div>
          <a href="https://wa.me/970599000000" target="_blank" rel="noopener noreferrer" className="btn-primary w-full bg-[#25D366] hover:bg-[#1fb457]">
            💬 تواصل عبر واتساب
          </a>
        </div>
      </div>
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
