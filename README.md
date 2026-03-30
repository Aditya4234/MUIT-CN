# AR/VR Campus Navigation System — POC

**Web-based proof-of-concept · Published Research Paper Demo**

> A Next.js app that simulates a full AR campus navigation experience inside a single Mapbox GL JS map instance — no Three.js, no WebXR, no separate 3D engine.

🔗 **[Live Demo](#)** · 🎬 **[Demo Video](#)** · 📄 **[Research Paper](#)**

---

## What It Does

Four progressive camera states on one map canvas, transitioning seamlessly:

| Mode | Pitch | Description |
|------|-------|-------------|
| **1 — 2D Map** | 0° | Default idle state with interactive destination pins |
| **2 — Route Overview** | 45° | Walking route polyline, bearing-aligned to destination |
| **3 — Turn-by-Turn** | 60° | 3D buildings, terrain, directional arrow, step instructions |
| **4 — AR Simulation** | 85° | Eye-level camera (1.7 m), fog atmosphere, holographic buildings, 3D neon path, AR markers |

All transitions are camera parameter changes only — no re-renders or canvas replacement.

---

## Screenshots

| 2D Map | Route Overview |
|--------|---------------|
| *(screenshot)* | *(screenshot)* |

| Turn-by-Turn | AR Simulation |
|-------------|---------------|
| *(screenshot)* | *(screenshot)* |

---

## Architecture

### Single Mapbox GL JS Instance

The key innovation: four "views" are just pitch/zoom/bearing changes on one `mapboxgl.Map`. No separate 3D engines, no canvas swaps.

```
mapboxgl.Map
  ├── Mode 1: pitch 0°,  zoom 15  — 2D flat map
  ├── Mode 2: pitch 45°, fitBounds — route overview
  ├── Mode 3: pitch 60°, zoom 18  — 3D turn-by-turn (terrain DEM)
  └── Mode 4: pitch 85°, zoom 20  — AR simulation (FreeCameraOptions @ 1.7 m)
```

### AR Mode Key Details

- **FreeCameraOptions API** — `MercatorCoordinate.fromLngLat(lngLat, 1.7)` positions camera at true eye level (1.7 m above ground)
- **360° look-around** — click-and-drag (desktop) / DeviceOrientation (mobile) via `setPitchBearing()` preserving altitude
- **3D neon path** — `@turf/buffer` converts route LineString → 2 m polygon → `fill-extrusion` + neon centerline glow
- **Holographic buildings** — `fill-extrusion-emissive-strength: 1.0` makes buildings self-luminous, bypassing PBR shadows
- **Atmosphere** — `map.setFog()` with dark blue `horizon-blend` hides the flat-map edge

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Map Engine | Mapbox GL JS v3 + react-map-gl v8 |
| State | Zustand v5 |
| Animations | Framer Motion |
| Geospatial | @turf/buffer, @turf/helpers |
| Styling | Tailwind CSS v4 |
| Notifications | Sonner |

---

## Research Paper

> **"AR-Based Indoor/Outdoor Campus Navigation Using Web Technologies"**
>
> 📄 [Link to paper](#)

This POC demonstrates the core navigation UX described in the paper — specifically the progressive camera simulation of an AR overlay using standard web map APIs.

---

## Confidentiality Note

This is a **proof-of-concept** web demo of a university in-house mobile app (Flutter/AR) currently under development. All coordinates used are publicly visible satellite data. No proprietary data or internal systems are exposed.

---

## How to Run Locally

```bash
# Clone
git clone https://github.com/ripunjkashyap-a11y/campus-navigation-poc.git
cd campus-navigation-poc

# Install
npm install

# Environment — create .env.local
echo "NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here" > .env.local

# Dev server
npm run dev
# → http://localhost:3000
```

Requires a free [Mapbox account](https://account.mapbox.com/) and access token.

---

## Project Structure

```
app/                    # Next.js App Router
components/
  ar/                   # AR HUD overlay
  map/                  # Map layers (route, buildings, markers)
  navigation/           # Info panel, turn-by-turn overlay
  search/               # Location search
  ui/                   # Mode indicator
constants/              # Campus coordinates (single source of truth)
hooks/                  # useARControls, useDirections, useSearch
store/                  # Zustand navigation store
utils/                  # Bearing, distance, fog config
```
