import { rand } from "./collision";

export function makeLevel(levelIndex) {
  const time = 60 + Math.min(20, levelIndex * 4);

  // Outer arena, add internal bars after L2
  const walls = [
    { x: 0.0, y: 0.38, w: 0.90, h: 0.02 },
    { x: 0.0, y: -0.38, w: 0.90, h: 0.02 },
    { x: -0.45, y: 0.0, w: 0.02, h: 0.76 },
    { x: 0.45, y: 0.0, w: 0.02, h: 0.76 },
  ];
  if (levelIndex >= 2) {
    walls.push({ x: -0.12, y: 0.12, w: 0.22, h: 0.02 });
    walls.push({ x: 0.18, y: -0.10, w: 0.22, h: 0.02 });
  }

  // Spawns (normalized space: -0.5..0.5 screen units)
  const spawns = [];
  const n = Math.min(6 + levelIndex * 2, 22);

  if (levelIndex < 2) {
    for (let k = 0; k < n; k++)
      spawns.push({ type: "chaser", x: 0.35, y: rand(-0.25, 0.25), count: 1 });
  } else if (levelIndex < 4) {
    for (let k = 0; k < n; k++)
      spawns.push({
        type: k % 4 === 0 ? "spinner" : "chaser",
        x: 0.30,
        y: -0.30 + (k % 6) * 0.12,
        count: 1,
      });
  } else {
    for (let k = 0; k < n; k++)
      spawns.push({
        type: k % 5 === 0 ? "turret" : k % 2 ? "spinner" : "chaser",
        x: k % 2 ? 0.32 : 0.28,
        y: -0.32 + (k % 8) * 0.08,
        count: 1,
      });
  }

  return { time, walls, spawns };
}

export function pickBoss(levelIndex) {
  return `boss${(levelIndex % 3) + 1}`; // boss1 | boss2 | boss3
}
