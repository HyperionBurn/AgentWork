# AgentWork Landing Page — Reconstruction Hyperprompt

> Paste the entire contents below into any frontier AI (GPT-4o, Claude, Gemini, etc.) to reconstruct the AgentWork landing page with full fidelity.

---

## PROMPT START

You are a senior frontend engineer. Build the **AgentWork landing page** — a dark neon cyberpunk-themed page for an AI agent marketplace with nanopayments on Arc L1 blockchain. The page is served at `/landing` in a Next.js 14 App Router project.

### Tech Stack

- **Framework**: Next.js 14 (App Router), TypeScript, `"use client"` component
- **3D Rendering**: `@react-three/fiber` ^8.17, `@react-three/drei` ^9.114, `three` ^0.169
- **Animation**: `framer-motion` ^11.11 (DOM animations only, NOT Three.js)
- **Styling**: Tailwind CSS with custom config
- **Font**: Inter (300–700) + JetBrains Mono (400–500) via Google Fonts

### ⚠️ CRITICAL GPU CONSTRAINT

**NO post-processing effects.** No Bloom, no N8AO, no EffectComposer, no custom shaders. These crash GPUs. Use ONLY standard Three.js materials:
- `MeshStandardMaterial` with `emissive` for neon glow
- `MeshBasicMaterial` for halos/rings
- `LineBasicMaterial` for edges
- `PointsMaterial` with `AdditiveBlending` for particles

### Color System (exact hex values)

| Role | Hex | Usage |
|------|-----|-------|
| Background | `#0F172A` | Page bg, card troughs |
| Card Surface | `#1E293B` | Panels, cards, ribbon |
| Border | `#334155` | All borders (50% opacity) |
| Heading Text | `#F1F5F9` | h1, h2, nav brand |
| Body Text | `#94A3B8` | Paragraphs, descriptions |
| Muted Text | `#64748B` | Labels, secondary info |
| List Text | `#CBD5E1` | Bulleted list items |
| Purple Accent | `#7C3AED` | Primary brand, agent badges |
| Blue Accent | `#3B82F6` | Secondary brand, code badge |
| Cyan Accent | `#06B6D4` | Blockchain nodes, identity |
| Emerald Accent | `#10B981` | Research badges, success |
| Amber Accent | `#F59E0B` | Review badges, cost |
| Code Block BG | `#0D1117` | Technical evidence section |

### 3D Scene: NetworkMesh (Blockchain Payment Visualization)

Create TWO files:

**File 1: `app/landing/components/NetworkMesh.tsx`** (`"use client"`, default export)

A React Three Fiber component rendering a blockchain payment network with:

**7 Nodes** (positioned in 3D space):
| ID | Position | Color | Size | Role |
|----|----------|-------|------|------|
| orchestrator | [0, 0, 0] | #E2E8F0 | 0.35 | Central hub |
| research | [-2.4, 1.4, 0.6] | #7C3AED | 0.22 | Research agent |
| code | [2.4, 1.1, 0.4] | #3B82F6 | 0.22 | Code agent |
| test | [2.0, -1.5, -0.5] | #10B981 | 0.22 | Test agent |
| review | [-2.0, -1.3, -0.4] | #F59E0B | 0.22 | Review agent |
| arc | [0, 2.8, -1.0] | #06B6D4 | 0.18 | Arc L1 blockchain |
| gateway | [0, -2.6, 0.8] | #06B6D4 | 0.16 | Circle Gateway |

Each node renders:
- Core sphere: `MeshStandardMaterial` with `emissive` set to node color, `emissiveIntensity` per table, `metalness: 0.4`, `roughness: 0.3`
- Glow halo: `MeshBasicMaterial` color `#7C3AED`, `opacity: 0.08`, `side: BackSide`, scaled 2.5× node size
- Local `pointLight` with node color, `intensity: 0.4`, `distance: 2`

**10 Edges** (connections between nodes):
```
orchestrator→research, orchestrator→code, orchestrator→test, orchestrator→review,
research→arc, code→arc, test→gateway, review→gateway, research→code, code→test
```
- First 4 edges (orchestrator→agents): `LineBasicMaterial` color `#7C3AED`, `opacity: 0.5`
- Remaining edges: `LineBasicMaterial` color `#334155`, `opacity: 0.25`

**30 Traveling Particles** (3 per edge):
- `PointsMaterial`: size 0.06, color `#06B6D4`, opacity 0.8, `AdditiveBlending`, `depthWrite: false`
- Each particle ping-pongs along its edge at different speeds (0.15 + p×0.08) with staggered offsets

