"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ── Node definitions (stable positions, deterministic) ──
interface NodeDef {
  id: string;
  pos: [number, number, number];
  color: string;
  size: number;
  emissiveIntensity: number;
  label: string;
}

const NODES: NodeDef[] = [
  { id: "orchestrator", pos: [0, 0, 0], color: "#E2E8F0", size: 0.35, emissiveIntensity: 0.5, label: "Orchestrator" },
  { id: "research", pos: [-2.4, 1.4, 0.6], color: "#7C3AED", size: 0.22, emissiveIntensity: 0.9, label: "Research" },
  { id: "code", pos: [2.4, 1.1, 0.4], color: "#3B82F6", size: 0.22, emissiveIntensity: 0.9, label: "Code" },
  { id: "test", pos: [2.0, -1.5, -0.5], color: "#10B981", size: 0.22, emissiveIntensity: 0.9, label: "Test" },
  { id: "review", pos: [-2.0, -1.3, -0.4], color: "#F59E0B", size: 0.22, emissiveIntensity: 0.9, label: "Review" },
  { id: "arc", pos: [0, 2.8, -1.0], color: "#06B6D4", size: 0.18, emissiveIntensity: 0.7, label: "Arc L1" },
  { id: "gateway", pos: [0, -2.6, 0.8], color: "#06B6D4", size: 0.16, emissiveIntensity: 0.6, label: "Gateway" },
];

const EDGES: [string, string][] = [
  ["orchestrator", "research"],
  ["orchestrator", "code"],
  ["orchestrator", "test"],
  ["orchestrator", "review"],
  ["research", "arc"],
  ["code", "arc"],
  ["test", "gateway"],
  ["review", "gateway"],
  ["research", "code"],
  ["code", "test"],
];

const PARTICLES_PER_EDGE = 3;

