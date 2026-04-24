/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, lazy, Suspense } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import TechStats from "./components/TechStats";
import Features from "./components/Features";
import CodeSnippet from "./components/CodeSnippet";
import AgentChaining from "./components/AgentChaining";
import TechnicalEvidenceCTA from "./components/TechnicalEvidenceCTA";
import Footer from "./components/Footer";
import NoiseOverlay from "./components/NoiseOverlay";
import CustomCursor from "./components/CustomCursor";
import Preloader from "./components/Preloader";

// Lazy-load Three.js to prevent duplicate instances and SSR issues
const Network3D = lazy(() => import("./components/Network3D"));

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative min-h-screen text-white selection:bg-orange-500/30 selection:text-orange-200 cursor-none">
      {!isLoaded && <Preloader onComplete={() => setIsLoaded(true)} />}
      
      <CustomCursor />
      <NoiseOverlay />
      
      {isLoaded && (
        <>
          <Suspense fallback={null}>
            <Network3D />
          </Suspense>
          <Navbar />
          
          <main>
            <Hero />
            <TechStats />
            <Features />
            <AgentChaining />
            <CodeSnippet />
            <TechnicalEvidenceCTA />
          </main>
          
          <Footer />
        </>
      )}
    </div>
  );
}



