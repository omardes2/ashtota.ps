import Link from "next/link";

export default function OfferBanner() {
  return (
    <section className="container-p">
      <div className="relative overflow-hidden rounded-xl3 bg-gradient-to-l from-brand-dark to-brand p-6 text-white md:p-10">
        <div className="pointer-events-none absolute -left-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-xl" />
        <div className="relative flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="text-center md:text-right">
            <span className="chip bg-accent text-ink">عروض خاصة</span>
            <h2 className="mt-3 text-2xl font-black md:text-3xl">عروض خاصة بطعم أحلى</h2>
            <p className="mt-1 text-white/85">خصومات وهدايا بانتظارك</p>
            <Link href="/offers" className="mt-4 inline-flex rounded-full bg-white px-6 py-3 font-extrabold text-brand-dark transition hover:bg-cloud active:scale-95">
              استعرض العروض
            </Link>
          </div>
          <div className="text-7xl md:text-8xl" aria-hidden="true">🍨</div>
        </div>
      </div>
    </section>
  );
}
