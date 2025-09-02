import * as THREE from 'three'

// clamp circle inside world bounds and push out of wall boxes
export function resolveWallsCircle(s, r, walls, world){
  // world clamp
  s.x = Math.max(world.x + r, Math.min(world.x + world.w - r, s.x))
  s.y = Math.max(world.y + r, Math.min(world.y + world.h - r, s.y))

  // AABB vs circle
  for (const b of walls){
    const nx = THREE.MathUtils.clamp(s.x, b.min.x, b.max.x)
    const ny = THREE.MathUtils.clamp(s.y, b.min.y, b.max.y)
    const dx = s.x - nx, dy = s.y - ny
    if (dx*dx + dy*dy <= r*r){
      // resolve along smallest axis
      const left = Math.abs((s.x + r) - b.min.x)
      const right= Math.abs(b.max.x - (s.x - r))
      const top  = Math.abs((s.y + r) - b.min.y)
      const bott = Math.abs(b.max.y - (s.y - r))
      const m = Math.min(left,right,top,bott)
      if (m===left)  s.x = b.min.x - r - 0.01
      else if (m===right) s.x = b.max.x + r + 0.01
      else if (m===top)   s.y = b.min.y - r - 0.01
      else                s.y = b.max.y + r + 0.01
      s.vx *= 0.5; s.vy *= 0.5
    }
  }
}

export const dist2 = (ax,ay,bx,by) => {
  const dx=ax-bx, dy=ay-by; return dx*dx+dy*dy
}
