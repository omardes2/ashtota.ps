/* لوحة تحكم قشطوطة بلبن */
const API = "../api/admin/";
let CSRF = "", ADMIN = null, META = { optionGroups: [], settings: {} }, BRANCHES = [], CATS = [];

/* ------------- API ------------- */
async function call(action, data = {}) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-CSRF": CSRF },
    body: JSON.stringify({ action, ...data }),
  });
  let j;
  try { j = await res.json(); } catch { j = { ok: false, error: "bad_json" }; }
  return j;
}

/* ------------- عناصر ------------- */
const $ = (s) => document.querySelector(s);
const content = $("#content");
const CUR = "₪";
const money = (n) => `${(+n % 1 ? (+n).toFixed(2) : +n)} ${CUR}`;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const STATUS_LABELS = {
  new: "جديد", confirmed: "مؤكد", preparing: "قيد التحضير", ready: "جاهز",
  out_for_delivery: "قيد التوصيل", delivered: "تم التسليم", completed: "مكتمل",
  cancelled: "ملغي", rejected: "مرفوض",
};

/* ------------- دخول ------------- */
$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("#lgErr").textContent = "";
  const r = await call("login", { username: $("#lgUser").value.trim(), password: $("#lgPass").value });
  if (r.ok) { CSRF = r.csrf; ADMIN = r.admin; enterApp(); }
  else $("#lgErr").textContent = "اسم المستخدم أو كلمة المرور غير صحيحة";
});

$("#logoutBtn").addEventListener("click", async () => { await call("logout"); location.reload(); });

async function boot() {
  const r = await call("me");
  if (r.ok) { CSRF = r.csrf; ADMIN = r.admin; enterApp(); }
  else { $("#loginScreen").classList.remove("hidden"); }
}

async function enterApp() {
  $("#loginScreen").classList.add("hidden");
  $("#app").classList.remove("hidden");
  $("#whoName").textContent = "👤 " + (ADMIN.name || ADMIN.username);
  // تحميل بيانات مشتركة
  const m = await call("meta"); if (m.ok) META = m;
  const b = await call("branches_list"); if (b.ok) BRANCHES = b.branches;
  const c = await call("categories_list"); if (c.ok) CATS = c.categories;
  navTo("dashboard");
}

/* ------------- تنقل ------------- */
$("#nav").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-view]"); if (!btn) return;
  document.querySelectorAll("#nav button").forEach(x => x.classList.remove("active"));
  btn.classList.add("active");
  navTo(btn.dataset.view);
  $("#sidebar").classList.remove("open");
});
$("#menuToggle").addEventListener("click", () => $("#sidebar").classList.toggle("open"));

const TITLES = { dashboard: "لوحة القيادة", orders: "الطلبات", products: "المنتجات", branches: "الفروع", categories: "التصنيفات", zones: "مناطق التوصيل", settings: "الإعدادات" };
function navTo(view) {
  $("#viewTitle").textContent = TITLES[view] || "";
  content.innerHTML = `<div class="empty">جارِ التحميل…</div>`;
  ({ dashboard: viewDashboard, orders: viewOrders, products: viewProducts, branches: viewBranches, categories: viewCategories, zones: viewZones, settings: viewSettings }[view] || (() => {}))();
}

/* ------------- لوحة القيادة ------------- */
async function viewDashboard() {
  const r = await call("dashboard");
  if (!r.ok) return content.innerHTML = err(r);
  const s = r.stats;
  const bs = s.byStatus || {};
  content.innerHTML = `
    <div class="stat-grid">
      <div class="stat accent"><div class="n">${s.todayCount}</div><div class="l">طلبات اليوم</div></div>
      <div class="stat accent"><div class="n">${money(s.todaySales)}</div><div class="l">مبيعات اليوم</div></div>
      <div class="stat"><div class="n">${bs.new || 0}</div><div class="l">طلبات جديدة</div></div>
      <div class="stat"><div class="n">${bs.preparing || 0}</div><div class="l">قيد التحضير</div></div>
      <div class="stat"><div class="n">${bs.out_for_delivery || 0}</div><div class="l">قيد التوصيل</div></div>
      <div class="stat"><div class="n">${(bs.completed || 0) + (bs.delivered || 0)}</div><div class="l">مكتملة</div></div>
      <div class="stat"><div class="n">${s.totalOrders}</div><div class="l">إجمالي الطلبات</div></div>
      <div class="stat"><div class="n">${s.products}</div><div class="l">المنتجات</div></div>
      <div class="stat"><div class="n">${s.branches}</div><div class="l">الفروع</div></div>
    </div>
    <div class="panel"><div class="panel-head"><h2>أحدث الطلبات</h2><span class="sp"></span>
      <button class="btn-ghost btn-sm" onclick="document.querySelector('[data-view=orders]').click()">عرض الكل</button></div>
      <div id="recentOrders" class="empty">…</div></div>`;
  const o = await call("orders_list");
  if (o.ok) $("#recentOrders").innerHTML = ordersTable(o.orders.slice(0, 8));
}

