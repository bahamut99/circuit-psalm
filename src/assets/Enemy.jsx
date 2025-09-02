import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

/**
 * Dumb renderer for an enemy object.
 * Expects data fields (typical): { id, type, x, y, r, hp, color }
 * Movement/AI are handled by systems; we only render & softly pulse.
 */
export default function Enemy({ data }) {
  const mesh = useRef()

  useFrame((state, dt) => {
    if (!mesh.current) return
    // light breathing/pulse
    mesh.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2.2) * 0.02)
    mesh.current.position.set(data.x, data.y, 0)
  })

  const color =
    data.type === 'turret'  ? '#ff7ad9' :
    data.type === 'spinner' ? '#ffd166' : '#9cdcff'

  const radius = Math.max(2.2, data.r ?? 2.8)

  return (
    <mesh ref={mesh}>
      <cylinderGeometry args={[radius, radius, 0.7, 24]} />
      <meshStandardMaterial color={color} metalness={0.25} roughness={0.55} emissive="#111" />
    </mesh>
  )
}

