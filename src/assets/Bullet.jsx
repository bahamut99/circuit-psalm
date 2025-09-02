import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

/**
 * Visual-only bullet. Movement/logic are in systems; we just
 * read data.x/y each frame and render a small glowing dot.
 * data: { id, owner, x, y, r, color }
 */
export default function Bullet({ data }) {
  const mesh = useRef()

  useFrame(() => {
    if (mesh.current) mesh.current.position.set(data.x, data.y, 0.05)
  })

  const r = Math.max(0.5, data.r ?? 0.8)
  const color = data.color || (data.owner === 'player' ? '#ffffff' : '#ff5a5a')

  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[r, 12, 12]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} metalness={0.1} roughness={0.4} />
    </mesh>
  )
}
