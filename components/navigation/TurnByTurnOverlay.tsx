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
import { useRouteProgress } from "@/hooks/useRouteProgress";
import { formatDistance } from "@/utils/formatDistance";

function ManeuverIcon({ type, modifier }: { type: string; modifier?: string }) {
  const style = { color: "#ffffff" };
  const cls = "w-6 h-6";
  if (type === "arrive") return <Flag className={cls} style={style} />;
  if (modifier === "left" || modifier === "sharp left")
    return <CornerUpLeft className={cls} style={style} />;
  if (modifier === "right" || modifier === "sharp right")
    return <CornerUpRight className={cls} style={style} />;
  if (modifier === "slight left") return <ArrowUpLeft className={cls} style={style} />;
  if (modifier === "slight right") return <ArrowUpRight className={cls} style={style} />;
  return <ArrowUp className={cls} style={style} />;
}

export function TurnByTurnOverlay() {
  const { viewMode, navSteps, currentStepIndex, userLocation } = useNavigationStore();
  const progress = useRouteProgress();
  const visible = viewMode === "turn-by-turn";
  // Active step advances automatically as you walk (kept in the store).
  const step = navSteps[Math.min(currentStepIndex, navSteps.length - 1)];
  const nextStep = navSteps[Math.min(currentStepIndex + 1, navSteps.length - 1)];

  // Live remaining distance along the route; falls back to the step estimate.
  const remainingM = progress?.remainingDistanceM ?? step?.distance ?? null;
  const speedKmh =
    userLocation?.speed != null && userLocation.speed > 0.3 ? userLocation.speed * 3.6 : null;

  return (
    <AnimatePresence>
      {visible && step && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 220, mass: 0.8 }}
          className="absolute top-14 left-1/2 -translate-x-1/2 z-40 w-full max-w-[420px] px-4"
        >
          <div
            className="rounded-3xl overflow-hidden backdrop-blur-2xl shadow-2xl relative"
            style={{
              background: "rgba(9, 19, 40, 0.5)",
              border: "1px solid rgba(133, 173, 255, 0.1)",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div className="flex items-center gap-4 px-5 py-4">
              {/* Maneuver icon — Luminous Glow */}
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
                style={{
                  background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                }}
              >
                <ManeuverIcon type={step.maneuver.type} modifier={step.maneuver.modifier} />
              </div>

              {/* Instruction + live remaining distance */}
              <div className="flex-1 min-w-0">
                <p
                  className="font-bold text-sm leading-snug tracking-tight"
                  style={{ color: "var(--on-surface)", fontFamily: "var(--font-inter)" }}
                >
                  {step.instruction}
                </p>
                <p
                  className="text-[11px] mt-1 font-bold opacity-60"
                  style={{ color: "var(--on-surface-muted)", fontFamily: "var(--font-inter)" }}
                >
                  {remainingM != null ? `${formatDistance(remainingM)} remaining` : "Calculating…"}
                  {speedKmh != null && (
                    <span className="opacity-80"> · 🚶 {speedKmh.toFixed(1)} km/h</span>
                  )}
                </p>
              </div>
            </div>

            {/* Next step preview — Tonal separation */}
            {nextStep && nextStep !== step && (
              <div className="flex items-center gap-3 px-5 py-2.5 bg-white/5 border-t border-white/5">
                <span
                  className="text-[10px] font-black uppercase tracking-wider opacity-40"
                  style={{ color: "var(--on-surface-muted)", fontFamily: "var(--font-inter)" }}
                >
                  Then:
                </span>
                <p
                  className="text-[11px] font-bold truncate flex-1 opacity-80"
                  style={{ color: "var(--on-surface)", fontFamily: "var(--font-inter)" }}
                >
                  {nextStep.instruction}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
