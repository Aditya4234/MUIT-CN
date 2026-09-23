import { haversineDistance } from "./bearing";

export interface IpLocationResult {
  lat: number;
  lng: number;
  city: string | null;
  region: string | null;
  country: string | null;
  isp: string | null;
}

/** Campus centre (MUIT, Lucknow) — IP fixes are only usable near campus. */
export const CAMPUS_CENTER = { lat: 26.929, lng: 80.9283 };

/**
 * Max distance (km) from campus for an IP-based fix to be used as the
 * navigation origin. IP geolocation is city-level — e.g. an Airtel user may
 * resolve to Patti (~165 km away), which must NOT become the route origin.
 */
export const NEAR_CAMPUS_KM = 50;

/** Estimated accuracy (metres) of an IP-based fix — always coarse. */
export const IP_ACCURACY_M = 5000;

const API_URL = "https://api.ip2location.io/";

function getApiUrl(): string {
  // No `ip` param → the API resolves the caller's own IP automatically.
  // Optional key raises rate limits: set NEXT_PUBLIC_IP2LOCATION_KEY in .env.local
  const key = process.env.NEXT_PUBLIC_IP2LOCATION_KEY;
  return key ? `${API_URL}?key=${encodeURIComponent(key)}` : API_URL;
}

/**
 * Looks up the caller's coarse location via ip2location.io.
 * Throws on network error, bad response, or missing coordinates.
 */
export async function fetchIpLocation(timeoutMs = 8000): Promise<IpLocationResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(getApiUrl(), { signal: ctrl.signal });
    if (!res.ok) throw new Error(`IP geolocation error: ${res.status}`);
    const data = await res.json();
    const lat = Number(data.latitude);
    const lng = Number(data.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new Error("IP geolocation returned no coordinates");
    }
    return {
      lat,
      lng,
      city: data.city_name ?? data.city?.name ?? null,
      region: data.region_name ?? data.region?.name ?? null,
      country: data.country_name ?? data.country?.name ?? null,
      isp: data.isp ?? data.as ?? null,
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Distance (km) of a point from campus centre. */
export function distanceFromCampusKm(lat: number, lng: number): number {
  return haversineDistance(CAMPUS_CENTER.lat, CAMPUS_CENTER.lng, lat, lng) / 1000;
}
