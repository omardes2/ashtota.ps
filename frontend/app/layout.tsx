import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import MobileCartBar from "@/components/layout/MobileCartBar";
import BranchSelectorModal from "@/components/branches/BranchSelectorModal";
import ProductCustomizationModal from "@/components/products/ProductCustomizationModal";
import Toast from "@/components/shared/Toast";
import MenuLoader from "@/components/MenuLoader";

const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "قشطوطة بلبن | اطلب أونلاين",
  description:
    "قشطوطة بلبن — حلويات طازجة بلبن. اطلب أونلاين من أقرب فرع إليك في فلسطين. توصيل سريع واستلام من الفرع.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} font-sans bg-cloud antialiased`}>
        <MenuLoader />
        <Header />
        <main className="min-h-[60vh] pb-24 md:pb-0">{children}</main>
        <Footer />
        <MobileBottomNav />
        <MobileCartBar />
        <BranchSelectorModal />
        <ProductCustomizationModal />
        <Toast />
      </body>
    </html>
  );
}
