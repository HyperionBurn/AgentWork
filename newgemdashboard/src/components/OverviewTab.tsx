import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import { Activity, Server, ArrowRightLeft, DollarSign, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatNumber } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// --- ArcHealthMonitor ---
function ArcHealthMonitor() {
  const [blockHeight, setBlockHeight] = useState(14258901);
  const [latency, setLatency] = useState(12);

  useEffect(() => {
    const blockInterval = setInterval(() => {
      setBlockHeight(prev => prev + 1);
    }, 2500);

    const latencyInterval = setInterval(() => {
      setLatency(10 + Math.floor(Math.random() * 5));
    }, 1000);

    return () => {
      clearInterval(blockInterval);
      clearInterval(latencyInterval);
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-arc-surface border border-arc-border p-5 relative overflow-hidden group"
    >
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-arc-border group-hover:via-arc-orange/50 to-transparent transition-all duration-500"></div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-mono text-arc-muted uppercase tracking-wider">Arc Network Health</h3>
        <div className="flex items-center space-x-2 text-xs font-mono text-arc-green">
          <Activity className="w-4 h-4" />
          <span>OPERATIONAL</span>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-arc-muted font-mono mb-1">BLOCK HEIGHT</p>
          <div className="text-xl font-mono relative overflow-hidden h-7">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={blockHeight}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute"
              >
                {formatNumber(blockHeight)}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <div>
          <p className="text-xs text-arc-muted font-mono mb-1">LATENCY</p>
          <p className="text-xl font-mono text-arc-orange transition-colors duration-300">~{latency}ms</p>
        </div>
        <div>
          <p className="text-xs text-arc-muted font-mono mb-1">RPC STATUS</p>
          <p className="text-xl font-mono flex items-center">
            <CheckCircle2 className="w-5 h-5 text-arc-green mr-2" /> 99.9%
          </p>
        </div>
        <div>
          <p className="text-xs text-arc-muted font-mono mb-1">GATEWAY SYNC</p>
          <p className="text-xl font-mono">Synced</p>
        </div>
      </div>
    </motion.div>
  );
}

// --- BridgeStatus ---
function BridgeStatus() {
  const [l1Latency, setL1Latency] = useState(45);
  const [cctpLatency, setCctpLatency] = useState(12);

  useEffect(() => {
    const latInterval = setInterval(() => {
      setL1Latency(42 + Math.floor(Math.random() * 8));
      setCctpLatency(10 + Math.floor(Math.random() * 4));
    }, 3000);
    return () => clearInterval(latInterval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
      className="bg-arc-surface border border-arc-border p-5"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-mono text-arc-muted uppercase tracking-wider">Bridge Status</h3>
        <div className="flex items-center space-x-2 text-xs font-mono">
          <Server className="w-4 h-4 text-arc-muted" />
          <span>2 ACTIVE</span>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 border border-arc-border bg-[#0a0a0a] hover:border-arc-muted transition-colors">
          <div className="flex flex-col">
            <span className="text-sm font-medium hover:text-arc-orange transition-colors cursor-pointer">Arc ↔ Ethereum</span>
            <span className="text-xs text-arc-muted font-mono mt-1">L1 Gateway</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm font-mono text-arc-green">Online</span>
            <span className="text-xs text-arc-muted font-mono mt-1 transition-colors duration-300">{l1Latency}ms</span>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 border border-arc-border bg-[#0a0a0a] hover:border-arc-muted transition-colors">
          <div className="flex flex-col">
            <span className="text-sm font-medium hover:text-arc-orange transition-colors cursor-pointer">Arc ↔ Circle</span>
            <span className="text-xs text-arc-muted font-mono mt-1">USDC CCTP</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm font-mono text-arc-green">Online</span>
            <span className="text-xs text-arc-muted font-mono mt-1 transition-colors duration-300">{cctpLatency}ms</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- DashboardCharts ---
const initialTxData = [
  { time: '00:00', volume: 1200 }, { time: '04:00', volume: 2100 },
  { time: '08:00', volume: 1800 }, { time: '12:00', volume: 3400 },
  { time: '16:00', volume: 2900 }, { time: '20:00', volume: 4100 },
  { time: '24:00', volume: 3800 },
];
function DashboardCharts() {
  const [data, setData] = useState(initialTxData);
  const [total, setTotal] = useState(19300);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time data jitter
      setData(prev => {
        const newData = [...prev];
        const lastIndex = newData.length - 1;
        const newVol = Math.max(1000, newData[lastIndex].volume + (Math.random() < 0.5 ? 1 : -1) * Math.floor(Math.random() * 200));
        newData[lastIndex] = { ...newData[lastIndex], volume: newVol };
        return newData;
      });
      setTotal(prev => prev + Math.floor(Math.random() * 5));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-arc-surface border border-arc-border p-5 lg:col-span-2 relative"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-mono text-arc-muted uppercase tracking-wider">Transaction Volume (24h)</h3>
        <span className="text-xl font-mono font-medium text-arc-orange transition-all duration-300">{formatNumber(total)} TX</span>
      </div>
      <div className="w-full mt-4" style={{ height: 250, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF5300" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#FF5300" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="time" stroke="var(--muted-color)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--muted-color)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '4px', color: 'var(--text-color)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
              itemStyle={{ color: '#FF5300', fontFamily: 'JetBrains Mono', fontSize: '14px' }}
              cursor={{ stroke: '#FF5300', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area type="monotone" dataKey="volume" stroke="#FF5300" strokeWidth={2} fillOpacity={1} fill="url(#colorVolume)" isAnimationActive={true} animationDuration={1000} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

// --- EconomicChart ---
function EconomicChart() {
  const chainData = [
    { name: 'Ethereum', cost: 1250.00, color: '#333333' },
    { name: 'Solana', cost: 25.00, color: '#14F195' },
    { name: 'Optimism', cost: 18.50, color: '#FF0420' },
    { name: 'Base', cost: 15.20, color: '#0052FF' },
    { name: 'Arbitrum', cost: 12.50, color: '#28A0F0' },
    { name: 'Polygon', cost: 8.50, color: '#8247E5' },
    { name: 'Arc L3', cost: 0.15, color: '#FF5300' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-[#050505] border border-[#222] p-5 lg:col-span-2 relative overflow-hidden glow-border flex flex-col"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-arc-orange opacity-[0.03] blur-3xl pointer-events-none"></div>
      
      <div className="flex justify-between items-center mb-6 relative z-10 shrink-0">
        <h3 className="text-sm font-mono text-arc-muted uppercase tracking-wider">Cost Comparison (10k Txs)</h3>
        <div className="bg-[#0a0a0a] border border-arc-orange/30 px-3 py-1 flex items-center">
          <TrendingUp className="w-3 h-3 text-arc-orange mr-2" />
          <span className="text-xs font-mono text-arc-orange">99% SAVINGS</span>
        </div>
      </div>
      
      <div className="w-full flex-1 min-h-[250px] relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chainData} layout="vertical" margin={{ top: 0, right: 50, left: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-color)', fontSize: 11, fontFamily: 'JetBrains Mono' }} width={80} />
            <Tooltip 
              cursor={{ fill: 'var(--surface-secondary)' }}
              contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-color)', fontFamily: 'JetBrains Mono', fontSize: '12px' }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']}
            />
            <Bar dataKey="cost" radius={[0, 4, 4, 0]} isAnimationActive={true} animationDuration={1500}>
              {chainData.map((entry, index) => (
                <rect key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

// --- NetworkMarginChart ---
function NetworkMarginChart() {
  const marginData = [
    { day: 'Mon', margin: 15 }, { day: 'Tue', margin: 18 },
    { day: 'Wed', margin: 16 }, { day: 'Thu', margin: 22 },
    { day: 'Fri', margin: 25 }, { day: 'Sat', margin: 24 },
    { day: 'Sun', margin: 27 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-arc-surface border border-arc-border p-5 lg:col-span-1"
    >
      <h3 className="text-sm font-mono text-arc-muted uppercase tracking-wider mb-6">Network Margin %</h3>
      <div className="w-full h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={marginData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="day" stroke="var(--muted-color)" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--muted-color)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-color)' }} />
            <Bar dataKey="margin" fill="#00FF00" radius={[2, 2, 0, 0]} opacity={0.6} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

export function OverviewTab() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-40 bg-arc-surface border border-arc-border" />
          <div className="h-40 bg-arc-surface border border-arc-border" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="h-64 lg:col-span-2 bg-arc-surface border border-arc-border" />
          <div className="h-64 lg:col-span-2 bg-arc-surface border border-arc-border" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">System Overview</h2>
          <p className="text-arc-muted text-sm mt-1">Real-time metrics and network performance.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ArcHealthMonitor />
        <BridgeStatus />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <DashboardCharts />
        <EconomicChart />
        <NetworkMarginChart />
      </div>
    </div>
  );
}
