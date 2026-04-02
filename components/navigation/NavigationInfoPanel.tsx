"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Navigation, Radio, Building2, BookOpen, Trophy, UtensilsCrossed, X } from "lucide-react";
import { useNavigationStore } from "@/store/navigationStore";
import { CAMPUS_LOCATIONS } from "@/constants/locations";
import { formatDistance, formatDuration } from "@/utils/formatDistance";

const LOCATION_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  admin: Building2,
  library: BookOpen,
  basketball: Trophy,
  canteen: UtensilsCrossed,
};

export function NavigationInfoPanel() {
  const { selectedDestination, routeData, viewMode, setViewMode, clearNavigation } = useNavigationStore();

  const location = selectedDestination
    ? CAMPUS_LOCATIONS.find((l) => l.id === selectedDestination)
    : null;

  const visible =
    !!location &&
    !!routeData &&
    (viewMode === "route-overview" || viewMode === "turn-by-turn" || viewMode === "ar-simulation");

  return (
    <AnimatePresence>
      {visible && location && routeData && (
        <motion.div
          initial={{ y: 160, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 160, opacity: 0 }}
          transition={{ 
            type: "spring", 
            damping: 24, 
            stiffness: 220,
            mass: 0.8
          }}
          className="absolute bottom-0 left-0 right-0 z-40 px-4 pb-8"
        >
          <div
            className="rounded-[32px] overflow-hidden max-w-md mx-auto relative backdrop-blur-3xl shadow-2xl transition-all duration-300"
            style={{
              background: "rgba(9, 19, 40, 0.5)",
              border: "1px solid rgba(133, 173, 255, 0.1)",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.05)",
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "rgba(133,173,255,0.2)" }} />
            </div>
            <div className="p-4 sm:p-6">
              {/* Destination header — Editorial scale */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-4 mb-6 relative"
              >
                {/* Close / back-to-map button */}
                <button
                  onClick={clearNavigation}
                  className="absolute -top-1 right-0 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
                  style={{ color: "var(--on-surface-muted)" }}
                  aria-label="Close panel"
                >
                  <X size={14} />
                </button>
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner"
                  style={{ background: location.color + "15", border: `1px solid ${location.color}20` }}
                >
                  {(() => {
                    const Icon = LOCATION_ICONS[location.id] ?? Building2;
                    return <Icon size={22} style={{ color: location.color, filter: `drop-shadow(0 0 8px ${location.color}40)` }} />;
                  })()}
                </div>
                <div>
                  <h3
                    className="font-extrabold text-lg leading-tight tracking-tight"
                    style={{ color: "var(--on-surface)", fontFamily: "var(--font-bricolage)" }}
                  >
                    {location.label}
                  </h3>
                  <p
                    className="text-[11px] mt-1 font-bold opacity-70"
                    style={{ color: "var(--on-surface-muted)", fontFamily: "var(--font-inter)" }}
                  >
                    {formatDistance(routeData.distance)} <span className="opacity-30">·</span> {formatDuration(routeData.duration)}
                  </p>
                </div>
              </motion.div>

              {/* Action buttons — route-overview only */}
              {viewMode === "route-overview" && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <button
                    onClick={() => setViewMode("turn-by-turn")}
                    className="flex-1 flex items-center justify-center gap-2.5 rounded-2xl py-3.5 text-[13px] font-black uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-lg active:shadow-none translate-z-0"
                    style={{
                      background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                      color: "#060e20",
                      fontFamily: "var(--font-inter)",
                      boxShadow: "0 8px 16px rgba(133, 173, 255, 0.25)"
                    }}
                  >
                    <Navigation size={16} />
                    Start Navigation
                  </button>
                  <button
                    onClick={() => setViewMode("ar-simulation")}
                    className="flex-1 flex items-center justify-center gap-2.5 rounded-2xl py-3.5 text-[13px] font-black uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-lg active:shadow-none translate-z-0"
                    style={{
                      background: "linear-gradient(135deg, var(--secondary), var(--secondary-dim))",
                      color: "var(--on-surface)",
                      fontFamily: "var(--font-inter)",
                      boxShadow: "0 8px 16px rgba(172, 138, 255, 0.25)"
                    }}
                  >
                    <Radio size={16} />
                    AR View
                  </button>
                </motion.div>
              )}

              {/* Exit — turn-by-turn */}
              {viewMode === "turn-by-turn" && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setViewMode("route-overview")}
                  className="w-full py-3.5 rounded-2xl text-[13px] font-black uppercase tracking-wider transition-all duration-300 hover:bg-red-500/10 hover:text-red-400 group"
                  style={{
                    background: "rgba(25, 37, 64, 0.4)",
                    border: "1px solid rgba(133, 173, 255, 0.15)",
                    color: "var(--primary)",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  Exit Navigation
                </motion.button>
              )}

              {/* Exit — AR */}
              {viewMode === "ar-simulation" && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setViewMode("route-overview")}
                  className="w-full py-3.5 rounded-2xl text-[13px] font-black uppercase tracking-wider transition-all duration-300 hover:bg-purple-500/10 hover:text-purple-400"
                  style={{
                    background: "rgba(25, 37, 64, 0.4)",
                    border: "1px solid rgba(172, 138, 255, 0.15)",
                    color: "var(--secondary)",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  Exit AR
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
