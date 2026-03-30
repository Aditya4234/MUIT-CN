"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Map, Route, Navigation, Radio } from "lucide-react";
import { useNavigationStore } from "@/store/navigationStore";

const MODES = {
  "2d-map": { label: "2D Map", icon: Map, color: "bg-zinc-700/80" },
  "route-overview": { label: "Route Overview", icon: Route, color: "bg-blue-600/80" },
  "turn-by-turn": { label: "Navigating", icon: Navigation, color: "bg-blue-600/80" },
  "ar-simulation": { label: "AR Simulation", icon: Radio, color: "bg-purple-600/80" },
};

export function ModeIndicator() {
  const { viewMode } = useNavigationStore();
  const { label, icon: Icon, color } = MODES[viewMode];

  return (
    <div className="absolute top-20 left-4 z-40">
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${color} backdrop-blur-sm shadow-lg`}
        >
          <Icon size={13} className="text-white" />
          <span className="text-white text-xs font-medium">{label}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
