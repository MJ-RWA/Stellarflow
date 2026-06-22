import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { useBalances } from '../hooks/useBalances';
import { buildSendTx, submitTx, USDC_ASSET } from '../lib/stellar';
import AssetBadge from '../components/AssetBadge';
import toast from 'react-hot-toast';
import { CheckCircle, ArrowRight } from 'lucide-react';
import {AddressInput} from '../components/AddressInput'

const ASSETS = [
  { code: 'XLM', label: 'Stellar Lumens' },
  { code: 'USDC', label: 'USD Coin', issuer: USDC_ASSET.getIssuer() },
];

export default function SendPage() {
  const { address, signTx } = useWallet();
  const { balances, refresh } = useBalances(address);
  const [asset, setAsset] = useState('XLM');
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const selectedAsset = ASSETS.find(a => a.code === asset)!;
  const balance = balances.find(b => b.assetCode === asset)?.amount ?? '0';

  async function handleSend() {
    if (!address || !destination || !amount) return;
    setLoading(true);
    try {
      const xdr = await buildSendTx(
        address,
        destination,
        amount,
        selectedAsset.code,
        selectedAsset.issuer,
        memo || undefined
      );
      const signedXdr = await signTx(xdr);
      const result = await submitTx(signedXdr);
      setTxHash(result.hash);
      toast.success('Transaction sent!');
      refresh();
      setDestination('');
      setAmount('');
      setMemo('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Transaction failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  if (txHash) {
    return (
      <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto flex flex-col items-center justify-center">
        <div className="glass glow rounded-2xl p-8 text-center w-full animate-slide-up">
          <CheckCircle size={48} className="text-stellar-400 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-white mb-2">Sent!</h2>
          <p className="text-stellar-600 font-body text-sm mb-6">Your transaction was submitted.</p>
          <p className="font-mono text-xs text-stellar-700 break-all mb-6 p-3 bg-ink rounded-xl">{txHash}</p>
          <a
            href={`https://stellar.expert/explorer/public/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary block mb-3"
          >
            View on Explorer
          </a>
          <button onClick={() => setTxHash(null)} className="text-stellar-600 hover:text-stellar-400 text-sm">
            Send another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
      <h1 className="font-display text-2xl font-bold text-white mb-8">Send</h1>

      {/* Asset selector */}
      <div className="mb-5">
        <label className="text-stellar-600 text-xs font-display font-600 uppercase tracking-widest block mb-2">
          Asset
        </label>
        <div className="flex gap-3">
          {ASSETS.map(a => (
            <button
              key={a.code}
              onClick={() => setAsset(a.code)}
              className={`flex-1 glass rounded-xl p-3 flex items-center gap-2 transition-all ${
                asset === a.code ? 'border-stellar-500 bg-stellar-500/10' : 'hover:border-stellar-700'
              }`}
            >
              <AssetBadge asset={a.code} size="sm" />
              <div className="text-left">
                <p className="font-display font-semibold text-white text-sm">{a.code}</p>
                <p className="text-stellar-700 text-xs">{a.label}</p>
              </div>
            </button>
          ))}
        </div>
        <p className="text-stellar-700 text-xs font-mono mt-2 text-right">
          Balance: {balance} {asset}
        </p>
      </div>

      {/* Destination */}
      <div className="mb-4">
        <label className="text-stellar-600 text-xs font-display font-600 uppercase tracking-widest block mb-2">
          Destination Address
        </label>
        <AddressInput
          value={destination}
          onChange={setDestination}
          placeholder="G..."
          className="font-mono text-sm"
        />
      </div>

      {/* Amount */}
      <div className="mb-4">
        <label className="text-stellar-600 text-xs font-display font-600 uppercase tracking-widest block mb-2">
          Amount
        </label>
        <div className="relative">
          <input
            className="input-field pr-20"
            placeholder="0.00"
            type="number"
            min="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stellar-500 font-mono text-sm font-medium">
            {asset}
          </span>
        </div>
        <button
          onClick={() => setAmount(balance)}
          className="text-stellar-600 hover:text-stellar-400 text-xs mt-1 float-right transition-colors"
        >
          Max
        </button>
      </div>

      {/* Memo */}
      <div className="mb-8 clear-both">
        <label className="text-stellar-600 text-xs font-display font-600 uppercase tracking-widest block mb-2">
          Memo <span className="text-stellar-800 normal-case">(optional)</span>
        </label>
        <input
          className="input-field"
          placeholder="Payment note..."
          value={memo}
          onChange={e => setMemo(e.target.value)}
          maxLength={28}
        />
      </div>

      <button
        onClick={handleSend}
        disabled={loading || !destination || !amount}
        className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Signing & sending…' : <>Send {asset} <ArrowRight size={16} /></>}
      </button>
    </div>
  );
}
