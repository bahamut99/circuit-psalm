import React from "react";

export default function Player({ position, rotation }) {
  return (
    <group position={position} rotation={[0, 0, rotation]}>
      {/* subtle shadow */}
      <mesh position={[0, -0.02, -0.02]}>
        <ellipseGeometry args={[0.13, 0.05, 24]} />
        <meshBasicMaterial color="#000" opacity={0.35} transparent />
      </mesh>

      {/* core disc */}
      <mesh>
        <circleGeometry args={[0.12, 32]} />
        <meshStandardMaterial color="#fff" opacity={0.14} transparent />
      </mesh>
      <mesh>
        <ringGeometry args={[0.12, 0.125, 32]} />
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.8} />
      </mesh>

      {/* pointer “ship” wedge */}
      <mesh position={[0.15, 0, 0.01]}>
        <coneGeometry args={[0.08, 0.22, 24]} />
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}
