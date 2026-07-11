// أنواع البيانات المشتركة

export interface Branch {
  id: string;
  name: string;
  city: string;
  address: string;
  isOpen: boolean;
  deliveryTime: string; // مثال: "30 - 45 دقيقة"
  minOrder: number;
  deliveryFeeFrom: number;
  phone?: string;
  whatsapp?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string;
}

export interface ProductSize {
  id: string;
  name: string; // صغير / وسط / كبير
  priceDelta: number; // فرق السعر عن السعر الأساسي
}

export interface ProductExtra {
  id: string;
  name: string;
  price: number; // 0 = مجاني
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  ingredients?: string;
  category: string; // slug التصنيف
  emoji: string; // بديل الصورة مؤقتًا
  image?: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviewsCount: number;
  preparationTime: string;
  availableBranches: string[]; // ids الفروع
  sizes: ProductSize[];
  extras: ProductExtra[];
  isFeatured?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  isAvailable: boolean;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  emoji: string;
  badge?: string;
}

export interface CartItem {
  key: string; // مفتاح فريد (product + size + extras)
  productId: string;
  name: string;
  emoji: string;
  basePrice: number;
  size?: ProductSize;
  extras: ProductExtra[];
  note?: string;
  qty: number;
  unitPrice: number; // السعر بعد الحجم والإضافات
}

export type OrderMode = "delivery" | "pickup";
export type PaymentMethod = "cash" | "card" | "wallet";

export interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
}
