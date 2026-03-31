"use client";

import { useState } from "react";
import { Search, X, Building2, BookOpen, Trophy, UtensilsCrossed, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigationStore } from "@/store/navigationStore";
import { CAMPUS_LOCATIONS, COLLEGE_GATE } from "@/constants/locations";
import { haversineDistance } from "@/utils/bearing";
import { formatDistance } from "@/utils/formatDistance";
import { useSearch } from "@/hooks/useSearch";
import type { CampusLocation } from "@/types";

const LOCATION_ICONS: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  admin:      Building2,
  library:    BookOpen,
  basketball: Trophy,
  canteen:    UtensilsCrossed,
};

// Design-system-aligned category colors
const ICON_COLORS: Record<string, string> = {
  admin:      "#85adff",  // primary electric blue
  library:    "#ac8aff",  // secondary neon purple
  basketball: "#f59e0b",  // amber — energetic
  canteen:    "#9bffce",  // tertiary emerald
};

const LOCATION_STATUS: Record<string, { isOpen: boolean }> = {
  admin:      { isOpen: true  },
  library:    { isOpen: true  },
  basketball: { isOpen: true  },
  canteen:    { isOpen: false },
};

type Filter = "all" | "nearest" | "open";

export function Sidebar() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const {
    selectDestination, setHoveredLocation, hoveredLocation,
    selectedDestination, viewMode,
  } = useNavigationStore();
  const searchResults = useSearch(query);

  // All hooks above — safe to early-return now
  if (viewMode === "ar-simulation" || viewMode === "turn-by-turn") return null;

  const isSearching = query.length > 0;

  let displayList: readonly CampusLocation[] = CAMPUS_LOCATIONS;
  if (filter === "open") {
    displayList = CAMPUS_LOCATIONS.filter((l) => LOCATION_STATUS[l.id]?.isOpen);
  } else if (filter === "nearest") {
    displayList = [...CAMPUS_LOCATIONS].sort((a, b) => {
      const da = haversineDistance(COLLEGE_GATE.lat, COLLEGE_GATE.lng, a.lat, a.lng);
      const db = haversineDistance(COLLEGE_GATE.lat, COLLEGE_GATE.lng, b.lat, b.lng);
      return da - db;
    });
  }

  const finalList: readonly CampusLocation[] = isSearching ? searchResults : displayList;

  function handleSelect(id: string) {
    setQuery("");
    selectDestination(id);
  }

  return (
    <aside
      className="hidden md:flex flex-col w-72 flex-shrink-0 h-full z-10"
      style={{ background: "#091328" }}
    >
      {/* Header */}
      <div className="px-5 pt-6 pb-5" style={{ background: "#060e20" }}>
        <div className="flex items-center gap-2.5 mb-1">
          {/* Brand accent dot */}
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #85adff, #ac8aff)", boxShadow: "0 0 6px rgba(133,173,255,0.6)" }}
          />
          <h1
            className="text-xl font-extrabold tracking-tight leading-none"
            style={{ color: "#dee5ff", fontFamily: "var(--font-jakarta)" }}
          >
            Campus Navigator
          </h1>
        </div>
        <p
          className="text-xs pl-[18px]"
          style={{ color: "#a3aac4", fontFamily: "var(--font-manrope)", fontWeight: 500 }}
        >
          SRM Institute · Chennai
        </p>
      </div>

      {/* Search — glassmorphic */}
      <div className="px-4 pt-4 pb-3">
        <div
          className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 transition-all duration-200"
          style={{
            background: "rgba(25, 37, 64, 0.6)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            outline: "1px solid rgba(64, 72, 93, 0.15)",
          }}
        >
          <Search size={14} style={{ color: "#a3aac4", flexShrink: 0 }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search campus places…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{
              color: "#dee5ff",
              fontFamily: "var(--font-inter)",
            }}
          />
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.1 }}
                onClick={() => setQuery("")}
                style={{ color: "#a3aac4" }}
              >
                <X size={13} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Filter chips */}
      <AnimatePresence>
        {!isSearching && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-4 flex gap-2 overflow-hidden"
          >
            {(["all", "nearest", "open"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-all duration-150"
                style={{
                  fontFamily: "var(--font-manrope)",
                  background:
                    filter === f
                      ? "linear-gradient(135deg, #85adff, #6e9fff)"
                      : "rgba(25, 37, 64, 0.6)",
                  color: filter === f ? "#060e20" : "#a3aac4",
                  backdropFilter: filter === f ? undefined : "blur(12px)",
                  outline: filter === f ? "none" : "1px solid rgba(64, 72, 93, 0.15)",
                  fontWeight: filter === f ? 700 : 500,
                }}
              >
                {f === "all" ? "All" : f === "nearest" ? "Nearest" : "Open Now"}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section label */}
      <div className="px-5 pb-2">
        <span
          className="text-[10px] uppercase tracking-widest"
          style={{ color: "#40485d", fontFamily: "var(--font-manrope)", fontWeight: 600 }}
        >
          {isSearching ? "Results" : "Locations"}
        </span>
      </div>

      {/* Location list */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
        <AnimatePresence mode="popLayout">
          {finalList.map((loc) => {
            const Icon = LOCATION_ICONS[loc.id];
            const iconColor = ICON_COLORS[loc.id] ?? loc.color;
            const status = LOCATION_STATUS[loc.id];
            const isSelected = selectedDestination === loc.id;
            const isHovered = hoveredLocation === loc.id;
            const isActive = isSelected || isHovered;
            const dist = haversineDistance(COLLEGE_GATE.lat, COLLEGE_GATE.lng, loc.lat, loc.lng);

            return (
              <motion.button
                key={loc.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                onClick={() => handleSelect(loc.id)}
                onMouseEnter={() => setHoveredLocation(loc.id)}
                onMouseLeave={() => setHoveredLocation(null)}
                className="relative w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors duration-150"
                style={{ background: isActive ? "#141f38" : "transparent" }}
              >
                {/* Left active indicator */}
                {isSelected && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
                    style={{ background: "#85adff" }}
                  />
                )}

                {/* Icon container */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: iconColor + "22" }}
                >
                  {Icon && <Icon size={16} style={{ color: iconColor }} />}
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold truncate leading-tight"
                    style={{
                      color: isSelected ? "#85adff" : "#dee5ff",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    {loc.label}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: status?.isOpen ? "#9bffce" : "#40485d" }}
                    />
                    <p
                      className="text-xs truncate"
                      style={{ color: "#a3aac4", fontFamily: "var(--font-manrope)" }}
                    >
                      {formatDistance(dist)} · {status?.isOpen ? "Open" : "Closed"}
                    </p>
                  </div>
                </div>

                {/* Chevron — only visible on hover/active */}
                <ChevronRight
                  size={14}
                  className="flex-shrink-0 transition-all duration-150"
                  style={{
                    color: "#85adff",
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? "translateX(0)" : "translateX(-4px)",
                  }}
                />
              </motion.button>
            );
          })}
        </AnimatePresence>

        {isSearching && finalList.length === 0 && (
          <p
            className="text-xs text-center py-10"
            style={{ color: "#40485d", fontFamily: "var(--font-manrope)" }}
          >
            No results for &quot;{query}&quot;
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4" style={{ background: "#060e20" }}>
        <p
          className="text-[11px] text-center"
          style={{ color: "#40485d", fontFamily: "var(--font-manrope)" }}
        >
          {CAMPUS_LOCATIONS.length} locations · SRM IST
        </p>
      </div>
    </aside>
  );
}
