import { createClient } from '@supabase/supabase-js';

const ARC_EXPLORER_BASE = import.meta.env.VITE_ARC_EXPLORER || 'https://testnet.arcscan.app/tx/';

function isExplorerReference(value?: string): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^(mock_|pending|\[pending|\[settling|undefined|null)$/i.test(trimmed)) return false;
  return true;
}

export interface TaskEvent {
  id: string;
  task_id: string;
  agent_type: string;
  status: string;
  gateway_tx?: string;
  explorer_url?: string;
  amount?: string;
  result?: string;
  created_at: string;
}

// Lazy Supabase client initialization
let supabase: any = null;

const getSupabase = () => {
  if (!supabase) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (url && key) {
      supabase = createClient(url, key);
    }
  }
  return supabase;
};

export function subscribeToTasks(onEvent: (event: any) => void) {
  const client = getSupabase();
  if (!client) {
    console.warn('Supabase URL or Key missing. Real-time updates disabled.');
    return () => {};
  }

  const channelId = `task_events_${Math.random().toString(36).substring(7)}`;
  const channel = client
    .channel(channelId)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'task_events' }, (payload: any) => {
      const newEvent = payload.new as TaskEvent;
      // Parse result if it's a JSON string
      let parsedResult = newEvent.result;
      try {
        if (newEvent.result && typeof newEvent.result === 'string' && (newEvent.result.startsWith('{') || newEvent.result.startsWith('['))) {
          parsedResult = JSON.parse(newEvent.result);
        }
      } catch (e) {
        // Keep original if parse fails
      }
      const parsedObject = parsedResult && typeof parsedResult === 'object'
        ? parsedResult as Record<string, unknown>
        : null;
      
      onEvent({
        id: newEvent.id,
        type: newEvent.agent_type || 'unknown',
        status: newEvent.status,
        message: parsedObject
          ? (typeof parsedObject.summary === 'string'
            ? parsedObject.summary
            : typeof parsedObject.reasoning === 'string'
              ? parsedObject.reasoning
              : typeof parsedObject.type === 'string'
                ? parsedObject.type
                : JSON.stringify(parsedObject).slice(0, 200))
          : (newEvent.result || ''),
        rawResult: parsedResult,
        amount: newEvent.amount ? parseFloat(newEvent.amount.replace(/[^0-9.-]+/g,"")) : 0,
        timestamp: newEvent.created_at,
        agent: newEvent.agent_type,
        txHash: newEvent.gateway_tx,
        explorerUrl: isExplorerReference(newEvent.gateway_tx) ? `${ARC_EXPLORER_BASE}${newEvent.gateway_tx}` : undefined
      });
    })
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
