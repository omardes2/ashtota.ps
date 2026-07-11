/**
 * إدارة السلة + حالة الفرع (تُحفظ في localStorage)
 */
const Cart = (() => {
  const KEY = "qashtoota_cart_v1";
  const BRANCH_KEY = "qashtoota_branch_v1";

  let state = load() || { items: [] };

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
  }
  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
    document.dispatchEvent(new CustomEvent("cart:change"));
  }

  /* ------------------ الفرع ------------------ */
  function getBranchId() { return localStorage.getItem(BRANCH_KEY); }
  function setBranch(id) {
    const prev = getBranchId();
    localStorage.setItem(BRANCH_KEY, id);
    // تغيير الفرع قد يجعل بعض منتجات السلة غير متوفرة
    if (prev && prev !== id && state.items.length) {
      pruneUnavailable(id);
    }
    document.dispatchEvent(new CustomEvent("branch:change"));
  }
  function getBranch() {
    return STORE.branches.find(b => b.id === getBranchId()) || null;
  }

  // حذف المنتجات غير المتوفرة في الفرع الجديد وتحديث الأسعار
  function pruneUnavailable(branchId) {
    state.items = state.items.filter(it => {
      const p = STORE.products.find(x => x.id === it.productId);
      const av = p && p.availability.find(a => a.branchId === branchId && a.inStock);
      if (av) { it.unitBase = av.price; recalcItem(it); return true; }
      return false;
    });
    save();
  }

  /* ------------------ العناصر ------------------ */
  function priceForBranch(product, branchId) {
    const av = product.availability.find(a => a.branchId === branchId);
    return av ? av.price : product.basePrice;
  }

  function recalcItem(it) {
    const optsTotal = it.options.reduce((s, o) => s + (o.price || 0), 0);
    it.unitPrice = it.unitBase + optsTotal;
    it.lineTotal = it.unitPrice * it.qty;
  }

  function addItem({ productId, unitBase, qty, options, note }) {
    const it = {
      uid: "u" + Date.now() + Math.floor(performance.now()),
      productId, unitBase, qty, options: options || [], note: note || "",
    };
    recalcItem(it);
    state.items.push(it);
    save();
  }

  function updateQty(uid, delta) {
    const it = state.items.find(x => x.uid === uid);
    if (!it) return;
    it.qty = Math.max(1, it.qty + delta);
    recalcItem(it);
    save();
  }
  function remove(uid) {
    state.items = state.items.filter(x => x.uid !== uid);
    save();
  }
  function clear() { state.items = []; save(); }

  /* ------------------ الحسابات ------------------ */
  function count() { return state.items.reduce((s, it) => s + it.qty, 0); }
  function subtotal() { return state.items.reduce((s, it) => s + it.lineTotal, 0); }
  function points() { // تقدير النقاط: 1 نقطة لكل شيكل
    return Math.round(subtotal());
  }
  function items() { return state.items; }

  function deliveryFee(zone, orderMode) {
    if (orderMode === "pickup" || !zone) return 0;
    if (zone.freeOver && subtotal() >= zone.freeOver) return 0;
    return zone.fee;
  }

  return {
    getBranchId, setBranch, getBranch,
    priceForBranch, addItem, updateQty, remove, clear,
    count, subtotal, points, items, deliveryFee,
  };
})();
