import type { Category } from "@/types";

export const categories: Category[] = [
  { id: "c1", name: "أم علي", slug: "om-ali", emoji: "🍲" },
  { id: "c2", name: "كاسات", slug: "cups", emoji: "🍨" },
  { id: "c3", name: "كيكة", slug: "cake", emoji: "🍰" },
  { id: "c4", name: "حلا بارد", slug: "cold", emoji: "🧁" },
  { id: "c5", name: "معجنات", slug: "pastry", emoji: "🥐" },
  { id: "c6", name: "مشروبات", slug: "drinks", emoji: "🥤" },
  { id: "c7", name: "عروض خاصة", slug: "offers", emoji: "🎁" },
  { id: "c8", name: "إضافات", slug: "extras", emoji: "✨" },
];

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
