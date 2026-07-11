const FEATURES = [
  { icon: "🌿", title: "مكونات طازجة", desc: "نختار الأفضل دائمًا" },
  { icon: "🛵", title: "توصيل سريع", desc: "لجميع المناطق" },
  { icon: "🔒", title: "دفع آمن", desc: "خيارات دفع متعددة" },
  { icon: "🎧", title: "خدمة عملاء", desc: "نحن هنا لخدمتك" },
];

export default function FeaturesSection() {
  return (
    <section className="container-p">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex flex-col items-center gap-1 rounded-xl2 bg-white p-5 text-center shadow-card">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-brand/10 text-2xl">{f.icon}</span>
            <h3 className="mt-1 font-extrabold text-ink">{f.title}</h3>
            <p className="text-xs text-gray-500">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
