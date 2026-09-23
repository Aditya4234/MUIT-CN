"use client";

import { useState, useMemo } from "react";
import { Search, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigationStore } from "@/store/navigationStore";
import { CAMPUS_LOCATIONS, COLLEGE_GATE } from "@/constants/locations";
import { haversineDistance } from "@/utils/bearing";
import { formatDistance } from "@/utils/formatDistance";
import { useSearch } from "@/hooks/useSearch";
import { LOCATION_ICONS } from "@/constants/locationIcons";
import { AuthControls } from "./AuthControls";
import type { CampusLocation } from "@/types";

const ICON_COLORS: Record<string, string> = {
  admin:       "#85adff",
  "second-gate": "#60a5fa",
  library:     "#ac8aff",
  engineering: "#f59e0b",
  "engineering-workshop": "#38bdf8",
  canteen:     "#9bffce",
  "second-canteen": "#4ade80",
  auditorium:  "#ff6b6b",
  "boys-hostel":  "#06b6d4",
  "girls-hostel": "#ec4899",
  playground:  "#f97316",
  "computer-lab": "#14b8a6",
  "programming-lab": "#2dd4bf",
  pharmacy:    "#a855f7",
  "chancellors-house": "#fb7185",
  commerce:    "#eab308",
  science:     "#6366f1",
  humanities:  "#d946ef",
  parking:     "#78716c",
};

const LOCATION_STATUS: Record<string, { isOpen: boolean }> = {
  admin:       { isOpen: true  },
  "second-gate":  { isOpen: true  },
  library:     { isOpen: true  },
  engineering: { isOpen: true  },
  "engineering-workshop": { isOpen: true  },
  canteen:     { isOpen: true  },
  "second-canteen": { isOpen: true  },
  auditorium:  { isOpen: false },
  "boys-hostel":  { isOpen: true  },
  "girls-hostel": { isOpen: true  },
  playground:  { isOpen: true  },
  "computer-lab": { isOpen: true  },
  "programming-lab": { isOpen: true  },
  pharmacy:    { isOpen: true  },
  "chancellors-house": { isOpen: true  },
  commerce:    { isOpen: true  },
  science:     { isOpen: true  },
  humanities:  { isOpen: true  },
  parking:     { isOpen: true  },
};

type Filter = "all" | "nearest" | "open";

function distanceFromOrigin(
  origin: { lat: number; lng: number },
  loc: { lat: number; lng: number }
) {
  return haversineDistance(origin.lat, origin.lng, loc.lat, loc.lng);
}

