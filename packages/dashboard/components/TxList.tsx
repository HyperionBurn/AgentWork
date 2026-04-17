interface TxEntry {
  id: string;
  gateway_tx: string;
  amount: string;
  endpoint: string;
  created_at: string;
}

interface TxListProps {
  transactions: TxEntry[];
}

export default function TxList({ transactions }: TxListProps) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
        On-Chain Transactions
      </h2>
      <div className="bg-arc-card border border-arc-border rounded-xl overflow-hidden">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Transactions will appear here as agents process tasks.
          </div>
        ) : (
          <div className="divide-y divide-arc-border max-h-[300px] overflow-y-auto">
            {transactions.map((tx) => {
              const isMock = tx.gateway_tx.startsWith("MOCK_");
              const displayHash = isMock
                ? `${tx.gateway_tx.slice(0, 15)}...`
                : `${tx.gateway_tx.slice(0, 10)}...${tx.gateway_tx.slice(-8)}`;
              const formatAmount = (a: string) => a.startsWith("$") ? a : `$${a}`;
              return (
                <div
                  key={tx.id}
                  className="px-4 py-3 flex items-center justify-between hover:bg-arc-dark/50 transition-colors animate-fade-in"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-arc-purple/20 flex items-center justify-center">
                      <span className="text-xs">{isMock ? "⚡" : "🔗"}</span>
                    </div>
                    <div>
                      <p className="text-sm font-mono text-slate-300">
                        {displayHash}
                        {isMock && <span className="text-xs text-slate-500 ml-2">simulated</span>}
                      </p>
                      <p className="text-xs text-slate-500">
                        {tx.endpoint} ·{" "}
                        {new Date(tx.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-400">
                      {formatAmount(tx.amount)}
                    </p>
                    {tx.gateway_tx && !isMock && (
                      <a
                        href={`https://testnet.arcscan.io/tx/${tx.gateway_tx}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-arc-purple hover:underline"
                      >
                        ArcScan ↗
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
