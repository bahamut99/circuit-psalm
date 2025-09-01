import React from "react";

export default function PowerUp({ position, kind }) {
  const color = kind === "rapid" ? "#9cdcff" : kind === "shield" ? "#2dd4bf" : "#ff7ad9";
  return (
    <group position={position}>
      <mesh>
        <circleGeometry args={[0.16, 24]} />
        <meshStandardMaterial color={color} opacity={0.12} transparent />
      </mesh>
      <mesh>
        <ringGeometry args={[0.1, 0.16, 28]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}
