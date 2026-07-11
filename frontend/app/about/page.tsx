import FeaturesSection from "@/components/home/FeaturesSection";

export const metadata = { title: "من نحن | قشطوطة بلبن" };

export default function AboutPage() {
  return (
    <div className="container-p py-8">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-brand-light to-brand text-4xl text-white shadow-soft">🍮</div>
        <h1 className="mt-4 text-3xl font-black text-ink">قشطوطة بلبن</h1>
        <p className="mt-3 leading-relaxed text-gray-600">
          قشطوطة بلبن علامة فلسطينية متخصّصة في الحلويات الطازجة بلبن. نحضّر منتجاتنا
          يوميًا من مكونات مختارة بعناية، لنقدّم لك طعم السعادة في كل لقمة. نخدمكم عبر
          فروعنا في الخليل ورام الله ونابلس وبيت لحم، مع خدمة توصيل سريعة وطلب أونلاين سهل.
        </p>
      </div>

      <div className="mt-8">
        <FeaturesSection />
      </div>

      <div className="mx-auto mt-8 grid max-w-3xl gap-4 md:grid-cols-3">
        {[
          { n: "4", l: "فروع" },
          { n: "+16", l: "منتجًا" },
          { n: "طازج", l: "يوميًا" },
        ].map((s) => (
          <div key={s.l} className="rounded-xl2 bg-white p-6 text-center shadow-card">
            <div className="text-3xl font-black text-brand">{s.n}</div>
            <div className="text-sm text-gray-500">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
