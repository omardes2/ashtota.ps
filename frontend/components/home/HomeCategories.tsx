"use client";
import CategoryCard from "@/components/home/CategoryCard";
import { useMenuStore } from "@/store/useMenuStore";

export default function HomeCategories() {
  const categories = useMenuStore((s) => s.categories);
  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
      {categories.map((c) => (
        <CategoryCard key={c.id} category={c} />
      ))}
    </div>
  );
}
