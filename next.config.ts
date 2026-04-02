import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore
  devIndicators: false,
  turbopack: {
    resolveAlias: {
      "mapbox-gl": "mapbox-gl/dist/mapbox-gl.js",
    },
  },
};

export default nextConfig;
