"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── Types ───────────────────────────────────────────────────────────────────

interface NodeDef {
  id: string;
  position: [number, number, number];
  color: string;
  size: number;
  pulseSpeed: number;
  pulseOffset: number;
}

interface EdgeDef {
  from: string;
  to: string;
}

// ─── Static Data (deterministic — no randomness per render) ─────────────────

const NODES: NodeDef[] = [
  {
    id: "orchestrator",
    position: [0, 0, 0],
    color: "#7C3AED",
    size: 0.28,
    pulseSpeed: 0.8,
    pulseOffset: 0,
  },
  {
    id: "gateway",
    position: [0, 1.8, 0.3],
    color: "#3B82F6",
    size: 0.22,
    pulseSpeed: 1.0,
    pulseOffset: 1.2,
  },
  {
    id: "arc",
    position: [0, -1.8, -0.2],
    color: "#06B6D4",
    size: 0.24,
    pulseSpeed: 0.6,
    pulseOffset: 2.4,
  },
  {
    id: "research",
    position: [-2.2, 0.6, 0.5],
    color: "#8B5CF6",
    size: 0.18,
    pulseSpeed: 1.2,
    pulseOffset: 0.5,
  },
  {
    id: "code",
    position: [2.2, 0.6, 0.5],
    color: "#3B82F6",
    size: 0.18,
    pulseSpeed: 1.1,
    pulseOffset: 1.7,
  },
  {
    id: "test",
    position: [-1.6, -1.0, -0.6],
    color: "#10B981",
    size: 0.18,
    pulseSpeed: 1.3,
    pulseOffset: 3.0,
  },
  {
    id: "review",
    position: [1.6, -1.0, -0.6],
    color: "#F59E0B",
    size: 0.18,
    pulseSpeed: 1.1,
    pulseOffset: 0.9,
  },
];

const EDGES: EdgeDef[] = [
  { from: "orchestrator", to: "gateway" },
  { from: "orchestrator", to: "research" },
  { from: "orchestrator", to: "code" },
  { from: "orchestrator", to: "test" },
  { from: "orchestrator", to: "review" },
  { from: "gateway", to: "arc" },
  { from: "research", to: "code" },
  { from: "code", to: "test" },
  { from: "test", to: "review" },
  { from: "review", to: "gateway" },
];

// 3 particles per edge = 30 total
const PARTICLE_SPEEDS = EDGES.flatMap((_, ei) =>
  [0, 1, 2].map((p) => ({
    edgeIndex: ei,
    speed: 0.12 + ei * 0.025 + p * 0.06,
    offset: p * 0.33,
  }))
);

// ─── Sub-components ──────────────────────────────────────────────────────────

function PulsingNode({
  position,
  size,
  nodeMat,
  glowMat,
  pulseSpeed,
  pulseOffset,
}: {
  position: [number, number, number];
  size: number;
  nodeMat: THREE.MeshStandardMaterial;
  glowMat: THREE.MeshStandardMaterial;
  pulseSpeed: number;
  pulseOffset: number;
}) {
  const coreRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = 1 + Math.sin(t * pulseSpeed + pulseOffset) * 0.12;
    if (coreRef.current) coreRef.current.scale.setScalar(pulse);
    if (haloRef.current) haloRef.current.scale.setScalar(pulse * 1.7);
  });

  return (
    <group position={position}>
      <mesh ref={coreRef} material={nodeMat}>
        <sphereGeometry args={[size, 24, 24]} />
      </mesh>
      <mesh ref={haloRef} material={glowMat}>
        <sphereGeometry args={[size, 16, 16]} />
      </mesh>
    </group>
  );
}

