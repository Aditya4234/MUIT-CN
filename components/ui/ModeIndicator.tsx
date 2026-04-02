"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Map, Route, Navigation, Radio } from "lucide-react";
import { useNavigationStore } from "@/store/navigationStore";

const MODES = {
  "2d-map":         { label: "2D Map",         icon: Map,        accent: "#a3aac4" },
  "route-overview": { label: "Route Overview",  icon: Route,      accent: "#85adff" },
  "turn-by-turn":   { label: "Navigating",      icon: Navigation, accent: "#85adff" },
  "ar-simulation":  { label: "AR Simulation",   icon: Radio,      accent: "#ac8aff" },
};

export function ModeIndicator() {
  const { viewMode } = useNavigationStore();
  const { label, icon: Icon, accent } = MODES[viewMode];

  return (
    <div className="absolute top-4 left-16 md:left-4 z-40">
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
            style={{ color: accent, fontFamily: "var(--font-manrope)" }}
          >
            {label}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
