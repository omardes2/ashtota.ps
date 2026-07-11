import Link from "next/link";

export default function SectionHeader({
  title,
  moreHref,
}: {
  title: string;
  moreHref?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-xl font-black text-ink">
        <span className="h-6 w-1.5 rounded-full bg-gradient-to-b from-brand-light to-brand" />
        {title}
      </h2>
      {moreHref && (
        <Link href={moreHref} className="text-sm font-bold text-brand hover:underline">
          عرض الكل
        </Link>
      )}
    </div>
  );
}
