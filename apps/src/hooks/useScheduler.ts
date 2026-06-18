import { useState, useEffect, useCallback } from 'react';
import { getScheduled, updateScheduled, getNextRun, isDue } from '../lib/scheduler';
import { buildSendTx, submitTx } from '../lib/stellar';
import type { ScheduledPayment } from '../types';

export function useScheduler(
  address: string | null,
  signTx: (xdr: string) => Promise<string>
) {
  const [payments, setPayments] = useState<ScheduledPayment[]>([]);
  const [running, setRunning] = useState<string | null>(null); // id currently executing

  const refresh = useCallback(() => setPayments(getScheduled()), []);

  useEffect(() => { refresh(); }, [refresh]);

  // Check and execute due payments on load and every 60s
  useEffect(() => {
    if (!address) return;

    async function runDue() {
      const all = getScheduled();
      const due = all.filter(isDue);
      for (const p of due) {
        setRunning(p.id);
        try {
          const xdr = await buildSendTx(address!, p.destination, p.amount, p.asset, p.assetIssuer);
          const signed = await signTx(xdr);
          const result = await submitTx(signed);
          updateScheduled(p.id, {
            lastRun: new Date().toISOString(),
            nextRun: getNextRun(p.frequency),
            executionLog: [
              { date: new Date().toISOString(), hash: result.hash, status: 'success' },
              ...p.executionLog.slice(0, 9),
            ],
          });
        } catch (e) {
          updateScheduled(p.id, {
            lastRun: new Date().toISOString(),
            nextRun: getNextRun(p.frequency),
            executionLog: [
              { date: new Date().toISOString(), hash: '', status: 'failed', error: e instanceof Error ? e.message : 'Unknown' },
              ...p.executionLog.slice(0, 9),
            ],
          });
        } finally {
          setRunning(null);
        }
      }
      refresh();
    }

    runDue();
    const interval = setInterval(runDue, 60_000);
    return () => clearInterval(interval);
  }, [address, signTx, refresh]);

  return { payments, refresh, running };
}
