"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Navigation, Radio } from "lucide-react";
import { useNavigationStore } from "@/store/navigationStore";
import { CAMPUS_LOCATIONS } from "@/constants/locations";
import { formatDistance, formatDuration } from "@/utils/formatDistance";

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
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-700 overflow-hidden max-w-md mx-auto">
            {/* Colour accent bar */}
            <div className="h-1 w-full" style={{ backgroundColor: location.color }} />

            <div className="p-5">
              {/* Destination header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ backgroundColor: location.color + "22" }}
                >
                  {location.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-tight">
                    {location.label}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {formatDistance(routeData.distance)} · {formatDuration(routeData.duration)}
                  </p>
                </div>
              </div>

              {/* Action buttons — route-overview only */}
              {viewMode === "route-overview" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setViewMode("turn-by-turn")}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl py-3 text-sm font-semibold transition-colors"
                  >
                    <Navigation size={16} />
                    Start Navigation
                  </button>
                  <button
                    onClick={() => setViewMode("ar-simulation")}
                    className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-white transition-colors"
                    style={{ background: `linear-gradient(135deg, #6366f1, #8b5cf6)` }}
                  >
                    <Radio size={16} />
                    AR View
                  </button>
                </div>
              )}

              {/* Exit buttons for nav/AR modes */}
              {viewMode === "turn-by-turn" && (
                <button
                  onClick={() => setViewMode("route-overview")}
                  className="w-full py-3 rounded-2xl border border-gray-200 dark:border-zinc-600 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Exit Navigation
                </button>
              )}

              {viewMode === "ar-simulation" && (
                <button
                  onClick={() => setViewMode("route-overview")}
                  className="w-full py-3 rounded-2xl border border-purple-200 dark:border-purple-800 text-sm font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
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
