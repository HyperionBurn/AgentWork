/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import TechStats from "./components/TechStats";
import Features from "./components/Features";
import CodeSnippet from "./components/CodeSnippet";
import AgentChaining from "./components/AgentChaining";
import TechnicalEvidenceCTA from "./components/TechnicalEvidenceCTA";
import Footer from "./components/Footer";
import Network3D from "./components/Network3D";
import NoiseOverlay from "./components/NoiseOverlay";
import CustomCursor from "./components/CustomCursor";
import Preloader from "./components/Preloader";

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative min-h-screen text-white selection:bg-orange-500/30 selection:text-orange-200 cursor-none">
      {!isLoaded && <Preloader onComplete={() => setIsLoaded(true)} />}
      
      <CustomCursor />
      <NoiseOverlay />
      
      {isLoaded && (
        <>
          <Network3D />
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