export default function NetworkMesh() {
  const groupRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.Mesh[]>([]);
  const particlesRef = useRef<THREE.Points>(null);
  const [scrollY, setScrollY] = useState(0);

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setScrollY(maxScroll > 0 ? window.scrollY / maxScroll : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Pre-compute edge geometries
  const edgeData = useMemo(() => {
    return EDGES.map(([fromId, toId]) => {
      const from = NODES.find((n) => n.id === fromId)!;
      const to = NODES.find((n) => n.id === toId)!;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array([...from.pos, ...to.pos]);
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      return { from, to, geometry };
    });
  }, []);

  // Pre-compute particle positions and velocities
  const particleData = useMemo(() => {
    const positions = new Float32Array(EDGES.length * PARTICLES_PER_EDGE * 3);
    const velocities: { edge: number; speed: number; offset: number }[] = [];

    for (let e = 0; e < EDGES.length; e++) {
      for (let p = 0; p < PARTICLES_PER_EDGE; p++) {
        const idx = (e * PARTICLES_PER_EDGE + p) * 3;
        const from = NODES.find((n) => n.id === EDGES[e][0])!;
        positions[idx] = from.pos[0];
        positions[idx + 1] = from.pos[1];
        positions[idx + 2] = from.pos[2];
        velocities.push({
          edge: e,
          speed: 0.15 + (p * 0.08),
          offset: p * 0.33,
        });
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    return { positions, velocities, geometry };
  }, []);

  // Materials (created once)
  const nodeMaterials = useMemo(() => {
    return NODES.map((n) =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(n.color),
        emissive: new THREE.Color(n.color),
        emissiveIntensity: n.emissiveIntensity,
        metalness: 0.4,
        roughness: 0.3,
      })
    );
  }, []);

  const glowMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#7C3AED"),
        transparent: true,
        opacity: 0.08,
        side: THREE.BackSide,
      }),
    []
  );

  const edgeMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color("#334155"),
        transparent: true,
        opacity: 0.25,
      }),
    []
  );

  const paymentEdgeMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color("#7C3AED"),
        transparent: true,
        opacity: 0.5,
      }),
    []
  );

  const particleMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.06,
        color: new THREE.Color("#06B6D4"),
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    []
  );

  // Ring materials
  const ringMaterials = useMemo(
    () => [
      new THREE.MeshBasicMaterial({ color: new THREE.Color("#7C3AED"), transparent: true, opacity: 0.2 }),
      new THREE.MeshBasicMaterial({ color: new THREE.Color("#3B82F6"), transparent: true, opacity: 0.15 }),
      new THREE.MeshBasicMaterial({ color: new THREE.Color("#06B6D4"), transparent: true, opacity: 0.12 }),
    ],
    []
  );

  // Ring geometries
  const ringGeometries = useMemo(
    () => [
      new THREE.TorusGeometry(0.7, 0.008, 16, 100),
      new THREE.TorusGeometry(0.9, 0.006, 16, 100),
      new THREE.TorusGeometry(1.1, 0.005, 16, 100),
    ],
    []
  );

  // Sphere geometry (reused)
  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 32, 32), []);
  const glowGeo = useMemo(() => new THREE.SphereGeometry(1, 16, 16), []);

  // Cleanup: dispose all Three.js GPU resources on unmount
  useEffect(() => {
    return () => {
      nodeMaterials.forEach((m) => m.dispose());
      glowMaterial.dispose();
      edgeMaterial.dispose();
      paymentEdgeMaterial.dispose();
      particleMaterial.dispose();
      ringMaterials.forEach((m) => m.dispose());
      ringGeometries.forEach((g) => g.dispose());
      sphereGeo.dispose();
      glowGeo.dispose();
      edgeData.forEach((e) => e.geometry.dispose());
      particleData.geometry.dispose();
    };
  }, [nodeMaterials, glowMaterial, edgeMaterial, paymentEdgeMaterial, particleMaterial, ringMaterials, ringGeometries, sphereGeo, glowGeo, edgeData, particleData]);

  // Animation
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const clock = state.clock.elapsedTime;

    // Scroll-driven rotation + scale
    const targetRotY = scrollY * Math.PI * 0.6;
    const targetRotX = scrollY * 0.15;
    const targetScale = 1 - scrollY * 0.15;
    const targetX = scrollY * 2;

    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRotY + Math.sin(clock * 0.1) * 0.05,
      delta * 2
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetRotX,
      delta * 2
    );
    const s = THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, delta * 2);
    groupRef.current.scale.setScalar(s);
    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      targetX,
      delta * 2
    );

    // Node pulse (breathing scale)
    nodesRef.current.forEach((mesh, i) => {
      if (!mesh) return;
      const pulse = 1 + Math.sin(clock * 1.5 + i * 1.1) * 0.08;
      mesh.scale.setScalar(NODES[i].size * pulse);
    });

    // Particle travel along edges
    if (particlesRef.current) {
      const posAttr = particlesRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;

      for (let i = 0; i < particleData.velocities.length; i++) {
        const v = particleData.velocities[i];
        const edgeIdx = v.edge;
        const from = NODES.find((n) => n.id === EDGES[edgeIdx][0])!;
        const to = NODES.find((n) => n.id === EDGES[edgeIdx][1])!;

        // Ping-pong t value
        const rawT = (clock * v.speed + v.offset) % 2;
        const t = rawT < 1 ? rawT : 2 - rawT;

        const idx = i * 3;
        arr[idx] = from.pos[0] + (to.pos[0] - from.pos[0]) * t;
        arr[idx + 1] = from.pos[1] + (to.pos[1] - from.pos[1]) * t;
        arr[idx + 2] = from.pos[2] + (to.pos[2] - from.pos[2]) * t;
      }

      posAttr.needsUpdate = true;
    }
  });

  // Register node refs
  const setNodeRef = (index: number) => (el: THREE.Mesh | null) => {
    if (el) nodesRef.current[index] = el;
  };

  return (
    <group ref={groupRef}>
      {/* Nodes */}
      {NODES.map((node, i) => (
        <group key={node.id} position={node.pos}>
          {/* Core sphere */}
          <mesh ref={setNodeRef(i)} geometry={sphereGeo} material={nodeMaterials[i]} scale={node.size} />
          {/* Glow halo */}
          <mesh geometry={glowGeo} material={glowMaterial} scale={node.size * 2.5} />
          {/* Local point light */}
          <pointLight color={node.color} intensity={0.4} distance={2} />
        </group>
      ))}

      {/* Edges */}
      {edgeData.map((edge, i) => {
        const isPayment = i < 4;
        return (
          <line key={`edge-${i}`} geometry={edge.geometry}>
            <primitive object={isPayment ? paymentEdgeMaterial : edgeMaterial} attach="material" />
          </line>
        );
      })}

      {/* Traveling particles */}
      <points ref={particlesRef} geometry={particleData.geometry} material={particleMaterial} />

      {/* Glow rings around orchestrator */}
      {ringMaterials.map((mat, i) => {
        const rotations: [number, number, number][] = [
          [Math.PI / 2, 0, 0],
          [Math.PI / 3, Math.PI / 4, 0],
          [Math.PI / 2.5, -Math.PI / 3, Math.PI / 6],
        ];
        return (
          <mesh key={`ring-${i}`} geometry={ringGeometries[i]} material={mat} rotation={rotations[i]} />
        );
      })}
    </group>
  );
}
