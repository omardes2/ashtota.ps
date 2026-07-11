# قشطوطة بلبن — منصة طلب أونلاين (Qashtouta Belaban)

متجر حلويات فلسطيني بـ 4 فروع (الخليل، رام الله، نابلس، بيت لحم). موقع طلب أونلاين
عربي RTL موبايل-أولًا + لوحة تحكم (مدير عام + مدراء فروع). يُنشر على استضافة
Hostinger المشتركة (PHP) عبر Git auto-deploy.

## المعمارية

- **الواجهة**: Next.js 14 (App Router) + TypeScript + Tailwind + Zustand، **static export**
  (`output: "export"`, `trailingSlash: true`, `images.unoptimized`). المصدر في `frontend/`.
- **الخلفية**: PHP 8 + PDO في `api/` — تدعم SQLite و MySQL (تبديل بالمحرّك).
- **لوحة التحكم**: SPA بلا إطار في `admin/` (`index.html` + `admin.js` + `admin.css`).
- **قاعدة البيانات على الإنتاج**: MySQL على Hostinger (تظهر في phpMyAdmin).

## آلية النشر (مهم جدًا)

الواجهة تُبنى محليًا وتُنسخ مخرجاتها إلى **جذر المستودع** بجانب `api/` و `admin/`،
لأن Hostinger ينشر الجذر كما هو إلى `public_html`.

بعد أي تعديل على `frontend/`:
```bash
bash build-web.sh      # يبني Next ثم ينسخ frontend/out إلى الجذر
```
ثم commit + push. أما تعديلات `api/` و `admin/` فهي في الجذر مباشرة (لا تحتاج build).
بعد الـ push: المستخدم يضغط **Deploy** في hPanel → Git يدويًا.

## قواعد صارمة

1. **المستودع عام (public)**: ممنوع أي أسرار في الكود. بيانات MySQL توضع **فقط** في
   `api/config.local.php` وهو **gitignored**. تحقّق قبل كل commit:
   `git ls-files api/config.local.php | wc -l` يجب أن يكون `0`.
2. **الفرع**: طوّر وادفع على `claude/qashoota-ordering-platform-bbj9ss` (منعكس على `main`).
   الدفع: `git push -u origin <branch>` ثم `git push origin <branch>:main`.
3. **كاش لوحة التحكم**: عند تعديل `admin.js`/`admin.css`، ارفع رقم النسخة في
   `admin/index.html` (`admin.css?v=N` و `admin.js?v=N`) لتجاوز كاش المتصفح.
4. لا تضع معرّف الموديل في أي commit/كود.

## قاعدة البيانات والترحيلات

- `api/schema.php`: `install_schema()` (CREATE TABLE IF NOT EXISTS) + `seed_data()` + `ensure_admin()`.
- `api/db.php`: `ensure_migrations()` ترحيل تدريجي حسب `schema_version` في جدول settings.
  تُستدعى في menu.php / order.php / admin. **الإصدار الحالي: v8**.
  - v3 صور/أحجام/إضافات المنتجات، v4 صورة التصنيف، v5 فرع المستخدم،
    v6 جدول `branch_requests`، v7 `orders.delivered_at`، v8 جدول `coupons` + `orders.coupon_code/discount`.
- عند إضافة عمود/جدول: عدّل `schema.php` (للتنصيب الجديد) **و** أضف كتلة ترحيل في `db.php`
  وارفع `schema_version` في الموضعين.
- MySQL: الأعمدة الفريدة (UNIQUE) تحتاج `VARCHAR(191)` وليس `TEXT`.

## نقاط API العامة (`api/`)

- `menu.php` (GET): brand + site (محتوى الموقع) + branches + categories + products + zones.
- `order.php` (POST): ينشئ طلبًا، يحسب الأسعار من DB (لا يثق بالمتصفح)، يطبّق كود الخصم،
  رقم الطلب = `سنة(رقمان)+شهر+يوم+تسلسل يبدأ 100 يوميًا` (مثال `26711100`).
- `track.php` (GET حالة / POST deliver): تتبع الطلب وتأكيد الاستلام من الزبون (فقط إن كان قيد التوصيل).
- `coupon.php` (POST): التحقق من كود الخصم للعرض (لا يزيد العدّاد).
- `install.php`: تنصيب/تهيئة القاعدة.

## لوحة التحكم (`api/admin/index.php` — راوتر actions)

- جلسة + CSRF. أدوار: `super` (المدير العام) و branch (مدير فرع، مقيّد بفرعه).
- `$superOnly` تحصر إجراءات المدير العام. `$mutations` تفرض CSRF.
- أهم الإجراءات: dashboard, orders_list/order_get/order_status/orders_ping, products/branches/
  categories/zones (CRUD)، users_*، reports (بفلترة from/to)، requests_* (الطلبات اليومية للفروع)،
  coupons_list/coupon_save/coupon_delete، settings_save/meta، upload.php (رفع الصور).

## حالات الطلب (التدفق المبسّط)

`new` (تم الاستلام) → `preparing` (تأكيد/قيد التحضير) → `out_for_delivery` (قيد التوصيل)
→ `delivered` (تم التسليم). + `cancelled`/`rejected`. المدير/الفرع يغيّرها؛ الزبون يقدر
يؤكد الاستلام من صفحة التتبع فقط عند `out_for_delivery`.

## الواجهة (`frontend/`)

- `lib/api.ts`: `fetchMenu`, `submitOrder`, `trackOrder`, `confirmDelivery`, `validateCoupon`.
- `store/`: Zustand — `useMenuStore` (brand + site + بيانات المنيو، `load()` من menu.php)،
  `useCartStore` (persist)، `useBranchStore`، `useCouponStore` (persist)، `useUiStore`.
- الشعار/الفوتر/صفحات (about/contact/offers) تقرأ المحتوى من `site` (يُدار من تبويب «محتوى الموقع»).
- الخط: **Cairo** (عبر `next/font` في `app/layout.tsx` + متغيّر tailwind).
- حقول الإدخال 16px على الموبايل (globals.css) لمنع تكبير iOS.

## الاختبار المحلي

```bash
# SQLite (افتراضي) — لا يحتاج config.local.php
php -S 127.0.0.1:8199            # ثم curl على /api/install.php و /api/menu.php ...
cd frontend && npm install && npm run build
```
قاعدة SQLite المحلية في `~/qashtoota_data/qashtoota.sqlite` (خارج المستودع). لا يوجد
`sqlite3` CLI — استخدم PHP/PDO للفحص. لاختبار مسار MySQL محليًا يمكن تنصيب MariaDB.

## الموقع المباشر

darkorange-newt-387229.hostingersite.com — قاعدة MySQL: `u132383167_qashtoota`.
