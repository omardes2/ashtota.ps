import Link from "next/link";

export default function EmptyState({
  emoji = "🛒",
  title,
  subtitle,
  actionLabel,
  actionHref,
}: {
  emoji?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="text-6xl" aria-hidden="true">
        {emoji}
      </div>
      <h3 className="text-lg font-extrabold text-ink">{title}</h3>
      {subtitle && <p className="max-w-sm text-gray-500">{subtitle}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-primary mt-2">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
