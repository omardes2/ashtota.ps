import Link from "next/link";
import Logo from "@/components/shared/Logo";
import { branches } from "@/data/branches";

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-cloud bg-ink text-white/85">
      <div className="container-p grid gap-8 py-10 md:grid-cols-4">
        <div className="space-y-3">
          <div className="rounded-2xl bg-white/95 p-2">
            <Logo />
          </div>
          <p className="text-sm leading-relaxed text-white/70">
            حلويات طازجة بلبن، محضّرة يوميًا من مكونات مختارة. اطلب من أقرب فرع
            واستمتع بطعم السعادة في كل لقمة.
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
                {b.name} — {b.address}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 font-extrabold text-white">تواصل معنا</h4>
          <a
            href="https://wa.me/970599000000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-bold text-white"
          >
            💬 واتساب
          </a>
          <div className="mt-4 flex gap-2">
            <a href="#" aria-label="انستغرام" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20">📷</a>
            <a href="#" aria-label="فيسبوك" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20">📘</a>
            <a href="#" aria-label="تيك توك" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20">🎵</a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-p flex flex-col items-center justify-between gap-2 py-4 text-xs text-white/60 md:flex-row">
          <span>قشطوطة بلبن © {new Date().getFullYear()} — جميع الحقوق محفوظة</span>
          <div className="flex gap-4">
            <Link href="/about" className="hover:text-brand-light">سياسة الخصوصية</Link>
            <Link href="/about" className="hover:text-brand-light">الشروط والأحكام</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
