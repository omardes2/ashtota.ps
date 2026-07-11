/**
 * المتحكم الرئيسي للتطبيق (Frontend MVP)
 */
const App = (() => {
  let activeCat = null;
  let currentProduct = null;
  let currentQty = 1;
  let checkoutMode = "delivery";

  /* ------------------ التهيئة ------------------ */
  function init() {
    document.getElementById("year").textContent = new Date().getFullYear();
    document.getElementById("heroTagline").textContent = STORE.brand.tagline;

    renderContact();
    renderSocials();
    setupWhatsApp();
    UI.renderCats(activeCat, onCatClick);
    UI.renderBranchesList();
    refreshMenu();
    refreshBranchPill();
    refreshCartBar();

    document.addEventListener("cart:change", () => { refreshCartBar(); rerenderOpenSheet(); });
    document.addEventListener("branch:change", () => {
      refreshBranchPill(); refreshMenu(); UI.renderBranchesList();
    });
  }

  function onCatClick(cat) {
    activeCat = cat;
    UI.renderCats(activeCat, onCatClick);
    refreshMenu();
  }

  function refreshMenu() { UI.renderMenu(Cart.getBranchId(), activeCat); }

  function refreshBranchPill() {
    const b = Cart.getBranch();
    const pill = document.getElementById("branchPill");
    const name = document.getElementById("branchPillName");
    if (b) {
      name.textContent = b.name;
      pill.classList.toggle("closed", !b.isOpen);
    } else {
      name.textContent = "اختر الفرع";
    }
  }

  function refreshCartBar() {
    const bar = document.getElementById("cartBar");
    const c = Cart.count();
    document.getElementById("cartCount").textContent = c;
    document.getElementById("cartTotal").textContent = UI.money(Cart.subtotal());
    bar.classList.toggle("show", c > 0);
  }

  /* ------------------ التواصل والسوشال ------------------ */
  function renderContact() {
    const el = document.getElementById("contactCards");
    const b = STORE.brand;
    el.innerHTML = `
      <a class="info-card" href="https://wa.me/${b.whatsapp}" target="_blank">
        <div class="ic">💬</div><div class="lbl">واتساب</div><div class="val">تواصل معنا</div></a>
      <div class="info-card"><div class="ic">🕒</div><div class="lbl">أوقات العمل</div><div class="val">يوميًا 10ص - 12م</div></div>
      <div class="info-card"><div class="ic">🏬</div><div class="lbl">عدد الفروع</div><div class="val">${STORE.branches.length} فروع</div></div>
      <div class="info-card"><div class="ic">🛵</div><div class="lbl">التوصيل</div><div class="val">متاح لأغلب المناطق</div></div>`;
  }

  function renderSocials() {
    const el = document.getElementById("socials");
    const b = STORE.brand;
    el.innerHTML = `
      <a href="${b.instagram}" target="_blank" title="انستغرام">📷</a>
      <a href="${b.facebook}" target="_blank" title="فيسبوك">📘</a>
      <a href="${b.tiktok}" target="_blank" title="تيك توك">🎵</a>
      <a href="https://wa.me/${b.whatsapp}" target="_blank" title="واتساب">💬</a>`;
  }

  function setupWhatsApp() {
    document.getElementById("waFloat").href = `https://wa.me/${STORE.brand.whatsapp}`;
  }

  /* ------------------ التنقل العام ------------------ */
  function goHome() { window.scrollTo({ top: 0, behavior: "smooth" }); }
  function startOrder() {
    if (!Cart.getBranchId()) { openBranchSheet(); }
    else { document.querySelector(".cats").scrollIntoView({ behavior: "smooth" }); }
  }

  /* ------------------ Sheets ------------------ */
  let openSheetType = null;

  function showSheet(html, type) {
    document.getElementById("sheet").innerHTML = html;
    document.getElementById("overlay").classList.add("show");
    document.body.style.overflow = "hidden";
    openSheetType = type;
  }
  function closeSheet() {
    document.getElementById("overlay").classList.remove("show");
    document.body.style.overflow = "";
    openSheetType = null;
    currentProduct = null;
  }
  function rerenderOpenSheet() {
    if (openSheetType === "cart") showSheet(UI.cartSheet(), "cart");
  }

  // إغلاق عند الضغط خارج الورقة
  document.addEventListener("click", e => {
    if (e.target.id === "overlay") closeSheet();
  });

  /* ------------------ الفروع ------------------ */
  function openBranchSheet() { showSheet(UI.branchSheet(Cart.getBranchId()), "branch"); }
  function chooseBranch(id) {
    const b = STORE.branches.find(x => x.id === id);
    if (b && !b.isOpen) {
      if (!confirm(`${b.name} مغلق حاليًا. هل تريد المتابعة على أي حال؟`)) return;
    }
    Cart.setBranch(id);
    toast(`تم اختيار ${b.name}`);
    closeSheet();
  }

  /* ------------------ المنتج ------------------ */
  function openProduct(pid) {
    const p = STORE.products.find(x => x.id === pid);
    if (!p) return;
    currentProduct = p;
    currentQty = 1;
    showSheet(UI.productSheet(p, Cart.getBranchId()), "product");
    bindOptionHandlers();
    updateAddPrice();
  }

  function bindOptionHandlers() {
    document.querySelectorAll(".opt-group[data-group] .opt").forEach(opt => {
      opt.addEventListener("click", () => {
        const group = opt.closest(".opt-group");
        const max = +group.dataset.max;
        const isRadio = max === 1;
        if (isRadio) {
          group.querySelectorAll(".opt").forEach(o => o.classList.remove("selected"));
          opt.classList.add("selected");
        } else {
          const selected = group.querySelectorAll(".opt.selected").length;
          if (!opt.classList.contains("selected") && selected >= max) {
            toast(`أقصى اختيار ${max}`); return;
          }
          opt.classList.toggle("selected");
        }
        updateAddPrice();
      });
    });
  }

  function collectOptions() {
    const opts = [];
    let valid = true;
    document.querySelectorAll(".opt-group[data-group]").forEach(group => {
      const sel = group.querySelectorAll(".opt.selected");
      const min = +group.dataset.min;
      const required = group.dataset.required === "true";
      if (required && sel.length < min) valid = false;
      sel.forEach(o => opts.push({ id: o.dataset.opt, name: o.dataset.name, price: +o.dataset.price }));
    });
    return { opts, valid };
  }

  function currentUnitPrice() {
    const base = +document.getElementById("optForm").dataset.base;
    const { opts } = collectOptions();
    return base + opts.reduce((s, o) => s + o.price, 0);
  }

  function updateAddPrice() {
    const el = document.getElementById("addPrice");
    if (el) el.textContent = UI.money(currentUnitPrice() * currentQty);
  }

  function qtyDelta(d) {
    currentQty = Math.max(1, currentQty + d);
    document.getElementById("qtyVal").textContent = currentQty;
    updateAddPrice();
  }

  function confirmAdd() {
    const { opts, valid } = collectOptions();
    if (!valid) { toast("يرجى اختيار الخيارات الإجبارية"); return; }
    const base = +document.getElementById("optForm").dataset.base;
    const note = document.getElementById("itemNote").value.trim();
    Cart.addItem({ productId: currentProduct.id, unitBase: base, qty: currentQty, options: opts, note });
    toast("✓ تمت الإضافة للسلة");
    closeSheet();
  }

  /* ------------------ السلة ------------------ */
  function openCart() { showSheet(UI.cartSheet(), "cart"); }
  function cartQty(uid, d) { Cart.updateQty(uid, d); }
  function cartRemove(uid) { Cart.remove(uid); }

  /* ------------------ الدفع ------------------ */
  function openCheckout() {
    const b = Cart.getBranch();
    if (!b) { toast("اختر الفرع أولًا"); return; }
    checkoutMode = b.allowDelivery ? "delivery" : "pickup";
    showSheet(UI.checkoutSheet(), "checkout");
    bindCheckout();
    updateCheckoutSummary();
  }

  function bindCheckout() {
    document.querySelectorAll("#modeSeg button").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#modeSeg button").forEach(x => x.classList.remove("active"));
        btn.classList.add("active");
        checkoutMode = btn.dataset.mode;
        document.getElementById("deliveryFields").classList.toggle("hidden", checkoutMode !== "delivery");
        updateCheckoutSummary();
      });
    });
    const zoneSel = document.getElementById("ckZone");
    if (zoneSel) zoneSel.addEventListener("change", updateCheckoutSummary);
  }

  function selectedZone() {
    const sel = document.getElementById("ckZone");
    if (!sel || !sel.value) return null;
    return STORE.deliveryZones.find(z => z.id === sel.value);
  }

  function updateCheckoutSummary() {
    document.getElementById("ckSummary").innerHTML =
      UI.checkoutSummary(checkoutMode, selectedZone());
  }

  function placeOrder() {
    const name = document.getElementById("ckName").value.trim();
    const phone = document.getElementById("ckPhone").value.trim();
    if (!name || !phone) { toast("يرجى إدخال الاسم ورقم الهاتف"); return; }

    const branch = Cart.getBranch();
    const mode = checkoutMode;
    const zone = selectedZone();

    if (mode === "delivery") {
      if (!zone) { toast("يرجى اختيار منطقة التوصيل"); return; }
      const address = document.getElementById("ckAddress").value.trim();
      if (!address) { toast("يرجى إدخال العنوان"); return; }
      if (Cart.subtotal() < zone.minOrder) {
        toast(`الحد الأدنى للطلب في ${zone.name} هو ${UI.money(zone.minOrder)}`); return;
      }
    }

    const fee = Cart.deliveryFee(zone, mode);
    const total = Cart.subtotal() + fee;
    const orderNo = "Q" + Date.now().toString().slice(-6);

    // بناء رسالة واتساب
    let msg = `*طلب جديد - قشطوطة بلبن* 🍮%0A`;
    msg += `رقم الطلب: ${orderNo}%0A`;
    msg += `الفرع: ${branch.name}%0A`;
    msg += `الاسم: ${name}%0A`;
    msg += `الهاتف: ${phone}%0A`;
    msg += `الاستلام: ${mode === "delivery" ? "توصيل" : "استلام من الفرع"}%0A`;
    if (mode === "delivery") {
      msg += `المنطقة: ${zone.name}%0A`;
      msg += `العنوان: ${document.getElementById("ckAddress").value.trim()}%0A`;
    }
    msg += `----------%0A`;
    Cart.items().forEach(it => {
      const p = STORE.products.find(x => x.id === it.productId);
      msg += `• ${p.name} ×${it.qty} = ${UI.money(it.lineTotal)}%0A`;
      if (it.options.length) msg += `   (${it.options.map(o => o.name).join("، ")})%0A`;
      if (it.note) msg += `   ملاحظة: ${it.note}%0A`;
    });
    const note = document.getElementById("ckNote").value.trim();
    if (note) msg += `ملاحظة الطلب: ${note}%0A`;
    msg += `----------%0A`;
    msg += `المجموع الفرعي: ${UI.money(Cart.subtotal())}%0A`;
    msg += `التوصيل: ${mode === "pickup" ? "-" : UI.money(fee)}%0A`;
    msg += `*الإجمالي: ${UI.money(total)}*%0A`;
    msg += `الدفع: نقدًا عند الاستلام`;

    const waNumber = branch.whatsapp || STORE.brand.whatsapp;
    window.open(`https://wa.me/${waNumber}?text=${msg}`, "_blank");

    toast("تم إرسال طلبك ✓");
    setTimeout(() => { Cart.clear(); closeSheet(); }, 800);
  }

  /* ------------------ Toast ------------------ */
  let toastTimer;
  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  return {
    init, goHome, startOrder, openBranchSheet, chooseBranch,
    openProduct, qtyDelta, confirmAdd, closeSheet,
    openCart, cartQty, cartRemove, openCheckout, placeOrder,
  };
})();

document.addEventListener("DOMContentLoaded", App.init);
