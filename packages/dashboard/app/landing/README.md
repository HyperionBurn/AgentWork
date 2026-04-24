# AgentWork Landing Page

A pristine, Awwwards-worthy 3D landing page for AgentWork featuring glassmorphism effects, scroll-based animations, and real-time 3D rendering.

## Features

- **Pristine Light Theme**: Clean, airy aesthetic with alabaster whites (#FAFAFA to #FFFFFF)
- **Glassmorphism 3D Object**: Abstract frosted glass sculpture using MeshTransmissionMaterial
- **Scroll Orchestration**: 4-page scroll with "hyperframe" transitions
- **Post-Processing**: N8AO ambient occlusion, subtle bloom, and depth effects
- **Responsive Design**: Optimized for desktop and tablet (mobile-friendly)

## Tech Stack

- **Core**: React, Next.js 14, TypeScript
- **3D Rendering**: React Three Fiber (R3F), Three.js
- **3D Utilities**: @react-three/drei, @react-three/postprocessing
- **Animations**: Framer Motion (DOM), GSAP-style scroll interpolation
- **Styling**: Tailwind CSS

## Installation

1. **Install dependencies**:
```bash
cd packages/dashboard
npm install @react-three/fiber @react-three/drei @react-three/postprocessing three framer-motion
```

2. **Run the development server**:
```bash
npm run dev
```

3. **Access the landing page**:
```
http://localhost:3000/landing
```

## Architecture

### File Structure

```
app/landing/
├── page.tsx              # Main landing page (DOM UI + 3D canvas)
└── components/
    ├── ThreeScene.tsx    # 3D scene setup with Canvas, lights, post-processing
    └── AbstractGeometry.tsx  # Glass sculpture with scroll animations
```

### Design Principles

#### Pristine Light Aesthetic
- Palette: Alabaster whites (#FAFAFA), soft frosted glass, brushed silver
- No dark modes, heavy gradients, or cyberpunk neon
- Subtle iridescent pastel caustics

#### Lighting Rig
- Environment HDRI: `<Environment preset="studio" />`
- Shadows: `ContactShadows` + `AccumulativeShadows` (resolution 1024)
- Post-Processing: N8AO, subtle Bloom, Depth of Field

#### Material Specifications
- Primary: `<MeshTransmissionMaterial>` for realistic glass
- Config: `transmission: 1`, `thickness: 1.5`, `roughness: 0.1`, `ior: 1.5`, `chromaticAberration: 0.04`

#### Scroll Orchestration
- Architecture: Fixed Canvas (`fixed inset-0 z-0`), HTML UI (`z-10`)
- Hyperframes: `<ScrollControls pages={4}>` with scroll.offset interpolation (0 to 1)
- Transitions: Scale up, rotate 180°, explode/reassemble geometry

## Components

### ThreeScene.tsx
- Sets up the R3F Canvas with proper camera settings
- Configures lighting rig (studio HDRI, directional lights, point lights)
- Implements scroll controls for 4 pages
- Adds post-processing pipeline (N8AO, Bloom)

### AbstractGeometry.tsx
- Main 3D sculpture: Torus knot + orbiting rings + inner sphere
- Floating particles for depth
- Scroll-based rotation, scaling, and position changes
- MeshTransmissionMaterial for glass effects

### page.tsx
- Fixed 3D canvas background
- DOM UI overlay with Framer Motion animations
- Hero section with CTA buttons
- 4 feature sections (Nanopayments, Agent Chaining, Escrow, Reputation)
- Responsive navbar with Sign In / Get Started buttons

## Performance Considerations

- **Dynamic Import**: ThreeScene is dynamically imported to avoid SSR issues
- **Resolution**: Shadow maps at 1024-2048, bloom intensity kept low (0.15)
- **DPR**: `dpr={[1, 2]}` for adaptive pixel ratio
- **Suspense**: Loading skeleton during 3D initialization

## Customization

### Adjust Scroll Speed
Edit `damping={0.2}` in `ThreeScene.tsx` - lower = smoother, higher = faster

### Change Glass Thickness
Edit `thickness={1.5}` in `AbstractGeometry.tsx` - higher = thicker, more refraction

### Modify Bloom Intensity
Edit `intensity={0.15}` in `ThreeScene.tsx` - higher = more glow

### Adjust Number of Particles
Edit `{[...Array(20)].map(...)}` in `AbstractGeometry.tsx` - change 20 to desired count

## Browser Compatibility

- **Recommended**: Chrome 90+, Firefox 88+, Safari 14+
- **WebGL 2.0**: Required for post-processing effects
- **Fallback**: Loading skeleton displays if 3D fails to initialize

## Known Issues

- Mobile performance may vary due to heavy post-processing
- SSR disabled for Three.js components (client-side only)
- Initial load time ~2-3 seconds for 3D initialization

## Future Enhancements

- [ ] Mobile bottom navigation
- [ ] WebGL fallback for older browsers
- [ ] Interactive 3D object (drag/rotate)
- [ ] Progressive loading for faster initial render
- [ ] VR/AR mode support

## Credits

- **Design**: Inspired by Awwwards-winning sites (Linear, Vercel, Apple)
- **3D**: React Three Fiber ecosystem
- **Animations**: Framer Motion physics-based animations

## License

MIT - AgentWork Team 2026
