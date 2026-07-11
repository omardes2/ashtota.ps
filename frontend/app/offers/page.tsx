"use client";
import Link from "next/link";
import { offers } from "@/data/offers";
import SectionHeader from "@/components/shared/SectionHeader";
import { useMenuStore } from "@/store/useMenuStore";

export default function OffersPage() {
  const site = useMenuStore((s) => s.site);

  return (
    <div className="container-p py-6">
      <div className="mb-6 overflow-hidden rounded-xl3 bg-gradient-to-l from-brand-dark to-brand p-8 text-center text-white">
        <h1 className="text-3xl font-black">{site.offersTitle || "عروض خاصة بطعم أحلى 🎉"}</h1>
        <p className="mt-2 whitespace-pre-line text-white/85">
          {site.offersContent || "خصومات وهدايا بانتظارك — استفد منها الآن"}
        </p>
      </div>

      <SectionHeader title="جميع العروض" />
      <div className="grid gap-4 md:grid-cols-2">
        {offers.map((o) => (
          <div key={o.id} className="flex items-center gap-4 rounded-xl2 bg-white p-5 shadow-card">
            <span className="grid h-16 w-16 flex-shrink-0 place-items-center rounded-2xl bg-brand/10 text-3xl">{o.emoji}</span>
            <div className="flex-1">
              {o.badge && <span className="chip bg-accent text-ink">{o.badge}</span>}
              <h3 className="mt-1 font-extrabold text-ink">{o.title}</h3>
              <p className="text-sm text-gray-500">{o.description}</p>
            </div>
            <Link href="/products" className="btn-ghost whitespace-nowrap">اطلب</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
