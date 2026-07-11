"use client";
import Link from "next/link";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/currency";
import Rating from "@/components/shared/Rating";
import ProductImage from "@/components/shared/ProductImage";
import { useBranchStore } from "@/store/useBranchStore";
import { useUiStore } from "@/store/useUiStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useHydrated } from "@/lib/useHydrated";
import { isProductInBranch } from "@/lib/utils";

export default function ProductCard({ product }: { product: Product }) {
  const hydrated = useHydrated();
  const branchId = useBranchStore((s) => s.branchId);
  const openBranchModal = useUiStore((s) => s.openBranchModal);
  const openCustomize = useUiStore((s) => s.openCustomize);
  const wished = useWishlistStore((s) => s.ids.includes(product.id));
  const toggleWish = useWishlistStore((s) => s.toggle);

  const available = !hydrated || isProductInBranch(product, branchId) || !branchId;

  function handleAdd() {
    if (!branchId) {
      openBranchModal();
      return;
    }
    openCustomize(product);
  }

  const badge = product.isBestSeller
    ? { label: "الأكثر طلبًا", cls: "bg-accent text-ink" }
    : product.isNew
    ? { label: "جديد", cls: "bg-green-500 text-white" }
    : product.oldPrice
    ? { label: "عرض", cls: "bg-red-500 text-white" }
    : null;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl2 bg-white shadow-card transition hover:shadow-lift">
      <div className="relative">
        <Link href={`/product/${product.slug}`} aria-label={product.name}>
          <ProductImage emoji={product.emoji} alt={product.name} className="aspect-square w-full" />
        </Link>
        {badge && (
          <span className={`chip absolute right-2 top-2 ${badge.cls}`}>{badge.label}</span>
        )}
        <button
          onClick={() => toggleWish(product.id)}
          aria-label={wished ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
          className="absolute left-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-lg shadow-card transition hover:scale-110"
        >
          {hydrated && wished ? "❤️" : "🤍"}
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link href={`/product/${product.slug}`} className="font-extrabold text-ink hover:text-brand">
          {product.name}
        </Link>
        <p className="line-clamp-2 min-h-[2.4rem] text-xs text-gray-500">{product.description}</p>
        <Rating value={product.rating} count={product.reviewsCount} />
        <div className="mt-1 flex items-center gap-2">
          <span className="text-lg font-black text-brand">{formatPrice(product.price)}</span>
          {product.oldPrice && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(product.oldPrice)}</span>
          )}
        </div>
        <button
          onClick={handleAdd}
          disabled={hydrated && !available}
          className="mt-2 flex items-center justify-center gap-1 rounded-full bg-brand py-2 text-sm font-extrabold text-white transition hover:bg-brand-dark active:scale-95 disabled:bg-gray-300"
        >
          {hydrated && !available ? "غير متوفر بالفرع" : "＋ أضف للسلة"}
        </button>
      </div>
    </div>
  );
}
