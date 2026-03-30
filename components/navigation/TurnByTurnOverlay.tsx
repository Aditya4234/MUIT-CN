"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUp,
  CornerUpLeft,
  CornerUpRight,
  ArrowUpLeft,
  ArrowUpRight,
  Flag,
} from "lucide-react";
import { useNavigationStore } from "@/store/navigationStore";
import { formatDistance } from "@/utils/formatDistance";

function ManeuverIcon({ type, modifier }: { type: string; modifier?: string }) {
  const cls = "w-6 h-6 text-white";
  if (type === "arrive") return <Flag className={cls} />;
  if (modifier === "left" || modifier === "sharp left") return <CornerUpLeft className={cls} />;
  if (modifier === "right" || modifier === "sharp right") return <CornerUpRight className={cls} />;
  if (modifier === "slight left") return <ArrowUpLeft className={cls} />;
  if (modifier === "slight right") return <ArrowUpRight className={cls} />;
  return <ArrowUp className={cls} />;
}

export function TurnByTurnOverlay() {
  const { viewMode, navSteps } = useNavigationStore();
  const visible = viewMode === "turn-by-turn";
  const step = navSteps[0];

  return (
    <AnimatePresence>
      {visible && step && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 260 }}
          className="absolute top-20 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4"
        >
          <div className="bg-blue-600/95 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center gap-4 px-5 py-4">
              {/* Maneuver icon */}
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <ManeuverIcon
                  type={step.maneuver.type}
                  modifier={step.maneuver.modifier}
                />
              </div>

              {/* Instruction + distance */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm leading-snug">
                  {step.instruction}
                </p>
                <p className="text-blue-200 text-xs mt-0.5">
                  {formatDistance(step.distance)}
                </p>
              </div>
            </div>

            {/* Next step preview */}
            {navSteps[1] && (
              <div className="flex items-center gap-3 px-5 py-2 bg-blue-700/60 border-t border-blue-500/30">
                <span className="text-xs text-blue-200">Then:</span>
                <p className="text-xs text-blue-100 truncate flex-1">
                  {navSteps[1].instruction}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
