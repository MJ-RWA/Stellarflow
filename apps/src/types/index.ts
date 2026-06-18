export interface WalletState {
  address: string | null;
  network: string | null;
  isConnected: boolean;
  isConnecting: boolean;
}

export interface Balance {
  asset: string;
  amount: string;
  assetCode: string;
  assetIssuer?: string;
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'swap';
  asset: string;
  amount: string;
  to?: string;
  from?: string;
  date: string;
  status: 'success' | 'pending' | 'failed';
  hash?: string;
}

export interface SwapQuote {
  fromAsset: string;
  toAsset: string;
  fromAmount: string;
  toAmount: string;
  rate: string;
  path: string[];
}

export interface PaymentRequest {
  to: string;
  amount: string;
  asset: string;
  memo?: string;
}

export interface ScheduledPayment {
  id: string;
  label: string;
  destination: string;
  amount: string;
  asset: string;
  assetIssuer?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  nextRun: string; // ISO date string
  lastRun?: string;
  enabled: boolean;
  createdAt: string;
  executionLog: { date: string; hash: string; status: 'success' | 'failed'; error?: string }[];
}
