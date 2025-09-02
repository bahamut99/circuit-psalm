import { Canvas, useFrame } from '@react-three/fiber'
import { OrthographicCamera, Html } from '@react-three/drei'
import { Perf } from '@react-three/drei'
import Level from './assets/Level.jsx'
import HUD from './assets/HUD.jsx'
import { useGameStore } from './systems/store.js'
import './App.css'

function Scene() {
  // mild animated grid background
  const gridRef = React.useRef()
  useFrame(({ clock }) => {
    if (!gridRef.current) return
    const t = clock.getElapsedTime()
    gridRef.current.material.opacity = 0.07 + Math.sin(t * 0.6) * 0.02
  })
  return (
    <>
      <OrthographicCamera makeDefault position={[0, 0, 100]} zoom={80} />
      {/* subtle background grid plane */}
      <mesh ref={gridRef} position={[0,0,-2]}>
        <planeGeometry args={[100, 56]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.08} />
      </mesh>
      <Level />
    </>
  )
}

import React from 'react'
export default function App() {
  const state = useGameStore(s => s.state)
  return (
    <>
      <Canvas dpr={[1, 2]}>
        <color attach="background" args={['#000']} />
        <Scene />
        {/* Perf is optional; remove if you want */}
        {/* <Perf position="bottom-left" /> */}
      </Canvas>
      <HUD />
    </>
  )
}

