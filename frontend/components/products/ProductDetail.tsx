"use client";
import { useState } from "react";
import Link from "next/link";
import type { Product, ProductExtra, ProductSize } from "@/types";
import { formatPrice } from "@/lib/currency";
import { cartItemKey, cn, computeUnitPrice, isProductInBranch } from "@/lib/utils";
import Rating from "@/components/shared/Rating";
import ProductImage from "@/components/shared/ProductImage";
import QuantitySelector from "@/components/shared/QuantitySelector";
import { useBranchStore } from "@/store/useBranchStore";
import { useCartStore } from "@/store/useCartStore";
import { useUiStore } from "@/store/useUiStore";
import { useHydrated } from "@/lib/useHydrated";

export default function ProductDetail({ product }: { product: Product }) {
  const hydrated = useHydrated();
  const branchId = useBranchStore((s) => s.branchId);
  const addItem = useCartStore((s) => s.addItem);
  const openBranchModal = useUiStore((s) => s.openBranchModal);
  const showToast = useUiStore((s) => s.showToast);

  const [size, setSize] = useState<ProductSize | undefined>(product.sizes[0]);
  const [extras, setExtras] = useState<ProductExtra[]>([]);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  const base = (branchId && product.branchPrices?.[branchId]) || product.price;
  const unit = computeUnitPrice(base, size, extras);
  const inBranch = !hydrated || !branchId || isProductInBranch(product, branchId);

  function toggleExtra(ex: ProductExtra) {
    setExtras((p) => (p.find((e) => e.id === ex.id) ? p.filter((e) => e.id !== ex.id) : [...p, ex]));
  }

  function add() {
    if (!branchId) return openBranchModal();
    addItem({
      key: cartItemKey(product.id, size, extras, note),
      productId: product.id,
      name: product.name,
      emoji: product.emoji,
      image: product.image,
      basePrice: base,
      size,
      extras,
      note: note.trim() || undefined,
      qty,
      unitPrice: unit,
    });
    showToast("✓ تمت الإضافة إلى السلة");
  }

  return (
    <div className="container-p py-6">
      <nav className="mb-4 text-sm text-gray-400">
        <Link href="/" className="hover:text-brand">الرئيسية</Link> ›{" "}
        <Link href="/products" className="hover:text-brand">المنتجات</Link> ›{" "}
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-6 md:grid-cols-2">
        {/* الصور */}
        <div>
          <ProductImage emoji={product.emoji} src={product.image} alt={product.name} className="aspect-square w-full rounded-xl3" size="lg" />
        </div>

        {/* التفاصيل */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {product.isBestSeller && <span className="chip bg-accent text-ink">الأكثر طلبًا</span>}
            {product.isNew && <span className="chip bg-green-500 text-white">جديد</span>}
          </div>
          <h1 className="mt-2 text-2xl font-black text-ink">{product.name}</h1>
          <div className="mt-1 flex items-center gap-3">
            <Rating value={product.rating} count={product.reviewsCount} size="md" />
            <span className={cn("text-sm font-bold", inBranch ? "text-green-600" : "text-red-500")}>
              {inBranch ? "متوفر" : "غير متوفر بالفرع الحالي"}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            {product.hasSizes && <span className="text-sm text-gray-400">يبدأ من</span>}
            <span className="text-2xl font-black text-brand">{formatPrice(unit)}</span>
            {product.oldPrice && <span className="text-gray-400 line-through">{formatPrice(product.oldPrice)}</span>}
          </div>

          <p className="mt-3 text-gray-600">{product.description}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-500">
            {product.ingredients && <span>🧾 المكونات: {product.ingredients}</span>}
            <span>⏱️ التحضير: {product.preparationTime}</span>
          </div>

          {/* الحجم */}
          {product.sizes.length > 0 && (
            <div className="mt-5">
              <h4 className="mb-2 font-extrabold text-brand-dark">اختر الحجم</h4>
              <div className="grid grid-cols-3 gap-2">
                {product.sizes.map((s) => (
                  <button key={s.id} onClick={() => setSize(s)} className={cn("rounded-xl2 border-2 p-3 text-center font-bold", size?.id === s.id ? "border-brand bg-brand/5" : "border-cloud")}>
                    <div>{s.name}</div>
                    <div className="text-xs text-gray-400">{formatPrice(s.price)}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* الإضافات */}
          {product.extras.length > 0 && (
            <div className="mt-5">
              <h4 className="mb-2 font-extrabold text-brand-dark">الإضافات</h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {product.extras.map((ex) => {
                  const selected = !!extras.find((e) => e.id === ex.id);
                  return (
                    <button key={ex.id} onClick={() => toggleExtra(ex)} className={cn("flex items-center gap-2 rounded-xl2 border-2 p-3 text-right", selected ? "border-brand bg-brand/5" : "border-cloud")}>
                      <span className={cn("grid h-5 w-5 place-items-center rounded-md border-2 text-xs text-white", selected ? "border-brand bg-brand" : "border-gray-300")}>{selected ? "✓" : ""}</span>
                      <span className="flex-1 font-bold">{ex.name}</span>
                      <span className="text-sm font-extrabold text-brand">{ex.price ? `+ ${formatPrice(ex.price)}` : "مجاني"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ملاحظات */}
          <div className="mt-5">
            <h4 className="mb-2 font-extrabold text-brand-dark">ملاحظات (اختياري)</h4>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="أي ملاحظة على الطلب…" className="min-h-[60px] w-full rounded-xl2 border-2 border-cloud p-3 text-sm outline-none focus:border-brand-light" />
          </div>

          {/* الكمية + الإضافة */}
          <div className="mt-6 flex items-center gap-3">
            <QuantitySelector qty={qty} onDec={() => setQty((q) => Math.max(1, q - 1))} onInc={() => setQty((q) => q + 1)} />
            <button onClick={add} disabled={hydrated && !inBranch} className="btn-primary flex-1 text-base disabled:bg-gray-300">
              {hydrated && !inBranch ? "غير متوفر بالفرع" : `إضافة إلى السلة · ${formatPrice(unit * qty)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
