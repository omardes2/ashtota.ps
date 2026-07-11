import type { CartItem, Product, ProductExtra, ProductSize } from "@/types";

// دمج أسماء الأصناف (بديل بسيط لـ clsx)
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

// حساب سعر الوحدة بناءً على الحجم والإضافات
export function computeUnitPrice(
  base: number,
  size?: ProductSize,
  extras: ProductExtra[] = []
): number {
  const sizeDelta = size?.priceDelta ?? 0;
  const extrasTotal = extras.reduce((s, e) => s + e.price, 0);
  return base + sizeDelta + extrasTotal;
}

// إنشاء مفتاح فريد لعنصر السلة
export function cartItemKey(
  productId: string,
  size?: ProductSize,
  extras: ProductExtra[] = [],
  note?: string
): string {
  const ex = [...extras].map((e) => e.id).sort().join(",");
  return `${productId}|${size?.id ?? "-"}|${ex}|${note ?? ""}`;
}

// هل المنتج متوفر في الفرع؟
export function isProductInBranch(product: Product, branchId: string | null): boolean {
  if (!branchId) return false;
  return product.isAvailable && product.availableBranches.includes(branchId);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((s, i) => s + i.qty, 0);
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
}
