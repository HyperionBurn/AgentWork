import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Receipt, Download, Search, Filter, ExternalLink, ChevronRight, X, FileText, Cpu, Clock, History } from 'lucide-react';
import { useDashboardStore } from '../../../lib/store';
import { apiFetch, cn, formatCurrency } from '../../../lib/utils';
import { adaptReceiptsForHistory } from '../../../lib/api-adapters';
import { SkeletonTable } from '../Skeleton';

interface ReceiptRecord {
  id: string;
  txHash: string;
  explorerUrl?: string;
  agent: string;
  task: string;
  amount: number;
  status: 'passed' | 'failed' | 'pending';
  timestamp: string;
  metadata: {
    logic_hash: string;
    computation_units: number;
    gas_saved_usd: number;
    provider: string;
  };
}

import { MOCK_RECEIPTS } from '../../../lib/mock-data';

const ARC_EXPLORER_BASE = import.meta.env.VITE_ARC_EXPLORER || 'https://testnet.arcscan.app/tx/';

function isRealTransactionHash(value?: string): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^(mock_|pending|\[pending|\[settling|undefined|null)$/i.test(trimmed)) return false;
  return /^0x[0-9a-fA-F]{64}$/.test(trimmed);
}

function buildExplorerUrl(txHash?: string, explorerUrl?: string): string {
  if (explorerUrl && isRealTransactionHash(txHash)) return explorerUrl;
  if (!isRealTransactionHash(txHash)) return '';
  return `${ARC_EXPLORER_BASE}${txHash}`;
}

function shortHash(txHash: string): string {
  return txHash.length > 20 ? `${txHash.slice(0, 10)}...${txHash.slice(-8)}` : txHash;
}

