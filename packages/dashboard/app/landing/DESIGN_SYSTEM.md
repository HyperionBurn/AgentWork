# AgentWork Dark Landing Page — Complete Design System

> UI MASTER output. Every value is exact. Every class is paste-ready.
> Purpose: Transform light-mode landing page into dark cyberpunk blockchain UI
> matching the existing dashboard palette.

---

## 1. COLOR PALETTE

### Background Layers
| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-base` | `#070B14` | Body background (deeper than dashboard for drama) |
| `--bg-surface` | `#0F172A` | Section backgrounds (matches dashboard arc-dark) |
| `--bg-card` | `#1E293B` | Card surfaces (matches dashboard arc-card) |
| `--bg-elevated` | `#263348` | Elevated cards, hover states |
| `--bg-glass` | `rgba(15, 23, 42, 0.70)` | Glassmorphism panels |
| `--bg-glass-heavy` | `rgba(15, 23, 42, 0.85)` | Navbar glass |

### Border Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--border-subtle` | `#1E293B` | Subtle dividers, default card borders |
| `--border-default` | `#334155` | Standard borders (matches arc-border) |
| `--border-bright` | `#475569` | Hover borders, active states |
| `--border-neon-purple` | `rgba(124, 58, 237, 0.4)` | Neon accent borders |
| `--border-neon-blue` | `rgba(59, 130, 246, 0.4)` | Neon accent borders |

### Text Hierarchy
| Token | Hex | Usage |
|-------|-----|-------|
| `--text-primary` | `#F1F5F9` | Headlines, primary text (slate-100) |
| `--text-secondary` | `#94A3B8` | Body text, descriptions (slate-400) |
| `--text-muted` | `#64748B` | Labels, timestamps, metadata (slate-500) |
| `--text-faint` | `#475569` | Disabled, placeholders (slate-600) |

### Accent Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--accent-purple` | `#7C3AED` | Primary accent, CTA glow (arc-purple) |
| `--accent-purple-light` | `#A78BFA` | Purple tint for hover/secondary |
| `--accent-blue` | `#3B82F6` | Secondary accent (arc-blue) |
| `--accent-cyan` | `#22D3EE` | Data highlights, status indicators |
| `--accent-emerald` | `#34D399` | Success states, online dots |
| `--accent-amber` | `#FBBF24` | Warning, "connecting" states |

### Gradients
| Name | CSS |
|------|-----|
| `--gradient-hero-text` | `linear-gradient(135deg, #A78BFA 0%, #7C3AED 30%, #3B82F6 70%, #22D3EE 100%)` |
| `--gradient-cta-btn` | `linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)` |
| `--gradient-cta-hover` | `linear-gradient(135deg, #8B5CF6 0%, #60A5FA 100%)` |
| `--gradient-card-border` | `linear-gradient(135deg, rgba(124,58,237,0.3) 0%, rgba(59,130,246,0.1) 50%, rgba(34,211,238,0.3) 100%)` |
| `--gradient-bg-subtle` | `radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.08) 0%, transparent 60%)` |
| `--gradient-bg-radial` | `radial-gradient(circle at 30% 20%, rgba(124,58,237,0.06) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(59,130,246,0.04) 0%, transparent 50%)` |

### Glow / Box Shadows
| Name | CSS |
|------|-----|
| `--glow-purple-sm` | `0 0 15px rgba(124, 58, 237, 0.2)` |
| `--glow-purple-md` | `0 0 30px rgba(124, 58, 237, 0.3), 0 0 60px rgba(124, 58, 237, 0.1)` |
| `--glow-purple-lg` | `0 0 40px rgba(124, 58, 237, 0.4), 0 0 80px rgba(124, 58, 237, 0.15), 0 0 120px rgba(124, 58, 237, 0.05)` |
| `--glow-blue-sm` | `0 0 15px rgba(59, 130, 246, 0.2)` |
| `--glow-cyan-sm` | `0 0 15px rgba(34, 211, 238, 0.2)` |
| `--glow-cta` | `0 0 20px rgba(124, 58, 237, 0.4), 0 0 40px rgba(59, 130, 246, 0.2)` |
| `--glow-card` | `0 4px 24px rgba(0, 0, 0, 0.3)` |