**3 Glow Rings** around orchestrator:
- Torus geometries at radii 0.7, 0.9, 1.1
- Colors: #7C3AED (0.2), #3B82F6 (0.15), #06B6D4 (0.12) — all transparent
- Rotated at different angles

**Animations** (in `useFrame`):
- Scroll-driven: `rotation.y` = scrollProgress × π × 0.6, `rotation.x` = scrollProgress × 0.15, `scale` = 1 - scroll × 0.15, `position.x` = scroll × 2 — all lerped with `delta × 2`
- Subtle idle: `sin(clock × 0.1) × 0.05` added to rotation.y
- Node pulse: `sin(clock × 1.5 + i × 1.1) × 0.08` breathing scale
- Particle travel: ping-pong `t = rawT < 1 ? rawT : 2 - rawT` interpolated between edge endpoints

**File 2: `app/landing/components/ThreeScene.tsx`** (`"use client"`, default export)

R3F Canvas wrapper:
```tsx
<Canvas camera={{ position: [0, 0, 7], fov: 50 }}
  gl={{ antialias: true, alpha: true, powerPreference: "high-performance", stencil: false, depth: true }}
  dpr={[1, 1.5]}>
  <Suspense fallback={null}>
    <ambientLight intensity={0.1} />
    <pointLight position={[-5, 4, 5]} intensity={0.5} color="#7C3AED" />
    <pointLight position={[5, -2, 4]} intensity={0.3} color="#06B6D4" />
    <pointLight position={[0, 0, -6]} intensity={0.25} color="#3B82F6" />
    <Float speed={0.6} rotationIntensity={0.08} floatIntensity={0.2} floatingRange={[-0.04, 0.04]}>
      <NetworkMesh />
    </Float>
  </Suspense>
</Canvas>
```

### Landing Page: `app/landing/page.tsx`

**File 3: `app/landing/page.tsx`** (`"use client"`, default export `LandingPage`)

Imports: `dynamic` from `next/dynamic`, `motion` from `framer-motion`, `Link` from `next/link`

ThreeScene loaded via `dynamic(() => import("@/app/landing/components/ThreeScene"), { ssr: false })` with dark loading spinner.

**Animation variants:**
- `fadeUp`: hidden `{ y: 30, opacity: 0 }` → visible `{ y: 0, opacity: 1, transition: { duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] } }`
- `stagger`: visible `{ transition: { staggerChildren: 0.1 } }`

**Page structure** (top to bottom):

#### 1. Navbar (fixed, z-50)
- `bg-[#0F172A]/70 backdrop-blur-xl border-b border-[#334155]/50`
- Logo: 9×9 rounded-lg with `bg-gradient-to-br from-[#7C3AED] to-[#3B82F6]` + `shadow-[0_0_12px_rgba(124,58,237,0.3)]`, "AW" text
- Brand: "AgentWork" in `text-[#F1F5F9]`
- Links: "Dashboard" (→ `/`), "Features" (→ `#features`), "Evidence" (→ `#evidence`) — all `text-[#94A3B8]` hover `text-[#F1F5F9]`
- CTA: "Get Started" pill with purple→blue gradient

#### 2. Hero (min-h-screen, centered)
- Pill badge: emerald dot + "Live on Arc Testnet · Chain 5042002" in `bg-[#1E293B]/80 border-[#7C3AED]/30` rounded-full
- H1: "AI Agents That / Scale on Chain" — "Scale on Chain" has gradient `from-[#7C3AED] via-[#3B82F6] to-[#06B6D4] bg-clip-text text-transparent`
- Subtitle: "Chain research, coding, testing, and review agents — pay $0.005 per task with gasless x402 payments on Arc."
- CTAs: "Launch Demo" (gradient pill with arrow svg) + "Explore Features" (outlined `border-[#334155]`)
- Scroll indicator: small capsule with bouncing purple dot

#### 3. Tech Stats Ribbon
- `bg-[#1E293B]/90 backdrop-blur-sm border-y border-[#334155]/50`
- Font: JetBrains Mono
- 6 stats in a flex-wrap row:
  - Chain ID: **5042002** (cyan)
  - Gas Token: **USDC** (emerald)
  - Protocol: **x402 · EIP-3009** (purple)
  - Contracts: **5 Vyper** (blue)
  - Cost: **$0.005/task** (amber)
  - Identity: **ERC-8004** (cyan)

