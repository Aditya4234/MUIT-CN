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
  const style = { color: "#060e20" };
  const cls = "w-6 h-6";
  if (type === "arrive") return <Flag className={cls} style={style} />;
  if (modifier === "left" || modifier === "sharp left") return <CornerUpLeft className={cls} style={style} />;
  if (modifier === "right" || modifier === "sharp right") return <CornerUpRight className={cls} style={style} />;
  if (modifier === "slight left") return <ArrowUpLeft className={cls} style={style} />;
  if (modifier === "slight right") return <ArrowUpRight className={cls} style={style} />;
  return <ArrowUp className={cls} style={style} />;
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
          className="absolute top-14 left-1/2 -translate-x-1/2 z-40 w-full max-w-[420px] px-4"
        >
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "#091328",
              backdropFilter: "blur(12px)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
            }}
          >
            {/* Primary accent bar */}
            <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, #85adff, #6e9fff)" }} />

            <div className="flex items-center gap-3.5 px-4 py-3">
              {/* Maneuver icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #85adff, #6e9fff)" }}
              >
                <ManeuverIcon type={step.maneuver.type} modifier={step.maneuver.modifier} />
              </div>

              {/* Instruction + distance */}
              <div className="flex-1 min-w-0">
                <p
                  className="font-semibold text-sm leading-snug"
                  style={{ color: "#dee5ff", fontFamily: "var(--font-inter)" }}
                >
                  {step.instruction}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "#a3aac4", fontFamily: "var(--font-manrope)" }}
                >
                  {formatDistance(step.distance)}
                </p>
              </div>
            </div>

            {/* Next step preview — separated by 2px gap via margin */}
            {navSteps[1] && (
              <div
                className="flex items-center gap-3 px-4 py-2 mt-px"
                style={{ background: "#141f38" }}
              >
                <span className="text-xs" style={{ color: "#a3aac4", fontFamily: "var(--font-manrope)" }}>
                  Then:
                </span>
                <p
                  className="text-xs truncate flex-1"
                  style={{ color: "#dee5ff", fontFamily: "var(--font-manrope)" }}
                >
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
