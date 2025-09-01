import React from "react";

const colors = {
  chaser: "#9cdcff",
  spinner: "#ffd166",
  turret: "#ff7ad9",
  boss1: "#fff2b3",
  boss2: "#fff2b3",
  boss3: "#fff2b3",
};

export default function Enemy({ type = "chaser", position }) {
  const c = colors[type] || "#9cdcff";
  const r = type.startsWith("boss") ? 0.22 : 0.12;

  return (
    <group position={position}>
      <mesh>
        <circleGeometry args={[r, 28]} />
        <meshStandardMaterial color={c} opacity={0.08} transparent />
      </mesh>
      <mesh>
        <ringGeometry args={[r, r + 0.005, 28]} />
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={type.startsWith("boss") ? 0.9 : 0.6} />
      </mesh>
    </group>
  );
}
