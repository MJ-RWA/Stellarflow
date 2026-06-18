import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { generatePaymentLink } from '../lib/stellar';
import AssetBadge from '../components/AssetBadge';
import toast from 'react-hot-toast';
import { Copy, Share2, Link2 } from 'lucide-react';
import QRCode from './QRCode';

const ASSETS = ['XLM', 'USDC'];

export default function RequestPage() {
  const { address } = useWallet();
  const [asset, setAsset] = useState('XLM');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [link, setLink] = useState<string | null>(null);

  function generate() {
    if (!address || !amount) return;
    const url = generatePaymentLink(address, amount, asset, memo || undefined);
    setLink(url);
  }

  function copyLink() {
    if (!link) return;
    navigator.clipboard.writeText(link);
    toast.success('Link copied!');
  }

  async function shareLink() {
    if (!link) return;
    if (navigator.share) {
      await navigator.share({ title: 'StellarFlow Payment Request', url: link });
    } else {
      copyLink();
    }
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
      <h1 className="font-display text-2xl font-bold text-white mb-2">Request Payment</h1>
      <p className="text-stellar-600 font-body text-sm mb-8">
        Generate a shareable link anyone can use to pay you.
      </p>

      {/* Asset */}
      <div className="mb-5">
        <label className="text-stellar-600 text-xs font-display font-600 uppercase tracking-widest block mb-2">
          Asset
        </label>
        <div className="flex gap-3">
          {ASSETS.map(a => (
            <button
              key={a}
              onClick={() => setAsset(a)}
              className={`flex-1 glass rounded-xl p-3 flex items-center gap-2 transition-all ${
                asset === a ? 'border-stellar-500 bg-stellar-500/10' : 'hover:border-stellar-700'
              }`}
            >
              <AssetBadge asset={a} size="sm" />
              <span className="font-display font-semibold text-white text-sm">{a}</span>
            </button>
          ))}
        </div>
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
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stellar-500 font-mono text-sm">
            {asset}
          </span>
        </div>
      </div>

      {/* Memo */}
      <div className="mb-8">
        <label className="text-stellar-600 text-xs font-display font-600 uppercase tracking-widest block mb-2">
          Memo <span className="text-stellar-800 normal-case">(optional)</span>
        </label>
        <input
          className="input-field"
          placeholder="What's this for?"
          value={memo}
          onChange={e => setMemo(e.target.value)}
          maxLength={28}
        />
      </div>

      <button
        onClick={generate}
        disabled={!amount}
        className="w-full btn-primary flex items-center justify-center gap-2 mb-8 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Link2 size={16} />
        Generate Link
      </button>

      {/* Generated link */}
      {link && (
        <div className="glass rounded-2xl p-5 animate-slide-up">
          <p className="text-stellar-600 text-xs font-display font-600 uppercase tracking-widest mb-3">
            Payment Link
          </p>
          <QRCode value={link} />
          <div className="bg-ink rounded-xl p-3 mb-4 break-all">
            <p className="font-mono text-xs text-stellar-400 leading-relaxed">{link}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={copyLink}
              className="flex-1 flex items-center justify-center gap-2 glass rounded-xl py-3 text-stellar-400 hover:border-stellar-500 transition-all text-sm font-display font-semibold"
            >
              <Copy size={14} />
              Copy
            </button>
            <button
              onClick={shareLink}
              className="flex-1 flex items-center justify-center gap-2 btn-primary text-sm py-3"
            >
              <Share2 size={14} />
              Share
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
