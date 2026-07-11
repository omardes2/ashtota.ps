"use client";
import Link from "next/link";
import { useUiStore } from "@/store/useUiStore";
import { useBranchStore } from "@/store/useBranchStore";
import { useMenuStore } from "@/store/useMenuStore";

export default function HeroSection() {
  const openBranchModal = useUiStore((s) => s.openBranchModal);
  const branchId = useBranchStore((s) => s.branchId);
  const brand = useMenuStore((s) => s.brand);

  const title = brand.heroTitle || "طعم السعادة في كل لقمة";
  const subtitle =
    brand.heroSubtitle || brand.tagline || "حلويات طازجة، مكونات مختارة، ونكهات بتحبها من أول لقمة.";
  const titleLines = title.split("\n");

  function orderNow() {
    if (!branchId) openBranchModal();
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-bl from-brand-light via-brand to-brand-dark text-white">
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/40 blur-2xl" />
        <div className="absolute bottom-0 left-10 h-24 w-24 rounded-full bg-white/30 blur-xl" />
      </div>

      <div className="container-p relative grid items-center gap-6 py-10 md:grid-cols-2 md:py-16">
        <div className="order-2 text-center md:order-1 md:text-right">
          <h1 className="text-3xl font-black leading-tight md:text-5xl">
            {titleLines.map((line, i) => (
              <span key={i}>
                {line}
                {i < titleLines.length - 1 && <br />}
              </span>
            ))}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-white/90 md:mx-0">{subtitle}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
            <Link href="/products" onClick={orderNow} className="rounded-full bg-white px-7 py-3 font-extrabold text-brand-dark shadow-soft transition hover:bg-cloud active:scale-95">
              اطلب الآن
            </Link>
            <Link href="/products" className="rounded-full border-2 border-white/70 px-7 py-3 font-extrabold text-white transition hover:bg-white/10 active:scale-95">
              استعرض المنتجات
            </Link>
          </div>
        </div>

        <div className="order-1 flex justify-center md:order-2">
          {brand.heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={brand.heroImage}
              alt="بنر قشطوطة بلبن"
              className="max-h-72 w-full max-w-md rounded-xl3 object-cover shadow-lift"
            />
          ) : (
            <div className="relative grid h-56 w-56 place-items-center rounded-full bg-white/15 text-8xl backdrop-blur md:h-72 md:w-72 md:text-9xl">
              🍮
              <span className="absolute -right-2 top-6 text-4xl">💧</span>
              <span className="absolute bottom-6 -left-2 text-3xl">🥛</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
