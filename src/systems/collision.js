import * as THREE from 'three'

/**
 * Point vs wall boxes (expanded by radius).
 * Walls are THREE.Box2 in "screen" coords (Level builds them from wall specs).
 * Player/bullets live in arena coords centered at (0,0) with +Y up.
 */
export function pointHitsWalls(px, py, r, walls, W, H) {
  for (const box of walls) {
    // convert to arena space (see Player.resolveCircleVsBox)
    const min = new THREE.Vector2(box.min.x - W / 2, H / 2 - box.max.y)
    const max = new THREE.Vector2(box.max.x - W / 2, H / 2 - box.min.y)
    if (
      px >= min.x - r && px <= max.x + r &&
      py >= min.y - r && py <= max.y + r
    ) {
      return true
    }
  }
  return false
}

export function circleVsCircle(ax, ay, ar, bx, by, br) {
  const dx = ax - bx, dy = ay - by
  const rr = (ar + br) * (ar + br)
  return dx * dx + dy * dy <= rr
}
