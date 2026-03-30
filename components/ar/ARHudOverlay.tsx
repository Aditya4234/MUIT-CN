"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useNavigationStore } from "@/store/navigationStore";

export function ARHudOverlay() {
  const { viewMode } = useNavigationStore();
  const visible = viewMode === "ar-simulation";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 z-30 pointer-events-none"
        >
          {/* Corner brackets — camera viewfinder effect */}
          {(["tl", "tr", "bl", "br"] as const).map((corner) => (
            <div
              key={corner}
              className={`absolute w-10 h-10 ${
                corner === "tl" ? "top-6 left-6 border-t-2 border-l-2" :
                corner === "tr" ? "top-6 right-6 border-t-2 border-r-2" :
                corner === "bl" ? "bottom-56 left-6 border-b-2 border-l-2" :
                "bottom-56 right-6 border-b-2 border-r-2"
              } border-blue-400/70 rounded-sm`}
            />
          ))}

          {/* AR Navigation badge — top center */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
            <div className="flex items-center gap-2 bg-blue-500/20 backdrop-blur-md border border-blue-400/40 rounded-full px-4 py-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-blue-200 text-xs font-semibold tracking-widest uppercase">
                AR Navigation
              </span>
            </div>
          </div>

          {/* Subtle scan line animation */}
          <motion.div
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent"
            animate={{ top: ["10%", "90%", "10%"] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />

          {/* Move mouse hint — fades after 3s */}
          <motion.p
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            transition={{ delay: 3, duration: 1.5 }}
            className="absolute bottom-52 left-1/2 -translate-x-1/2 text-white/50 text-xs tracking-wide whitespace-nowrap"
            style={{ bottom: "15.5rem" }}
          >
            Move mouse or tilt phone to look around
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
