"use client";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useBranchStore } from "@/store/useBranchStore";
import { useUiStore } from "@/store/useUiStore";
import { useMenuStore } from "@/store/useMenuStore";
import { useHydrated } from "@/lib/useHydrated";
import { cn, isProductInBranch } from "@/lib/utils";
import ProductGrid from "@/components/products/ProductGrid";
import EmptyState from "@/components/shared/EmptyState";

type Sort = "best" | "price-asc" | "price-desc" | "new";

export default function ProductsView() {
  const params = useSearchParams();
  const initialCat = params.get("category") || "";
  const hydrated = useHydrated();
  const branchId = useBranchStore((s) => s.branchId);
  const openBranchModal = useUiStore((s) => s.openBranchModal);
  const ALL = useMenuStore((s) => s.products);
  const categories = useMenuStore((s) => s.categories);
  const branch = useMenuStore((s) => s.branches.find((b) => b.id === branchId));

  const [query, setQuery] = useState("");
  const [cat, setCat] = useState(initialCat);
  const [sort, setSort] = useState<Sort>("best");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [visible, setVisible] = useState(8);

  const list = useMemo(() => {
    let items = branchId ? ALL.filter((p) => isProductInBranch(p, branchId)) : ALL;
    if (cat) items = items.filter((p) => p.category === cat);
    if (query.trim()) {
      const q = query.trim();
      items = items.filter((p) => p.name.includes(q) || p.description.includes(q));
    }
    if (availableOnly) items = items.filter((p) => p.isAvailable);
    items = [...items];
    if (sort === "price-asc") items.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") items.sort((a, b) => b.price - a.price);
    else if (sort === "new") items.sort((a, b) => Number(b.isNew) - Number(a.isNew));
    else items.sort((a, b) => Number(b.isBestSeller) - Number(a.isBestSeller));
    return items;
  }, [ALL, branchId, cat, query, availableOnly, sort]);

  return (
    <div className="container-p py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-black text-ink">المنتجات</h1>
        {hydrated && (
          <p className="text-sm text-gray-500">
            {branch ? (
              <>الفرع الحالي: <b className="text-brand-dark">{branch.name}</b></>
            ) : (
              <button onClick={openBranchModal} className="font-bold text-brand">اختر الفرع لعرض المنتجات المتوفرة</button>
            )}
          </p>
        )}
      </div>

      {/* البحث */}
      <div className="mb-4 flex items-center gap-2 rounded-full border-2 border-cloud bg-white px-4 py-2">
        <span aria-hidden="true">🔍</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن منتج…"
          className="w-full bg-transparent outline-none"
          aria-label="بحث"
        />
      </div>

      {/* التصنيفات */}
      <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setCat("")}
          className={cn("chip whitespace-nowrap px-4 py-2", !cat ? "bg-brand text-white" : "bg-white text-brand-dark shadow-card")}
        >
          الكل
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.slug)}
            className={cn("chip whitespace-nowrap px-4 py-2", cat === c.slug ? "bg-brand text-white" : "bg-white text-brand-dark shadow-card")}
          >
            {c.emoji} {c.name}
          </button>
        ))}
      </div>

      {/* الترتيب + المتوفر */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="rounded-full border-2 border-cloud bg-white px-4 py-2 text-sm font-bold"
          aria-label="ترتيب"
        >
          <option value="best">الأكثر طلبًا</option>
          <option value="price-asc">السعر: من الأقل للأعلى</option>
          <option value="price-desc">السعر: من الأعلى للأقل</option>
          <option value="new">الأحدث</option>
        </select>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-ink">
          <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} />
          المتوفر فقط
        </label>
        <span className="mr-auto text-sm text-gray-400">{list.length} منتج</span>
      </div>

      {list.length === 0 ? (
        <EmptyState emoji="🔍" title="لا توجد منتجات مطابقة" subtitle="جرّب تغيير التصنيف أو البحث" />
      ) : (
        <>
          <ProductGrid products={list.slice(0, visible)} />
          {visible < list.length && (
            <div className="mt-6 text-center">
              <button onClick={() => setVisible((v) => v + 8)} className="btn-outline">
                عرض المزيد
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
