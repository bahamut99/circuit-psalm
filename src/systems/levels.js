/**
 * Builds beveled rectangles for a few simple arenas.
 * Units are world units; Level.jsx renders them with a center-origin.
 */

export const LEVELS = [
  { time: 55, layout: 0 },
  { time: 60, layout: 1 },
  { time: 65, layout: 2 },
]

export function buildWalls(levelIdx, W, H) {
  const t = 4 // boundary thickness
  const walls = []

  // outer border
  walls.push({ x: 0, y: 0, w: W, h: t })            // top
  walls.push({ x: 0, y: H - t, w: W, h: t })        // bottom
  walls.push({ x: 0, y: 0, w: t, h: H })            // left
  walls.push({ x: W - t, y: 0, w: t, h: H })        // right

  // a few inner shapes by layout
  const L = LEVELS[(levelIdx - 1) % LEVELS.length]
  if (L.layout === 0) {
    // two horizontal bars
    walls.push({ x: W * 0.22, y: H * 0.40, w: W * 0.56, h: t })
    walls.push({ x: W * 0.22, y: H * 0.60, w: W * 0.56, h: t })
  } else if (L.layout === 1) {
    // U maze
    walls.push({ x: W * 0.18, y: H * 0.25, w: t, h: H * 0.55 })
    walls.push({ x: W * 0.18, y: H * 0.25, w: W * 0.64, h: t })
    walls.push({ x: W * 0.82 - t, y: H * 0.25, w: t, h: H * 0.55 })
    walls.push({ x: W * 0.40, y: H * 0.70 - t, w: W * 0.42, h: t })
  } else {
    // two pillars
    walls.push({ x: W * 0.30, y: H * 0.30, w: t, h: H * 0.40 })
    walls.push({ x: W * 0.70 - t, y: H * 0.30, w: t, h: H * 0.40 })
    walls.push({ x: W * 0.40, y: H * 0.48, w: W * 0.20, h: t })
  }

  // NOTE: these x/y are in top-left origin (0..W,0..H) for Level.jsx's Box2 conversion
  return walls.map((w) => ({
    x: Math.floor(w.x),
    y: Math.floor(w.y),
    w: Math.floor(w.w),
    h: Math.floor(w.h),
  }))
}