/* ------------- الطلبات ------------- */
let ordersFilter = "";
async function viewOrders() {
  const chips = ["", "new", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "completed", "cancelled"];
  const r = await call("orders_list", { status: ordersFilter });
  content.innerHTML = `
    <div class="panel">
      <div class="chip-row">
        ${chips.map(c => `<button class="chip ${ordersFilter === c ? "active" : ""}" data-f="${c}">${c === "" ? "الكل" : STATUS_LABELS[c]}</button>`).join("")}
      </div>
      <div id="ordersBody">${r.ok ? ordersTable(r.orders) : err(r)}</div>
    </div>`;
  content.querySelectorAll(".chip[data-f]").forEach(ch => ch.addEventListener("click", () => { ordersFilter = ch.dataset.f; viewOrders(); }));
}

function ordersTable(orders) {
  if (!orders.length) return `<div class="empty">لا توجد طلبات</div>`;
  return `<div class="table-wrap"><table>
    <thead><tr><th>رقم</th><th>الزبون</th><th>الفرع</th><th>النوع</th><th>الإجمالي</th><th>الحالة</th><th>الوقت</th><th></th></tr></thead>
    <tbody>${orders.map(o => `
      <tr>
        <td><b>${esc(o.order_no)}</b></td>
        <td>${esc(o.customer_name)}<br><span class="muted">${esc(o.phone)}</span></td>
        <td>${esc(o.branch_name || "-")}</td>
        <td>${o.mode === "delivery" ? "🛵 توصيل" : "🏬 استلام"}</td>
        <td><b>${money(o.total)}</b></td>
        <td><span class="badge b-${o.status}">${STATUS_LABELS[o.status] || o.status}</span></td>
        <td class="muted">${esc((o.created_at || "").slice(5, 16))}</td>
        <td><button class="btn-ghost btn-sm" onclick="openOrder(${o.id})">تفاصيل</button></td>
      </tr>`).join("")}</tbody></table></div>`;
}

async function openOrder(id) {
  const r = await call("order_get", { id });
  if (!r.ok) return toast("تعذّر التحميل");
  const o = r.order, items = r.items;
  const flow = ["new", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "completed"];
  modal(`طلب ${esc(o.order_no)}`, `
    <div class="field"><b>الزبون:</b> ${esc(o.customer_name)} — ${esc(o.phone)}</div>
    <div class="field"><b>الفرع:</b> ${esc(o.branch_name)} · <b>النوع:</b> ${o.mode === "delivery" ? "توصيل" : "استلام"}</div>
    ${o.mode === "delivery" ? `<div class="field"><b>المنطقة:</b> ${esc(o.zone_name || "-")}<br><b>العنوان:</b> ${esc(o.address || "-")}</div>` : ""}
    ${o.note ? `<div class="field"><b>ملاحظة:</b> ${esc(o.note)}</div>` : ""}
    <div class="panel"><div class="table-wrap"><table><thead><tr><th>المنتج</th><th>كمية</th><th>السعر</th></tr></thead>
      <tbody>${items.map(it => `<tr><td>${esc(it.name)}${it.options_text ? `<br><span class="muted">${esc(it.options_text)}</span>` : ""}${it.note ? `<br><span class="muted">📝 ${esc(it.note)}</span>` : ""}</td><td>${it.qty}</td><td>${money(it.line_total)}</td></tr>`).join("")}</tbody></table></div></div>
    <div class="field"><b>المجموع الفرعي:</b> ${money(o.subtotal)} · <b>التوصيل:</b> ${money(o.delivery_fee)} · <b>الإجمالي:</b> ${money(o.total)}</div>
    <div class="field"><label>تغيير الحالة</label>
      <select id="ordStatus">${Object.keys(STATUS_LABELS).map(s => `<option value="${s}" ${o.status === s ? "selected" : ""}>${STATUS_LABELS[s]}</option>`).join("")}</select>
    </div>
  `, [
    { label: "حفظ الحالة", cls: "btn-primary", fn: async () => {
      const st = $("#ordStatus").value;
      const rr = await call("order_status", { id, status: st });
      if (rr.ok) { toast("تم تحديث الحالة"); closeModal(); viewOrders(); } else toast("خطأ");
    } },
  ]);
}

