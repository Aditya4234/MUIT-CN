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
              className={`absolute w-8 h-8 sm:w-10 sm:h-10 ${
                corner === "tl" ? "top-6 left-6 border-t-2 border-l-2" :
                corner === "tr" ? "top-6 right-6 border-t-2 border-r-2" :
                corner === "bl" ? "bottom-44 sm:bottom-56 left-6 border-b-2 border-l-2" :
                "bottom-44 sm:bottom-56 right-6 border-b-2 border-r-2"
              } rounded-sm`}
              style={{ borderColor: "rgba(172, 138, 255, 0.6)" }}
            />
          ))}

          {/* AR Navigation badge — top center */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2">
            <div
              className="flex items-center gap-2 rounded-full px-4 py-1.5"
              style={{
                background: "rgba(172, 138, 255, 0.12)",
                backdropFilter: "blur(12px)",
                outline: "1px solid rgba(172, 138, 255, 0.35)",
              }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: "#ac8aff" }}
              />
              <span
                className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: "#ac8aff", fontFamily: "var(--font-manrope)" }}
              >
                AR Navigation
              </span>
            </div>
          </div>

          {/* Subtle scan line animation */}
          <motion.div
            className="absolute left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(172,138,255,0.25), transparent)" }}
            animate={{ top: ["10%", "90%", "10%"] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />

          {/* Move mouse hint — fades after 3s */}
          <motion.p
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            transition={{ delay: 3, duration: 1.5 }}
            className="absolute left-1/2 -translate-x-1/2 text-xs tracking-wide whitespace-nowrap"
            style={{ bottom: "15.5rem", color: "rgba(163,170,196,0.6)", fontFamily: "var(--font-manrope)" }}
          >
            Move mouse or tilt phone to look around
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