---

## 2. TYPOGRAPHY

### Font Stack
```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```
Monospace (for hashes, data):
```css
font-family: 'JetBrains Mono', 'Fira Code', monospace;
```

### Scale Table

| Element | Size | Weight | Line Height | Letter Spacing | Tailwind |
|---------|------|--------|-------------|----------------|----------|
| **Hero H1** | `clamp(2.5rem, 6vw, 5rem)` | 700 (bold) | 1.05 | -0.04em | `text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.05] tracking-[-0.04em]` |
| **Hero H1 span** (gradient) | same | 700 | — | -0.04em | (inherits parent) |
| **Section H2** | `3rem / 3.75rem` | 600 (semibold) | 1.1 | -0.03em | `text-5xl md:text-6xl font-semibold leading-[1.1] tracking-[-0.03em]` |
| **Section H2 alt** (compact) | `2.25rem / 3rem` | 600 | 1.15 | -0.025em | `text-4xl md:text-5xl font-semibold leading-[1.15] tracking-[-0.025em]` |
| **Section H3** | `1.5rem` | 600 | 1.3 | -0.02em | `text-2xl font-semibold leading-tight tracking-[-0.02em]` |
| **Body Large** | `1.125rem` (18px) | 300 (light) | 1.7 | -0.01em | `text-lg font-light leading-[1.7] tracking-[-0.01em]` |
| **Body** | `0.9375rem` (15px) | 400 | 1.6 | -0.005em | `text-[15px] leading-[1.6] tracking-[-0.005em]` |
| **Label** | `0.75rem` (12px) | 600 (semibold) | — | 0.15em | `text-xs font-semibold tracking-[0.15em]` |
| **Badge** | `0.6875rem` (11px) | 600 | — | 0.06em | `text-[11px] font-semibold tracking-[0.06em]` |
| **Button Primary** | `0.9375rem` (15px) | 500 (medium) | — | -0.01em | `text-[15px] font-medium tracking-[-0.01em]` |
| **Button Small** | `0.8125rem` (13px) | 500 | — | 0.02em | `text-[13px] font-medium tracking-[0.02em]` |
| **Nav Link** | `0.8125rem` (13px) | 500 | — | 0.02em | `text-[13px] font-medium tracking-[0.02em]` |
| **Mono/Data** | `0.8125rem` (13px) | 400 | — | 0 | `text-[13px] font-mono` |
| **Footer** | `0.8125rem` (13px) | 400 | — | -0.005em | `text-[13px] tracking-[-0.005em]` |

---

## 3. COMPONENT SPECS (Exact Tailwind Classes)

### 3.1 Navbar (Glass Morphism on Dark)

```
// Container:
fixed top-0 left-0 right-0 z-50 px-6 md:px-10 py-4 bg-[#070B14]/80 backdrop-blur-xl border-b border-white/[0.06]

// Inner wrapper:
max-w-7xl mx-auto flex items-center justify-between

// Logo container:
flex items-center gap-3

// Logo icon:
w-9 h-9 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#3B82F6] flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.3)]

// Logo text:
text-lg font-semibold text-slate-100 tracking-[-0.02em]

// Nav links container:
hidden md:flex items-center gap-8

// Nav link (inactive):
text-[13px] font-medium tracking-[0.02em] uppercase text-slate-400 hover:text-slate-100 transition-colors duration-300

// Nav link (active):
text-[13px] font-medium tracking-[0.02em] uppercase text-slate-100

// "Get Started" button (nav):
ml-2 px-5 py-2 text-[13px] font-medium tracking-[0.02em] bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] text-white rounded-full hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all duration-300
```

