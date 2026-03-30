"use client";

import { useState, useEffect } from "react";
import { Marker, Popup } from "react-map-gl/mapbox";
import type { CampusLocation } from "@/types";
import { COLLEGE_GATE } from "@/constants/locations";
import { haversineDistance } from "@/utils/bearing";
import { formatDistance } from "@/utils/formatDistance";
import { useNavigationStore } from "@/store/navigationStore";

interface DestinationPinProps {
  location: CampusLocation;
  onSelect: (id: string) => void;
}

export function DestinationPin({ location, onSelect }: DestinationPinProps) {
  const [showPopup, setShowPopup] = useState(false);
  const { viewMode } = useNavigationStore();

  // Close popup when entering AR or turn-by-turn — it floats over the HUD
  useEffect(() => {
    if (viewMode === "ar-simulation" || viewMode === "turn-by-turn") {
      setShowPopup(false);
    }
  }, [viewMode]);
  const distance = haversineDistance(
    COLLEGE_GATE.lat, COLLEGE_GATE.lng,
    location.lat, location.lng
  );

  return (
    <>
      <Marker
        longitude={location.lng}
        latitude={location.lat}
        anchor="bottom"
        onClick={(e) => {
          e.originalEvent.stopPropagation();
          setShowPopup(true);
          onSelect(location.id);
        }}
      >
        <div className="flex flex-col items-center cursor-pointer group">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-lg border-2 border-white group-hover:scale-110 transition-transform"
            style={{ backgroundColor: location.color }}
          >
            {location.icon}
          </div>
          <div
            className="w-0 h-0"
            style={{
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: `8px solid ${location.color}`,
            }}
          />
        </div>
      </Marker>

      {showPopup && (
        <Popup
          longitude={location.lng}
          latitude={location.lat}
          anchor="bottom"
          offset={55}
          onClose={() => setShowPopup(false)}
          className="rounded-xl"
        >
          <div className="p-2 min-w-[140px]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{location.icon}</span>
              <span className="font-semibold text-sm text-gray-900">{location.label}</span>
            </div>
            <p className="text-xs text-gray-500">{formatDistance(distance)} from gate</p>
          </div>
        </Popup>
      )}
    </>
  );
}
