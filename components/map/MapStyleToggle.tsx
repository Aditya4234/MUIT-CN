"use client";

import { Map, Globe } from "lucide-react";
import { useNavigationStore } from "@/store/navigationStore";

interface MapStyleToggleProps {
  isSatellite: boolean;
  onToggle: () => void;
}

export function MapStyleToggle({ isSatellite, onToggle }: MapStyleToggleProps) {
  const { viewMode } = useNavigationStore();
  if (viewMode === "ar-simulation") return null;

  return (
    <button
      onClick={onToggle}
      className="absolute top-4 right-4 z-40 flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium transition-all hover:brightness-110"
      style={{
        background: "rgba(9, 19, 40, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        outline: "1px solid rgba(64, 72, 93, 0.3)",
        color: "#a3aac4",
        fontFamily: "var(--font-inter)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      }}
    >
      {isSatellite ? (
        <>
          <Map size={14} style={{ color: "#85adff" }} />
          <span>Street</span>
        </>
      ) : (
        <>
          <Globe size={14} style={{ color: "#85adff" }} />
          <span>Satellite</span>
        </>
      )}
    </button>
  );
}
