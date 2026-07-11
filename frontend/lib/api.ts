import type {
  Branch,
  Category,
  DeliveryZone,
  Product,
  ProductExtra,
  ProductSize,
} from "@/types";

// المسار النسبي للـ backend (نفس النطاق على الاستضافة)
const API_BASE = "/api";

/* ------------ أشكال استجابة menu.php ------------ */
interface ApiBranch { id: number; name: string; city: string; area: string; phone: string; whatsapp: string; address: string; isOpen: boolean; hours: string; allowDelivery: boolean; allowPickup: boolean; minOrder: number; prepTime: number }
interface ApiSize { id: string; name: string; price: number }
interface ApiExtra { id: string; name: string; price: number }
interface ApiProduct { id: number; name: string; categoryId: number; desc: string; emoji: string; image: string; basePrice: number; salePrice: number | null; hasSizes: boolean; sizes: ApiSize[]; extras: ApiExtra[]; isFeatured: boolean; isNew: boolean; points: number; availability: { branchId: number; price: number; inStock: boolean }[] }
interface ApiZone { id: number; branchId: number; name: string; fee: number; minOrder: number; freeOver: number | null }
interface ApiBrand {
  name: string; tagline: string; whatsapp: string; instagram: string; facebook: string; tiktok: string;
  heroTitle: string; heroSubtitle: string; heroImage: string;
}
interface ApiMenu {
  ok: boolean;
  brand?: ApiBrand;
  branches: ApiBranch[];
  categories: { id: number; name: string; emoji: string; image: string; order: number }[];
  products: ApiProduct[];
  deliveryZones: ApiZone[];
}

export interface BrandInfo {
  name: string;
  tagline: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
}

export interface MappedMenu {
  brand: BrandInfo;
  branches: Branch[];
  categories: Category[];
  products: Product[];
  zones: DeliveryZone[];
}

const S = (v: number | string) => String(v);

function mapMenu(api: ApiMenu): MappedMenu {
  const zones: DeliveryZone[] = (api.deliveryZones || []).map((z) => ({
    id: S(z.id), branchId: S(z.branchId), name: z.name, fee: z.fee,
    minOrder: z.minOrder, freeOver: z.freeOver,
  }));

  const feeFrom: Record<string, number> = {};
  zones.forEach((z) => {
    if (feeFrom[z.branchId] === undefined || z.fee < feeFrom[z.branchId]) feeFrom[z.branchId] = z.fee;
  });

  const branches: Branch[] = (api.branches || []).map((b) => ({
    id: S(b.id), name: b.name, city: b.city, address: b.address,
    isOpen: b.isOpen, deliveryTime: `${b.prepTime} - ${b.prepTime + 15} دقيقة`,
    minOrder: b.minOrder, deliveryFeeFrom: feeFrom[S(b.id)] ?? 0,
    phone: b.phone, whatsapp: b.whatsapp,
  }));

  const categories: Category[] = (api.categories || []).map((c) => ({
    id: S(c.id), name: c.name, slug: S(c.id), emoji: c.emoji || "🍽️", image: c.image || undefined,
  }));

  const products: Product[] = (api.products || []).map((p) => {
    const sizes: ProductSize[] = (p.sizes || []).map((s) => ({ id: s.id, name: s.name, price: s.price }));
    const extras: ProductExtra[] = (p.extras || []).map((e) => ({ id: e.id, name: e.name, price: e.price }));

    const branchPrices: Record<string, number> = {};
    (p.availability || []).forEach((a) => { branchPrices[S(a.branchId)] = a.price; });
    const availableBranches = (p.availability || []).filter((a) => a.inStock).map((a) => S(a.branchId));

    // سعر العرض في البطاقة: أقل حجم إن وُجدت أحجام، وإلا السعر الأساسي
    const displayPrice = p.hasSizes && sizes.length ? Math.min(...sizes.map((s) => s.price)) : (p.salePrice ?? p.basePrice);

    return {
      id: S(p.id), name: p.name, slug: S(p.id),
      description: p.desc || "", category: S(p.categoryId),
      emoji: p.emoji || "🍮", image: p.image || undefined, hasSizes: !!p.hasSizes,
      price: displayPrice,
      oldPrice: !p.hasSizes && p.salePrice ? p.basePrice : undefined,
      rating: 4.7, reviewsCount: 0, preparationTime: "—",
      availableBranches, sizes, extras,
      isFeatured: p.isFeatured, isNew: p.isNew, isBestSeller: p.isFeatured,
      isAvailable: availableBranches.length > 0,
      branchPrices,
    };
  });

  const b = api.brand;
  const brand: BrandInfo = {
    name: b?.name || "قشطوطة بلبن",
    tagline: b?.tagline || "",
    whatsapp: b?.whatsapp || "",
    instagram: b?.instagram || "",
    facebook: b?.facebook || "",
    tiktok: b?.tiktok || "",
    heroTitle: b?.heroTitle || "",
    heroSubtitle: b?.heroSubtitle || "",
    heroImage: b?.heroImage || "",
  };

  return { brand, branches, categories, products, zones };
}

// جلب المنيو من قاعدة البيانات؛ يُرجع null عند الفشل (فيُستخدم البديل التجريبي)
export async function fetchMenu(): Promise<MappedMenu | null> {
  try {
    const res = await fetch(`${API_BASE}/menu.php`, { cache: "no-store" });
    if (!res.ok) return null;
    const data: ApiMenu = await res.json();
    if (!data || !data.ok) return null;
    return mapMenu(data);
  } catch {
    return null;
  }
}

/* ------------ إرسال الطلب ------------ */
export interface SubmitOrderInput {
  branchId: string;
  name: string;
  phone: string;
  mode: "delivery" | "pickup";
  zoneId?: string | null;
  address?: string;
  note?: string;
  items: { productId: string; qty: number; sizeId?: string | null; options: { id: string }[]; note?: string }[];
}

export interface SubmitOrderResult {
  ok: boolean;
  error?: string;
  orderNo?: string;
  total?: number;
  deliveryFee?: number;
  min?: number;
}

export async function submitOrder(input: SubmitOrderInput): Promise<SubmitOrderResult> {
  try {
    const res = await fetch(`${API_BASE}/order.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        branchId: Number(input.branchId),
        name: input.name,
        phone: input.phone,
        mode: input.mode,
        zoneId: input.zoneId ? Number(input.zoneId) : null,
        address: input.address || "",
        note: input.note || "",
        items: input.items.map((it) => ({
          productId: Number(it.productId),
          qty: it.qty,
          sizeId: it.sizeId || null,
          options: it.options.map((o) => ({ id: o.id })), // "e0" strings
          note: it.note || "",
        })),
      }),
    });
    return await res.json();
  } catch {
    return { ok: false, error: "network" };
  }
}
