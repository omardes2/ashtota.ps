"use client";
import { useEffect, useState } from "react";
import type { ProductExtra, ProductSize } from "@/types";
import { useUiStore } from "@/store/useUiStore";
import { useCartStore } from "@/store/useCartStore";
import { useBranchStore } from "@/store/useBranchStore";
import { formatPrice } from "@/lib/currency";
import { cartItemKey, cn, computeUnitPrice } from "@/lib/utils";
import QuantitySelector from "@/components/shared/QuantitySelector";
import ProductImage from "@/components/shared/ProductImage";

export default function ProductCustomizationModal() {
  const product = useUiStore((s) => s.customizeProduct);
  const close = useUiStore((s) => s.closeCustomize);
  const showToast = useUiStore((s) => s.showToast);
  const addItem = useCartStore((s) => s.addItem);
  const branchId = useBranchStore((s) => s.branchId);

  const [size, setSize] = useState<ProductSize | undefined>();
  const [extras, setExtras] = useState<ProductExtra[]>([]);
  const [note, setNote] = useState("");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (product) {
      setSize(product.sizes[0]);
      setExtras([]);
      setNote("");
      setQty(1);
    }
  }, [product]);

  if (!product) return null;

  const base = (branchId && product.branchPrices?.[branchId]) || product.price;
  const unit = computeUnitPrice(base, size, extras);

  function toggleExtra(ex: ProductExtra) {
    setExtras((prev) =>
      prev.find((e) => e.id === ex.id) ? prev.filter((e) => e.id !== ex.id) : [...prev, ex]
    );
  }

  function add() {
    const key = cartItemKey(product!.id, size, extras, note);
    addItem({
      key,
      productId: product!.id,
      name: product!.name,
      emoji: product!.emoji,
      image: product!.image,
      basePrice: base,
      size,
      extras,
      note: note.trim() || undefined,
      qty,
      unitPrice: unit,
    });
    showToast("✓ تمت الإضافة إلى السلة");
    close();
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={close} />
      <div className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-xl3 bg-white shadow-lift sm:rounded-xl3">
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-cloud bg-white p-4">
          <h3 className="flex-1 text-lg font-black text-ink">{product.name}</h3>
          <button onClick={close} aria-label="إغلاق" className="grid h-9 w-9 place-items-center rounded-full bg-cloud text-lg">✕</button>
        </div>

        <div className="p-4">
          <ProductImage emoji={product.emoji} src={product.image} alt={product.name} className="mb-3 aspect-video w-full rounded-xl2" size="lg" />
          <p className="mb-4 text-sm text-gray-500">{product.description}</p>

          {/* الحجم */}
          {product.sizes.length > 0 && (
            <div className="mb-5">
              <h4 className="mb-2 font-extrabold text-brand-dark">اختر الحجم</h4>
              <div className="grid grid-cols-3 gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSize(s)}
                    className={cn(
                      "rounded-xl2 border-2 p-3 text-center font-bold transition",
                      size?.id === s.id ? "border-brand bg-brand/5 text-brand-dark" : "border-cloud"
                    )}
                  >
                    <div>{s.name}</div>
                    <div className="text-xs text-gray-400">{formatPrice(s.price)}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* الإضافات */}
          {product.extras.length > 0 && (
            <div className="mb-5">
              <h4 className="mb-2 font-extrabold text-brand-dark">الإضافات</h4>
              <div className="space-y-2">
                {product.extras.map((ex) => {
                  const selected = !!extras.find((e) => e.id === ex.id);
                  return (
                    <button
                      key={ex.id}
                      onClick={() => toggleExtra(ex)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl2 border-2 p-3 text-right transition",
                        selected ? "border-brand bg-brand/5" : "border-cloud"
                      )}
                    >
                      <span className={cn("grid h-5 w-5 place-items-center rounded-md border-2 text-xs text-white", selected ? "border-brand bg-brand" : "border-gray-300")}>
                        {selected ? "✓" : ""}
                      </span>
                      <span className="flex-1 font-bold text-ink">{ex.name}</span>
                      <span className="text-sm font-extrabold text-brand">
                        {ex.price ? `+ ${formatPrice(ex.price)}` : "مجاني"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ملاحظات */}
          <div className="mb-5">
            <h4 className="mb-2 font-extrabold text-brand-dark">ملاحظات (اختياري)</h4>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="مثال: زيادة صوص، بدون مكسرات…"
              className="min-h-[64px] w-full rounded-xl2 border-2 border-cloud p-3 text-sm outline-none focus:border-brand-light"
            />
          </div>

          {/* الكمية */}
          <div className="mb-2 flex items-center justify-between">
            <span className="font-extrabold text-brand-dark">الكمية</span>
            <QuantitySelector qty={qty} onDec={() => setQty((q) => Math.max(1, q - 1))} onInc={() => setQty((q) => q + 1)} />
          </div>
        </div>

        <div className="sticky bottom-0 border-t border-cloud bg-white p-4">
          <button onClick={add} className="btn-primary w-full text-base">
            إضافة إلى السلة · {formatPrice(unit * qty)}
          </button>
        </div>
      </div>
    </div>
  );
}
