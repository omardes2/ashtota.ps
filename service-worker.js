/* Service Worker - قشطوطة بلبن (تخزين مؤقت بسيط للعمل دون اتصال) */
const CACHE = "qashtoota-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/data.js",
  "./js/cart.js",
  "./js/ui.js",
  "./js/app.js",
  "./icons/icon.svg",
  "./manifest.webmanifest",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const sameOrigin = req.url.startsWith(self.location.origin);
  // لا نعترض طلبات الـ API إطلاقًا (بيانات حيّة)
  if (sameOrigin && req.url.includes("/api/")) return;

  if (sameOrigin) {
    // ملفات التطبيق: الشبكة أولًا (لإظهار آخر تحديث)، ثم الكاش عند عدم الاتصال
    e.respondWith(
      fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match(req))
    );
  } else {
    // موارد خارجية (خطوط): الكاش أولًا
    e.respondWith(caches.match(req).then((cached) => cached || fetch(req)));
  }
});
