import { useState, useEffect, useCallback } from 'react';
import { fetchBalances } from '../lib/stellar';
import type { Balance } from '../types';

export function useBalances(address: string | null) {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    const b = await fetchBalances(address);
    setBalances(b);
    setLoading(false);
  }, [address]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { balances, loading, refresh };
}