### 3.2 Hero Section

```
// Section container:
relative z-10 min-h-screen flex flex-col items-center justify-center px-6 pt-24

// Background radial glow (pseudo-element or div):
absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse,rgba(124,58,237,0.12)_0%,transparent_70%)] pointer-events-none

// Content wrapper:
max-w-3xl mx-auto text-center relative

// Pill badge:
inline-flex items-center gap-2 px-4 py-1.5 bg-[#7C3AED]/10 backdrop-blur-sm rounded-full border border-[#7C3AED]/20 text-[12px] font-medium tracking-[0.06em] uppercase text-[#A78BFA]

// Pill dot:
w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse

// Hero H1:
text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.05] tracking-[-0.04em] text-slate-100 mb-6

// Hero H1 gradient span:
bg-gradient-to-r from-[#A78BFA] via-[#7C3AED] to-[#3B82F6] bg-clip-text text-transparent

// Subtitle:
text-lg md:text-xl font-light leading-[1.7] tracking-[-0.01em] text-slate-400 max-w-xl mx-auto mb-10

// CTA group:
flex flex-col sm:flex-row items-center justify-center gap-4

// Primary CTA button:
group px-8 py-3.5 bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] text-white rounded-full text-[15px] font-medium tracking-[-0.01em] hover:shadow-[0_0_30px_rgba(124,58,237,0.4),0_0_60px_rgba(59,130,246,0.2)] transition-all duration-300 flex items-center gap-2

// Secondary CTA button:
px-8 py-3.5 text-[15px] font-medium tracking-[-0.01em] text-slate-300 border border-slate-600 rounded-full hover:border-slate-400 hover:text-slate-100 transition-all duration-300

// Scroll indicator container:
absolute bottom-10 left-1/2 -translate-x-1/2

// Scroll indicator mouse:
w-5 h-8 border border-slate-600 rounded-full flex justify-center pt-1.5

// Scroll indicator dot:
w-1 h-1 bg-slate-400 rounded-full
```

### 3.3 Feature Section (Numbered)

```
// Section wrapper:
min-h-screen flex items-center px-6 py-32 relative

// Section background glow:
absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(124,58,237,0.04)_0%,transparent_50%)] pointer-events-none

// Content grid:
max-w-6xl mx-auto grid md:grid-cols-2 gap-16 md:gap-20 items-center

// Left column (text):
space-y-8

// Section label:
text-xs font-semibold tracking-[0.15em] uppercase text-[#A78BFA]

// Section H2:
text-4xl md:text-5xl font-semibold leading-[1.1] tracking-[-0.03em] text-slate-100

// Section body:
text-lg font-light leading-[1.7] tracking-[-0.01em] text-slate-400 max-w-md

// Check list item:
flex items-center gap-3 text-[15px] text-slate-300 tracking-[-0.005em]

// Check icon container:
w-5 h-5 rounded-full bg-emerald-400/10 flex items-center justify-center flex-shrink-0

// Check icon SVG:
w-3 h-3 text-emerald-400
```

### 3.4 Feature Cards (Agent Cards, Step Cards)

```
// Dark glass card:
p-5 bg-[#1E293B]/60 backdrop-blur-sm rounded-xl border border-[#334155]/60

// Dark glass card with neon border:
p-5 bg-[#1E293B]/60 backdrop-blur-sm rounded-xl border border-[#7C3AED]/20 hover:border-[#7C3AED]/40 transition-colors duration-300

// Step number circle (pending):
w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold tracking-wide bg-slate-700 text-slate-400

// Step number circle (complete):
w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold tracking-wide bg-emerald-400/10 text-emerald-400

// Agent type badge:
inline-block px-2 py-0.5 rounded text-[11px] font-semibold tracking-[0.05em] uppercase mb-2

// Agent badge variants:
// Research: bg-[#7C3AED]/10 text-[#A78BFA]
// Code:     bg-[#3B82F6]/10 text-[#60A5FA]
// Test:     bg-emerald-400/10 text-emerald-400
// Review:   bg-[#FBBF24]/10 text-[#FBBF24]
```

