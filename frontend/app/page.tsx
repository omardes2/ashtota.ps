import HeroSection from "@/components/home/HeroSection";
import SelectedBranchCard from "@/components/home/SelectedBranchCard";
import CategoryCard from "@/components/home/CategoryCard";
import OfferBanner from "@/components/home/OfferBanner";
import FeaturesSection from "@/components/home/FeaturesSection";
import ProductGrid from "@/components/products/ProductGrid";
import SectionHeader from "@/components/shared/SectionHeader";
import { categories } from "@/data/categories";
import { products } from "@/data/products";

export default function HomePage() {
  const featured = products.filter((p) => p.isFeatured).slice(0, 8);

  return (
    <div className="space-y-10 pb-10">
      <HeroSection />
      <SelectedBranchCard />

      <section className="container-p">
        <SectionHeader title="تسوّق حسب القسم" moreHref="/products" />
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
          {categories.map((c) => (
            <CategoryCard key={c.id} category={c} />
          ))}
        </div>
      </section>

      <section className="container-p">
        <SectionHeader title="منتجاتنا المميزة" moreHref="/products" />
        <ProductGrid products={featured} />
      </section>

      <OfferBanner />
      <FeaturesSection />
    </div>
  );
}
