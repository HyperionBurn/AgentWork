import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

const bootSequences = [
  "INITIALIZING WSS PROTOCOL...",
  "LOCATING PEER NODES...",
  "VERIFYING CRYPTOGRAPHIC PROOFS...",
  "ESTABLISHING SECURE TUNNEL...",
  "SYNCHRONIZING LEDGER STATE...",
  "BOOT SEQUENCE COMPLETE."
];

export default function Preloader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [sequenceIndex, setSequenceIndex] = useState(0);

  useEffect(() => {
    // Prevent scrolling while preloader is active
    document.body.style.overflow = "hidden";

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 4;
      if (currentProgress > 100) currentProgress = 100;
      
      setProgress(currentProgress);
      
      const newSequenceIndex = Math.min(
        Math.floor((currentProgress / 100) * bootSequences.length),
        bootSequences.length - 1
      );
      setSequenceIndex(newSequenceIndex);

      if (currentProgress === 100) {
        clearInterval(interval);
        setTimeout(() => {
          document.body.style.overflow = "";
          onComplete();
        }, 800); // Hold at 100% for a moment
      }
    }, 40);

    return () => {
      clearInterval(interval);
      document.body.style.overflow = "";
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        key="preloader"
        initial={{ opacity: 1 }}
        exit={{ 
            opacity: 0, 
            y: "-100%", 
            transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } 
        }}
        className="fixed inset-0 z-[200] bg-black flex flex-col justify-end p-6 md:p-12 text-orange-500 font-mono"
      >
        <div className="flex flex-col gap-4 max-w-2xl">
           <div className="text-xs md:text-sm text-white/50 h-5">
             {bootSequences[sequenceIndex]}
           </div>
           <div className="flex items-end justify-between">
              <div className="text-6xl md:text-9xl font-light tracking-tighter leading-none">
                {Math.floor(progress).toString().padStart(3, '0')}<span className="text-white/20 text-4xl md:text-6xl">%</span>
              </div>
              <div className="text-xs text-white/30 hidden md:block pb-2">
                AGENWORK KERNEL v2.4.1
              </div>
           </div>
           
           <div className="w-full h-1 bg-white/10 mt-4 relative overflow-hidden">
             <motion.div 
               className="absolute top-0 left-0 h-full bg-orange-500"
               style={{ width: `${progress}%` }}
             />
           </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
