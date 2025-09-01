import React from "react";

export default function Bullet({ position, enemy }) {
  const color = enemy ? "#ff5a5a" : "#ffffff";
  return (
    <mesh position={position}>
      <circleGeometry args={[0.03, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
    </mesh>
  );
}
