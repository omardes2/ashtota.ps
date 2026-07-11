import { branches } from "@/data/branches";
import { formatPrice } from "@/lib/currency";
import SectionHeader from "@/components/shared/SectionHeader";

export const metadata = { title: "الفروع | قشطوطة بلبن" };

export default function BranchesPage() {
  return (
    <div className="container-p py-6">
      <h1 className="mb-4 text-2xl font-black text-ink">فروعنا</h1>
      <SectionHeader title="اختر الأقرب إليك" />
      <div className="grid gap-4 md:grid-cols-2">
        {branches.map((b) => (
          <div key={b.id} className="rounded-xl2 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-2xl">🏬</span>
                <div>
                  <h3 className="font-extrabold text-ink">{b.name}</h3>
                  <p className="text-sm text-gray-500">{b.city} — {b.address}</p>
                </div>
              </div>
              <span className={`chip ${b.isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                {b.isOpen ? "مفتوح" : "مغلق"}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-gray-500">
              <div className="rounded-xl bg-cloud p-2"><div className="font-black text-brand-dark">{b.deliveryTime}</div>وقت التوصيل</div>
              <div className="rounded-xl bg-cloud p-2"><div className="font-black text-brand-dark">{formatPrice(b.minOrder)}</div>حد أدنى</div>
              <div className="rounded-xl bg-cloud p-2"><div className="font-black text-brand-dark">{formatPrice(b.deliveryFeeFrom)}</div>التوصيل من</div>
            </div>
            {b.whatsapp && (
              <a href={`https://wa.me/${b.whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn-ghost mt-3 w-full">💬 تواصل مع الفرع</a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
