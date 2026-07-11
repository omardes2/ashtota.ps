import Link from "next/link";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`} aria-label="قشطوطة بلبن">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-light to-brand text-2xl shadow-soft">
        <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
          <path
            d="M12 3c2.8 4 5 6.2 5 9a5 5 0 1 1-10 0c0-2.8 2.2-5 5-9Z"
            fill="#fff"
          />
          <circle cx="9.5" cy="8.5" r="1" fill="#55C2F2" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-lg font-black text-brand-dark">قشطوطة بلبن</span>
        <span className="text-[10px] font-bold tracking-wide text-brand">Qashtouta</span>
      </span>
    </Link>
  );
}