export function Sidebar() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const {
    selectDestination, setHoveredLocation, hoveredLocation,
    selectedDestination, viewMode, isSidebarOpen, setSidebarOpen,
    userLocation
  } = useNavigationStore();
  const searchResults = useSearch(query);
  const isSearching = query.length > 0;
  // Live origin for distances — GPS fix when available, gate as fallback
  const origin = userLocation ?? COLLEGE_GATE;
  const distances = useMemo(
    () =>
      Object.fromEntries(
        CAMPUS_LOCATIONS.map((l) => [l.id, distanceFromOrigin(origin, l)])
      ) as Record<string, number>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userLocation?.lat, userLocation?.lng]
  );
  const displayList = useMemo((): readonly CampusLocation[] => {
    if (filter === "open")
      return CAMPUS_LOCATIONS.filter((l) => LOCATION_STATUS[l.id]?.isOpen) as CampusLocation[];
    if (filter === "nearest")
      return [...CAMPUS_LOCATIONS].sort((a, b) => distances[a.id] - distances[b.id]) as CampusLocation[];
    return CAMPUS_LOCATIONS;
  }, [filter, distances]);

  // All hooks above — safe to early-return now
  if (viewMode === "ar-simulation" || viewMode === "turn-by-turn") return null;

  const finalList: readonly CampusLocation[] = isSearching ? searchResults : displayList;

  function handleSelect(id: string) {
    setQuery("");
    selectDestination(id);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }

  return (
    <>
      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] md:relative md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{ background: "var(--surface-low)", borderRight: "1px solid rgba(133, 173, 255, 0.05)" }}
      >
        {/* Header — Luminous brand anchor */}
        <div className="px-5 pt-8 pb-6 bg-transparent relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full blur-[60px] opacity-20" style={{ background: "var(--primary)" }} />
          
          {/* Mobile Close Button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-6 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white/40 hover:text-white md:hidden z-20"
          >
            <X size={16} />
          </button>

          <div className="flex flex-col gap-1 relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <div
                  className="w-2.5 h-2.5 rounded-full z-10"
                  style={{ background: "var(--tertiary)", boxShadow: "0 0 15px var(--tertiary)" }}
                />
                <div
                  className="absolute inset-0 w-full h-full rounded-full animate-ping opacity-20"
                  style={{ background: "var(--tertiary)" }}
                />
              </div>
              <h1
                className="text-3xl font-black tracking-[0.35em] mr-[-0.35em]"
                style={{ color: "var(--on-surface)", fontFamily: "var(--font-bricolage)" }}
              >
                CNS
              </h1>
            </div>
            <p
              className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40 ml-0.5"
              style={{ color: "var(--on-surface-muted)", fontFamily: "var(--font-inter)" }}
            >
              MAHARISHI UNIVERSITY OF INFORMATION TECHNOLOGY
            </p>
          </div>
      </div>

      {/* Search */}
      <div className="px-4 pb-5">
        <div
          className="flex items-center gap-3 rounded-[18px] px-4 py-3 transition-all duration-300 group"
          style={{
            background: "rgba(25, 37, 64, 0.4)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(133, 173, 255, 0.08)",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
          }}
        >
          <Search size={15} style={{ color: "var(--on-surface-muted)", opacity: 0.6 }} className="group-focus-within:text-[#85adff] transition-colors" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search campus places…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#40485d]"
            style={{ color: "var(--on-surface)", fontFamily: "var(--font-inter)" }}
          />
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                onClick={() => setQuery("")}
                style={{ color: "var(--on-surface-muted)" }}
                className="hover:text-white transition-colors"
              >
                <X size={14} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Filter chips */}
      <AnimatePresence>
        {!isSearching && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="px-4 pb-6 flex gap-2.5 overflow-hidden"
          >
            {(["all", "nearest", "open"] as Filter[]).map((f) => {
              const isActive = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="px-4 py-1.5 rounded-full text-[11px] font-bold tracking-tight transition-all duration-200"
                  style={{
                    fontFamily: "var(--font-inter)",
                    background: isActive
                      ? "linear-gradient(135deg, var(--primary), var(--primary-dim))"
                      : "rgba(25, 37, 64, 0.4)",
                    color: isActive ? "#060e20" : "var(--on-surface-muted)",
                    backdropFilter: isActive ? undefined : "blur(12px)",
                    border: isActive ? "none" : "1px solid rgba(133, 173, 255, 0.05)",
                    boxShadow: isActive ? "0 4px 12px rgba(133, 173, 255, 0.3)" : "none",
                  }}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section label */}
      <div className="px-6 pb-3">
        <span
          className="text-[10px] uppercase tracking-[0.15em] font-black opacity-40"
          style={{ color: "var(--on-surface-muted)", fontFamily: "var(--font-inter)" }}
        >
          {isSearching ? "Search Results" : "Campus Locations"}
        </span>
      </div>

      {/* Location list */}
      <div className="flex-1 overflow-y-auto px-2 pb-6 space-y-1 scrollbar-hide">
        <AnimatePresence mode="popLayout">
          {finalList.map((loc) => {
            const Icon = LOCATION_ICONS[loc.id];
            const iconColor = ICON_COLORS[loc.id] ?? loc.color;
            const status = LOCATION_STATUS[loc.id];
            const isSelected = selectedDestination === loc.id;
            const isHovered = hoveredLocation === loc.id;
            const isActive = isSelected || isHovered;
            const dist = distances[loc.id];

            return (
              <motion.button
                key={loc.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={() => handleSelect(loc.id)}
                onMouseEnter={() => setHoveredLocation(loc.id)}
                onMouseLeave={() => setHoveredLocation(null)}
                className="relative w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left transition-all duration-300 group"
                style={{ background: isActive ? "rgba(133, 173, 255, 0.08)" : "transparent" }}
              >
                {isSelected && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute left-1 top-4 bottom-4 w-1 rounded-full shadow-[0_0_8px_var(--primary)]"
                    style={{ background: "var(--primary)" }}
                  />
                )}
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-inner"
                  style={{ background: iconColor + "15", border: `1px solid ${iconColor}20` }}
                >
                  {Icon && <Icon size={18} style={{ color: iconColor, filter: isActive ? `drop-shadow(0 0 8px ${iconColor}60)` : "none" }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-bold tracking-tight leading-snug"
                    style={{ color: isSelected ? "var(--primary)" : "var(--on-surface)", fontFamily: "var(--font-bricolage)" }}
                  >
                    {loc.label}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status?.isOpen ? "animate-pulse" : ""}`}
                      style={{
                        background: status?.isOpen ? "var(--tertiary)" : "rgba(163, 170, 196, 0.2)",
                        boxShadow: status?.isOpen ? "0 0 6px var(--tertiary)" : "none",
                      }}
                    />
                    <p
                      className="text-[11px] font-medium opacity-70"
                      style={{ color: "var(--on-surface-muted)", fontFamily: "var(--font-inter)" }}
                    >
                      {formatDistance(dist)} <span className="opacity-40">·</span> {status?.isOpen ? "Open Now" : "Closed"}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={14}
                  className="flex-shrink-0 transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2"
                  style={{ color: "var(--primary)" }}
                />
              </motion.button>
            );
          })}
        </AnimatePresence>

        {isSearching && finalList.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 px-4">
            <p className="text-xs tracking-wide opacity-30" style={{ fontFamily: "var(--font-inter)" }}>
              No campus coordinates match<br />&quot;{query}&quot;
            </p>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-5 mt-auto relative space-y-3" style={{ borderTop: "1px solid rgba(133, 173, 255, 0.05)" }}>
        <AuthControls />
        <div className="flex items-center justify-center gap-2 opacity-30 group hover:opacity-100 transition-opacity">
          <p
            className="text-[10px] font-black uppercase tracking-[0.2em]"
            style={{ color: "var(--on-surface-muted)", fontFamily: "var(--font-inter)" }}
          >
              {CAMPUS_LOCATIONS.length} COORDINATES · MUIT NAVIGATOR
          </p>
        </div>
      </div>
      </aside>
    </>
  );
}
