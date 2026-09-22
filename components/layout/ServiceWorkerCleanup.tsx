"use client";

import { useEffect } from "react";

// One-time cleanup: unregister any stale service worker left over from a
// different project previously served on this origin. That worker intercepts
// this app's Mapbox/Clerk requests and breaks them (outdated CSP + offline
// cache). This app registers no service worker of its own, so anything found
// here is foreign and safe to remove. Takes effect on the next reload.
export function ServiceWorkerCleanup() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => {
        if (regs.length === 0) return;
        regs.forEach((reg) => {
          reg.unregister().catch(() => {});
        });
        console.info(
          `[cleanup] unregistered ${regs.length} stale service worker(s) — please reload the page once`
        );
      })
      .catch(() => {});
  }, []);
  return null;
}
