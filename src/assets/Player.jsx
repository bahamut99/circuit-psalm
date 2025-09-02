import React, { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../systems/store.js'

/**
 * Player puck with pointer.
 * Props:
 *  - W, H: arena size (world units)
 *  - walls: THREE.Box2[] in arena coordinates (center-origin, +Y up)
 *  - input: { move:{x,y}, fire:boolean, fireDir:{x,y}, aim:{x,y}|null }
 *  - spawn: { x, y } safe spawn computed by Level
 */
export default function Player({ W, H, walls, input, spawn }) {
  // store access
  const { addBullet, powerRapid } = useGameStore((s) => ({
    addBullet: s.addBullet,
    powerRapid: s.powerRapid,
  }))

  // --- tuning ---
  const radius = 3.2
  const acc = 160
  const max = 55
  const friction = 0.16
  const baseFireGap = 0.10 // seconds
  const bulletSpeed = 110
  const muzzleOffset = radius + 0.9

  // --- refs / state ---
  const mesh = useRef()
  const nose = useRef()
  const vel = useMemo(() => new THREE.Vector2(0, 0), [])
  const pos = useMemo(() => new THREE.Vector2(spawn?.x ?? 0, spawn?.y ?? 0), [spawn])
  const lastAim = useMemo(() => new THREE.Vector2(1, 0), [])
  const cdRef = useRef(0)

  // apply spawn on mount/level change
  useEffect(() => {
    pos.set(spawn?.x ?? 0, spawn?.y ?? 0)
    vel.set(0, 0)
    if (mesh.current) mesh.current.position.set(pos.x, pos.y, 0)
  }, [spawn, pos, vel])

  // circle-vs-rect resolve (push out by smallest penetration)
  function resolveVsBox(p, v, r, box) {
    // distances to the 4 expanded faces (positive means overlapping past that face)
    const penLeft   = (p.x + r) - box.min.x
    const penRight  = box.max.x - (p.x - r)
    const penBottom = (p.y + r) - box.min.y
    const penTop    = box.max.y - (p.y - r)

    if (penLeft > 0 && penRight > 0 && penBottom > 0 && penTop > 0) {
      // overlapping: choose the smallest move out
      const m = Math.min(penLeft, penRight, penBottom, penTop)
      if (m === penLeft)  { p.x = box.min.x - r; v.x = Math.min(0, v.x) * 0.2 }
      else if (m === penRight) { p.x = box.max.x + r; v.x = Math.max(0, v.x) * 0.2 }
      else if (m === penBottom) { p.y = box.min.y - r; v.y = Math.min(0, v.y) * 0.2 }
      else { p.y = box.max.y + r; v.y = Math.max(0, v.y) * 0.2 }
      return true
    }
    return false
  }

  // resolve against all walls (Box2s)
  function resolveVsWalls(p, v, r, boxes) {
    for (let i = 0; i < boxes.length; i++) resolveVsBox(p, v, r, boxes[i])
  }

  // aim helper
  function currentAim() {
    // Arrow keys provide a fire vector
    const fx = input?.fireDir?.x ?? 0
    const fy = input?.fireDir?.y ?? 0
    if (fx !== 0 || fy !== 0) {
      lastAim.set(fx, fy).normalize()
      return lastAim
    }
    // Mouse aim → vector to mouse world point
    if (input?.aim) {
      lastAim.set(input.aim.x - pos.x, input.aim.y - pos.y)
      if (lastAim.lengthSq() > 0.0001) lastAim.normalize()
      return lastAim
    }
    // fallback to previous
    return lastAim
  }

  // per-frame
  useFrame((_, dt) => {
    if (dt > 0.05) dt = 0.05

    // movement
    const mvx = input?.move?.x ?? 0
    const mvy = input?.move?.y ?? 0
    if (mvx !== 0 || mvy !== 0) {
      const len = Math.hypot(mvx, mvy) || 1
      vel.x += (mvx / len) * acc * dt
      vel.y += (mvy / len) * acc * dt
    }

    // clamp max speed
    const spd = Math.hypot(vel.x, vel.y)
    if (spd > max) {
      vel.x = (vel.x / spd) * max
      vel.y = (vel.y / spd) * max
    }

    // friction
    vel.x *= (1 - friction * dt)
    vel.y *= (1 - friction * dt)

    // integrate
    pos.x += vel.x * dt
    pos.y += vel.y * dt

    // collide with walls
    resolveVsWalls(pos, vel, radius, walls)

    // update visuals
    if (mesh.current) mesh.current.position.set(pos.x, pos.y, 0)

    // aim + rotate nose
    const aim = currentAim()
    const rot = Math.atan2(aim.y, aim.x)
    if (nose.current) {
      nose.current.rotation.z = rot - Math.PI / 2
    }

    // firing
    cdRef.current -= dt
    const wantFire = !!(input?.fire) || (Math.abs(input?.fireDir?.x ?? 0) + Math.abs(input?.fireDir?.y ?? 0) > 0)
    const fireGap = (powerRapid > 0) ? baseFireGap * 0.5 : baseFireGap
    if (wantFire && cdRef.current <= 0) {
      addBullet({
        id: crypto.randomUUID(),
        owner: 'player',
        x: pos.x + aim.x * muzzleOffset,
        y: pos.y + aim.y * muzzleOffset,
        vx: aim.x * bulletSpeed,
        vy: aim.y * bulletSpeed,
        r: 1.0,
        life: 1.25,
        color: '#ffffff',
      })
      cdRef.current = fireGap
    }
  })

  // --- render ---
  return (
    <group>
      {/* puck disk (rotate cylinder to face camera) */}
      <mesh ref={mesh} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius, radius, 0.8, 32]} />
        <meshStandardMaterial
          color="#e5e5e5"
          metalness={0.35}
          roughness={0.25}
          emissive="#1a1a1a"
        />
      </mesh>

      {/* subtle ring */}
      <mesh position={[pos.x, pos.y, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 1.05, 0.12, 8, 48]} />
        <meshStandardMaterial color="#9cdcff" emissive="#0a1a22" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* pointer nose */}
      <mesh ref={nose} position={[pos.x, pos.y, 0.9]}>
        <coneGeometry args={[0.7, 1.2, 16]} />
        <meshStandardMaterial color="#8fb6cf" roughness={0.4} metalness={0.1} />
      </mesh>
    </group>
  )
}
