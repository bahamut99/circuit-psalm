import * as THREE from 'three'
import { pointHitsWalls, circleVsCircle } from './collision.js'

// spawn plan per level
export function planSpawns(levelSpec, W, H) {
  const spawns = []
  const center = new THREE.Vector2(0, 0)

  const push = (type, count, spread = 0.75) => {
    for (let i = 0; i < count; i++) {
      // random point near edges, away from center
      const side = Math.floor(Math.random() * 4)
      let x = 0, y = 0
      if (side === 0) { x = -W * spread; y = (Math.random() * 2 - 1) * H * 0.45 }
      if (side === 1) { x =  W * spread; y = (Math.random() * 2 - 1) * H * 0.45 }
      if (side === 2) { y = -H * spread; x = (Math.random() * 2 - 1) * W * 0.45 }
      if (side === 3) { y =  H * spread; x = (Math.random() * 2 - 1) * W * 0.45 }

      const id = crypto.randomUUID()
      if (type === 'chaser') {
        spawns.push({ id, type, x, y, vx: 0, vy: 0, r: 3, hp: 3, speed: 22 })
      } else if (type === 'turret') {
        spawns.push({ id, type, x, y, vx: 0, vy: 0, r: 3.5, hp: 5, cooldown: 0 })
      } else { // spinner
        spawns.push({ id, type: 'spinner', x, y, vx: 0, vy: 0, r: 3.2, hp: 4, t: 0 })
      }
    }
  }

  // gentle curve up: easy first, more later
  const idx = Math.max(1, levelSpec.time ? 1 : 1)
  const stage = ((idx - 1) % 3)

  push('chaser', 6 + stage * 2)
  if (stage >= 1) push('spinner', 2 + stage)
  if (stage >= 2) push('turret', 1 + stage)

  return spawns
}

export function updateAll({
  W, H, walls, dt,
  enemies, bullets, powerups,
  addBullet, addPowerUp, setArrays,
  setLives, powerRapid, powerShield, setPowerRapid, setPowerShield, addLife,
}) {
  // ---- bullets ----
  const nb = []
  for (let i = 0; i < bullets.length; i++) {
    const b = bullets[i]
    const nx = b.x + b.vx * dt
    const ny = b.y + b.vy * dt
    const life = b.life - dt
    if (life <= 0) continue
    if (pointHitsWalls(nx, ny, b.r, walls, W, H)) continue
    nb.push({ ...b, x: nx, y: ny, life })
  }

  // ---- enemies (simple behaviors) ----
  const ne = []
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i]
    if (e.hp <= 0) continue

    if (e.type === 'chaser') {
      // chase origin (center). If you later store player pos, target that instead.
      const dx = 0 - e.x, dy = 0 - e.y
      const len = Math.hypot(dx, dy) || 1
      const ax = (dx / len) * e.speed
      const ay = (dy / len) * e.speed
      const vx = THREE.MathUtils.lerp(e.vx, ax, 0.6 * dt)
      const vy = THREE.MathUtils.lerp(e.vy, ay, 0.6 * dt)
      let nx = e.x + vx * dt, ny = e.y + vy * dt
      // stop if hitting walls
      if (!pointHitsWalls(nx, ny, e.r, walls, W, H)) {
        ne.push({ ...e, x: nx, y: ny, vx, vy })
      } else {
        ne.push({ ...e, vx: 0, vy: 0 })
      }
    } else if (e.type === 'turret') {
      const cd = (e.cooldown ?? 0) - dt
      if (cd <= 0) {
        // shoot toward center
        const dx = 0 - e.x, dy = 0 - e.y
        const len = Math.hypot(dx, dy) || 1
        const sp = 36
        addBullet({
          id: crypto.randomUUID(),
          owner: 'enemy',
          x: e.x, y: e.y,
          vx: (dx / len) * sp, vy: (dy / len) * sp,
          r: 0.9, life: 3.0, color: '#ff5a5a',
        })
        ne.push({ ...e, cooldown: 0.9 })
      } else {
        ne.push({ ...e, cooldown: cd })
      }
    } else {
      // spinner = lazy circle move & radial bursts
      const t = (e.t ?? 0) + dt
      const s = 12
      const nx = e.x + Math.cos(t * 0.8) * s * dt
      const ny = e.y + Math.sin(t * 0.8) * s * dt
      // small radial volley every ~1.2s
      if (Math.floor((e.t ?? 0) / 1.2) !== Math.floor(t / 1.2)) {
        const n = 10, sp = 28, base = Math.random() * Math.PI * 2
        for (let k = 0; k < n; k++) {
          const a = base + (k / n) * Math.PI * 2
          addBullet({
            id: crypto.randomUUID(),
            owner: 'enemy',
            x: nx, y: ny,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            r: 0.9, life: 2.2, color: '#ffd166',
          })
        }
      }
      ne.push({ ...e, x: nx, y: ny, t })
    }
  }

  // ---- bullet vs enemy ----
  const ne2 = []
  for (let i = 0; i < ne.length; i++) {
    const e = ne[i]
    let hp = e.hp
    for (let j = 0; j < nb.length; j++) {
      const b = nb[j]
      if (b.owner !== 'player') continue
      if (circleVsCircle(e.x, e.y, e.r, b.x, b.y, b.r)) {
        // bullet consumed
        nb[j] = nb[nb.length - 1]; nb.pop(); j--
        hp -= 1
        if (hp <= 0) break
      }
    }
    if (hp > 0) {
      ne2.push({ ...e, hp })
    } else {
      // small drop chance (5%), ttl 5s
      if (Math.random() < 0.05) {
        const kinds = ['rapid', 'shield', 'life']
        const kind = kinds[Math.floor(Math.random() * kinds.length)]
        addPowerUp({
          id: crypto.randomUUID(),
          kind,
          x: e.x, y: e.y, r: 1.6,
          ttl: 5, // seconds
        })
      }
    }
  }

  // ---- powerups lifetime ----
  const np = []
  for (let i = 0; i < powerups.length; i++) {
    const p = powerups[i]
    const ttl = (p.ttl ?? 5) - dt
    if (ttl > 0) np.push({ ...p, ttl })
  }

  setArrays({ enemies: ne2, bullets: nb, powerups: np })
}
