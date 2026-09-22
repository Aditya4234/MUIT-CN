// Rogue service-worker killer.
//
// A stale `sw.js` from a DIFFERENT project previously run on this origin
// (localhost:3000) is still registered in the browser. It intercepts this
// app's Mapbox/Clerk requests, enforces an outdated cached CSP, and returns
// offline 503s. This app registers no service worker of its own.
//
// How this works: on every navigation the browser re-fetches `/sw.js` to
// check for updates. It will find THIS script (different bytes), install it,
// and on activation the script unregisters itself — killing the rogue worker.
// Safe to delete this file once DevTools > Application > Service Workers is
// empty for this origin.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    self.registration
      .unregister()
      .then(() => self.clients.claim())
      .catch(() => {})
  );
});
