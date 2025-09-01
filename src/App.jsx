import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import Level from "./components/Level.jsx";
import HUD from "./components/HUD.jsx";
import { GameProvider } from "./systems/store.js";

export default function App() {
  return (
    <GameProvider>
      <Canvas
        gl={{ antialias: true, powerPreference: "high-performance" }}
        style={{ width: "100vw", height: "100vh", background: "#000" }}
      >
        <ambientLight intensity={0.35} />
        <pointLight position={[3, 3, 6]} intensity={10} distance={20} />
        <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={80} />
        <Level />
      </Canvas>
      <HUD />
    </GameProvider>
  );
}
