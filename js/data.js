/**
 * بيانات النظام (نسخة أولية MVP)
 * ------------------------------------------------------------
 * هذه البيانات ثابتة مؤقتًا داخل الملف لتشغيل الواجهة بسرعة.
 * لاحقًا يتم استبدالها بجلبها من قاعدة بيانات / API (PHP + MySQL)
 * عبر لوحة تحكم الإدارة كما هو موضح في التصور المبدئي.
 *
 * جميع الأسعار بالشيكل (₪).
 */

window.STORE = {
  brand: {
    name: "قشطوطة بلبن",
    tagline: "أشهى الحلويات بلبن.. من أقرب فرع إليك",
    currency: "₪",
    whatsapp: "970599000000", // بصيغة دولية بدون + أو أصفار بادئة
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
    tiktok: "https://tiktok.com/",
  },

  /* ------------------------- الفروع ------------------------- */
  branches: [
    {
      id: "b1",
      name: "فرع عين سارة",
      city: "الخليل",
      area: "عين سارة",
      phone: "022220001",
      whatsapp: "970599000001",
      address: "عين سارة – الشارع الرئيسي",
      isOpen: true,
      hours: "10:00 ص – 12:00 م",
      allowDelivery: true,
      allowPickup: true,
      minOrder: 20,
      prepTime: 20,
    },
    {
      id: "b2",
      name: "فرع رأس الجورة",
      city: "الخليل",
      area: "رأس الجورة",
      phone: "022220002",
      whatsapp: "970599000002",
      address: "رأس الجورة – بالقرب من الدوار",
      isOpen: true,
      hours: "11:00 ص – 11:30 م",
      allowDelivery: true,
      allowPickup: true,
      minOrder: 25,
      prepTime: 25,
    },
    {
      id: "b3",
      name: "فرع الحرس",
      city: "الخليل",
      area: "الحرس",
      phone: "022220003",
      whatsapp: "970599000003",
      address: "منطقة الحرس – الشارع العام",
      isOpen: false,
      hours: "10:00 ص – 11:00 م",
      allowDelivery: true,
      allowPickup: true,
      minOrder: 20,
      prepTime: 20,
    },
    {
      id: "b4",
      name: "فرع وسط البلد",
      city: "الخليل",
      area: "وسط البلد",
      phone: "022220004",
      whatsapp: "970599000004",
      address: "وسط البلد – السوق التجاري",
      isOpen: true,
      hours: "09:00 ص – 12:00 م",
      allowDelivery: false,
      allowPickup: true,
      minOrder: 15,
      prepTime: 15,
    },
  ],

  /* --------------------- مناطق التوصيل --------------------- */
  // مربوطة بالفرع، وتحدد سعر التوصيل والحد الأدنى للطلب
  deliveryZones: [
    { id: "z1", branchId: "b1", name: "عين سارة", fee: 10, minOrder: 20, freeOver: 80 },
    { id: "z2", branchId: "b1", name: "الحرس", fee: 12, minOrder: 25, freeOver: 90 },
    { id: "z3", branchId: "b2", name: "رأس الجورة", fee: 12, minOrder: 25, freeOver: 90 },
    { id: "z4", branchId: "b2", name: "منطقة بعيدة", fee: 20, minOrder: 40, freeOver: 120 },
    { id: "z5", branchId: "b3", name: "الحرس", fee: 10, minOrder: 20, freeOver: 80 },
    { id: "z6", branchId: "b4", name: "وسط البلد", fee: 8, minOrder: 15, freeOver: 70 },
  ],

  /* --------------------- التصنيفات --------------------- */
  categories: [
    { id: "c1", name: "قشطوطة", emoji: "🍮", order: 1 },
    { id: "c2", name: "بلبن", emoji: "🥛", order: 2 },
    { id: "c3", name: "أم علي", emoji: "🍲", order: 3 },
    { id: "c4", name: "كاسات وحلويات", emoji: "🍨", order: 4 },
    { id: "c5", name: "وافل وكريب", emoji: "🧇", order: 5 },
    { id: "c6", name: "بوكسات وعائلي", emoji: "🎁", order: 6 },
    { id: "c7", name: "مشروبات", emoji: "🥤", order: 7 },
  ],

  /* --------------------- مجموعات الإضافات --------------------- */
  // تُربط بالمنتجات عبر optionGroups
  optionGroups: {
    size: {
      id: "size",
      name: "اختر الحجم",
      required: true,
      min: 1,
      max: 1,
      options: [
        { id: "sm", name: "صغير", price: 0 },
        { id: "md", name: "وسط", price: 5 },
        { id: "lg", name: "كبير", price: 10 },
      ],
    },
    sauce: {
      id: "sauce",
      name: "اختر الصوص",
      required: false,
      min: 0,
      max: 2,
      options: [
        { id: "choco", name: "شوكولاتة", price: 0 },
        { id: "caramel", name: "كراميل", price: 0 },
        { id: "lotus", name: "لوتس", price: 3 },
      ],
    },
    extras: {
      id: "extras",
      name: "إضافات اختيارية",
      required: false,
      min: 0,
      max: 6,
      options: [
        { id: "pistachio", name: "فستق", price: 5 },
        { id: "oreo", name: "أوريو", price: 3 },
        { id: "nuts", name: "مكسرات", price: 5 },
        { id: "nutella", name: "نوتيلا", price: 6 },
        { id: "icecream", name: "آيس كريم", price: 6 },
      ],
    },
  },

  /* --------------------- المنتجات --------------------- */
  // availability: قائمة بالفروع المتوفر فيها المنتج مع سعر كل فرع
  products: [
    {
      id: "p1",
      name: "قشطوطة كلاسيك",
      categoryId: "c1",
      desc: "قشطة طازجة بلبن مع قطر وفستق حلبي.",
      emoji: "🍮",
      basePrice: 20,
      isFeatured: true,
      isNew: false,
      points: 20,
      optionGroups: ["size", "extras"],
      availability: [
        { branchId: "b1", price: 20, inStock: true },
        { branchId: "b2", price: 22, inStock: true },
        { branchId: "b3", price: 20, inStock: true },
        { branchId: "b4", price: 18, inStock: true },
      ],
    },
    {
      id: "p2",
      name: "كاسة بلبن",
      categoryId: "c2",
      desc: "بلبن غني بطبقات القشطة والمكسرات.",
      emoji: "🥛",
      basePrice: 18,
      salePrice: 15,
      isFeatured: true,
      isNew: false,
      points: 18,
      optionGroups: ["size", "sauce", "extras"],
      availability: [
        { branchId: "b1", price: 18, inStock: true },
        { branchId: "b2", price: 18, inStock: true },
        { branchId: "b4", price: 16, inStock: true },
      ],
    },
    {
      id: "p3",
      name: "أم علي بالمكسرات",
      categoryId: "c3",
      desc: "أم علي ساخنة بالحليب والقشطة والمكسرات المشكلة.",
      emoji: "🍲",
      basePrice: 22,
      isFeatured: false,
      isNew: true,
      points: 22,
      optionGroups: ["size", "extras"],
      availability: [
        { branchId: "b1", price: 22, inStock: true },
        { branchId: "b2", price: 24, inStock: true },
        { branchId: "b3", price: 22, inStock: false },
      ],
    },
    {
      id: "p4",
      name: "كاسة لوتس",
      categoryId: "c4",
      desc: "طبقات بسكويت لوتس مع كريمة وصوص لوتس.",
      emoji: "🍨",
      basePrice: 20,
      isFeatured: true,
      isNew: true,
      points: 20,
      optionGroups: ["size", "sauce", "extras"],
      availability: [
        { branchId: "b1", price: 20, inStock: true },
        { branchId: "b2", price: 20, inStock: true },
        { branchId: "b4", price: 19, inStock: true },
      ],
    },
    {
      id: "p5",
      name: "وافل بلجيكي",
      categoryId: "c5",
      desc: "وافل مقرمش مع نوتيلا وموز وآيس كريم.",
      emoji: "🧇",
      basePrice: 25,
      isFeatured: false,
      isNew: false,
      points: 25,
      optionGroups: ["sauce", "extras"],
      availability: [
        { branchId: "b1", price: 25, inStock: true },
        { branchId: "b2", price: 26, inStock: true },
      ],
    },
    {
      id: "p6",
      name: "بوكس عائلي مشكّل",
      categoryId: "c6",
      desc: "تشكيلة حلويات لبن تكفي 4-6 أشخاص.",
      emoji: "🎁",
      basePrice: 90,
      salePrice: 79,
      isFeatured: true,
      isNew: false,
      points: 90,
      optionGroups: ["extras"],
      availability: [
        { branchId: "b1", price: 90, inStock: true },
        { branchId: "b2", price: 95, inStock: true },
        { branchId: "b4", price: 85, inStock: true },
      ],
    },
    {
      id: "p7",
      name: "عصير طازج",
      categoryId: "c7",
      desc: "عصير فواكه طبيعي طازج حسب المتوفر.",
      emoji: "🥤",
      basePrice: 12,
      isFeatured: false,
      isNew: false,
      points: 12,
      optionGroups: ["size"],
      availability: [
        { branchId: "b1", price: 12, inStock: true },
        { branchId: "b2", price: 12, inStock: true },
        { branchId: "b3", price: 12, inStock: true },
        { branchId: "b4", price: 10, inStock: true },
      ],
    },
    {
      id: "p8",
      name: "كريب نوتيلا",
      categoryId: "c5",
      desc: "كريب طري محشو بالنوتيلا والفراولة.",
      emoji: "🌯",
      basePrice: 20,
      isFeatured: false,
      isNew: true,
      points: 20,
      optionGroups: ["sauce", "extras"],
      availability: [
        { branchId: "b1", price: 20, inStock: true },
        { branchId: "b4", price: 18, inStock: true },
      ],
    },
  ],
};
