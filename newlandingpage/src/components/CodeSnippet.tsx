import { motion } from "motion/react";
import { Terminal } from "lucide-react";

const code = `import { GatewayClient } from '@circle-fin/x402-batching/client';

// Connect to Arc L1 via Circle's x402 payment protocol
const gateway = new GatewayClient({
  chain: 'arcTestnet',
  privateKey: process.env.PRIVATE_KEY as Hex,
});

// Pay an AI agent $0.005 for a completed task
const result = await gateway.pay('https://agent.example/research');
console.log(\`Settled: \${result.transaction}\`);

// Check remaining USDC balance in gateway wallet
const balances = await gateway.getBalances();
console.log(\`Available: \${balances.gateway.formattedAvailable}\`);`;

export default function CodeSnippet() {
  return (
    <section className="relative z-10 py-24 px-6">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1">
          <h2 className="text-sm font-mono text-orange-500 uppercase tracking-widest mb-4">One Function Call</h2>
          <h3 className="text-4xl md:text-5xl font-display font-light mb-6 leading-tight">
            Pay agents.<br /><span className="text-white/40">The blockchain handles the rest.</span>
          </h3>
          <p className="text-white/50 text-lg font-light leading-relaxed mb-8">
            One line to pay. Circle's x402 SDK handles identity verification, gasless authorization, batch settlement, and on-chain finality — all on Arc L1 with USDC as native gas.
          </p>
          
          <ul className="space-y-4">
            {["Official Circle x402 SDK (v2.1)", "EIP-3009 gasless transfers", "35,000× cheaper than Ethereum L1", "USDC native gas — no ETH needed"].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-white/70">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex-1 w-full"
        >
          <div className="glass-surface rounded-2xl border border-white/10 overflow-hidden">
            <div className="flex items-center px-4 py-3 bg-white/5 border-b border-white/5">
              <div className="flex gap-2 mr-4">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex items-center gap-2 text-white/30 text-xs font-mono">
                <Terminal className="w-3 h-3" />
                orchestrator.ts
              </div>
            </div>
            <div className="p-6 overflow-x-auto">
              <pre className="text-sm font-mono leading-relaxed">
                <code className="text-white/80">
                  {code.split('\n').map((line, i) => {
                    const replaced = line
                             .replace(/import/g, '<span class="text-pink-400">import</span>')
                             .replace(/from/g, '<span class="text-pink-400">from</span>')
                             .replace(/const/g, '<span class="text-blue-400">const</span>')
                             .replace(/new/g, '<span class="text-blue-400">new</span>')
                             .replace(/await/g, '<span class="text-purple-400">await</span>')
                             .replace(/'[^']*'/g, match => `<span class="text-green-400">${match}</span>`);
                    
                    const finalHtml = replaced.replace(/\/\/.*$/g, match => `<span class="text-white/30 italic">${match}</span>`);

                    return (
                      <motion.div 
                        key={i} 
                        className="table-row"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.4, delay: i * 0.1 }}
                      >
                        <span className="table-cell pr-6 text-white/20 select-none text-right">{i + 1}</span>
                        <span className="table-cell whitespace-pre" dangerouslySetInnerHTML={{ __html: finalHtml }} />
                      </motion.div>
                    );
                  })}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="mt-4 w-2 h-4 bg-orange-500/80 inline-block"
                  />
                </code>
              </pre>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
