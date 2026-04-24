import React, { useState } from 'react';
import { Wallet, ChevronDown, Activity, Link as LinkIcon } from 'lucide-react';
import { truncateAddress, formatNumber, cn } from '../../lib/utils';
import { motion } from 'motion/react';

export function WalletConnect() {
  const [connected, setConnected] = useState(false);
  const address = "0x7a5cD9...B4e21"; // Mock demo state
  
  if (!connected) {
    return (
      <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setConnected(true)}
        className="flex items-center space-x-2 bg-arc-orange hover:bg-arc-orange-light text-black font-semibold text-sm px-4 py-2 rounded-none transition-colors border border-arc-orange shadow-[0_0_15px_rgba(255,83,0,0.3)] hover:shadow-[0_0_25px_rgba(255,83,0,0.5)]"
      >
        <Wallet className="w-4 h-4" />
        <span>CONNECT WALLET</span>
      </motion.button>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="hidden sm:flex flex-col items-end mr-2">
        <span className="text-[10px] text-arc-muted font-mono uppercase">Network</span>
        <div className="flex items-center space-x-1.5 text-[10px] font-mono text-arc-green mt-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-arc-green animate-pulse" />
          <span>ARC L3</span>
        </div>
      </div>
      <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setConnected(false)}
        className="flex items-center space-x-2 bg-arc-surface hover:bg-arc-surface-hover text-arc-text text-sm px-4 py-2 rounded-none border border-arc-border transition-colors font-mono relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-arc-orange/5 group-hover:bg-arc-orange/10 transition-colors" />
        <div className="w-2 h-2 rounded-full bg-arc-orange shadow-[0_0_8px_rgba(255,83,0,0.8)] relative z-10" />
        <span className="relative z-10">{truncateAddress(address)}</span>
        <span className="text-arc-muted ml-2 relative z-10 font-bold">{formatNumber(4251)} USDC</span>
        <ChevronDown className="w-4 h-4 text-arc-muted relative z-10" />
      </motion.button>
    </div>
  );
}
