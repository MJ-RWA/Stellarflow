import { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { useBalances } from '../hooks/useBalances';
import { getSwapQuote, buildSwapTx, submitTx, USDC_ASSET } from '../lib/stellar';
import type { SwapQuoteResult } from '../lib/stellar';
import AssetBadge from '../components/AssetBadge';
import toast from 'react-hot-toast';
import { ArrowUpDown, Loader2, ArrowRight, CheckCircle, Info } from 'lucide-react';

type AssetCode = 'XLM' | 'USDC';

export default function SwapPage() {
  const { address, signTx } = useWallet();
  const { balances, refresh } = useBalances(address);
  const [fromAsset, setFromAsset] = useState<AssetCode>('XLM');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<SwapQuoteResult | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [swapLoading, setSwapLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const toAsset: AssetCode = fromAsset === 'XLM' ? 'USDC' : 'XLM';
  const fromBalance = balances.find(b => b.assetCode === fromAsset)?.amount ?? '0';

  // Need a trustline for USDC to receive it
  const hasUsdcTrustline = balances.some(b => b.assetCode === 'USDC');
  const swappingToUsdc = toAsset === 'USDC';
  const trustlineWarning = swappingToUsdc && !hasUsdcTrustline;

  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0) { setQuote(null); return; }
    const timeout = setTimeout(async () => {
      setQuoteLoading(true);
      const q = await getSwapQuote(
        fromAsset, toAsset, amount,
        fromAsset === 'USDC' ? USDC_ASSET.getIssuer() : undefined,
        toAsset === 'USDC' ? USDC_ASSET.getIssuer() : undefined
      );
      setQuote(q);
      setQuoteLoading(false);
    }, 600);
    return () => clearTimeout(timeout);
  }, [amount, fromAsset, toAsset]);

  function flipAssets() {
    setFromAsset(toAsset);
    setQuote(null);
    setAmount('');
  }

  async function handleSwap() {
    if (!address || !quote) return;
    setSwapLoading(true);
    try {
      // 1% slippage — format to 7 decimal places (Stellar requires it)
      const minReceive = (parseFloat(quote.toAmount) * 0.99).toFixed(7);

      const xdr = await buildSwapTx(
        address, fromAsset, toAsset, amount, minReceive,
        quote.pathAssets, // real path from Horizon
        fromAsset === 'USDC' ? USDC_ASSET.getIssuer() : undefined,
        toAsset === 'USDC' ? USDC_ASSET.getIssuer() : undefined
      );

      const signedXdr = await signTx(xdr);
      const result = await submitTx(signedXdr);
      setTxHash(result.hash);
      toast.success('Swap complete!');
      refresh();
      setAmount('');
      setQuote(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Swap failed");
      console.error(e);
    } finally {
      setSwapLoading(false);
    }
  }

  if (txHash) {
    return (
      <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto flex flex-col items-center justify-center">
        <div className="glass glow rounded-2xl p-8 text-center w-full animate-slide-up">
          <CheckCircle size={48} className="text-stellar-400 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-white mb-2">Swapped!</h2>
          <p className="font-mono text-xs text-stellar-700 break-all mb-6 p-3 bg-ink rounded-xl">{txHash}</p>
          <a href={`https://stellar.expert/explorer/public/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="btn-primary block mb-3">
            View on Explorer
          </a>
          <button onClick={() => setTxHash(null)} className="text-stellar-600 hover:text-stellar-400 text-sm">
            Swap again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
      <h1 className="font-display text-2xl font-bold text-white mb-8">Swap</h1>

      {/* Trustline warning */}
      {trustlineWarning && (
        <div className="glass border-yellow-500/30 rounded-xl p-3 mb-5 flex gap-2 items-start">
          <Info size={15} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-yellow-300 text-xs font-body">
            You don't have a USDC trustline. Add one in Freighter (Settings → Add Asset → USDC) before swapping to USDC.
          </p>
        </div>
      )}

      {/* From */}
      <div className="glass rounded-2xl p-5 mb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AssetBadge asset={fromAsset} size="sm" />
            <span className="font-display font-semibold text-white">{fromAsset}</span>
          </div>
          <span className="text-stellar-700 text-xs font-mono">Balance: {fromBalance}</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="bg-transparent text-white font-mono text-2xl font-medium flex-1 focus:outline-none placeholder-stellar-800"
            placeholder="0.00"
            type="number"
            min="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
          <button
            onClick={() => setAmount(fromBalance)}
            className="text-xs text-stellar-600 hover:text-stellar-400 border border-border rounded-lg px-2 py-1 transition-colors"
          >
            Max
          </button>
        </div>
      </div>

      {/* Flip button */}
      <div className="flex justify-center my-1 relative z-10">
        <button
          onClick={flipAssets}
          className="glass border-border rounded-full p-2 hover:border-stellar-500 transition-all hover:rotate-180 duration-300"
        >
          <ArrowUpDown size={16} className="text-stellar-400" />
        </button>
      </div>

      {/* To */}
      <div className="glass rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AssetBadge asset={toAsset} size="sm" />
            <span className="font-display font-semibold text-white">{toAsset}</span>
          </div>
          <span className="text-stellar-700 text-xs font-mono">You receive</span>
        </div>
        <div className="flex items-center gap-2">
          {quoteLoading
            ? <Loader2 size={20} className="animate-spin text-stellar-600" />
            : <span className="font-mono text-2xl font-medium text-white">{quote ? quote.toAmount : '0.00'}</span>
          }
        </div>
      </div>

      {/* Quote details */}
      {quote && (
        <div className="glass rounded-xl p-4 mb-6 animate-fade-in text-sm space-y-1.5">
          <div className="flex justify-between text-stellar-600 font-body">
            <span>Rate</span>
            <span className="font-mono text-stellar-400">1 {fromAsset} = {quote.rate} {toAsset}</span>
          </div>
          <div className="flex justify-between text-stellar-600 font-body">
            <span>Min received (1% slippage)</span>
            <span className="font-mono text-stellar-400">{(parseFloat(quote.toAmount) * 0.99).toFixed(4)} {toAsset}</span>
          </div>
          {quote.path.length > 0 && (
            <div className="flex justify-between text-stellar-600 font-body">
              <span>Route</span>
              <span className="text-stellar-400 text-xs">{fromAsset} → {quote.path.join(' → ')} → {toAsset}</span>
            </div>
          )}
          <div className="flex justify-between text-stellar-600 font-body">
            <span>Protocol</span>
            <span className="text-stellar-400">Stellar DEX (on-chain)</span>
          </div>
        </div>
      )}

      <button
        onClick={handleSwap}
        disabled={swapLoading || !quote || !amount || trustlineWarning}
        className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {swapLoading ? 'Signing & swapping…'
          : !amount ? 'Enter amount'
          : quoteLoading ? 'Fetching quote…'
          : !quote ? 'No route found'
          : trustlineWarning ? 'Add USDC trustline first'
          : <><ArrowRight size={16} /> Swap {fromAsset} → {toAsset}</>
        }
      </button>

      <p className="text-center text-xs text-stellar-800 mt-4 font-body">
        Powered by Stellar's on-chain DEX order book
      </p>
    </div>
  );
}