/* ------------- المنتجات ------------- */
async function viewProducts() {
  const r = await call("products_list");
  if (!r.ok) return content.innerHTML = err(r);
  content.innerHTML = `
    <div class="panel">
      <div class="panel-head"><h2>المنتجات (${r.products.length})</h2><span class="sp"></span>
        <button class="btn-primary btn-sm" onclick="editProduct()">＋ منتج جديد</button></div>
      <div class="table-wrap"><table>
        <thead><tr><th>المنتج</th><th>التصنيف</th><th>السعر</th><th>الفروع</th><th>الحالة</th><th></th></tr></thead>
        <tbody>${r.products.map(p => `
          <tr>
            <td>${p.emoji || ""} <b>${esc(p.name)}</b></td>
            <td>${esc(p.cat_name || "-")}</td>
            <td>${money(p.base_price)}${p.sale_price ? ` <span class="muted">(${money(p.sale_price)})</span>` : ""}</td>
            <td>${(p.availability || []).filter(a => +a.in_stock).length}/${(p.availability || []).length}</td>
            <td>${+p.active ? '<span class="dot-open">مفعّل</span>' : '<span class="dot-closed">مخفي</span>'}</td>
            <td><div class="row-actions">
              <button class="icon-btn" onclick='editProduct(${p.id})'>✏️</button>
              <button class="icon-btn danger" onclick="delProduct(${p.id},'${esc(p.name)}')">🗑</button>
            </div></td>
          </tr>`).join("")}</tbody></table></div></div>`;
  PRODUCTS_CACHE = r.products;
}
let PRODUCTS_CACHE = [];

