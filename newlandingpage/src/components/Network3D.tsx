import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line, Sphere, Points, PointMaterial } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

// 7 Node positions (x, y, z)
const nodes = [
  new THREE.Vector3(0, 1.5, 0),    // Central Top
  new THREE.Vector3(-2, 0.5, 1),   // Left 1
  new THREE.Vector3(1.5, 0, 1.5),  // Right 1
  new THREE.Vector3(-1.5, -1, -1), // Left 2
  new THREE.Vector3(2, -1.5, -0.5),// Right 2
  new THREE.Vector3(0, -2, 1),     // Bottom Center
  new THREE.Vector3(0, 0, -2),     // Center Back
];

// Edges (indices of connected nodes)
const edges = [
  [0, 1], [0, 2], [0, 6],
  [1, 3], [1, 6],
  [2, 4], [2, 6],
  [3, 5], [4, 5],
  [5, 6],
  [1, 5], [2, 5], // Cross connections
];

function NetworkNodes() {
  const group = useRef<THREE.Group>(null);
  const glowingMaterial = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    emissive: "#ff4e00",
    emissiveIntensity: 4,
    toneMapped: false,
  });

  const lineMaterial = new THREE.LineBasicMaterial({
    color: "#ff4e00",
    transparent: true,
    opacity: 0.3,
  });

  useFrame((state, delta) => {
    if (group.current) {
      // Base gentle rotation
      const time = state.clock.getElapsedTime();
      
      // Target rotation based on mouse position (normalized -1 to 1)
      const targetX = state.pointer.y * 0.5;
      const targetY = state.pointer.x * 0.5;

      // Smooth interpolation towards target rotation
      group.current.rotation.y += (targetY + time * 0.05 - group.current.rotation.y) * delta * 2;
      group.current.rotation.x += (targetX + Math.sin(time * 0.05) * 0.2 - group.current.rotation.x) * delta * 2;
    }
  });

  return (
    <group ref={group}>
      {/* Nodes */}
      {nodes.map((pos, i) => (
        <Sphere key={`node-${i}`} position={pos} args={[0.08, 32, 32]}>
          <primitive object={glowingMaterial} attach="material" />
        </Sphere>
      ))}

      {/* Edges */}
      {edges.map(([start, end], i) => (
        <Line
          key={`edge-${i}`}
          points={[nodes[start], nodes[end]]}
          color="#ff4e00"
          lineWidth={1}
          transparent
          opacity={0.15}
        />
      ))}

      {/* Floating Particles */}
      <Particles />
    </group>
  );
}

function Particles() {
  const count = 500;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(Math.random() * 2 - 1);
        const radius = 3 + Math.random() * 3;
        pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        pos[i * 3 + 2] = radius * Math.cos(phi);
    }
    return pos;
  }, [count]);

  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (pointsRef.current) {
        pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#ff8844"
        size={0.02}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  );
}

export default function Network3D() {
  return (
    <div className="fixed inset-0 z-[-1] bg-[#050505] pointer-events-none">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <color attach="background" args={["#050505"]} />
        <ambientLight intensity={0.5} />
        <NetworkNodes />
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/50 to-[#050505]" />
    </div>
  );
}
