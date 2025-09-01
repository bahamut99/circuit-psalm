export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
export const dist2 = (ax, ay, bx, by) => {
  const dx = ax - bx, dy = ay - by;
  return dx * dx + dy * dy;
};
export const anglerp = (a, b, t) => {
  let d = ((b - a + Math.PI) % (2 * Math.PI)) - Math.PI;
  return a + d * t;
};

// circle vs axis-aligned rect, where rect is center-based (x,y,w,h)
export function circleRectColl(cx, cy, r, rx, ry, rw, rh) {
  const nx = clamp(cx, rx - rw / 2, rx + rw / 2);
  const ny = clamp(cy, ry - rh / 2, ry + rh / 2);
  const dx = cx - nx, dy = cy - ny;
  return (dx * dx + dy * dy) <= r * r;
}
