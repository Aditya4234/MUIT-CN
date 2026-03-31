"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Navigation, Radio, Building2, BookOpen, Trophy, UtensilsCrossed } from "lucide-react";
import { useNavigationStore } from "@/store/navigationStore";
import { CAMPUS_LOCATIONS } from "@/constants/locations";
import { formatDistance, formatDuration } from "@/utils/formatDistance";

const LOCATION_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  admin: Building2,
  library: BookOpen,
  basketball: Trophy,
  canteen: UtensilsCrossed,
};

export function NavigationInfoPanel() {
  const { selectedDestination, routeData, viewMode, setViewMode } = useNavigationStore();

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
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 260 }}
          className="absolute bottom-0 left-0 right-0 z-40 px-4 pb-6"
        >
          <div
            className="rounded-3xl overflow-hidden max-w-md mx-auto"
            style={{
              background: "#091328",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
            }}
          >
            {/* Colour accent bar */}
            <div className="h-[3px] w-full" style={{ backgroundColor: location.color }} />

            <div className="p-5">
              {/* Destination header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: location.color + "22" }}
                >
                  {(() => {
                    const Icon = LOCATION_ICONS[location.id] ?? Building2;
                    return <Icon size={20} style={{ color: location.color }} />;
                  })()}
                </div>
                <div>
                  <h3
                    className="font-bold text-base leading-tight"
                    style={{ color: "#dee5ff", fontFamily: "var(--font-jakarta)" }}
                  >
                    {location.label}
                  </h3>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "#a3aac4", fontFamily: "var(--font-manrope)" }}
                  >
                    {formatDistance(routeData.distance)} · {formatDuration(routeData.duration)}
                  </p>
                </div>
              </div>

              {/* Action buttons — route-overview only */}
              {viewMode === "route-overview" && (
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={() => setViewMode("turn-by-turn")}
                    className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold transition-all hover:brightness-110"
                    style={{
                      background: "linear-gradient(135deg, #85adff, #6e9fff)",
                      color: "#060e20",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    <Navigation size={15} />
                    Start Navigation
                  </button>
                  <button
                    onClick={() => setViewMode("ar-simulation")}
                    className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold transition-all hover:brightness-110"
                    style={{
                      background: "linear-gradient(135deg, #ac8aff, #5516be)",
                      color: "#dee5ff",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    <Radio size={15} />
                    AR View
                  </button>
                </div>
              )}

              {/* Exit — turn-by-turn */}
              {viewMode === "turn-by-turn" && (
                <button
                  onClick={() => setViewMode("route-overview")}
                  className="w-full py-3 rounded-2xl text-sm font-semibold transition-all hover:brightness-110"
                  style={{
                    background: "rgba(25, 37, 64, 0.6)",
                    backdropFilter: "blur(12px)",
                    outline: "1px solid rgba(133,173,255,0.2)",
                    color: "#85adff",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  Exit Navigation
                </button>
              )}

              {/* Exit — AR */}
              {viewMode === "ar-simulation" && (
                <button
                  onClick={() => setViewMode("route-overview")}
                  className="w-full py-3 rounded-2xl text-sm font-semibold transition-all hover:brightness-110"
                  style={{
                    background: "rgba(25, 37, 64, 0.6)",
                    backdropFilter: "blur(12px)",
                    outline: "1px solid rgba(172,138,255,0.2)",
                    color: "#ac8aff",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  Exit AR
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
