import { useRef, useMemo, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Html } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

// ============================================================
// GC10: Real-Time 3D Transaction Globe
// ============================================================
// Interactive Three.js globe showing payment flows as animated
// arcs between geographic agent nodes. Agents = nodes on the
// globe, payments = particle streams along arcs.
// ============================================================

// Agent node positions on a globe (lat/lng → xyz)
const AGENT_NODES = [
  { id: "orchestrator", label: "Orchestrator", lat: 40.7, lng: -74.0, color: "#00d4ff" },   // New York
  { id: "research", label: "Research Agent", lat: 51.5, lng: -0.1, color: "#3b82f6" },       // London
  { id: "code", label: "Code Agent", lat: 48.8, lng: 2.3, color: "#22c55e" },                // Paris
  { id: "test", label: "Test Agent", lat: 35.7, lng: 139.7, color: "#eab308" },              // Tokyo
  { id: "review", label: "Review Agent", lat: -23.5, lng: -46.6, color: "#a855f7" },         // São Paulo
];

// Payment flow arcs (source → destination)
const FLOW_ARCS = [
  { from: "orchestrator", to: "research" },
  { from: "orchestrator", to: "code" },
  { from: "orchestrator", to: "test" },
  { from: "orchestrator", to: "review" },
  { from: "research", to: "code" },
  { from: "code", to: "test" },
  { from: "test", to: "review" },
];

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function GlobeWireframe() {
  const earthRef = useRef<THREE.Group>(null);

  const wireframeGeometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(2, 36, 18);
    return geo;
  }, []);

  return (
    <group ref={earthRef}>
      <mesh geometry={wireframeGeometry}>
        <meshBasicMaterial
          color="#0a1628"
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>
      {/* Inner glow */}
      <mesh geometry={wireframeGeometry}>
        <meshBasicMaterial
          color="#1a0a3e"
          transparent
          opacity={0.05}
        />
      </mesh>
    </group>
  );
}

function AgentNode({ node, hovered, onHover }: {
  node: typeof AGENT_NODES[0];
  hovered: boolean;
  onHover: (id: string | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const pos = latLngToVector3(node.lat, node.lng, 2.05);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      meshRef.current.scale.setScalar(hovered ? 1.5 : 1 + Math.sin(t * 2 + node.lat) * 0.1);
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(hovered ? 2.5 : 1.8);
    }
  });

  return (
    <group position={pos}>
      {/* Core sphere */}
      <mesh
        ref={meshRef}
        onPointerEnter={() => onHover(node.id)}
        onPointerLeave={() => onHover(null)}
      >
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={hovered ? 6 : 3}
          toneMapped={false}
        />
      </mesh>

      {/* Glow ring */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial
          color={node.color}
          transparent
          opacity={hovered ? 0.2 : 0.05}
        />
      </mesh>

      {/* Label */}
      {hovered && (
        <Html distanceFactor={10} position={[0, 0.2, 0]}>
          <div className="rounded-lg border border-white/20 bg-black/90 px-3 py-2 text-center whitespace-nowrap">
            <div className="text-xs font-bold" style={{ color: node.color }}>{node.label}</div>
            <div className="text-[10px] text-slate-400">${(Math.random() * 0.05 + 0.005).toFixed(3)}/call</div>
          </div>
        </Html>
      )}
    </group>
  );
}

function PaymentArc({ from, to, animate }: {
  from: typeof AGENT_NODES[0];
  to: typeof AGENT_NODES[0];
  animate: boolean;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const fromPos = latLngToVector3(from.lat, from.lng, 2.05);
  const toPos = latLngToVector3(to.lat, to.lng, 2.05);

  // Create arc curve elevated above globe surface
  const midPoint = fromPos.clone().add(toPos).multiplyScalar(0.5);
  const dist = fromPos.distanceTo(toPos);
  midPoint.normalize().multiplyScalar(2.05 + dist * 0.35);

  const curve = useMemo(() => {
    return new THREE.QuadraticBezierCurve3(fromPos, midPoint, toPos);
  }, [fromPos, midPoint, toPos]);

  // Particle positions along curve
  const particleCount = 20;
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const point = curve.getPoint(t);
      pos[i * 3] = point.x;
      pos[i * 3 + 1] = point.y;
      pos[i * 3 + 2] = point.z;
    }
    return pos;
  }, [curve]);

  useFrame((state) => {
    if (pointsRef.current && animate) {
      const t = state.clock.getElapsedTime();
      const geo = pointsRef.current.geometry;
      const posAttr = geo.getAttribute("position");
      for (let i = 0; i < particleCount; i++) {
        const offset = ((t * 0.5 + i / particleCount) % 1);
        const point = curve.getPoint(offset);
        posAttr.setXYZ(i, point.x, point.y, point.z);
      }
      posAttr.needsUpdate = true;
    }
  });

  const color = new THREE.Color(from.color).lerp(new THREE.Color(to.color), 0.5);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={particleCount}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.04}
        sizeAttenuation
        transparent
        opacity={animate ? 0.8 : 0.3}
        depthWrite={false}
      />
    </points>
  );
}

function GlobeScene() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [activeFlows, setActiveFlows] = useState<Set<number>>(new Set([0, 1, 2, 3]));

  // Cycle active flows for animation
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFlows((prev) => {
        const next = new Set(prev);
        const idx = Math.floor(Math.random() * FLOW_ARCS.length);
        if (next.has(idx)) {
          next.delete(idx);
        } else {
          next.add(idx);
        }
        // Always keep at least 3 flows active
        if (next.size < 3) {
          next.add(Math.floor(Math.random() * FLOW_ARCS.length));
        }
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />

      <GlobeWireframe />

      {/* Agent nodes */}
      {AGENT_NODES.map((node) => (
        <AgentNode
          key={node.id}
          node={node}
          hovered={hoveredNode === node.id}
          onHover={setHoveredNode}
        />
      ))}

      {/* Payment arcs */}
      {FLOW_ARCS.map((arc, i) => {
        const fromNode = AGENT_NODES.find((n) => n.id === arc.from);
        const toNode = AGENT_NODES.find((n) => n.id === arc.to);
        if (!fromNode || !toNode) return null;
        return (
          <PaymentArc
            key={`arc-${i}`}
            from={fromNode}
            to={toNode}
            animate={activeFlows.has(i)}
          />
        );
      })}

      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={3}
        maxDistance={8}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  );
}

export default function TransactionGlobe() {
  return (
    <div className="relative h-[600px] w-full rounded-xl border border-arc-border bg-[#050510] overflow-hidden">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <color attach="background" args={["#050510"]} />
        <GlobeScene />
        <EffectComposer>
          <Bloom luminanceThreshold={0.3} mipmapBlur intensity={1.2} />
          <Vignette eskil={false} offset={0.1} darkness={0.8} />
        </EffectComposer>
      </Canvas>

      {/* Overlay HUD */}
      <div className="absolute left-4 top-4 space-y-1">
        <div className="text-xs text-slate-500">LIVE PAYMENT NETWORK</div>
        <div className="text-lg font-bold text-white">Arc L1 · x402 Protocol</div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 space-y-1">
        {AGENT_NODES.map((node) => (
          <div key={node.id} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: node.color }}
            />
            <span className="text-slate-400">{node.label}</span>
          </div>
        ))}
      </div>

      {/* Transaction counter */}
      <div className="absolute bottom-4 left-4 rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-xs">
        <span className="text-slate-500">Total Payments:</span>{" "}
        <span className="font-mono text-emerald-400" id="globe-txn-count">—</span>
      </div>
    </div>
  );
}
