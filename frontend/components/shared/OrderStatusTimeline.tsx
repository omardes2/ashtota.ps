const STEPS = [
  { key: "received", label: "تم استلام الطلب", emoji: "📥" },
  { key: "confirming", label: "الطلب قيد التأكيد", emoji: "✅" },
  { key: "preparing", label: "الطلب قيد التحضير", emoji: "👨‍🍳" },
  { key: "ready", label: "الطلب جاهز", emoji: "📦" },
  { key: "delivering", label: "الطلب قيد التوصيل", emoji: "🛵" },
  { key: "delivered", label: "تم تسليم الطلب", emoji: "🎉" },
];

export default function OrderStatusTimeline({ currentIndex = 2 }: { currentIndex?: number }) {
  return (
    <ol className="relative space-y-6 pr-6">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li key={step.key} className="relative">
            {i < STEPS.length - 1 && (
              <span
                className={`absolute right-[13px] top-8 h-full w-0.5 ${
                  done ? "bg-brand" : "bg-gray-200"
                }`}
                aria-hidden="true"
              />
            )}
            <div className="flex items-start gap-3">
              <span
                className={`z-10 grid h-7 w-7 place-items-center rounded-full text-sm ${
                  done
                    ? "bg-brand text-white"
                    : active
                    ? "bg-accent text-white ring-4 ring-accent/20"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {done ? "✓" : step.emoji}
              </span>
              <div className="pt-0.5">
                <p
                  className={`font-extrabold ${
                    active ? "text-brand-dark" : done ? "text-ink" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </p>
                {active && <p className="text-sm text-brand">جارٍ الآن…</p>}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
