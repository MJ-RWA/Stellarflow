import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { useScheduler } from '../hooks/useScheduler';
import {
  addScheduled, deleteScheduled, updateScheduled,
  getNextRun, formatFrequency, formatNextRun,
} from '../lib/scheduler';
import { USDC_ASSET } from '../lib/stellar';
import AssetBadge from '../components/AssetBadge';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, Pause, Play, Clock, CheckCircle,
  XCircle, ChevronDown, ChevronUp, Loader2,
} from 'lucide-react';
import type { ScheduledPayment } from '../types';

const FREQUENCIES: ScheduledPayment['frequency'][] = ['daily', 'weekly', 'monthly'];
const ASSETS = ['XLM', 'USDC'];

export default function SchedulePage() {
  const { address, signTx } = useWallet();
  const { payments, refresh, running } = useScheduler(address, signTx);

  const [showForm, setShowForm] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Form state
  const [label, setLabel] = useState('');
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('XLM');
  const [frequency, setFrequency] = useState<ScheduledPayment['frequency']>('weekly');

  function handleCreate() {
    if (!destination || !amount || !label) {
      toast.error('Fill in all fields');
      return;
    }
    addScheduled({
      label,
      destination,
      amount,
      asset,
      assetIssuer: asset === 'USDC' ? USDC_ASSET.getIssuer() : undefined,
      frequency,
      nextRun: new Date().toISOString(), // first run: now (will execute on next check)
      enabled: true,
    });
    toast.success('Scheduled payment created');
    setLabel(''); setDestination(''); setAmount('');
    setShowForm(false);
    refresh();
  }

  function handleDelete(id: string) {
    deleteScheduled(id);
    toast('Payment removed', { icon: '🗑️' });
    refresh();
  }

  function handleToggle(p: ScheduledPayment) {
    updateScheduled(p.id, {
      enabled: !p.enabled,
      nextRun: !p.enabled ? getNextRun(p.frequency) : p.nextRun,
    });
    refresh();
  }

  const hasDue = payments.some(p => p.enabled && new Date(p.nextRun) <= new Date());

  return (
    <div className="min-h-screen pb-28 px-4 pt-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Recurring</h1>
          <p className="text-stellar-600 text-xs font-body mt-0.5">Auto-payments on Stellar</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 bg-stellar-500/15 border border-stellar-500/30 text-stellar-400 hover:bg-stellar-500/25 rounded-xl px-3 py-2 text-sm font-display font-semibold transition-all"
        >
          <Plus size={15} /> New
        </button>
      </div>

      {hasDue && running && (
        <div className="glass border-stellar-500/30 rounded-xl p-3 mb-4 flex items-center gap-2 animate-fade-in">
          <Loader2 size={14} className="animate-spin text-stellar-400" />
          <p className="text-stellar-400 text-xs font-body">Executing scheduled payment…</p>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="glass rounded-2xl p-5 mb-6 animate-slide-up">
          <h2 className="font-display font-semibold text-white mb-4">New Scheduled Payment</h2>

          <div className="space-y-3">
            <div>
              <label className="text-stellar-600 text-xs font-display uppercase tracking-widest block mb-1">Label</label>
              <input className="input-field" placeholder="e.g. Weekly savings" value={label} onChange={e => setLabel(e.target.value)} />
            </div>

            <div>
              <label className="text-stellar-600 text-xs font-display uppercase tracking-widest block mb-1">To Address</label>
              <input className="input-field font-mono text-sm" placeholder="G..." value={destination} onChange={e => setDestination(e.target.value)} />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-stellar-600 text-xs font-display uppercase tracking-widest block mb-1">Amount</label>
                <input className="input-field" placeholder="0.00" type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              <div className="w-28">
                <label className="text-stellar-600 text-xs font-display uppercase tracking-widest block mb-1">Asset</label>
                <select
                  className="input-field"
                  value={asset}
                  onChange={e => setAsset(e.target.value)}
                >
                  {ASSETS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-stellar-600 text-xs font-display uppercase tracking-widest block mb-1">Frequency</label>
              <div className="flex gap-2">
                {FREQUENCIES.map(f => (
                  <button
                    key={f}
                    onClick={() => setFrequency(f)}
                    className={`flex-1 py-2 rounded-xl text-xs font-display font-semibold transition-all ${
                      frequency === f
                        ? 'bg-stellar-500/20 border border-stellar-500 text-stellar-300'
                        : 'glass text-stellar-600 hover:text-stellar-400'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={() => setShowForm(false)} className="flex-1 glass rounded-xl py-3 text-stellar-600 text-sm hover:text-stellar-400 transition-colors">
              Cancel
            </button>
            <button onClick={handleCreate} className="flex-1 btn-primary py-3 text-sm">
              Schedule
            </button>
          </div>
        </div>
      )}

      {/* Payment list */}
      {payments.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center mt-8">
          <Clock size={32} className="text-stellar-700 mx-auto mb-3" />
          <p className="font-display font-semibold text-stellar-600 mb-1">No scheduled payments</p>
          <p className="text-stellar-800 text-xs font-body">Create one to automate recurring XLM or USDC transfers.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map(p => {
            const isRunning = running === p.id;
            const due = p.enabled && new Date(p.nextRun) <= new Date();
            return (
              <div key={p.id} className={`glass rounded-2xl p-4 transition-all ${!p.enabled ? 'opacity-60' : ''} ${due ? 'border-stellar-500/40' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <AssetBadge asset={p.asset} size="sm" />
                    <div className="min-w-0">
                      <p className="font-display font-semibold text-white text-sm truncate">{p.label}</p>
                      <p className="font-mono text-stellar-600 text-xs truncate">
                        {p.amount} {p.asset} · {formatFrequency(p.frequency)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isRunning && <Loader2 size={14} className="animate-spin text-stellar-400" />}
                    <button
                      onClick={() => handleToggle(p)}
                      className="p-1.5 rounded-lg glass hover:border-stellar-500 transition-colors text-stellar-600 hover:text-stellar-400"
                      title={p.enabled ? 'Pause' : 'Resume'}
                    >
                      {p.enabled ? <Pause size={13} /> : <Play size={13} />}
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 rounded-lg glass hover:border-red-500/50 transition-colors text-stellar-600 hover:text-red-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Next run */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    <Clock size={11} className="text-stellar-700" />
                    <span className="text-stellar-700 text-xs font-body">
                      Next: <span className={due ? 'text-stellar-400' : 'text-stellar-600'}>{formatNextRun(p.nextRun)}</span>
                    </span>
                  </div>

                  {p.executionLog.length > 0 && (
                    <button
                      onClick={() => setExpandedLog(expandedLog === p.id ? null : p.id)}
                      className="flex items-center gap-1 text-stellar-700 hover:text-stellar-400 text-xs transition-colors"
                    >
                      {p.executionLog.length} runs
                      {expandedLog === p.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                  )}
                </div>

                {/* Execution log */}
                {expandedLog === p.id && p.executionLog.length > 0 && (
                  <div className="mt-3 space-y-1.5 animate-fade-in">
                    {p.executionLog.map((log, i) => (
                      <div key={i} className="flex items-center justify-between bg-ink rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          {log.status === 'success'
                            ? <CheckCircle size={12} className="text-stellar-400" />
                            : <XCircle size={12} className="text-red-400" />
                          }
                          <span className="text-stellar-700 text-xs font-mono">
                            {new Date(log.date).toLocaleDateString()}
                          </span>
                          {log.error && <span className="text-red-400 text-xs truncate max-w-[120px]">{log.error}</span>}
                        </div>
                        {log.hash && (
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${log.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-stellar-600 hover:text-stellar-400 text-xs font-mono underline"
                          >
                            {log.hash.slice(0, 8)}…
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info callout */}
      <div className="glass rounded-xl p-4 mt-6 border-stellar-800/30">
        <p className="text-stellar-700 text-xs font-body leading-relaxed">
          <span className="text-stellar-500 font-display font-semibold">How it works: </span>
          Payments execute automatically when the app is open and the scheduled time arrives. Each payment prompts Freighter to sign. Freighter doesn't support this natively — this is a StellarFlow-exclusive feature.
        </p>
      </div>
    </div>
  );
}
