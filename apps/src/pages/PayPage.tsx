import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { buildSendTx, submitTx, USDC_ASSET, truncateAddress } from '../lib/stellar';
import AssetBadge from '../components/AssetBadge';
import toast from 'react-hot-toast';
import { CheckCircle } from 'lucide-react';

export default function PayPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { address, isConnected, connect, signTx } = useWallet();
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const to = params.get('to') ?? '';
  const amount = params.get('amount') ?? '';
  const asset = params.get('asset') ?? 'XLM';
  const memo = params.get('memo') ?? '';

  async function handlePay() {
    if (!isConnected) {
      try { await connect(); } catch (e) { return; }
    }
    if (!address) return;
    setLoading(true);
    try {
      const issuer = asset === 'USDC' ? USDC_ASSET.getIssuer() : undefined;
      const xdr = await buildSendTx(address, to, amount, asset, issuer, memo || undefined);
      const signedXdr = await signTx(xdr);
      const result = await submitTx(signedXdr);
      setTxHash(result.hash);
      toast.success('Payment sent!');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Payment failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  if (!to || !amount) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass rounded-2xl p-8 text-center max-w-sm w-full">
          <p className="text-stellar-600 font-body mb-4">Invalid payment link.</p>
          <button onClick={() => navigate('/')} className="btn-primary">Go Home</button>
        </div>
      </div>
    );
  }

  if (txHash) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass glow rounded-2xl p-8 text-center max-w-sm w-full animate-slide-up">
          <CheckCircle size={48} className="text-stellar-400 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-white mb-2">Paid!</h2>
          <p className="text-stellar-600 font-body text-sm mb-4">Your payment was sent.</p>
          <p className="font-mono text-xs text-stellar-700 break-all p-3 bg-ink rounded-xl mb-6">{txHash}</p>
          <a
            href={`https://stellar.expert/explorer/public/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary block"
          >
            View on Explorer
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-stellar-500/8 rounded-full blur-3xl" />

      <div className="glass glow rounded-2xl p-8 max-w-sm w-full animate-slide-up relative z-10">
        {/* Logo */}
        <div className="text-center mb-6">
          <span className="font-display text-stellar-400 text-sm font-semibold uppercase tracking-widest">
            StellarFlow
          </span>
          <h2 className="font-display text-2xl font-bold text-white mt-1">Payment Request</h2>
        </div>

        {/* Amount */}
        <div className="bg-ink rounded-2xl p-5 text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-1">
            <AssetBadge asset={asset} size="lg" />
            <span className="font-display text-4xl font-bold text-white">{amount}</span>
            <span className="font-display text-xl text-stellar-400">{asset}</span>
          </div>
          {memo && (
            <p className="text-stellar-600 text-sm font-body mt-2">"{memo}"</p>
          )}
        </div>

        {/* To */}
        <div className="flex items-center justify-between mb-6 px-1">
          <span className="text-stellar-700 text-sm font-body">To</span>
          <span className="font-mono text-stellar-400 text-sm">{truncateAddress(to)}</span>
        </div>

        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full btn-primary text-lg py-4 disabled:opacity-40"
        >
          {loading ? 'Processing…' : isConnected ? `Pay ${amount} ${asset}` : 'Connect & Pay'}
        </button>

        <p className="text-center text-xs text-stellar-800 mt-4 font-body">
          Powered by Stellar Testnet
        </p>
      </div>
    </div>
  );
}
