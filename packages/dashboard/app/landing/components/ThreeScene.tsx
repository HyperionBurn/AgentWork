"use client";

import { Canvas } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import NetworkMesh from "./NetworkMesh";
import { Suspense } from "react";

export default function ThreeScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 50 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
      }}
      dpr={[1, 1.5]}
    >
      <Suspense fallback={null}>
        {/* Dim ambient — network nodes are primarily emissive */}
        <ambientLight intensity={0.1} />

        {/* Purple accent from upper left */}
        <pointLight position={[-5, 4, 5]} intensity={0.5} color="#7C3AED" />

        {/* Cyan accent from lower right */}
        <pointLight position={[5, -2, 4]} intensity={0.3} color="#06B6D4" />

        {/* Blue rim from behind */}
        <pointLight position={[0, 0, -6]} intensity={0.25} color="#3B82F6" />

        {/* Floating network mesh with gentle idle motion */}
        <Float
          speed={0.6}
          rotationIntensity={0.08}
          floatIntensity={0.2}
          floatingRange={[-0.04, 0.04]}
        >
          <NetworkMesh />
        </Float>
      </Suspense>
    </Canvas>
  );
}