function editProduct(id) {
  const p = id ? PRODUCTS_CACHE.find(x => +x.id === id) : null;
  const avByBranch = {};
  (p?.availability || []).forEach(a => avByBranch[a.branch_id] = a);
  const selGroups = new Set((p?.optionGroups || []).map(Number));
  modal(id ? "تعديل منتج" : "منتج جديد", `
    <div class="grid2">
      <div class="field"><label>الاسم</label><input id="pName" value="${esc(p?.name || "")}"></div>
      <div class="field"><label>الرمز التعبيري</label><input id="pEmoji" value="${esc(p?.emoji || "🍮")}"></div>
    </div>
    <div class="grid2">
      <div class="field"><label>التصنيف</label><select id="pCat">${CATS.map(c => `<option value="${c.id}" ${p && +p.category_id === +c.id ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></div>
      <div class="field"><label>النقاط</label><input id="pPoints" type="number" value="${p?.points ?? 0}"></div>
    </div>
    <div class="field"><label>الوصف</label><textarea id="pDesc">${esc(p?.description || "")}</textarea></div>
    <div class="grid2">
      <div class="field"><label>السعر الأساسي</label><input id="pPrice" type="number" step="0.5" value="${p?.base_price ?? 0}"></div>
      <div class="field"><label>سعر الخصم (اختياري)</label><input id="pSale" type="number" step="0.5" value="${p?.sale_price ?? ""}"></div>
    </div>
    <div class="grid2">
      <label class="check"><input type="checkbox" id="pFeat" ${p && +p.is_featured ? "checked" : ""}> منتج مميز</label>
      <label class="check"><input type="checkbox" id="pNew" ${p && +p.is_new ? "checked" : ""}> منتج جديد</label>
    </div>
    <label class="check"><input type="checkbox" id="pActive" ${!p || +p.active ? "checked" : ""}> ظاهر للزبائن</label>

    <div class="field"><label>التوفر والأسعار حسب الفرع</label>
      ${BRANCHES.map(b => { const a = avByBranch[b.id]; return `
        <div class="av-row">
          <label class="av-name"><input type="checkbox" class="pbEnable" data-b="${b.id}" ${a ? "checked" : ""}> ${esc(b.name)}</label>
          <input type="number" step="0.5" class="pbPrice" data-b="${b.id}" placeholder="سعر" value="${a?.price ?? p?.base_price ?? ""}">
          <label class="check" style="margin:0;padding:6px 10px"><input type="checkbox" class="pbStock" data-b="${b.id}" ${!a || +a.in_stock ? "checked" : ""}> متوفر</label>
        </div>`; }).join("")}
    </div>

    <div class="field"><label>مجموعات الخيارات</label>
      ${(META.optionGroups || []).map(g => `<label class="check"><input type="checkbox" class="pOG" value="${g.id}" ${selGroups.has(+g.id) ? "checked" : ""}> ${esc(g.name)}</label>`).join("")}
    </div>
  `, [
    { label: "حفظ", cls: "btn-primary", fn: async () => {
      const availability = BRANCHES.map(b => ({
        branch_id: b.id,
        enabled: $(`.pbEnable[data-b="${b.id}"]`).checked,
        price: $(`.pbPrice[data-b="${b.id}"]`).value || 0,
        in_stock: $(`.pbStock[data-b="${b.id}"]`).checked,
      }));
      const optionGroups = [...document.querySelectorAll(".pOG:checked")].map(x => +x.value);
      const product = {
        id: id || 0, name: $("#pName").value.trim(), category_id: +$("#pCat").value,
        description: $("#pDesc").value.trim(), emoji: $("#pEmoji").value.trim(),
        base_price: +$("#pPrice").value || 0, sale_price: $("#pSale").value,
        is_featured: $("#pFeat").checked, is_new: $("#pNew").checked, points: +$("#pPoints").value || 0,
        active: $("#pActive").checked, sort: p?.sort || 0, availability, optionGroups,
      };
      if (!product.name) return toast("أدخل اسم المنتج");
      const rr = await call("product_save", { product });
      if (rr.ok) { toast("تم الحفظ"); closeModal(); viewProducts(); } else toast("خطأ: " + (rr.error || ""));
    } },
  ]);
}
async function delProduct(id, name) {
  if (!confirm(`حذف المنتج "${name}"؟`)) return;
  const r = await call("product_delete", { id });
  if (r.ok) { toast("تم الحذف"); viewProducts(); }
}

/* ------------- الفروع ------------- */
async function viewBranches() {
  const r = await call("branches_list");
  if (!r.ok) return content.innerHTML = err(r);
  BRANCHES = r.branches;
  content.innerHTML = `
    <div class="panel">
      <div class="panel-head"><h2>الفروع (${r.branches.length})</h2><span class="sp"></span>
        <button class="btn-primary btn-sm" onclick="editBranch()">＋ فرع جديد</button></div>
      <div class="table-wrap"><table>
        <thead><tr><th>الفرع</th><th>المنطقة</th><th>الحالة</th><th>توصيل/استلام</th><th>حد أدنى</th><th></th></tr></thead>
        <tbody>${r.branches.map(b => `
          <tr>
            <td><b>${esc(b.name)}</b><br><span class="muted">${esc(b.phone || "")}</span></td>
            <td>${esc(b.area || "")}</td>
            <td>${+b.is_open ? '<span class="dot-open">● مفتوح</span>' : '<span class="dot-closed">● مغلق</span>'}</td>
            <td>${+b.allow_delivery ? "🛵" : "—"} ${+b.allow_pickup ? "🏬" : "—"}</td>
            <td>${money(b.min_order)}</td>
            <td><button class="icon-btn" onclick='editBranch(${b.id})'>✏️</button></td>
          </tr>`).join("")}</tbody></table></div></div>`;
}
function editBranch(id) {
  const b = id ? BRANCHES.find(x => +x.id === id) : null;
  modal(id ? "تعديل فرع" : "فرع جديد", `
    <div class="grid2">
      <div class="field"><label>اسم الفرع</label><input id="bName" value="${esc(b?.name || "")}"></div>
      <div class="field"><label>المنطقة</label><input id="bArea" value="${esc(b?.area || "")}"></div>
    </div>
    <div class="grid2">
      <div class="field"><label>المدينة</label><input id="bCity" value="${esc(b?.city || "الخليل")}"></div>
      <div class="field"><label>الهاتف</label><input id="bPhone" value="${esc(b?.phone || "")}"></div>
    </div>
    <div class="grid2">
      <div class="field"><label>واتساب (بصيغة دولية)</label><input id="bWa" value="${esc(b?.whatsapp || "")}" placeholder="9705xxxxxxxx"></div>
      <div class="field"><label>أوقات العمل</label><input id="bHours" value="${esc(b?.hours || "")}"></div>
    </div>
    <div class="field"><label>العنوان</label><input id="bAddr" value="${esc(b?.address || "")}"></div>
    <div class="grid2">
      <div class="field"><label>الحد الأدنى للطلب</label><input id="bMin" type="number" value="${b?.min_order ?? 0}"></div>
      <div class="field"><label>وقت التحضير (دقيقة)</label><input id="bPrep" type="number" value="${b?.prep_time ?? 20}"></div>
    </div>
    <label class="check"><input type="checkbox" id="bOpen" ${!b || +b.is_open ? "checked" : ""}> مفتوح الآن (يستقبل طلبات)</label>
    <div class="grid2">
      <label class="check"><input type="checkbox" id="bDel" ${!b || +b.allow_delivery ? "checked" : ""}> يسمح بالتوصيل</label>
      <label class="check"><input type="checkbox" id="bPick" ${!b || +b.allow_pickup ? "checked" : ""}> يسمح بالاستلام</label>
    </div>
    <label class="check"><input type="checkbox" id="bActive" ${!b || +b.active ? "checked" : ""}> الفرع مفعّل</label>
  `, [
    { label: "حفظ", cls: "btn-primary", fn: async () => {
      const branch = {
        id: id || 0, name: $("#bName").value.trim(), area: $("#bArea").value.trim(), city: $("#bCity").value.trim(),
        phone: $("#bPhone").value.trim(), whatsapp: $("#bWa").value.trim(), hours: $("#bHours").value.trim(),
        address: $("#bAddr").value.trim(), min_order: +$("#bMin").value || 0, prep_time: +$("#bPrep").value || 20,
        is_open: $("#bOpen").checked, allow_delivery: $("#bDel").checked, allow_pickup: $("#bPick").checked,
        active: $("#bActive").checked, sort: b?.sort || 0,
      };
      if (!branch.name) return toast("أدخل اسم الفرع");
      const rr = await call("branch_save", { branch });
      if (rr.ok) { toast("تم الحفظ"); closeModal(); const bb = await call("branches_list"); if (bb.ok) BRANCHES = bb.branches; viewBranches(); } else toast("خطأ");
    } },
  ]);
}

/* ------------- التصنيفات ------------- */
async function viewCategories() {
  const r = await call("categories_list");
  if (!r.ok) return content.innerHTML = err(r);
  CATS = r.categories;
  content.innerHTML = `
    <div class="panel">
      <div class="panel-head"><h2>التصنيفات (${r.categories.length})</h2><span class="sp"></span>
        <button class="btn-primary btn-sm" onclick="editCat()">＋ تصنيف جديد</button></div>
      <div class="table-wrap"><table>
        <thead><tr><th>التصنيف</th><th>الترتيب</th><th>الحالة</th><th></th></tr></thead>
        <tbody>${r.categories.map(c => `
          <tr><td>${c.emoji || ""} <b>${esc(c.name)}</b></td><td>${c.sort}</td>
          <td>${+c.active ? '<span class="dot-open">مفعّل</span>' : '<span class="dot-closed">مخفي</span>'}</td>
          <td><div class="row-actions"><button class="icon-btn" onclick='editCat(${c.id})'>✏️</button>
          <button class="icon-btn danger" onclick="delCat(${c.id},'${esc(c.name)}')">🗑</button></div></td></tr>`).join("")}
        </tbody></table></div></div>`;
}
function editCat(id) {
  const c = id ? CATS.find(x => +x.id === id) : null;
  modal(id ? "تعديل تصنيف" : "تصنيف جديد", `
    <div class="grid2">
      <div class="field"><label>الاسم</label><input id="cName" value="${esc(c?.name || "")}"></div>
      <div class="field"><label>الرمز</label><input id="cEmoji" value="${esc(c?.emoji || "🍽️")}"></div>
    </div>
    <div class="field"><label>الترتيب</label><input id="cSort" type="number" value="${c?.sort ?? 0}"></div>
    <label class="check"><input type="checkbox" id="cActive" ${!c || +c.active ? "checked" : ""}> ظاهر</label>
  `, [
    { label: "حفظ", cls: "btn-primary", fn: async () => {
      const category = { id: id || 0, name: $("#cName").value.trim(), emoji: $("#cEmoji").value.trim(), sort: +$("#cSort").value || 0, active: $("#cActive").checked };
      if (!category.name) return toast("أدخل الاسم");
      const rr = await call("category_save", { category });
      if (rr.ok) { toast("تم الحفظ"); closeModal(); const cc = await call("categories_list"); if (cc.ok) CATS = cc.categories; viewCategories(); } else toast("خطأ");
    } },
  ]);
}
async function delCat(id, name) { if (!confirm(`حذف التصنيف "${name}"؟`)) return; const r = await call("category_delete", { id }); if (r.ok) { toast("تم الحذف"); viewCategories(); } }

/* ------------- مناطق التوصيل ------------- */
async function viewZones() {
  const r = await call("zones_list");
  if (!r.ok) return content.innerHTML = err(r);
  content.innerHTML = `
    <div class="panel">
      <div class="panel-head"><h2>مناطق التوصيل (${r.zones.length})</h2><span class="sp"></span>
        <button class="btn-primary btn-sm" onclick="editZone()">＋ منطقة جديدة</button></div>
      <div class="table-wrap"><table>
        <thead><tr><th>المنطقة</th><th>الفرع</th><th>التوصيل</th><th>حد أدنى</th><th>مجاني فوق</th><th></th></tr></thead>
        <tbody>${r.zones.map(z => `
          <tr><td><b>${esc(z.name)}</b></td><td>${esc(z.branch_name || "-")}</td><td>${money(z.fee)}</td>
          <td>${money(z.min_order)}</td><td>${z.free_over ? money(z.free_over) : "—"}</td>
          <td><div class="row-actions"><button class="icon-btn" onclick='editZone(${z.id})'>✏️</button>
          <button class="icon-btn danger" onclick="delZone(${z.id})">🗑</button></div></td></tr>`).join("")}
        </tbody></table></div></div>`;
  ZONES_CACHE = r.zones;
}
let ZONES_CACHE = [];
function editZone(id) {
  const z = id ? ZONES_CACHE.find(x => +x.id === id) : null;
  modal(id ? "تعديل منطقة" : "منطقة جديدة", `
    <div class="field"><label>الفرع المسؤول</label><select id="zBranch">${BRANCHES.map(b => `<option value="${b.id}" ${z && +z.branch_id === +b.id ? "selected" : ""}>${esc(b.name)}</option>`).join("")}</select></div>
    <div class="field"><label>اسم المنطقة</label><input id="zName" value="${esc(z?.name || "")}"></div>
    <div class="grid2">
      <div class="field"><label>تكلفة التوصيل</label><input id="zFee" type="number" step="0.5" value="${z?.fee ?? 0}"></div>
      <div class="field"><label>الحد الأدنى للطلب</label><input id="zMin" type="number" value="${z?.min_order ?? 0}"></div>
    </div>
    <div class="field"><label>توصيل مجاني عند تجاوز (اتركه فارغًا لتعطيله)</label><input id="zFree" type="number" value="${z?.free_over ?? ""}"></div>
    <label class="check"><input type="checkbox" id="zActive" ${!z || +z.active ? "checked" : ""}> مفعّلة</label>
  `, [
    { label: "حفظ", cls: "btn-primary", fn: async () => {
      const zone = { id: id || 0, branch_id: +$("#zBranch").value, name: $("#zName").value.trim(), fee: +$("#zFee").value || 0, min_order: +$("#zMin").value || 0, free_over: $("#zFree").value, active: $("#zActive").checked };
      if (!zone.name) return toast("أدخل اسم المنطقة");
      const rr = await call("zone_save", { zone });
      if (rr.ok) { toast("تم الحفظ"); closeModal(); viewZones(); } else toast("خطأ");
    } },
  ]);
}
async function delZone(id) { if (!confirm("حذف هذه المنطقة؟")) return; const r = await call("zone_delete", { id }); if (r.ok) { toast("تم الحذف"); viewZones(); } }

/* ------------- الإعدادات ------------- */
async function viewSettings() {
  const m = await call("meta");
  const s = m.ok ? m.settings : {};
  content.innerHTML = `
    <div class="panel"><div class="panel-head"><h2>إعدادات المتجر</h2></div>
      <div style="padding:16px">
        <div class="grid2">
          <div class="field"><label>اسم المتجر</label><input id="sName" value="${esc(s.brand_name || "")}"></div>
          <div class="field"><label>واتساب الرئيسي</label><input id="sWa" value="${esc(s.whatsapp || "")}"></div>
        </div>
        <div class="field"><label>الشعار النصي (Tagline)</label><input id="sTag" value="${esc(s.tagline || "")}"></div>
        <div class="grid2">
          <div class="field"><label>انستغرام</label><input id="sIg" value="${esc(s.instagram || "")}"></div>
          <div class="field"><label>فيسبوك</label><input id="sFb" value="${esc(s.facebook || "")}"></div>
        </div>
        <div class="grid2">
          <div class="field"><label>تيك توك</label><input id="sTk" value="${esc(s.tiktok || "")}"></div>
          <div class="field"><label>نقاط لكل شيكل</label><input id="sPts" type="number" step="0.1" value="${esc(s.points_per_shekel || "1")}"></div>
        </div>
        <button class="btn-primary btn-sm" onclick="saveSettings()">حفظ الإعدادات</button>
      </div>
    </div>
    <div class="panel"><div class="panel-head"><h2>تغيير كلمة المرور</h2></div>
      <div style="padding:16px">
        <div class="field"><label>كلمة المرور الجديدة</label><input id="npass" type="password"></div>
        <button class="btn-ghost btn-sm" onclick="changePass()">تغيير كلمة المرور</button>
      </div>
    </div>`;
}
async function saveSettings() {
  const settings = {
    brand_name: $("#sName").value.trim(), whatsapp: $("#sWa").value.trim(), tagline: $("#sTag").value.trim(),
    instagram: $("#sIg").value.trim(), facebook: $("#sFb").value.trim(), tiktok: $("#sTk").value.trim(),
    points_per_shekel: $("#sPts").value.trim() || "1",
  };
  const r = await call("settings_save", { settings });
  toast(r.ok ? "تم حفظ الإعدادات" : "خطأ");
}
async function changePass() {
  const np = $("#npass").value;
  if (np.length < 6) return toast("كلمة المرور 6 أحرف على الأقل");
  const r = await call("change_password", { new: np });
  toast(r.ok ? "تم تغيير كلمة المرور" : "خطأ");
  if (r.ok) $("#npass").value = "";
}

/* ------------- أدوات النوافذ ------------- */
function modal(title, body, buttons = []) {
  $("#modal").innerHTML = `
    <div class="modal-head"><h3>${title}</h3><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">${body}</div>
    <div class="modal-foot">${buttons.map((b, i) => `<button class="${b.cls || "btn-ghost"}" data-i="${i}" style="flex:1">${b.label}</button>`).join("")}
      <button class="btn-ghost" onclick="closeModal()">إلغاء</button></div>`;
  $("#overlay").classList.add("show");
  buttons.forEach((b, i) => $(`#modal [data-i="${i}"]`).addEventListener("click", b.fn));
}
function closeModal() { $("#overlay").classList.remove("show"); $("#modal").innerHTML = ""; }
$("#overlay").addEventListener("click", (e) => { if (e.target.id === "overlay") closeModal(); });

let toastT;
function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2200); }
function err(r) { return `<div class="empty">تعذّر التحميل: ${esc(r.error || "")}</div>`; }

boot();
