# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev       # Start dev server at localhost:3000
npm run build     # Production build
npm run lint      # ESLint
```

No test framework is configured yet.

## Project Overview

**AR/VR Campus Navigation POC** — a Next.js 16 / React 19 web app that simulates an AR campus navigation experience entirely within a single Mapbox GL JS instance. No Three.js, no WebXR, no separate 3D engine.

The app lives almost entirely in `app/page.tsx` (or will be built out from there). The key innovation is four progressive camera states on one map, not four separate views.

## Core Architecture

### The Four-Mode State Machine

All modes share a **single `mapboxgl.Map` instance**. Transitions are camera parameter changes only — no re-renders, no canvas replacement:

| Mode | Pitch | Zoom | Bearing | What changes |
|------|-------|------|---------|--------------|
| 1 — 2D Map | 0° | 15 | 0° (north) | Default idle state |
| 2 — Route Overview | 45° | fitBounds | route bearing | Route polyline visible, info panel slides up |
| 3 — Turn-by-Turn | 60° | 18 | step bearing | 3D buildings, directional arrow replaces dot |
| 4 — AR Simulation | 85° | 20+ | mouse/gyro | Fog, holographic CSS markers, pan locked |

### Zustand Store

Global state (`store/navigationStore.ts` or similar) holds:
- `viewMode`: `'2d' | 'overview' | 'navigation' | 'ar'`
- `selectedDestination`: one of the 4 campus locations or null
- `routeData`: Directions API response
- `navSteps`: extracted turn-by-turn instructions

### Data: Static Coordinates (Single Source of Truth)

Defined in `constants/locations.ts`. **Do not modify coordinates without re-verifying on satellite imagery.**

- **College Gate** (static "live location" origin): `[80.22596731088542, 12.872848666834663]`
- **⚠️ Known bug risk:** Library longitude is `80.21920382817343` — a copy error that drops the `80.` prefix places the marker in the Gulf of Guinea. Verify before every commit.

### Map Layers

- Route: GeoJSON source + `line` layer (Mapbox Directions API walking route)
- 3D buildings: `fill-extrusion` layer or Mapbox Standard style built-in
- Fog/sky: `map.setFog()` — used only in Mode 4 to hide the horizon
- Gate marker: pulsing blue CSS dot (Modes 1–2) → directional arrow (Modes 3–4)
- AR markers: CSS-transformed `mapboxgl.Marker` elements with holographic styling, added only in Mode 4

### AR Mode (Mode 4) — Key Implementation Details

- Camera locked to gate coords; `map.dragPan.disable()`
- Desktop: `mousemove` → `map.setBearing(((x / width) - 0.5) * 360)`
- Mobile: `deviceorientation` → `map.setBearing(e.alpha)`
- Fog config: `range: [-1, 2]`, `horizon-blend: 0.4` (hides flat-map edge)
- AR arrow markers use `backdrop-filter: blur`, `box-shadow` glow, and `ar-pulse` keyframe animation

## Environment

Requires a Mapbox access token. Expected at `NEXT_PUBLIC_MAPBOX_TOKEN` in `.env.local`.

## Key Dependencies

- `mapbox-gl` v3 + `react-map-gl` v8 — map engine and React wrapper
- `zustand` v5 — navigation state
- `framer-motion` — UI panel slide animations (not map transitions)
- `sonner` — toast notifications
- Tailwind CSS v4 (PostCSS plugin, no `tailwind.config.js`)
