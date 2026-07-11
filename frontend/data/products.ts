import type { Product, ProductExtra, ProductSize } from "@/types";

// أحجام قياسية مشتركة (بيانات تجريبية احتياطية فقط)
const SIZES: ProductSize[] = [
  { id: "s0", name: "صغير", price: 18 },
  { id: "s1", name: "وسط", price: 23 },
  { id: "s2", name: "كبير", price: 28 },
];

// إضافات قياسية مشتركة
const EXTRAS: ProductExtra[] = [
  { id: "choco", name: "شوكولاتة إضافية", price: 4 },
  { id: "pistachio", name: "فستق", price: 5 },
  { id: "caramel", name: "صوص كراميل", price: 3 },
  { id: "strawberry", name: "فراولة", price: 4 },
  { id: "icecream", name: "آيس كريم", price: 6 },
  { id: "none", name: "بدون إضافة", price: 0 },
];

const ALL = ["khalil", "ramallah", "nablus", "bethlehem"];

function p(x: Partial<Product> & Pick<Product, "id" | "name" | "slug" | "category" | "emoji" | "price">): Product {
  return {
    description: "حلوى طازجة محضّرة يوميًا من مكونات مختارة بنكهة لا تُقاوم.",
    ingredients: "حليب طازج، قشطة، سكر، مكسرات.",
    rating: 4.6,
    reviewsCount: 40,
    preparationTime: "15 دقيقة",
    availableBranches: ["khalil", "ramallah", "nablus"],
    sizes: SIZES,
    extras: EXTRAS,
    isAvailable: true,
    ...x,
  } as Product;
}

export const products: Product[] = [
  p({ id: "p1", name: "أم علي قشطة", slug: "om-ali-eshta", category: "om-ali", emoji: "🍲", price: 18, rating: 4.8, reviewsCount: 120, isBestSeller: true, isFeatured: true, description: "أم علي ساخنة بالحليب والقشطة الطازجة والمكسرات." }),
  p({ id: "p2", name: "أم علي شوكولاتة", slug: "om-ali-choco", category: "om-ali", emoji: "🍫", price: 20, oldPrice: 24, rating: 4.7, isNew: true, description: "أم علي بلمسة شوكولاتة غنية ومكسرات محمصة." }),
  p({ id: "p3", name: "أم علي فستق", slug: "om-ali-pistachio", category: "om-ali", emoji: "🥜", price: 22, rating: 4.9, isFeatured: true, description: "أم علي فاخرة بالفستق الحلبي والقشطة." }),
  p({ id: "p4", name: "كاسات لوتس", slug: "cups-lotus", category: "cups", emoji: "🍮", price: 16, rating: 4.9, reviewsCount: 210, isBestSeller: true, isFeatured: true, description: "طبقات بسكويت لوتس مع كريمة وصوص لوتس." }),
  p({ id: "p5", name: "كاسات أوريو", slug: "cups-oreo", category: "cups", emoji: "🍪", price: 16, rating: 4.7, description: "كريمة ناعمة مع قطع أوريو مقرمشة." }),
  p({ id: "p6", name: "كاسات فراولة", slug: "cups-strawberry", category: "cups", emoji: "🍓", price: 16, oldPrice: 19, rating: 4.8, isFeatured: true, description: "كاسة منعشة بالفراولة الطازجة والكريمة." }),
  p({ id: "p7", name: "كاسات شوكولاتة", slug: "cups-choco", category: "cups", emoji: "🍫", price: 16, rating: 4.6, description: "كاسة شوكولاتة غنية بطبقات متعددة." }),
  p({ id: "p8", name: "كيكة شوكولاتة", slug: "cake-choco", category: "cake", emoji: "🍰", price: 20, rating: 4.7, isFeatured: true, description: "قطعة كيكة شوكولاتة طرية بحشوة غنية." }),
  p({ id: "p9", name: "كيكة لوتس", slug: "cake-lotus", category: "cake", emoji: "🎂", price: 22, rating: 4.8, isNew: true, description: "كيكة لوتس ناعمة بطبقة كراميل." }),
  p({ id: "p10", name: "حلا بارد مانجو", slug: "cold-mango", category: "cold", emoji: "🥭", price: 18, rating: 4.6, description: "حلا بارد منعش بطبقات المانجو والكريمة." }),
  p({ id: "p11", name: "حلا بارد فراولة", slug: "cold-strawberry", category: "cold", emoji: "🍓", price: 18, rating: 4.7, description: "حلا بارد بالفراولة والبسكويت." }),
  p({ id: "p12", name: "كريب شوكولاتة", slug: "crepe-choco", category: "pastry", emoji: "🌯", price: 20, rating: 4.7, isBestSeller: true, description: "كريب طري محشو بالنوتيلا والموز." }),
  p({ id: "p13", name: "وافل فواكه", slug: "waffle-fruits", category: "pastry", emoji: "🧇", price: 25, rating: 4.8, isFeatured: true, description: "وافل مقرمش مع فواكه طازجة وآيس كريم." }),
  p({ id: "p14", name: "مشروب شوكولاتة بارد", slug: "cold-choco-drink", category: "drinks", emoji: "🥤", price: 14, rating: 4.5, sizes: [{ id: "s0", name: "وسط", price: 14 }, { id: "s1", name: "كبير", price: 18 }], description: "مشروب شوكولاتة بارد ومنعش." }),
  p({ id: "p15", name: "عصير فراولة", slug: "strawberry-juice", category: "drinks", emoji: "🧃", price: 12, rating: 4.6, sizes: [{ id: "s0", name: "وسط", price: 14 }, { id: "s1", name: "كبير", price: 18 }], description: "عصير فراولة طبيعي طازج." }),
  p({ id: "p16", name: "بوكس العائلة", slug: "family-box", category: "offers", emoji: "🎁", price: 79, oldPrice: 95, rating: 4.9, reviewsCount: 88, isFeatured: true, isBestSeller: true, availableBranches: ["khalil", "ramallah", "nablus"], sizes: [], description: "تشكيلة حلويات لبن تكفي 4-6 أشخاص." }),
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function productsInBranch(branchId: string | null): Product[] {
  if (!branchId) return products;
  return products.filter((p) => p.availableBranches.includes(branchId));
}