### 3.5 CTA / Stats Section

```
// Stats bar (horizontal):
grid grid-cols-2 md:grid-cols-4 gap-4

// Stat card:
bg-[#1E293B]/40 backdrop-blur-sm border border-[#334155]/40 rounded-xl p-5 text-center

// Stat value:
text-3xl font-bold text-slate-100

// Stat value accent:
text-3xl font-bold bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] bg-clip-text text-transparent

// Stat label:
text-xs text-slate-500 uppercase tracking-wider mt-1
```

### 3.6 Final CTA Section

```
// Section:
relative z-10 min-h-[60vh] flex items-center justify-center px-6 py-32

// Background glow:
absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(124,58,237,0.08)_0%,transparent_60%)] pointer-events-none

// Content:
max-w-2xl mx-auto text-center space-y-8 relative

// H2:
text-4xl md:text-5xl font-semibold leading-[1.1] tracking-[-0.03em] text-slate-100

// Primary button (same as hero CTA):
px-8 py-3.5 bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] text-white rounded-full text-[15px] font-medium tracking-[-0.01em] hover:shadow-[0_0_30px_rgba(124,58,237,0.4),0_0_60px_rgba(59,130,246,0.2)] transition-all duration-300
```

### 3.7 Footer

```
// Container:
relative z-10 border-t border-white/[0.06] py-12 px-6 bg-[#070B14]/50

// Inner:
max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6

// Logo icon:
w-7 h-7 rounded-md bg-gradient-to-br from-[#7C3AED] to-[#3B82F6] flex items-center justify-center

// Logo text:
text-[14px] font-medium text-slate-300 tracking-[-0.02em]

// Copyright:
text-[13px] text-slate-600 tracking-[-0.005em]

// Footer links:
flex items-center gap-6

// Footer link:
text-[13px] text-slate-500 hover:text-slate-300 tracking-[-0.005em] transition-colors duration-300
```

---

## 4. ANIMATION SPECS (Framer Motion)

### 4.1 fadeUp (Dark-Adjusted)
```typescript
const fadeUp = {
  hidden: { y: 30, opacity: 0 },
  visible: (delay: number = 0) => ({
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.8,
      delay,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};
```
*Note: Reduced y from 40→30 for dark backgrounds (less "lift" needed for visual impact).*

### 4.2 fadeUpScale (For cards appearing)
```typescript
const fadeUpScale = {
  hidden: { y: 20, opacity: 0, scale: 0.97 },
  visible: (delay: number = 0) => ({
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.7,
      delay,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};
```

### 4.3 stagger (Container)
```typescript
const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};
```

### 4.4 glowPulse (For neon accents)
```typescript
const glowPulse = {
  animate: {
    boxShadow: [
      "0 0 15px rgba(124, 58, 237, 0.2)",
      "0 0 30px rgba(124, 58, 237, 0.4)",
      "0 0 15px rgba(124, 58, 237, 0.2)",
    ],
  },
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut",
  },
};
```

### 4.5 neonBorder (For card borders)
```typescript
const neonBorder = {
  animate: {
    borderColor: [
      "rgba(124, 58, 237, 0.15)",
      "rgba(124, 58, 237, 0.4)",
      "rgba(59, 130, 246, 0.3)",
      "rgba(124, 58, 237, 0.15)",
    ],
  },
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut",
  },
};
```

### 4.6 fadeIn (For 3D canvas overlay)
```typescript
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 1.2 } },
};
```

### 4.7 slideInLeft (For feature left column)
```typescript
const slideInLeft = {
  hidden: { x: -40, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};
```

### 4.8 floatGentle (For 3D scene, if used)
```typescript
const floatGentle = {
  animate: {
    y: [0, -8, 0],
  },
  transition: {
    duration: 6,
    repeat: Infinity,
    ease: "easeInOut",
  },
};
```

