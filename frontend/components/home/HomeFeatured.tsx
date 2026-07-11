"use client";
import ProductGrid from "@/components/products/ProductGrid";
import EmptyState from "@/components/shared/EmptyState";
import { useMenuStore } from "@/store/useMenuStore";

export default function HomeFeatured() {
  const products = useMenuStore((s) => s.products);
  const featured = (products.filter((p) => p.isFeatured).length
    ? products.filter((p) => p.isFeatured)
    : products
  ).slice(0, 8);

  if (featured.length === 0) {
    return <EmptyState emoji="🍮" title="لا توجد منتجات بعد" subtitle="سيتم عرض المنتجات هنا فور إضافتها" />;
  }
  return <ProductGrid products={featured} />;
}
