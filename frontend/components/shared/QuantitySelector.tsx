"use client";

export default function QuantitySelector({
  qty,
  onDec,
  onInc,
}: {
  qty: number;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border-2 border-cloud bg-white p-1">
      <button
        type="button"
        onClick={onDec}
        aria-label="إنقاص الكمية"
        className="grid h-9 w-9 place-items-center rounded-full bg-cloud text-xl font-black text-brand-dark transition hover:bg-brand/10 active:scale-90"
      >
        −
      </button>
      <span className="min-w-8 text-center text-lg font-extrabold" aria-live="polite">
        {qty}
      </span>
      <button
        type="button"
        onClick={onInc}
        aria-label="زيادة الكمية"
        className="grid h-9 w-9 place-items-center rounded-full bg-cloud text-xl font-black text-brand-dark transition hover:bg-brand/10 active:scale-90"
      >
        +
      </button>
    </div>
  );
}