#### 4. Feature 1 — Nanopayments (min-h-screen, 2-col grid)
- Label: "01 — NANO PAYMENTS" in purple
- H2: "$0.005 per task. / No gas. No hassle."
- Body: "Gasless EIP-3009 transfers via Circle Gateway. Pay per call with automatic batch settlement on Arc L1."
- Checklist (emerald check icons):
  - "Automatic batch settlement via Gateway"
  - "Every transaction verifiable on arcscan.io"
  - "100× cheaper gas than Arbitrum, 2500× vs Ethereum"
- **Gas Cost Comparison card** (`bg-[#1E293B]/80`):
  - Arc L1: $0.001/tx ($0.06/60txns) — `w-[2%]` bar, emerald text
  - Arbitrum: $0.10/tx ($6.00/60txns) — `w-[12%]` bar, amber text
  - Ethereum: $2.50/tx ($150.00/60txns) — `w-full` bar, red-400 text
  - Bars use gradient `from-[#7C3AED] to-[#3B82F6]`

#### 5. Feature 2 — Agent Chaining (min-h-screen, 2-col grid)

- Label: "02 — AGENT CHAINING"
- H2: "Specialized agents. / One seamless flow."
- Body: "Break complex tasks into specialized subtasks. Each handled by an expert, orchestrated on-chain."
- 4 agent cards in 2×2 grid, each with colored border/accent:
  - Research: purple `bg-[#7C3AED]/20 text-[#7C3AED]`
  - Code: blue `bg-[#3B82F6]/20 text-[#3B82F6]`
  - Test: emerald `bg-[#10B981]/20 text-[#10B981]`
  - Review: amber `bg-[#F59E0B]/20 text-[#F59E0B]`
