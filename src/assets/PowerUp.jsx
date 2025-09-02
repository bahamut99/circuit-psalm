import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

/**
 * Power-up chip. Render-only; pickup/expiration handled in systems.
 * data: { id, kind: 'rapid'|'shield'|'life', x, y, r, t }
 */
export default function PowerUp({ data }) {
  const mesh = useRef()

  useFrame((state) => {
    if (!mesh.current) return
    mesh.current.position.set(data.x, data.y, 0.02)
    // hover & rotate a bit
    mesh.current.rotation.z = state.clock.elapsedTime * 1.2
  })

  const color =
    data.kind === 'rapid'  ? '#9cdcff' :
    data.kind === 'shield' ? '#2dd4bf' : '#ff7ad9'

  const r = Math.max(1.4, data.r ?? 1.6)

  return (
    <mesh ref={mesh}>
      <cylinderGeometry args={[r, r, 0.5, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.35} metalness={0.2} />
    </mesh>
  )
}
