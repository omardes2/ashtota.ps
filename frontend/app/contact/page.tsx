"use client";
import { useState } from "react";
import { useUiStore } from "@/store/useUiStore";
import { useMenuStore } from "@/store/useMenuStore";

export default function ContactPage() {
  const showToast = useUiStore((s) => s.showToast);
  const site = useMenuStore((s) => s.site);
  const brand = useMenuStore((s) => s.brand);
  const branches = useMenuStore((s) => s.branches);
  const [sent, setSent] = useState(false);

  const wa = brand.whatsapp ? `https://wa.me/${brand.whatsapp.replace(/[^\d]/g, "")}` : "https://wa.me/970599000000";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
    showToast("تم إرسال رسالتك، سنتواصل معك قريبًا");
  }

  return (
    <div className="container-p py-8">
      <h1 className="mb-2 text-2xl font-black text-ink">{site.contactTitle || "تواصل معنا"}</h1>
      {site.contactContent && (
        <p className="mb-6 whitespace-pre-line leading-relaxed text-gray-600">{site.contactContent}</p>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        <form onSubmit={submit} className="card space-y-3 p-5">
          <label className="block">
            <span className="mb-1 block text-sm font-bold">الاسم</span>
            <input required className="w-full rounded-xl2 border-2 border-cloud px-3 py-2 outline-none focus:border-brand-light" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-bold">رقم الهاتف</span>
            <input required type="tel" className="w-full rounded-xl2 border-2 border-cloud px-3 py-2 outline-none focus:border-brand-light" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-bold">رسالتك</span>
            <textarea required className="min-h-[100px] w-full rounded-xl2 border-2 border-cloud p-3 outline-none focus:border-brand-light" />
          </label>
          <button className="btn-primary w-full" disabled={sent}>{sent ? "تم الإرسال ✓" : "إرسال"}</button>
        </form>

        <div className="space-y-4">
          <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl2 bg-white p-5 shadow-card">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#25D366]/15 text-2xl">💬</span>
            <div><div className="font-extrabold text-ink">واتساب</div><div className="text-sm text-gray-500">تواصل معنا مباشرة</div></div>
          </a>
          <div className="card p-5">
            <h3 className="mb-3 font-extrabold text-brand-dark">أرقام الفروع</h3>
            <ul className="space-y-2 text-sm">
              {branches.map((b) => (
                <li key={b.id} className="flex justify-between border-b border-cloud py-1 last:border-0">
                  <span className="text-gray-600">{b.name}</span>
                  <span className="font-bold text-ink" dir="ltr">{b.phone}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
