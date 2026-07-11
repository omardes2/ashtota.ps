"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/currency";

interface LastOrder {
  orderNo: string;
  branchName: string;
  mode: string;
  total: number;
}

export default function OrderSuccessPage() {
  const [order, setOrder] = useState<LastOrder | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("qashtoota-last-order");
      if (raw) setOrder(JSON.parse(raw));
    } catch {}
  }, []);

  return (
    <div className="container-p flex flex-col items-center py-14 text-center">
      <div className="grid h-24 w-24 animate-pop-in place-items-center rounded-full bg-gradient-to-br from-green-400 to-green-600 text-5xl text-white shadow-lift">
        ✓
      </div>
      <h1 className="mt-5 text-2xl font-black text-ink">شكرًا لطلبك من قشطوطة بلبن 🍮</h1>
      <p className="mt-1 text-gray-500">تم استلام طلبك بنجاح وسيتم تجهيزه.</p>

      {order && (
        <div className="mt-6 w-full max-w-sm rounded-xl2 bg-white p-4 text-right shadow-card">
          <Row label="رقم الطلب" value={order.orderNo} bold />
          <Row label="الفرع" value={order.branchName} />
          <Row label="طريقة الاستلام" value={order.mode === "pickup" ? "استلام من الفرع" : "توصيل"} />
          <div className="mt-2 flex justify-between border-t border-dashed border-cloud pt-2 text-lg font-black text-brand">
            <span>الإجمالي</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/track-order" className="btn-primary">تتبع الطلب</Link>
        <Link href="/products" className="btn-outline">متابعة التسوّق</Link>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={bold ? "font-black text-ink" : "font-bold"}>{value}</span>
    </div>
  );
}
