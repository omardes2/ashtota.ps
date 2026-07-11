"use client";
import { useBranchStore } from "@/store/useBranchStore";
import { useUiStore } from "@/store/useUiStore";
import { useHydrated } from "@/lib/useHydrated";
import { getBranch } from "@/data/branches";

export default function SelectedBranchCard() {
  const hydrated = useHydrated();
  const branchId = useBranchStore((s) => s.branchId);
  const openBranchModal = useUiStore((s) => s.openBranchModal);
  const branch = getBranch(branchId);

  return (
    <div className="container-p -mt-6 relative z-10">
      <div className="flex flex-col items-center gap-3 rounded-xl3 bg-white p-4 shadow-lift sm:flex-row sm:items-center">
        {hydrated && branch ? (
          <>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-2xl">🏬</span>
            <div className="flex-1 text-center sm:text-right">
              <div className="text-xs font-bold text-gray-400">أنت تطلب الآن من</div>
              <div className="font-black text-ink">{branch.name}</div>
              <div className="text-sm text-gray-500">
                {branch.address} · 🛵 {branch.deliveryTime} ·{" "}
                <span className={branch.isOpen ? "text-green-600" : "text-red-500"}>
                  {branch.isOpen ? "مفتوح" : "مغلق"}
                </span>
              </div>
            </div>
            <button onClick={openBranchModal} className="btn-ghost">تغيير الفرع</button>
          </>
        ) : (
          <>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-2xl">📍</span>
            <div className="flex-1 text-center sm:text-right">
              <div className="font-black text-ink">اختر الفرع للبدء</div>
              <div className="text-sm text-gray-500">حدد الفرع الأقرب لعرض المنتجات والأسعار</div>
            </div>
            <button onClick={openBranchModal} className="btn-primary">اختر الفرع للبدء</button>
          </>
        )}
      </div>
    </div>
  );
}
