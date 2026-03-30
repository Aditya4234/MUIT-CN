"use client";

import type { CampusLocation } from "@/types";
import { COLLEGE_GATE } from "@/constants/locations";
import { haversineDistance } from "@/utils/bearing";
import { formatDistance } from "@/utils/formatDistance";

interface SearchResultsProps {
  results: CampusLocation[];
  onSelect: (location: CampusLocation) => void;
}

export function SearchResults({ results, onSelect }: SearchResultsProps) {
  if (results.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-700 overflow-hidden z-50">
      {results.map((loc) => {
        const dist = haversineDistance(
          COLLEGE_GATE.lat, COLLEGE_GATE.lng,
          loc.lat, loc.lng
        );
        return (
          <button
            key={loc.id}
            onClick={() => onSelect(loc)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors text-left"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
              style={{ backgroundColor: loc.color + "22", border: `2px solid ${loc.color}` }}
            >
              {loc.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                {loc.label}
              </p>
              <p className="text-xs text-gray-400">{formatDistance(dist)} from gate</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
