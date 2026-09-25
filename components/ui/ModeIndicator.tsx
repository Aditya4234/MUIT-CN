"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Map, Route, Navigation, Radio } from "lucide-react";
import { useNavigationStore } from "@/store/navigationStore";

const MODES = {
  "2d-map": { label: "2D Map", icon: Map, accent: "#a3aac4" },
  "route-overview": { label: "Route Overview", icon: Route, accent: "#85adff" },
  "turn-by-turn": { label: "Navigating", icon: Navigation, accent: "#85adff" },
  "ar-simulation": { label: "AR Simulation", icon: Radio, accent: "#ac8aff" },
};

export function ModeIndicator() {
  const { viewMode, locationStatus, userLocation, locationSource, ipInfo } = useNavigationStore();
  const { label, icon: Icon, accent } = MODES[viewMode];

  const isIp = locationSource === "ip";
  const place = [ipInfo?.city, ipInfo?.region].filter(Boolean).join(", ");
  const gpsColor =
    locationStatus === "tracking" && !isIp
      ? "#22c55e"
      : locationStatus === "tracking" && isIp
        ? "#f59e0b"
        : locationStatus === "locating"
          ? "#f59e0b"
          : locationStatus === "denied" || locationStatus === "unavailable"
            ? ipInfo
              ? "#f59e0b"
              : "#ef4444"
            : "#a3aac4";
  const gpsLabel =
    locationStatus === "tracking" && isIp
      ? `IP ~${place || "unknown"} (±5 km)`
      : locationStatus === "tracking"
        ? `GPS live${userLocation?.accuracy != null ? ` ±${Math.round(userLocation.accuracy)}m` : ""}`
        : locationStatus === "locating"
          ? "Locating…"
          : ipInfo
            ? `📍 ${place || "unknown"} · ~${ipInfo.distanceFromCampusKm ?? "?"} km from campus`
            : locationStatus === "denied"
              ? "GPS denied"
              : locationStatus === "unavailable"
                ? "GPS unavailable"
                : "GPS idle";

  return (
    <div className="absolute top-4 left-16 md:left-4 z-40 flex flex-col gap-2">
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{
            background: "rgba(9, 19, 40, 0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            outline: `1px solid ${accent}30`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          <Icon size={12} style={{ color: accent }} />
          <span
            className="text-xs font-medium"
            style={{ color: accent, fontFamily: "var(--font-inter)" }}
          >
            {label}
          </span>
        </motion.div>
      </AnimatePresence>
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full w-fit"
        title={gpsLabel}
        style={{
          background: "rgba(9, 19, 40, 0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          outline: `1px solid ${gpsColor}30`,
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        <span
          className={`w-2 h-2 rounded-full ${locationStatus === "tracking" || locationStatus === "locating" ? "animate-pulse" : ""}`}
          style={{ background: gpsColor, boxShadow: `0 0 8px ${gpsColor}` }}
        />
        <span
          className="text-[11px] font-medium"
          style={{ color: gpsColor, fontFamily: "var(--font-inter)" }}
        >
          {gpsLabel}
        </span>
      </div>
    </div>
  );
}
