import Link from "next/link";
import type { Category } from "@/types";

export default function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/products?category=${category.slug}`}
      className="group flex min-w-[120px] flex-col items-center gap-2 rounded-xl2 bg-white p-4 shadow-card transition hover:-translate-y-1 hover:shadow-lift"
    >
      {category.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={category.image}
          alt={category.name}
          className="h-16 w-16 rounded-full object-cover transition group-hover:scale-110"
        />
      ) : (
        <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-brand-light/30 to-brand/15 text-3xl transition group-hover:scale-110">
          {category.emoji}
        </span>
      )}
      <span className="text-sm font-extrabold text-ink">{category.name}</span>
    </Link>
  );
}