- **Task Decomposition Flow card** (`bg-[#1E293B]/80`):
  - 5 steps with numbered circles and connecting lines:
    1. Input: "Build a REST API for user management" (gray #94A3B8)
    2. Research: "Analyze requirements, suggest architecture" (purple)
    3. Code: "Implement endpoints + data models" (blue)
    4. Test: "Unit tests + integration validation" (emerald)
    5. Review: "Code review + quality scoring" (amber)
  - Each step number in a circle with `color + "20"` background and step color text

#### 6. Feature 3 — On-Chain Escrow (min-h-screen, 2-col grid)
- Label: "03 — ESCROW"
- H2: "Trust minimized. / Fully on-chain."
- Body: "Funds locked in Vyper smart contracts until task completion. Automatic refund on failure."
- **Escrow flow card** (`bg-[#1E293B]/80`):
  - 4 numbered steps:
    1. "Create task and deposit USDC" (gray pill)
    2. "Agent claims and completes task" (gray pill)
    3. "Submit result for approval" (gray pill)
    4. ✓ "Funds released or refunded" (emerald pill `bg-[#10B981]/20`)

#### 7. Feature 4 — ERC-8004 Reputation (min-h-screen, 2-col grid)
- Label: "04 — REPUTATION"
- H2: "On-chain identity. / Proven quality."
- Body: "ERC-8004 identity NFTs and 0–100 quality scoring. Transparent feedback history with revocable on-chain audit trail."
- Checklist (blue check icons `bg-[#3B82F6]/20`):
  - "NFT-based agent identities"
  - "0–100 quality scoring system"
  - "Transparent on-chain feedback"
  - "Revocable feedback with audit trail"

#### 8. Technical Evidence Section
- H2: "Verified On-Chain"
- Body: "Deployed Vyper smart contracts on Arc testnet — verifiable on arcscan.io"
- **Code block** (`bg-[#0D1117] rounded-xl border-[#334155]/30`, JetBrains Mono):
  - Comment: `// AgentWork Contracts — Arc Testnet (5042002)`
  - 5 contract addresses (cyan name, gray colon, light address):
    - `IdentityRegistry: 0x858A5CB26a8f5e4C65F9799699385779E7Fd7431`
    - `ReputationRegistry: 0x75b4D64669a0837B93ffa930945E4E40dCe4f8Ea`
    - `AgentEscrow: 0x57141AF833bD46706DEE3155C7C32da37AA407F3`
    - `PaymentSplitter: 0xc23913b38cEA341714b466d7ce16c82DEb20aa30`
    - `SpendingLimiter: 0xe0c736FDe0064c3988c86c2393BB3234A942072D`
  - Divider line
  - Comment: `// Payment flow — 3 lines, gasless:`
  - Syntax-highlighted code (purple keywords, blue new, cyan props, green strings, yellow methods):
    ```
    const gateway = new GatewayClient({ chain: "arcTestnet" });
    await gateway.deposit("1.0");
    const result = await gateway.pay("http://localhost:4021/task");
    ```

#### 9. CTA Section (min-h-[60vh], centered)
- H2: "Start building with / autonomous agents."
- Body: "Explore the live testnet dashboard. 60+ on-chain transactions."
- Two buttons:
  - "Launch Demo Now" — gradient pill with glow shadow
  - "Read Documentation" — outlined `border-[#334155]` pill

#### 10. Footer
- `border-t border-[#334155]/50`
- Logo (gradient AW + "AgentWork" in light text)
- Center: "Agentic Economy on Arc · lablab.ai Hackathon 2026" in muted text
- Right: "GitHub", "Discord", "Docs" links in `text-[#94A3B8]` hover purple

### CSS Additions (globals.css)

Add these 4 keyframes and utility classes:

```css
@keyframes neonPulse {
  0%, 100% { opacity: 1; filter: brightness(1); }
  50% { opacity: 0.85; filter: brightness(1.3); }
}
@keyframes glowBreathe {
  0%, 100% { box-shadow: 0 0 20px rgba(124, 58, 237, 0.2); }
  50% { box-shadow: 0 0 40px rgba(124, 58, 237, 0.4); }
}
@keyframes dataFlow {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
@keyframes borderGlow {
  0%, 100% { border-color: rgba(124, 58, 237, 0.3); }
  50% { border-color: rgba(59, 130, 246, 0.5); }
}
.animate-neon-pulse { animation: neonPulse 3s ease-in-out infinite; }
.animate-glow-breathe { animation: glowBreathe 4s ease-in-out infinite; }
.animate-data-flow { background-size: 200% 100%; animation: dataFlow 3s linear infinite; }
.animate-border-glow { animation: borderGlow 4s ease-in-out infinite; }
```

### Tailwind Config Extension (tailwind.config.js)

```js
colors: {
  arc: {
    purple: "#7C3AED",
    blue: "#3B82F6",
    dark: "#0F172A",
    card: "#1E293B",
    border: "#334155",
    cyan: "#06B6D4",
    emerald: "#10B981",
    amber: "#F59E0B",
    elevated: "#253348",
  },
},
```

### Key Facts for Copy Accuracy

| Fact | Value |
|------|-------|
| Blockchain | Arc L1 (Chain ID 5042002) |
| Gas token | USDC (native, 6 decimals) |
| Payment protocol | x402 / EIP-3009 gasless transfers |
| SDK | `@circle-fin/x402-batching` v2.1.0 |
| Chain name in SDK | `"arcTestnet"` (NOT "arc" or "arc-testnet") |
| Gateway address | `0x0077777d7EBA4688BDeF3E311b846F25870A19B9` |
| Explorer | https://testnet.arcscan.io/tx/ |
| Cost per task | $0.005 |
| Number of agents | 4 (Research, Code, Test, Review) |
| Number of contracts | 5 (all Vyper, deployed on testnet) |
| Identity standard | ERC-8004 |
| Hackathon | Agentic Economy on Arc (lablab.ai, April 2026) |
| Agent ports | 4021 (research), 4022 (code), 4023 (test), 4024 (review) |

### File Structure

```
app/landing/
├── page.tsx                        ← Main landing page (450 lines)
└── components/
    ├── ThreeScene.tsx              ← R3F Canvas + lighting (45 lines)
    └── NetworkMesh.tsx             ← 3D blockchain network (290 lines)
```

All three files are `"use client"` components. The page dynamically imports ThreeScene with `ssr: false`. NetworkMesh is the default export imported by ThreeScene.

### Output

Generate all three files completely. Do not truncate or abbreviate. Include every line of code.

## PROMPT END

---

## Quick-Reference Cheat Sheet

If you just need the TL;DR for a chat prompt:

> Build an AgentWork landing page (Next.js 14, TypeScript, Tailwind, framer-motion, react-three-fiber). Dark cyberpunk theme (bg #0F172A, cards #1E293B, borders #334155). 3D background: 7-node blockchain payment network with emissive spheres, traveling cyan particles on edges, glow rings — NO post-processing (GPU-safe). Page sections: navbar → hero with gradient text "AI Agents That Scale on Chain" → tech stats ribbon (Chain 5042002, USDC, x402, 5 Vyper, $0.005/task, ERC-8004) → 4 feature sections (Nanopayments with gas comparison chart, Agent Chaining with decomposition flow, On-Chain Escrow with step cards, Reputation with checklist) → Technical Evidence with 5 deployed contract addresses in dark code block → CTA → Footer. All colors: purple #7C3AED, blue #3B82F6, cyan #06B6D4, emerald #10B981, amber #F59E0B. Three files: page.tsx, ThreeScene.tsx, NetworkMesh.tsx — all "use client".
