import { Suspense } from "react";
import ProductsView from "@/components/products/ProductsView";

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="container-p py-10 text-center text-gray-400">جارٍ التحميل…</div>}>
      <ProductsView />
    </Suspense>
  );
}
