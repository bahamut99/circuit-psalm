import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../systems/store.js'

/**
 * Player puck with a small pointer "nose".
 * Props:
 *  - W, H: arena size in world units
 *  - walls: THREE.Box2[] axis-aligned rectangles in world coords (top-left origin: (-W/2,+H/2))
 *  - input: Controls.useInputBindings() return — should expose:
 *      input.move: { x: -1..1, y: -1..1 }   // WASD movement vector
 *      input.fire: boolean                  // arrows or mouse+space
 *      input.aim:  { x: number, y: number } // world-space aim point (mouse), may be null
 *      input.fireDir: { x: -1..1, y: -1..1 } // from arrow keys when not using mouse
 */
export default function Player({ W, H, walls, input }) {
  const mesh = useRef()
  const nose = useRef()

  // store interactions
  const addBullet    = useGameStore(s => s.addBullet)
  const powerRapid   = useGameStore(s => s.powerRapid)

  // local kinematics
  const pos = useMemo(() => new THREE.Vector2(0, 0), [])
  const vel = useMemo(() => new THREE.Vector2(0, 0), [])
  const aim = useMemo(() => new THREE.Vector2(1, 0), [])
  const tmp = useMemo(() => new THREE.Vector2(), [])

  const radius = 3.5
  const accel  = 70
  const maxSpd = 32
  const friction = 7

  let cd = 0 // cooldown (closed over in frame)

  // simple circle-vs-rect resolve in our screen space:
  function resolveCircleVsBox(circle, r, box) {
    // convert to "arena space": center at (0,0), +X right, +Y up
    const min = new THREE.Vector2(box.min.x - W/2,  H/2 - box.max.y)
    const max = new THREE.Vector2(box.max.x - W/2,  H/2 - box.min.y)
    const clx = THREE.MathUtils.clamp(circle.x, min.x, max.x)
    const cly = THREE.MathUtils.clamp(circle.y, min.y, max.y)
    tmp.set(circle.x - clx, circle.y - cly)
    const d2 = tmp.lengthSq()
    if (d2 > r*r) return false
    const d = Math.sqrt(d2) || 1
    tmp.multiplyScalar((r - d) / d)
    circle.add(tmp)
    return true
  }

  function clampToArena(p, r) {
    p.x = THREE.MathUtils.clamp(p.x, -W/2 + r,  W/2 - r)
    p.y = THREE.MathUtils.clamp(p.y, -H/2 + r,  H/2 - r)
  }

  function tryShoot(dt) {
    cd -= dt
    if (!input?.fire) return
    if (cd > 0) return

    // get firing direction: prefer mouse aim; fallback to arrow-dir
    if (input?.aim) {
      tmp.set(input.aim.x, input.aim.y).sub(pos).normalize()
      if (tmp.lengthSq() > 0.0001) aim.copy(tmp)
    } else if (input?.fireDir && (input.fireDir.x || input.fireDir.y)) {
      tmp.set(input.fireDir.x, input.fireDir.y).normalize()
      if (tmp.lengthSq() > 0.0001) aim.copy(tmp)
    }

    // spawn bullet
    const speed = 90
    const x = pos.x + aim.x * (radius + 0.8)
    const y = pos.y + aim.y * (radius + 0.8)
    addBullet({
      id: crypto.randomUUID(),
      owner: 'player',
      x, y,
      vx: aim.x * speed,
      vy: aim.y * speed,
      r: 0.9,
      life: 2.0,
      color: '#ffffff'
    })

    cd = (powerRapid > 0 ? 0.06 : 0.12)
  }

  useFrame((_, dt) => {
    if (dt > 0.05) dt = 0.05

    // acceleration from WASD-like axes
    const ax = (input?.move?.x ?? 0)
    const ay = (input?.move?.y ?? 0)
    if (ax || ay) {
      tmp.set(ax, ay)
      // normalize so diagonal speed isn't higher
      const l = tmp.length() || 1
      tmp.multiplyScalar(accel * dt / l)
      vel.add(tmp)
    }

    // friction
    const f = Math.max(0, 1 - friction * dt)
    vel.multiplyScalar(f)

    // clamp speed
    const sp = vel.length()
    if (sp > maxSpd) vel.multiplyScalar(maxSpd / sp)

    // integrate
    pos.addScaledVector(vel, dt)

    // arena clamp & walls
    clampToArena(pos, radius)
    for (const b of walls) resolveCircleVsBox(pos, radius, b)

    // choose aim each frame if mouse exists
    if (input?.aim) {
      tmp.set(input.aim.x, input.aim.y).sub(pos)
      if (tmp.lengthSq() > 0.0001) aim.copy(tmp.normalize())
    }

    tryShoot(dt)

    // write to meshes
    if (mesh.current) mesh.current.position.set(pos.x, pos.y, 0)
    if (nose.current) {
      nose.current.position.set(pos.x + aim.x * (radius + 0.3), pos.y + aim.y * (radius + 0.3), 0.15)
      const rot = Math.atan2(aim.y, aim.x)
      nose.current.rotation.z = rot - Math.PI / 2
    }
  })

  // puck body + a sleek pointer "nose"
  return (
    <group>
      <mesh ref={mesh}>
        <cylinderGeometry args={[radius, radius, 0.8, 32]} />
        <meshStandardMaterial color="#e5e5e5" metalness={0.35} roughness={0.25} emissive="#1a1a1a" />
      </mesh>

      <mesh ref={nose}>
        <coneGeometry args={[0.7, 1.2, 16]} />
        <meshStandardMaterial color="#9cdcff" metalness={0.2} roughness={0.4} emissive="#102030" />
      </mesh>
    </group>
  )
}
