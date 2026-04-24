/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import Preloader from '../../landing/Preloader';
import Network3D from '../../landing/Network3D';
import Navbar from '../../landing/Navbar';
import Hero from '../../landing/Hero';
import TechStats from '../../landing/TechStats';
import Features from '../../landing/Features';
import AgentChaining from '../../landing/AgentChaining';
import CodeSnippet from '../../landing/CodeSnippet';
import TechnicalEvidenceCTA from '../../landing/TechnicalEvidenceCTA';
import Footer from '../../landing/Footer';
import CustomCursor from '../../landing/CustomCursor';
import NoiseOverlay from '../../landing/NoiseOverlay';

export default function LandingTab() {
  const [preloaderDone, setPreloaderDone] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-[#050505] overflow-y-auto">
      {!preloaderDone && <Preloader onComplete={() => setPreloaderDone(true)} />}
      {preloaderDone && (
        <>
          <CustomCursor />
          <NoiseOverlay />
          <div className="relative z-10">
            <Navbar />
            <Hero />
            <TechStats />
            <Features />
            <AgentChaining />
            <CodeSnippet />
            <TechnicalEvidenceCTA />
            <Footer />
          </div>
          <div className="fixed inset-0 pointer-events-none z-[5]">
            <Network3D />
          </div>
        </>
      )}
    </div>
  );
}
