"use client";

import { Map, Globe } from "lucide-react";

interface MapStyleToggleProps {
  isSatellite: boolean;
  onToggle: () => void;
}

export function MapStyleToggle({ isSatellite, onToggle }: MapStyleToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="absolute top-4 right-4 z-40 flex items-center gap-2 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border border-gray-200 dark:border-zinc-700 rounded-full px-3 py-2 text-sm font-medium shadow-md hover:bg-white dark:hover:bg-zinc-700 transition-colors"
    >
      {isSatellite ? (
        <>
          <Map size={16} className="text-gray-700 dark:text-gray-300" />
          <span className="text-gray-700 dark:text-gray-300">Street</span>
        </>
      ) : (
        <>
          <Globe size={16} className="text-gray-700 dark:text-gray-300" />
          <span className="text-gray-700 dark:text-gray-300">Satellite</span>
        </>
      )}
    </button>
  );
}
