"use client";
import type { CartItem } from "@/types";
import { formatPrice } from "@/lib/currency";
import { useCartStore } from "@/store/useCartStore";
import QuantitySelector from "@/components/shared/QuantitySelector";

export default function CartItemRow({ item }: { item: CartItem }) {
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);

  const details = [
    item.size?.name,
    ...item.extras.map((e) => e.name),
  ].filter(Boolean);

  return (
    <div className="flex gap-3 rounded-xl2 bg-white p-3 shadow-card">
      {item.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image} alt={item.name} className="h-16 w-16 flex-shrink-0 rounded-xl object-cover" />
      ) : (
        <div className="grid h-16 w-16 flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-light/30 to-brand/15 text-3xl">
          {item.emoji}
        </div>
      )}
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-extrabold text-ink">{item.name}</h3>
          <button
            onClick={() => removeItem(item.key)}
            className="flex-shrink-0 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-500 transition hover:bg-red-100"
            aria-label="حذف المنتج"
          >
            حذف
          </button>
        </div>
        {details.length > 0 && (
          <p className="text-xs text-gray-500">{details.join(" · ")}</p>
        )}
        {item.note && <p className="text-xs text-gray-400">📝 {item.note}</p>}
        <div className="mt-2 flex items-center justify-between">
          <QuantitySelector
            qty={item.qty}
            onDec={() => updateQty(item.key, -1)}
            onInc={() => updateQty(item.key, 1)}
          />
          <span className="font-black text-brand">{formatPrice(item.unitPrice * item.qty)}</span>
        </div>
      </div>
    </div>
  );
}