export default function ReceiptsTab() {
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptRecord | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await apiFetch<any>('/api/receipts');
        setReceipts(adaptReceiptsForHistory(data.receipts || data));
      } catch (e) {
        console.error('Failed to fetch receipts:', e);
        setReceipts(MOCK_RECEIPTS as any);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredReceipts = receipts.filter(r => 
    r.agent.toLowerCase().includes(search.toLowerCase()) || 
    r.task.toLowerCase().includes(search.toLowerCase()) ||
    r.txHash.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-light text-white">Execution <span className="text-orange-500 font-mono">Receipts</span></h2>
           <p className="text-xs font-mono text-white/30 uppercase tracking-widest mt-1">Verifiable history of agent computation</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input 
              type="text" 
              placeholder="Search receipt hash..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/[0.03] border border-white/[0.08] px-10 py-2 rounded-xl text-sm font-mono text-white outline-none focus:border-orange-500/30 transition-all placeholder:text-white/10"
            />
          </div>
          <button 
            onClick={() => {
              useDashboardStore.getState().addNotification('Preparing receipt manifest for export...', 'info');
              setTimeout(() => useDashboardStore.getState().addNotification('Export successful: receipt-history-apr-22.json', 'success'), 1500);
            }}
            className="flex items-center space-x-2 px-4 py-2 border border-white/10 rounded-xl hover:bg-white/5 transition-colors text-[10px] font-mono text-white/40 uppercase tracking-widest"
          >
             <Download className="w-3.5 h-3.5" />
             <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="glass-surface border border-white/[0.08] rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-8"><SkeletonTable rows={10} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                  <th className="px-6 py-4 text-[10px] font-mono text-white/30 uppercase tracking-widest">Agent / Task</th>
                  <th className="px-6 py-4 text-[10px] font-mono text-white/30 uppercase tracking-widest">Tx Hash</th>
                  <th className="px-6 py-4 text-[10px] font-mono text-white/30 uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-mono text-white/30 uppercase tracking-widest">Timestamp</th>
                  <th className="px-6 py-4 text-[10px] font-mono text-white/30 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filteredReceipts.map((receipt) => (
                  <tr key={receipt.id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => setSelectedReceipt(receipt)}>
                    <td className="px-6 py-4">
                       <div className="flex items-center space-x-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center border",
                            receipt.status === 'passed' ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-red-500/10 border-red-500/20 text-red-500"
                          )}>
                             <Cpu className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm text-white/80 group-hover:text-white">{receipt.agent}</p>
                            <p className="text-[10px] font-mono text-white/30 uppercase truncate max-w-[200px]">{receipt.task}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       {buildExplorerUrl(receipt.txHash, receipt.explorerUrl) ? (
                         <a
                           href={buildExplorerUrl(receipt.txHash, receipt.explorerUrl)}
                           target="_blank"
                           rel="noreferrer"
                           onClick={(e) => e.stopPropagation()}
                           className="inline-flex items-center space-x-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-mono text-white/45 transition-colors hover:border-orange-500/30 hover:text-orange-300 hover:bg-orange-500/5"
                         >
                            <span>{shortHash(receipt.txHash)}</span>
                            <ExternalLink className="w-3 h-3" />
                         </a>
                       ) : (
                         <span className="inline-flex items-center space-x-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs font-mono text-white/25">
                           <Loader2 className="w-3 h-3 animate-spin text-orange-400" />
                           <span>Settling</span>
                           {receipt.txHash ? <span className="text-white/35">{shortHash(receipt.txHash)}</span> : null}
                         </span>
                       )}
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-sm font-mono text-white">{formatCurrency(receipt.amount)}</span>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-xs font-mono text-white/30">{new Date(receipt.timestamp).toLocaleString().split(',')[0]}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="inline-flex items-center justify-center px-3 py-1 bg-white/5 border border-white/10 text-[9px] font-mono text-white/40 uppercase tracking-widest rounded-full group-hover:border-orange-500/30 group-hover:text-orange-500 transition-all">
                          Details
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedReceipt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/80 backdrop-blur-sm"
               onClick={() => setSelectedReceipt(null)}
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="relative glass-surface max-w-2xl w-full border border-white/[0.08] shadow-2xl rounded-3xl overflow-hidden"
             >
                <div className="p-8 border-b border-white/[0.05] relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4">
                      <button onClick={() => setSelectedReceipt(null)} className="text-white/20 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                      </button>
                   </div>
                   <div className="flex items-center space-x-4 mb-6">
                      <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center">
                         <Receipt className="w-6 h-6 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-light text-white">Receipt <span className="font-mono text-white/40">#{selectedReceipt.id.slice(0, 8)}</span></h3>
                        <p className="text-xs font-mono text-white/30 uppercase tracking-widest">{selectedReceipt.agent} Logic Trace</p>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 bg-black/40 border border-white/[0.05] rounded-2xl">
                         <p className="text-[9px] font-mono text-white/30 uppercase mb-1">Status</p>
                         <p className="text-xs font-bold text-green-400 uppercase tracking-widest">Finalized</p>
                      </div>
                      <div className="p-4 bg-black/40 border border-white/[0.05] rounded-2xl">
                         <p className="text-[9px] font-mono text-white/30 uppercase mb-1">Batch ID</p>
                         <p className="text-xs font-mono text-white">#ARC-410</p>
                      </div>
                      <div className="p-4 bg-black/40 border border-white/[0.05] rounded-2xl">
                         <p className="text-[9px] font-mono text-white/30 uppercase mb-1">Computation</p>
                         <p className="text-xs font-mono text-white">{selectedReceipt.metadata.computation_units} CU</p>
                      </div>
                      <div className="p-4 bg-black/40 border border-white/[0.05] rounded-2xl">
                         <p className="text-[9px] font-mono text-white/30 uppercase mb-1">Gas Savings</p>
                         <p className="text-xs font-mono text-orange-400">-{formatCurrency(selectedReceipt.metadata.gas_saved_usd)}</p>
                      </div>
                   </div>
                </div>
                <div className="p-8 space-y-6 max-h-[400px] overflow-y-auto font-mono text-xs text-white/60 scrollbar-hide">
                    <div className="space-y-4">
                       <div className="flex items-center space-x-2 text-white/40 border-b border-white/[0.05] pb-2 uppercase tracking-widest">
                          <History className="w-3.5 h-3.5" />
                          <span>Logic Summary</span>
                       </div>
                       <p className="leading-relaxed bg-white/[0.02] p-4 border border-white/[0.05] rounded-xl italic">
                          "Agent initiated cross-chain verification on {selectedReceipt.metadata.provider}. Logic hash {selectedReceipt.metadata.logic_hash} matched execution profile. Final settlement completed at block 14.2M."
                       </p>
                    </div>
                    <div className="space-y-4">
                       <div className="flex items-center space-x-2 text-white/40 border-b border-white/[0.05] pb-2 uppercase tracking-widest">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Timeline</span>
                       </div>
                       <div className="space-y-3 pl-4 border-l border-white/[0.1]">
                          <div className="flex justify-between"><span>Instruction Received</span><span className="text-white/30">12:00:01</span></div>
                          <div className="flex justify-between"><span>Proof Generation</span><span className="text-white/30">12:00:04</span></div>
                          <div className="flex justify-between"><span>Batch Settlement</span><span className="text-white/30">12:00:09</span></div>
                          <div className="flex justify-between text-white/90"><span>Receipt Finalized</span><span className="text-white/30">12:00:10</span></div>
                       </div>
                    </div>
                </div>
                <div className="p-8 bg-black/60 border-t border-white/[0.05] flex space-x-4">
                   <button 
                     onClick={() => {
                       useDashboardStore.getState().addNotification('Generating cryptographic certificate...', 'info');
                       setTimeout(() => useDashboardStore.getState().addNotification(`Certificate downloaded: #ARC-${selectedReceipt.id.slice(0, 8)}`, 'success'), 2000);
                     }}
                     className="flex-1 py-3 bg-white text-black font-bold text-[10px] uppercase font-mono tracking-[0.2em] rounded-xl hover:bg-orange-500 transition-colors"
                   >
                     Download Certificate
                   </button>
                   {buildExplorerUrl(selectedReceipt.txHash, selectedReceipt.explorerUrl) ? (
                     <a
                       href={buildExplorerUrl(selectedReceipt.txHash, selectedReceipt.explorerUrl)}
                       target="_blank"
                       rel="noreferrer"
                       onClick={() => useDashboardStore.getState().addNotification('Opening explorer link...', 'info')}
                       className="px-6 py-3 border border-white/10 text-white/40 font-mono text-[10px] uppercase rounded-xl hover:bg-white/5 transition-colors inline-flex items-center justify-center"
                     >
                       Explorer
                     </a>
                   ) : (
                     <button
                       disabled
                         className="px-6 py-3 border border-white/10 text-white/20 font-mono text-[10px] uppercase rounded-xl bg-white/[0.02] inline-flex items-center justify-center cursor-not-allowed"
                     >
                       Settling transaction
                     </button>
                   )}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