### 4.9 Navbar Entry
```typescript
const navEntry = {
  initial: { y: -30, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
};
```

### 4.10 countUp (For stat numbers)
```typescript
const countUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: "easeOut" },
  }),
};
```

---

## 5. LAYOUT GRID

### Max Widths
| Section | Max Width | Tailwind |
|---------|-----------|----------|
| Navbar inner | 1280px | `max-w-7xl` |
| Hero content | 768px | `max-w-3xl` |
| Feature grid | 1152px | `max-w-6xl` |
| CTA content | 672px | `max-w-2xl` |
| Footer inner | 1280px | `max-w-7xl` |

### Spacing
| Element | Value | Tailwind |
|---------|-------|----------|
| Navbar horizontal padding | 24px / 40px | `px-6 md:px-10` |
| Navbar vertical padding | 16px | `py-4` |
| Section vertical padding | 128px | `py-32` |
| Feature grid gap | 64px / 80px | `gap-16 md:gap-20` |
| Between text elements | 32px | `space-y-8` |
| List item gap | 12px | `space-y-3` |
| CTA button gap | 16px | `gap-4` |
| Footer vertical padding | 48px | `py-12` |

### Responsive Breakpoints (Tailwind defaults)
| Breakpoint | Min Width | Target |
|------------|-----------|--------|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small desktops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large desktops |

---

## 6. 3D SCENE ADJUSTMENTS (Dark Mode)

The current ThreeScene uses pastel/white materials. For dark mode, adjust:

### AbstractGeometry Materials
```
glassMaterial.color       → "#0A0F1A" (deep blue-black)
glassMaterial.transmission → 0.6 (was 0.95 — more opaque for dark bg)
glassMaterial.emissive    → "#1a0a3e" (subtle purple glow)
glassMaterial.emissiveIntensity → 0.15

ringMaterial.color        → "#7C3AED" (purple glow ring)
ringMaterial.emissive     → "#7C3AED"
ringMaterial.emissiveIntensity → 0.3

titaniumMaterial.color    → "#475569" (dark steel)

particleMaterial.color    → "#7C3AED" (purple particles)
particleMaterial.emissive → "#A78BFA"
particleMaterial.emissiveIntensity → 0.5
```

### ThreeScene Lighting
```
ambientLight.intensity    → 0.3 (was 0.6 — subtler)
keyLight.color            → "#C4B5FD" (purple-tinted)
keyLight.intensity        → 1.0 (was 1.5)
fillLight.color           → "#93C5FD" (blue-tinted)
rimLight.color            → "#7C3AED" (purple rim)
rimLight.intensity        → 1.0 (was 0.5)
```

### Canvas Background
```
// Canvas loading fallback:
bg-gradient-to-b from-[#070B14] to-[#0F172A]

// Canvas gl.clearColor → transparent (use CSS bg on parent)
```

---

## 7. CSS CUSTOM PROPERTIES (Add to globals.css)

