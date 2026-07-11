import { formatPrice } from "@/lib/currency";

export default function OrderSummary({
  subtotal,
  discount = 0,
  deliveryFee = 0,
  showDelivery = true,
}: {
  subtotal: number;
  discount?: number;
  deliveryFee?: number;
  showDelivery?: boolean;
}) {
  const total = subtotal - discount + (showDelivery ? deliveryFee : 0);
  return (
    <div className="space-y-2 text-sm">
      <Row label="مجموع المنتجات" value={formatPrice(subtotal)} />
      {discount > 0 && <Row label="الخصم" value={`- ${formatPrice(discount)}`} green />}
      {showDelivery && (
        <Row
          label="تكلفة التوصيل"
          value={deliveryFee === 0 ? "مجاني" : formatPrice(deliveryFee)}
          green={deliveryFee === 0}
        />
      )}
      <div className="mt-2 flex items-center justify-between border-t border-dashed border-cloud pt-3 text-lg font-black text-ink">
        <span>الإجمالي</span>
        <span className="text-brand">{formatPrice(total)}</span>
      </div>
    </div>
  );
}

function Row({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={green ? "font-bold text-green-600" : "font-bold"}>{value}</span>
    </div>
  );
}