function TravelingDot({
  from,
  to,
  material,
  speed,
  offset,
}: {
  from: [number, number, number];
  to: [number, number, number];
  material: THREE.MeshStandardMaterial;
  speed: number;
  offset: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const raw = (state.clock.elapsedTime * speed + offset) % 1;
    const t = raw < 0.5 ? raw * 2 : 2 - raw * 2;
    ref.current.position.set(
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t,
      from[2] + (to[2] - from[2]) * t
    );
  });

  return (
    <mesh ref={ref} material={material}>
      <sphereGeometry args={[0.04, 8, 8]} />
    </mesh>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AbstractGeometry() {
  const groupRef = useRef<THREE.Group>(null);
  const [scrollY, setScrollY] = useState(0);

  // Track scroll
  useEffect(() => {
    const handleScroll = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      setScrollY(maxScroll > 0 ? window.scrollY / maxScroll : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Materials ──

  // One material per unique node color (5 unique colors → 5 materials)
  const nodeMaterials = useMemo(() => {
    const map = new Map<string, THREE.MeshStandardMaterial>();
    for (const node of NODES) {
      if (!map.has(node.color)) {
        map.set(
          node.color,
          new THREE.MeshStandardMaterial({
            color: new THREE.Color(node.color),
            emissive: new THREE.Color(node.color),
            emissiveIntensity: 0.5,
            metalness: 0.3,
            roughness: 0.4,
          })
        );
      }
    }
    return map;
  }, []);

  // Shared glow halo material (very subtle, additive look via emissive)
  const glowMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#7C3AED"),
        emissive: new THREE.Color("#7C3AED"),
        emissiveIntensity: 0.15,
        transparent: true,
        opacity: 0.08,
        metalness: 0.0,
        roughness: 1.0,
        depthWrite: false,
      }),
    []
  );

  // Edge lines — simple gray
  const edgeMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color("#6B7280"),
        transparent: true,
        opacity: 0.3,
        linewidth: 1,
      }),
    []
  );

  // Traveling particles — bright emissive dots
  const particleMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#FFFFFF"),
        emissive: new THREE.Color("#06B6D4"),
        emissiveIntensity: 1.5,
        metalness: 0.0,
        roughness: 0.2,
        transparent: true,
        opacity: 0.9,
      }),
    []
  );

  // ── Node position lookup ──
  const nodeMap = useMemo(() => {
    const map = new Map<string, [number, number, number]>();
    for (const node of NODES) map.set(node.id, node.position);
    return map;
  }, []);

  // ── Pre-computed edge line geometries ──
  const edgeGeometries = useMemo(() => {
    return EDGES.map((edge) => {
      const from = nodeMap.get(edge.from)!;
      const to = nodeMap.get(edge.to)!;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array([...from, ...to]), 3)
      );
      return geo;
    });
  }, [nodeMap]);

  // ── Frame loop: scroll-driven group transform ──
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = scrollY;

    const lerp = (a: number, b: number, speed: number) =>
      a + (b - a) * Math.min(1, speed * delta * 60);

    const targetRotY = t * Math.PI * 1.2;
    const targetRotX = Math.sin(t * Math.PI) * 0.15;
    const targetScale = 1 - t * 0.15;
    const targetX = Math.sin(t * Math.PI * 2) * 0.8;

    groupRef.current.rotation.y = lerp(groupRef.current.rotation.y, targetRotY, 0.06);
    groupRef.current.rotation.x = lerp(groupRef.current.rotation.x, targetRotX, 0.06);
    groupRef.current.scale.setScalar(lerp(groupRef.current.scale.x, targetScale, 0.06));
    groupRef.current.position.x = lerp(groupRef.current.position.x, targetX, 0.05);

    // Gentle idle wobble
    groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.03;
  });

  return (
    <group ref={groupRef}>
      {/* ── Nodes (7 core meshes + 7 glow halos = 14 meshes) ── */}
      {NODES.map((node) => (
        <PulsingNode
          key={node.id}
          position={node.position}
          size={node.size}
          nodeMat={nodeMaterials.get(node.color)!}
          glowMat={glowMaterial}
          pulseSpeed={node.pulseSpeed}
          pulseOffset={node.pulseOffset}
        />
      ))}

      {/* ── Edges (10 lines — NOT meshes, no triangle cost) ── */}
      {edgeGeometries.map((geo, i) => (
        <line key={`edge-${i}`} geometry={geo} material={edgeMaterial} />
      ))}

      {/* ── Traveling Particles (30 tiny spheres) ── */}
      {PARTICLE_SPEEDS.map((p, i) => {
        const edge = EDGES[p.edgeIndex];
        return (
          <TravelingDot
            key={`dot-${i}`}
            from={nodeMap.get(edge.from)!}
            to={nodeMap.get(edge.to)!}
            material={particleMaterial}
            speed={p.speed}
            offset={p.offset}
          />
        );
      })}
    </group>
  );
}
