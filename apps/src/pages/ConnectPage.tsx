import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import toast from 'react-hot-toast';
import { ExternalLink, AlertTriangle } from 'lucide-react';

export default function ConnectPage() {
  const { connect, isConnecting } = useWallet();
  const navigate = useNavigate();
  const [noFreighter, setNoFreighter] = useState(false);

  async function handleConnect() {
    setNoFreighter(false);
    try {
      await connect();
      navigate('/dashboard');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to connect';
      if (msg.toLowerCase().includes('freighter extension not found')) {
        setNoFreighter(true);
      } else {
        toast.error(msg);
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-stellar-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-stellar-700/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full animate-slide-up">
        {/* Logo mark */}
        <div className="w-20 h-20 rounded-2xl bg-stellar-500/15 border border-stellar-500/30 flex items-center justify-center mb-8 glow animate-float">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M20 4L36 20L20 36L4 20L20 4Z" stroke="#47b8c8" strokeWidth="1.5" fill="none" />
            <path d="M20 10L30 20L20 30L10 20L20 10Z" fill="#2b9bae" opacity="0.4" />
            <circle cx="20" cy="20" r="3" fill="#82d3de" />
          </svg>
        </div>

        <h1 className="font-display text-4xl font-bold text-white mb-2 tracking-tight">
          StellarFlow
        </h1>
        <p className="text-stellar-600 font-body text-center mb-2 leading-relaxed">
          Send, receive, and swap XLM & USDC
          <br />on the Stellar network.
        </p>
        <div className="text-xs text-stellar-700 font-mono mb-12 px-3 py-1 rounded-full border border-border">
          TESTNET
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          {['Send XLM & USDC', 'Swap Assets', 'Payment Links', 'Freighter Wallet'].map(f => (
            <span key={f} className="text-xs px-3 py-1 rounded-full bg-card border border-border text-stellar-400 font-body">
              {f}
            </span>
          ))}
        </div>

        {/* No Freighter warning */}
        {noFreighter && (
          <div className="w-full mb-6 glass border-yellow-500/30 rounded-xl p-4 flex gap-3 items-start animate-fade-in">
            <AlertTriangle size={18} className="text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-300 text-sm font-display font-semibold mb-1">
                Freighter not detected
              </p>
              <p className="text-yellow-600 text-xs font-body mb-2">
                You need the Freighter browser extension to use StellarFlow.
              </p>
              <a
                href="https://freighter.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-yellow-400 hover:text-yellow-300 font-display font-semibold underline"
              >
                Install Freighter <ExternalLink size={11} />
              </a>
              <span className="text-yellow-700 text-xs font-body ml-2">
                then refresh this page.
              </span>
            </div>
          </div>
        )}

        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full btn-primary text-center font-display text-lg py-4 relative overflow-hidden group"
        >
          <span className="relative z-10">
            {isConnecting ? 'Waiting for Freighter…' : 'Connect Freighter'}
          </span>
          <div className="absolute inset-0 bg-stellar-400/20 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
        </button>

        <p className="mt-6 text-xs text-stellar-800 font-body text-center">
          Don't have Freighter?{' '}
          <a
            href="https://freighter.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-stellar-500 hover:text-stellar-400 underline"
          >
            Install it here
          </a>
          {' '}· Switch to Testnet in Freighter settings.
        </p>
      </div>
    </div>
  );
}
