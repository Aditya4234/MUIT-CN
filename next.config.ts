import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: {
    resolveAlias: {
      "mapbox-gl": "mapbox-gl/dist/mapbox-gl.js",
    },
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            // 'unsafe-eval' + 'unsafe-inline' required by Next.js dev/HMR.
            // Clerk script sources scoped to Clerk domains only (no '*').
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.dev",
            // 'unsafe-inline' required by Mapbox GL JS + react-map-gl injected styles.
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            // Mapbox satellite/raster tiles + sprites; Clerk avatars.
            "img-src 'self' data: blob: https://*.mapbox.com https://api.mapbox.com https://*.clerk.accounts.dev https://img.clerk.com",
            "font-src 'self' https://fonts.gstatic.com",
            // Mapbox: api (styles/sprites/glyphs/tiles/directions/DEM) + events (telemetry)
            //   + *.tiles.mapbox.com (vector/raster tiles a/b/c/d.tiles.mapbox.com).
            // Backends: localhost:8000/8001. Dev HMR: localhost:3000 ws/wss.
            // Preserved: Google Maps/Routes + Clerk Frontend API entries.
            // Clerk runtime: clerk-telemetry.com (SDK telemetry, observed) +
            //   img.clerk.com (avatar/proxy images fetched via Fetch API, observed).
            "connect-src 'self' http://localhost:3000 ws://localhost:3000 wss://localhost:3000 http://localhost:8000 http://localhost:8001 https://api.mapbox.com https://events.mapbox.com https://*.tiles.mapbox.com https://maps.googleapis.com https://routes.googleapis.com https://fonts.googleapis.com https://*.clerk.accounts.dev wss://*.clerk.accounts.dev https://*.clerk.dev https://clerk-telemetry.com https://img.clerk.com",
            // Mapbox GL JS web workers.
            "worker-src 'self' blob:",
            "child-src 'self' blob:",
            // Clerk sign-in / OAuth frames.
            "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.dev",
            "object-src 'none'",
            "base-uri 'self'",
            "frame-ancestors 'self'",
          ].join("; "),
        },
      ],
    },
  ],
};

export default nextConfig;
