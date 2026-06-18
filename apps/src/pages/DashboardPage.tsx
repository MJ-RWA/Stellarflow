import { useWallet } from '../context/WalletContext';
import { useBalances } from '../hooks/useBalances';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, LogOut, Copy, ExternalLink } from 'lucide-react';
import AssetBadge from '../components/AssetBadge';
import { truncateAddress } from '../lib/stellar';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { address, disconnect } = useWallet();
  const { balances, loading, refresh } = useBalances(address);
  const navigate = useNavigate();

  function copyAddress() {
    if (!address) return;
    navigator.clipboard.writeText(address);
    toast.success('Address copied!');
  }

  function handleDisconnect() {
    disconnect();
    navigate('/');
  }

  const totalXlm = balances.find(b => b.assetCode === 'XLM')?.amount ?? '0';

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Portfolio</h1>
          <button
            onClick={copyAddress}
            className="flex items-center gap-1.5 text-stellar-600 hover:text-stellar-400 text-sm font-mono mt-0.5 transition-colors"
          >
            {address ? truncateAddress(address) : '—'}
            <Copy size={12} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="p-2 rounded-xl border border-border hover:border-stellar-500 transition-colors text-stellar-600 hover:text-stellar-400"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleDisconnect}
            className="p-2 rounded-xl border border-border hover:border-red-500/50 transition-colors text-stellar-600 hover:text-red-400"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Total balance hero */}
      <div className="glass glow rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-stellar-500/5 rounded-full blur-2xl" />
        <p className="text-stellar-600 font-body text-sm mb-1">Total XLM Balance</p>
        <div className="flex items-end gap-2">
          <span className="font-display text-5xl font-bold text-white">
            {loading ? '···' : parseFloat(totalXlm).toFixed(2)}
          </span>
          <span className="text-stellar-400 font-display text-xl mb-1">XLM</span>
        </div>
        <a
          href={`https://stellar.expert/explorer/public/account/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-stellar-700 hover:text-stellar-400 mt-3 transition-colors"
        >
          View on Stellar Expert <ExternalLink size={10} />
        </a>
      </div>

      {/* Asset list */}
      <div className="mb-6">
        <h2 className="font-display text-sm font-600 text-stellar-600 uppercase tracking-widest mb-3">
          Assets
        </h2>
        {loading && balances.length === 0 ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="glass rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-stellar-800/40 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-stellar-800/40 rounded w-16 mb-1" />
                    <div className="h-3 bg-stellar-800/30 rounded w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : balances.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center text-stellar-700 font-body text-sm">
            No assets found. Fund your testnet account at{' '}
            <a href="https://friendbot.stellar.org" target="_blank" rel="noopener noreferrer" className="text-stellar-500 underline">
              Friendbot
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {balances.map(b => (
              <div key={b.asset} className="glass rounded-xl p-4 flex items-center justify-between hover:border-stellar-500/30 transition-colors cursor-default">
                <div className="flex items-center gap-3">
                  <AssetBadge asset={b.assetCode} />
                  <div>
                    <p className="font-display font-semibold text-white text-sm">{b.assetCode}</p>
                    <p className="text-stellar-700 text-xs font-body">
                      {b.assetCode === 'XLM' ? 'Stellar Lumens' : 'USD Coin'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-white text-sm font-medium">{b.amount}</p>
                  <p className="text-stellar-700 text-xs font-body">{b.assetCode}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Send', path: '/send', emoji: '↗' },
          { label: 'Swap', path: '/swap', emoji: '⇄' },
          { label: 'Request', path: '/request', emoji: '⟵' },
        ].map(a => (
          <button
            key={a.path}
            onClick={() => navigate(a.path)}
            className="glass rounded-xl p-4 flex flex-col items-center gap-2 hover:border-stellar-500/40 transition-all active:scale-95"
          >
            <span className="text-stellar-400 text-xl font-mono">{a.emoji}</span>
            <span className="text-xs font-display font-semibold text-stellar-500">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
