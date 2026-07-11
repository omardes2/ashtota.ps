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
interface ApiOption { id: number; name: string; price: number }
interface ApiGroup { id: number; name: string; required: boolean; min: number; max: number; options: ApiOption[] }
interface ApiBranch { id: number; name: string; city: string; area: string; phone: string; whatsapp: string; address: string; isOpen: boolean; hours: string; allowDelivery: boolean; allowPickup: boolean; minOrder: number; prepTime: number }
interface ApiProduct { id: number; name: string; categoryId: number; desc: string; emoji: string; basePrice: number; salePrice: number | null; isFeatured: boolean; isNew: boolean; points: number; optionGroups: number[]; availability: { branchId: number; price: number; inStock: boolean }[] }
interface ApiZone { id: number; branchId: number; name: string; fee: number; minOrder: number; freeOver: number | null }
interface ApiBrand {
  name: string; tagline: string; whatsapp: string; instagram: string; facebook: string; tiktok: string;
  heroTitle: string; heroSubtitle: string; heroImage: string;
}
interface ApiMenu {
  ok: boolean;
  brand?: ApiBrand;
  branches: ApiBranch[];
  categories: { id: number; name: string; emoji: string; order: number }[];
  optionGroups: Record<string, ApiGroup>;
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
    id: S(c.id), name: c.name, slug: S(c.id), emoji: c.emoji || "🍽️",
  }));

  const products: Product[] = (api.products || []).map((p) => {
    const groups = (p.optionGroups || []).map((gid) => api.optionGroups[String(gid)]).filter(Boolean);
    // مجموعة الحجم: إجبارية واختيار واحد
    const sizeGroup = groups.find((g) => g.required && g.max === 1);
    const sizes: ProductSize[] = sizeGroup
      ? sizeGroup.options.map((o) => ({ id: S(o.id), name: o.name, priceDelta: o.price }))
      : [];
    const extras: ProductExtra[] = groups
      .filter((g) => g !== sizeGroup)
      .flatMap((g) => g.options.map((o) => ({ id: S(o.id), name: o.name, price: o.price })));

    const branchPrices: Record<string, number> = {};
    (p.availability || []).forEach((a) => { branchPrices[S(a.branchId)] = a.price; });
    const availableBranches = (p.availability || []).filter((a) => a.inStock).map((a) => S(a.branchId));

    return {
      id: S(p.id), name: p.name, slug: S(p.id),
      description: p.desc || "", category: S(p.categoryId), emoji: p.emoji || "🍮",
      price: p.salePrice ?? p.basePrice, oldPrice: p.salePrice ? p.basePrice : undefined,
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
  items: { productId: string; qty: number; options: { id: string }[]; note?: string }[];
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
          options: it.options.map((o) => ({ id: Number(o.id) })),
          note: it.note || "",
        })),
      }),
    });
    return await res.json();
  } catch {
    return { ok: false, error: "network" };
  }
}
