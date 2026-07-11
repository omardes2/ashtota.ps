"use client";
import Link from "next/link";
import Logo from "@/components/shared/Logo";
import { useMenuStore } from "@/store/useMenuStore";

export default function Footer() {
  const site = useMenuStore((s) => s.site);
  const brand = useMenuStore((s) => s.brand);
  const branches = useMenuStore((s) => s.branches);

  const wa = brand.whatsapp ? `https://wa.me/${brand.whatsapp.replace(/[^\d]/g, "")}` : "https://wa.me/970599000000";
  const year = new Date().getFullYear();

  return (
    <footer className="mt-10 border-t border-cloud bg-ink text-white/85">
      <div className="container-p grid gap-8 py-10 md:grid-cols-4">
        <div className="space-y-3">
          <div className="rounded-2xl bg-white/95 p-2">
            <Logo />
          </div>
          <p className="text-sm leading-relaxed text-white/70">
            {site.footerAbout ||
              "حلويات طازجة بلبن، محضّرة يوميًا من مكونات مختارة. اطلب من أقرب فرع واستمتع بطعم السعادة في كل لقمة."}
          </p>
        </div>

        <div>
          <h4 className="mb-3 font-extrabold text-white">روابط سريعة</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/products" className="hover:text-brand-light">المنتجات</Link></li>
            <li><Link href="/offers" className="hover:text-brand-light">العروض</Link></li>
            <li><Link href="/about" className="hover:text-brand-light">من نحن</Link></li>
            <li><Link href="/contact" className="hover:text-brand-light">تواصل معنا</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 font-extrabold text-white">فروعنا</h4>
          <ul className="space-y-2 text-sm text-white/70">
            {branches.map((b) => (
              <li key={b.id}>
                {b.name}{b.address ? ` — ${b.address}` : ""}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 font-extrabold text-white">تواصل معنا</h4>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-bold text-white"
          >
            💬 واتساب
          </a>
          <div className="mt-4 flex gap-2">
            <a href={brand.facebook || "#"} target="_blank" rel="noopener noreferrer" aria-label="فيسبوك" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
              </svg>
            </a>
            <a href={brand.instagram || "#"} target="_blank" rel="noopener noreferrer" aria-label="انستغرام" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 1.8c-3.15 0-3.5.01-4.74.07-1.14.05-1.76.24-2.17.4-.55.22-.94.47-1.35.88-.41.41-.66.8-.88 1.35-.16.41-.35 1.03-.4 2.17-.06 1.24-.07 1.59-.07 4.74s.01 3.5.07 4.74c.05 1.14.24 1.76.4 2.17.22.55.47.94.88 1.35.41.41.8.66 1.35.88.41.16 1.03.35 2.17.4 1.24.06 1.59.07 4.74.07s3.5-.01 4.74-.07c1.14-.05 1.76-.24 2.17-.4.55-.22.94-.47 1.35-.88.41-.41.66-.8.88-1.35.16-.41.35-1.03.4-2.17.06-1.24.07-1.59.07-4.74s-.01-3.5-.07-4.74c-.05-1.14-.24-1.76-.4-2.17a3.6 3.6 0 0 0-.88-1.35 3.6 3.6 0 0 0-1.35-.88c-.41-.16-1.03-.35-2.17-.4-1.24-.06-1.59-.07-4.74-.07Zm0 3.06a4.98 4.98 0 1 0 0 9.96 4.98 4.98 0 0 0 0-9.96Zm0 8.21a3.23 3.23 0 1 1 0-6.46 3.23 3.23 0 0 1 0 6.46Zm6.34-8.41a1.16 1.16 0 1 1-2.33 0 1.16 1.16 0 0 1 2.33 0Z" />
              </svg>
            </a>
            <a href={brand.tiktok || "#"} target="_blank" rel="noopener noreferrer" aria-label="تيك توك" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M16.6 5.82a4.28 4.28 0 0 1-1.05-2.82h-3.1v12.4a2.53 2.53 0 0 1-2.53 2.53 2.53 2.53 0 1 1 .7-4.96v-3.16a5.67 5.67 0 0 0-.7-.05 5.68 5.68 0 1 0 5.68 5.68V9.01a7.35 7.35 0 0 0 4.3 1.38V7.28a4.28 4.28 0 0 1-3.3-1.46Z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-p flex flex-col items-center justify-between gap-2 py-4 text-xs text-white/60 md:flex-row">
          <span>{site.footerCopyright || `قشطوطة بلبن © ${year} — جميع الحقوق محفوظة`}</span>
          <div className="flex gap-4">
            <Link href="/about" className="hover:text-brand-light">سياسة الخصوصية</Link>
            <Link href="/about" className="hover:text-brand-light">الشروط والأحكام</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