```css
:root {
  /* Landing dark theme */
  --landing-bg: #070B14;
  --landing-surface: #0F172A;
  --landing-card: #1E293B;
  --landing-elevated: #263348;
  --landing-border: #334155;
  --landing-text-primary: #F1F5F9;
  --landing-text-secondary: #94A3B8;
  --landing-text-muted: #64748B;
  --landing-accent-purple: #7C3AED;
  --landing-accent-blue: #3B82F6;
  --landing-accent-cyan: #22D3EE;
}

/* Dark landing page background grid pattern */
.landing-grid-bg {
  background-image:
    linear-gradient(rgba(124, 58, 237, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(124, 58, 237, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
}

/* Neon text glow (for hero heading) */
.neon-text-glow {
  text-shadow: 0 0 40px rgba(124, 58, 237, 0.3), 0 0 80px rgba(124, 58, 237, 0.1);
}

/* Animated gradient border */
.gradient-border-animated {
  position: relative;
  background: transparent;
}
.gradient-border-animated::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(124,58,237,0.4), rgba(59,130,246,0.1), rgba(34,211,238,0.3));
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  pointer-events: none;
  animation: borderRotate 6s linear infinite;
}

@keyframes borderRotate {
  0% { background: linear-gradient(0deg, rgba(124,58,237,0.4), rgba(59,130,246,0.1), rgba(34,211,238,0.3)); }
  25% { background: linear-gradient(90deg, rgba(124,58,237,0.4), rgba(59,130,246,0.1), rgba(34,211,238,0.3)); }
  50% { background: linear-gradient(180deg, rgba(124,58,237,0.4), rgba(59,130,246,0.1), rgba(34,211,238,0.3)); }
  75% { background: linear-gradient(270deg, rgba(124,58,237,0.4), rgba(59,130,246,0.1), rgba(34,211,238,0.3)); }
  100% { background: linear-gradient(360deg, rgba(124,58,237,0.4), rgba(59,130,246,0.1), rgba(34,211,238,0.3)); }
}

/* CTA button shimmer effect */
.btn-shimmer {
  position: relative;
  overflow: hidden;
}
.btn-shimmer::after {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 40%,
    rgba(255, 255, 255, 0.08) 50%,
    transparent 60%
  );
  animation: shimmer 4s ease-in-out infinite;
}
@keyframes shimmer {
  0% { transform: translateX(-100%) translateY(-100%); }
  100% { transform: translateX(100%) translateY(100%); }
}

/* Noise texture overlay (subtle) */
.noise-overlay::after {
  content: "";
  position: absolute;
  inset: 0;
  opacity: 0.02;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 1;
}
```

---

## 8. QUICK REFERENCE — Copy-Paste Class Groups

### Page container
```tsx
<div className="relative w-full min-h-screen overflow-hidden bg-[#070B14] landing-grid-bg noise-overlay">
```

### Glass card
```tsx
className="bg-[#1E293B]/60 backdrop-blur-sm rounded-xl border border-[#334155]/60 p-5"
```

### Glass card with neon accent
```tsx
className="bg-[#1E293B]/60 backdrop-blur-sm rounded-xl border border-[#7C3AED]/20 hover:border-[#7C3AED]/40 transition-colors duration-300 p-5"
```

### Gradient text (hero)
```tsx
className="bg-gradient-to-r from-[#A78BFA] via-[#7C3AED] to-[#3B82F6] bg-clip-text text-transparent"
```

### Primary CTA
```tsx
className="group px-8 py-3.5 bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] text-white rounded-full text-[15px] font-medium tracking-[-0.01em] hover:shadow-[0_0_30px_rgba(124,58,237,0.4),0_0_60px_rgba(59,130,246,0.2)] transition-all duration-300 flex items-center gap-2"
```

### Secondary CTA
```tsx
className="px-8 py-3.5 text-[15px] font-medium tracking-[-0.01em] text-slate-300 border border-slate-600 rounded-full hover:border-slate-400 hover:text-slate-100 transition-all duration-300"
```

### Pill badge
```tsx
className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#7C3AED]/10 rounded-full border border-[#7C3AED]/20 text-[12px] font-medium tracking-[0.06em] uppercase text-[#A78BFA]"
```

### Section label
```tsx
className="text-xs font-semibold tracking-[0.15em] uppercase text-[#A78BFA]"
```

### Stat card
```tsx
className="bg-[#1E293B]/40 backdrop-blur-sm border border-[#334155]/40 rounded-xl p-5 text-center"
```

### Neon glow wrapper
```tsx
<motion.div animate={{ boxShadow: ["0 0 15px rgba(124,58,237,0.2)", "0 0 30px rgba(124,58,237,0.4)", "0 0 15px rgba(124,58,237,0.2)"] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
```
