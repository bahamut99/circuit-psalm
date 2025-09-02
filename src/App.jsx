import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import Level from './assets/Level.jsx'
import HUD from './assets/HUD.jsx'

export default function App() {
  return (
    <>
      <Canvas
        orthographic
        dpr={[1, 2]}
        camera={{ zoom: 40, position: [0, 0, 100] }}
        gl={{ antialias: true }}
      >
        {/* Background */}
        <color attach="background" args={['#0b0c0f']} />

        {/* Scene (Level renders lights too; leaving canvas clean) */}
        <Suspense fallback={null}>
          <Level />
        </Suspense>
      </Canvas>

      {/* 2D UI overlay */}
      <HUD />
    </>
  )
}

