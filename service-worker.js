/**
 * Service Worker مُنهٍ لذاته (self-destruct)
 * -----------------------------------------------------------
 * النسخة القديمة من الموقع سجّلت Service Worker يخزّن ملفات قديمة.
 * هذه النسخة تُلغي كل التخزين المؤقت وتُلغي تسجيل نفسها،
 * حتى يحصل الزوّار العائدون على واجهة Next.js الجديدة مباشرة.
 */
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((c) => c.navigate(c.url));
    })()
  );
});
