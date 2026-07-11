/**
 * دوال العرض (Rendering) – تبني HTML للأقسام المختلفة
 */
const UI = (() => {
  const money = (n) => `${(+n).toFixed(0)} ${STORE.brand.currency}`;

  /* ------------------ التصنيفات ------------------ */
  function renderCats(activeId, onClick) {
    const bar = document.getElementById("catsBar");
    const cats = [...STORE.categories].sort((a, b) => a.order - b.order);
    bar.innerHTML =
      `<button class="cat-chip ${!activeId ? "active" : ""}" data-id="">الكل</button>` +
      cats.map(c => `<button class="cat-chip ${activeId === c.id ? "active" : ""}" data-id="${c.id}">${c.emoji} ${c.name}</button>`).join("");
    bar.querySelectorAll(".cat-chip").forEach(chip =>
      chip.addEventListener("click", () => onClick(chip.dataset.id || null)));
  }

  /* ------------------ قائمة المنتجات ------------------ */
  function renderMenu(branchId, activeCat) {
    const area = document.getElementById("menuArea");
    if (!branchId) {
      area.innerHTML = `<div class="empty"><div class="e-emoji">🏬</div>
        <p>اختر فرعًا أولًا لعرض المنتجات والأسعار المتوفرة</p>
        <button class="cta" style="margin-top:14px" onclick="App.openBranchSheet()">اختر الفرع</button></div>`;
      return;
    }

    let products = STORE.products.filter(p =>
      p.availability.some(a => a.branchId === branchId));
    if (activeCat) products = products.filter(p => p.categoryId === activeCat);

    if (!products.length) {
      area.innerHTML = `<div class="empty"><div class="e-emoji">🔍</div><p>لا توجد منتجات في هذا التصنيف بالفرع الحالي</p></div>`;
      return;
    }

    const cats = [...STORE.categories].sort((a, b) => a.order - b.order);
    let html = "";
    const groups = activeCat ? [cats.find(c => c.id === activeCat)] : cats;

    groups.filter(Boolean).forEach(cat => {
      const inCat = products.filter(p => p.categoryId === cat.id);
      if (!inCat.length) return;
      html += `<div class="section-title">${cat.emoji} ${cat.name}</div><div class="grid">`;
      html += inCat.map(p => productCard(p, branchId)).join("");
      html += `</div>`;
    });
    area.innerHTML = html;

    area.querySelectorAll("[data-product]").forEach(el =>
      el.addEventListener("click", () => App.openProduct(el.dataset.product)));
  }

  function productCard(p, branchId) {
    const av = p.availability.find(a => a.branchId === branchId);
    const price = av ? av.price : p.basePrice;
    const inStock = av && av.inStock;
    const badges = [];
    if (p.isNew) badges.push(`<span class="badge new">جديد</span>`);
    if (p.isFeatured) badges.push(`<span class="badge hot">مميز</span>`);
    if (p.salePrice) badges.push(`<span class="badge off">خصم</span>`);

    return `
      <div class="card" ${inStock ? `data-product="${p.id}"` : ""}>
        ${badges.join("")}
        <div class="thumb">${p.emoji || "🍮"}</div>
        <div class="body">
          <div class="name">${p.name}</div>
          <div class="desc">${p.desc || ""}</div>
          <div class="price-row">
            <span class="price">${money(price)}</span>
            ${p.salePrice ? `<span class="old-price">${money(p.basePrice)}</span>` : ""}
          </div>
          <button class="add-btn" ${inStock ? "" : "disabled"}>
            ${inStock ? "＋ أضف للسلة" : "غير متوفر حاليًا"}
          </button>
        </div>
      </div>`;
  }

  /* ------------------ نافذة المنتج ------------------ */
  function productSheet(p, branchId) {
    const av = p.availability.find(a => a.branchId === branchId);
    const base = av ? av.price : p.basePrice;
    const groups = (p.optionGroups || []).map(gid => STORE.optionGroups[gid]).filter(Boolean);

    return `
      <div class="sheet-head">
        <h3>${p.name}</h3>
        <button class="sheet-close" onclick="App.closeSheet()">✕</button>
      </div>
      <div class="sheet-body">
        <div class="product-hero">${p.emoji || "🍮"}</div>
        <p style="color:var(--muted);margin-bottom:8px">${p.desc || ""}</p>
        <div style="font-weight:800;color:var(--caramel);margin-bottom:16px">السعر الأساسي: ${money(base)}</div>

        <form id="optForm" data-base="${base}" data-product="${p.id}">
          ${groups.map(optGroup).join("")}
          <div class="opt-group">
            <div class="og-title">📝 ملاحظات <span class="opt-tag">اختياري</span></div>
            <textarea class="notes-input" id="itemNote" placeholder="مثال: بدون مكسرات، تغليف هدية..."></textarea>
          </div>
        </form>
      </div>
      <div class="sheet-foot">
        <div class="qty">
          <button type="button" onclick="App.qtyDelta(-1)">−</button>
          <span id="qtyVal">1</span>
          <button type="button" onclick="App.qtyDelta(1)">＋</button>
        </div>
        <button class="big-btn" id="addToCartBtn" onclick="App.confirmAdd()">
          أضف للسلة · <span id="addPrice">${money(base)}</span>
        </button>
      </div>`;
  }

  function optGroup(g) {
    const isRadio = g.max === 1;
    return `
      <div class="opt-group" data-group="${g.id}" data-min="${g.min}" data-max="${g.max}" data-required="${g.required}">
        <div class="og-title">${g.name}
          ${g.required ? `<span class="req-tag">إجباري</span>` : `<span class="opt-tag">اختياري</span>`}
        </div>
        ${g.options.map(o => `
          <label class="opt ${isRadio ? "radio" : ""}" data-opt="${o.id}" data-price="${o.price}" data-name="${o.name}">
            <span class="o-check">✓</span>
            <span class="o-name">${o.name}</span>
            <span class="o-price">${o.price > 0 ? "+" + money(o.price) : "مجاني"}</span>
            <input type="${isRadio ? "radio" : "checkbox"}" name="g_${g.id}" hidden />
          </label>`).join("")}
      </div>`;
  }

  /* ------------------ السلة ------------------ */
  function cartSheet() {
    const items = Cart.items();
    if (!items.length) {
      return `
        <div class="sheet-head"><h3>🛒 سلة المشتريات</h3>
          <button class="sheet-close" onclick="App.closeSheet()">✕</button></div>
        <div class="sheet-body">
          <div class="empty"><div class="e-emoji">🛒</div><p>السلة فارغة</p>
            <button class="cta" style="margin-top:14px" onclick="App.closeSheet()">تصفح المنيو</button></div>
        </div>`;
    }
    return `
      <div class="sheet-head"><h3>🛒 سلة المشتريات</h3>
        <button class="sheet-close" onclick="App.closeSheet()">✕</button></div>
      <div class="sheet-body">
        ${items.map(cartItemRow).join("")}
        <div class="summary">
          <div class="row"><span>المجموع الفرعي</span><span>${money(Cart.subtotal())}</span></div>
          <div class="row"><span>النقاط المكتسبة</span><span class="g">+${Cart.points()} نقطة</span></div>
        </div>
        <button class="big-btn brown" style="margin-top:14px" onclick="App.openCheckout()">متابعة الطلب ←</button>
      </div>`;
  }

  function cartItemRow(it) {
    const p = STORE.products.find(x => x.id === it.productId);
    const optsTxt = it.options.map(o => o.name).join("، ");
    return `
      <div class="cart-item">
        <div class="ci-emoji">${p ? p.emoji : "🍮"}</div>
        <div class="ci-body">
          <div class="ci-name">${p ? p.name : "منتج"}</div>
          ${optsTxt ? `<div class="ci-opts">${optsTxt}</div>` : ""}
          ${it.note ? `<div class="ci-opts">📝 ${it.note}</div>` : ""}
          <div class="ci-foot">
            <div class="qty">
              <button onclick="App.cartQty('${it.uid}',-1)">−</button>
              <span>${it.qty}</span>
              <button onclick="App.cartQty('${it.uid}',1)">＋</button>
            </div>
            <span class="ci-price">${money(it.lineTotal)}</span>
          </div>
          <div style="margin-top:6px"><button class="ci-remove" onclick="App.cartRemove('${it.uid}')">🗑 حذف</button></div>
        </div>
      </div>`;
  }

  /* ------------------ الفروع ------------------ */
  function branchSheet(selectedId) {
    return `
      <div class="sheet-head"><h3>🏬 اختر الفرع</h3>
        <button class="sheet-close" onclick="App.closeSheet()">✕</button></div>
      <div class="sheet-body">
        <p style="color:var(--muted);margin-bottom:12px">اختر الفرع الأقرب لك لعرض المنتجات والأسعار المتوفرة فيه.</p>
        ${STORE.branches.map(b => branchCard(b, selectedId, true)).join("")}
      </div>`;
  }

  function branchCard(b, selectedId, inSheet) {
    return `
      <div class="branch-card ${selectedId === b.id ? "selected" : ""}" ${inSheet ? `onclick="App.chooseBranch('${b.id}')"` : ""}>
        <div class="b-icon">🏬</div>
        <div class="b-info">
          <div class="b-name">${b.name}</div>
          <div class="b-meta">${b.area} · ${b.hours}</div>
          <div class="b-status ${b.isOpen ? "open" : "closed"}">${b.isOpen ? "● مفتوح الآن" : "● مغلق"}</div>
        </div>
        <button class="b-choose">${selectedId === b.id ? "✓ محدد" : "اختيار"}</button>
      </div>`;
  }

  function renderBranchesList() {
    const el = document.getElementById("branchesList");
    el.innerHTML = STORE.branches.map(b => branchCard(b, Cart.getBranchId(), true)).join("");
  }

  /* ------------------ الدفع / إتمام الطلب ------------------ */
  function checkoutSheet() {
    const branch = Cart.getBranch();
    const zones = STORE.deliveryZones.filter(z => z.branchId === (branch && branch.id));
    const allowDelivery = branch && branch.allowDelivery;
    const allowPickup = branch && branch.allowPickup;

    return `
      <div class="sheet-head"><h3>إتمام الطلب</h3>
        <button class="sheet-close" onclick="App.closeSheet()">✕</button></div>
      <div class="sheet-body">
        <div class="field">
          <label>طريقة الاستلام</label>
          <div class="seg" id="modeSeg">
            ${allowDelivery ? `<button data-mode="delivery" class="active">🛵 توصيل</button>` : ""}
            ${allowPickup ? `<button data-mode="pickup" ${!allowDelivery ? "class=active" : ""}>🏬 استلام من الفرع</button>` : ""}
          </div>
        </div>

        <div class="field"><label>الاسم</label><input id="ckName" placeholder="اسمك الكامل" /></div>
        <div class="field"><label>رقم الهاتف</label><input id="ckPhone" type="tel" placeholder="05xxxxxxxx" /></div>

        <div id="deliveryFields" class="${allowDelivery ? "" : "hidden"}">
          <div class="field">
            <label>منطقة التوصيل</label>
            <select id="ckZone">
              <option value="">— اختر المنطقة —</option>
              ${zones.map(z => `<option value="${z.id}">${z.name} (توصيل ${money(z.fee)})</option>`).join("")}
            </select>
          </div>
          <div class="field"><label>العنوان بالتفصيل</label>
            <textarea class="notes-input" id="ckAddress" placeholder="الحي، الشارع، العمارة، الطابق، علامة مميزة..."></textarea></div>
        </div>

        <div class="field"><label>طريقة الدفع</label>
          <select id="ckPay"><option value="cash">💵 نقدًا عند الاستلام</option></select>
        </div>

        <div class="field"><label>ملاحظة على الطلب</label>
          <textarea class="notes-input" id="ckNote" placeholder="أي ملاحظة إضافية..."></textarea></div>

        <div class="summary" id="ckSummary"></div>
        <button class="big-btn" style="margin-top:14px" onclick="App.placeOrder()">
          ✓ تأكيد الطلب
        </button>
        <p style="text-align:center;color:var(--muted);font-size:.8rem;margin-top:10px">
          سيصل طلبك إلى الفرع مباشرة وسيتم تجهيزه.
        </p>
      </div>`;
  }

  function checkoutSummary(mode, zone) {
    const sub = Cart.subtotal();
    const fee = Cart.deliveryFee(zone, mode);
    const total = sub + fee;
    return `
      <div class="row"><span>المجموع الفرعي</span><span>${money(sub)}</span></div>
      <div class="row"><span>التوصيل</span><span>${mode === "pickup" ? "—" : (fee === 0 ? '<span class="g">مجاني</span>' : money(fee))}</span></div>
      <div class="row"><span>النقاط المكتسبة</span><span class="g">+${Cart.points()} نقطة</span></div>
      <div class="row total"><span>الإجمالي</span><span>${money(total)}</span></div>`;
  }

  /* ------------------ صفحة الشكر ------------------ */
  function thankYouSheet(orderNo, total, branch, mode) {
    return `
      <div class="thankyou">
        <div class="ty-check">✓</div>
        <h2>شكرًا لطلبك من قشطوطة بلبن 🍮</h2>
        <p class="ty-sub">تم استلام طلبك بنجاح وسيتم تجهيزه.</p>
        <div class="ty-card">
          <div class="ty-row"><span>رقم الطلب</span><b>${orderNo}</b></div>
          <div class="ty-row"><span>الفرع</span><b>${branch ? branch.name : "-"}</b></div>
          <div class="ty-row"><span>طريقة الاستلام</span><b>${mode === "pickup" ? "استلام من الفرع" : "توصيل"}</b></div>
          <div class="ty-row total"><span>الإجمالي</span><b>${money(total)}</b></div>
        </div>
        <p class="ty-note">سنتواصل معك لتأكيد الطلب عند الحاجة.</p>
        <button class="big-btn" onclick="App.finishOrder()">العودة للرئيسية</button>
      </div>`;
  }

  return {
    money, renderCats, renderMenu, productSheet, cartSheet, branchSheet,
    renderBranchesList, checkoutSheet, checkoutSummary, thankYouSheet,
  };
})();
