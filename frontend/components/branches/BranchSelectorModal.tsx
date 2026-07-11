"use client";
import { useEffect } from "react";
import { useBranchStore } from "@/store/useBranchStore";
import { useMenuStore } from "@/store/useMenuStore";
import { useCartStore } from "@/store/useCartStore";
import { useUiStore } from "@/store/useUiStore";
import { formatPrice } from "@/lib/currency";
import { cn } from "@/lib/utils";

export default function BranchSelectorModal() {
  const open = useUiStore((s) => s.branchModalOpen);
  const openModal = useUiStore((s) => s.openBranchModal);
  const close = useUiStore((s) => s.closeBranchModal);
  const showToast = useUiStore((s) => s.showToast);
  const branchId = useBranchStore((s) => s.branchId);
  const setBranch = useBranchStore((s) => s.setBranch);
  const cartItems = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);
  const branches = useMenuStore((s) => s.branches);

  // فتح تلقائي عند أول زيارة (لا يوجد فرع مختار)
  useEffect(() => {
    const stored = useBranchStore.getState().branchId;
    if (!stored) openModal();
  }, [openModal]);

  function choose(id: string) {
    if (id === branchId) {
      close();
      return;
    }
    if (branchId && cartItems.length > 0) {
      const ok = window.confirm(
        "تغيير الفرع سيؤدي إلى تفريغ سلة المشتريات لأن المنتجات قد تختلف من فرع إلى آخر."
      );
      if (!ok) return;
      clearCart();
    }
    setBranch(id);
    const b = branches.find((x) => x.id === id);
    showToast(`تم اختيار ${b?.name}`);
    close();
  }

  if (!open) return null;

  const canClose = !!branchId;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
        onClick={() => canClose && close()}
      />
      <div className="relative z-10 max-h-[92vh] w-full max-w-2xl animate-pop-in overflow-y-auto rounded-xl3 bg-white p-5 shadow-lift">
        <div className="mb-1 text-center text-3xl">📍</div>
        <h2 className="text-center text-xl font-black text-ink">
          اختر الفرع الأقرب إليك لبدء الطلب
        </h2>
        <p className="mb-4 text-center text-sm text-gray-500">
          ستظهر لك المنتجات والأسعار المتوفرة في الفرع الذي تختاره.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {branches.map((b) => {
            const disabled = !b.isOpen;
            const selected = b.id === branchId;
            return (
              <button
                key={b.id}
                disabled={disabled}
                onClick={() => choose(b.id)}
                className={cn(
                  "flex flex-col gap-2 rounded-xl2 border-2 p-4 text-right transition",
                  disabled && "cursor-not-allowed opacity-50",
                  selected
                    ? "border-brand bg-brand/5"
                    : "border-cloud hover:border-brand-light hover:shadow-card"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl" aria-hidden="true">🏬</span>
                  <span
                    className={cn(
                      "chip",
                      b.isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                    )}
                  >
                    {b.isOpen ? "● مفتوح" : "● مغلق مؤقتًا"}
                  </span>
                </div>
                <div className="font-extrabold text-ink">{b.name}</div>
                <div className="text-sm text-gray-500">
                  {b.city} — {b.address}
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
                  <span>🛵 التوصيل: {b.deliveryTime}</span>
                  <span>💰 حد أدنى: {formatPrice(b.minOrder)}</span>
                  <span>🚚 التوصيل من: {formatPrice(b.deliveryFeeFrom)}</span>
                </div>
                {!disabled && (
                  <span
                    className={cn(
                      "mt-1 rounded-full py-2 text-center text-sm font-extrabold",
                      selected ? "bg-brand text-white" : "bg-cloud text-brand-dark"
                    )}
                  >
                    {selected ? "✓ الفرع المختار" : "اختيار هذا الفرع"}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {canClose && (
          <button
            onClick={close}
            className="mx-auto mt-4 block text-sm font-bold text-gray-400 hover:text-brand"
          >
            إغلاق
          </button>
        )}
      </div>
    </div>
  );
}
