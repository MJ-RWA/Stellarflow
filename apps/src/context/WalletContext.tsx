import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import {
  isConnected,
  isAllowed,
  requestAccess,
  getAddress,
  getNetwork,
  signTransaction,
} from '@stellar/freighter-api';
import type { WalletState } from '../types';

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  signTx: (xdr: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    network: null,
    isConnected: false,
    isConnecting: false,
  });

  const connect = useCallback(async () => {
    setWallet(w => ({ ...w, isConnecting: true }));
    try {
      // 1. Check extension is installed
      const connectedResult = await isConnected();
      if (!connectedResult.isConnected) {
        throw new Error(
          'Freighter extension not found. Install it at freighter.app and refresh.'
        );
      }

      // 2. Check if this site already has permission
      const allowedResult = await isAllowed();

      let address: string;

      if (!allowedResult.isAllowed) {
        // 3a. Not yet allowed — trigger the Freighter popup
        const accessResult = await requestAccess();
        if (accessResult.error) {
          throw new Error(`Access denied: ${accessResult.error}`);
        }
        if (!accessResult.address) {
          throw new Error('No address returned. Did you reject the Freighter popup?');
        }
        address = accessResult.address;
      } else {
        // 3b. Already allowed — just fetch address silently
        const addrResult = await getAddress();
        if (addrResult.error) {
          throw new Error(addrResult.error);
        }
        if (!addrResult.address) {
          throw new Error('Could not retrieve address. Try reconnecting Freighter.');
        }
        address = addrResult.address;
      }

      // 4. Fetch active network
      const networkResult = await getNetwork();
      if (networkResult.error) {
        throw new Error(networkResult.error);
      }

      setWallet({
        address,
        network: networkResult.network,
        isConnected: true,
        isConnecting: false,
      });
    } catch (e) {
      setWallet(w => ({ ...w, isConnecting: false }));
      throw e;
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet({ address: null, network: null, isConnected: false, isConnecting: false });
  }, []);

  const signTx = useCallback(async (xdr: string): Promise<string> => {
    const result = await signTransaction(xdr, {
      networkPassphrase: 'Test SDF Network ; September 2015',
    });
    if (result.error) throw new Error(result.error);
    return result.signedTxXdr;
  }, []);

  return (
    <WalletContext.Provider value={{ ...wallet, connect, disconnect, signTx }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
