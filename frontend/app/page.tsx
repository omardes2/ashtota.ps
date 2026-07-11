import HeroSection from "@/components/home/HeroSection";
import SelectedBranchCard from "@/components/home/SelectedBranchCard";
import HomeCategories from "@/components/home/HomeCategories";
import HomeFeatured from "@/components/home/HomeFeatured";
import OfferBanner from "@/components/home/OfferBanner";
import FeaturesSection from "@/components/home/FeaturesSection";
import SectionHeader from "@/components/shared/SectionHeader";

export default function HomePage() {
  return (
    <div className="space-y-10 pb-10">
      <HeroSection />
      <SelectedBranchCard />

      <section className="container-p">
        <SectionHeader title="تسوّق حسب القسم" moreHref="/products" />
        <HomeCategories />
      </section>

      <section className="container-p">
        <SectionHeader title="منتجاتنا المميزة" moreHref="/products" />
        <HomeFeatured />
      </section>

      <OfferBanner />
      <FeaturesSection />
    </div>
  );
}
