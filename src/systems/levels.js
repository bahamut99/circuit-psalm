// very simple starter layouts (easy first)
export const LEVELS = [
  {
    time: 60,
    walls: [
      // outer border
      { x: 1, y: 1, w: 98, h: 2 },
      { x: 1, y: 53, w: 98, h: 2 },
      { x: 1, y: 1, w: 2, h: 54 },
      { x: 97, y: 1, w: 2, h: 54 },
    ],
    spawns: [
      { type: 'chaser', x: 0.85, y: 0.5, count: 4 },
    ],
    boss: true
  },
  {
    time: 65,
    walls: [
      { x: 1, y: 1, w: 98, h: 2 }, { x: 1, y: 53, w: 98, h: 2 },
      { x: 1, y: 1, w: 2, h: 54 }, { x: 97, y: 1, w: 2, h: 54 },
      // inner bars with gaps
      { x: 20, y: 18, w: 60, h: 2 },
      { x: 20, y: 36, w: 60, h: 2 },
      { x: 20, y: 18, w: 2, h: 20 },
      { x: 78, y: 18, w: 2, h: 8 },
      { x: 78, y: 30, w: 2, h: 8 },
    ],
    spawns: [
      { type:'chaser', x:0.8, y:0.3, count:4 },
      { type:'turret', x:0.8, y:0.7, count:1 },
    ],
    boss: true
  },
  {
    time: 60,
    walls: [
      { x: 1, y: 1, w: 98, h: 2 }, { x: 1, y: 53, w: 98, h: 2 },
      { x: 1, y: 1, w: 2, h: 54 }, { x: 97, y: 1, w: 2, h: 54 },
      { x: 15, y: 12, w: 2, h: 32 }, { x: 83, y: 12, w: 2, h: 32 },
      { x: 32, y: 26, w: 36, h: 2 },
    ],
    spawns: [
      { type:'spinner', x:0.2, y:0.25, count:2 },
      { type:'spinner', x:0.8, y:0.75, count:2 },
      { type:'chaser', x:0.5, y:0.5, count:6 },
    ],
    boss: true
  }
]

// convert normalized walls {x:[0..1], y:[0..1]} into our world units (100x56) but we store as pixelish coords for 3D meshes.
// Here Level.jsx expects absolute box coords in "world pixel" space (top-left origin-ish we adapt later).
export function buildWalls(levelIndex, W, H){
  const L = LEVELS[(levelIndex-1) % LEVELS.length]
  // NOTE: LEVELS here already define walls in absolute units (for simplicity), so just return them
  return L.walls
}
