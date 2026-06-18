interface Props {
  asset: string;
  size?: 'sm' | 'md' | 'lg';
}

const assetColors: Record<string, { bg: string; text: string; symbol: string }> = {
  XLM: { bg: 'bg-stellar-500/20', text: 'text-stellar-300', symbol: '✦' },
  USDC: { bg: 'bg-blue-500/20', text: 'text-blue-300', symbol: '$' },
};

const sizes = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
};

export default function AssetBadge({ asset, size = 'md' }: Props) {
  const cfg = assetColors[asset] ?? { bg: 'bg-stellar-800/40', text: 'text-stellar-400', symbol: '?' };
  return (
    <div className={`${sizes[size]} ${cfg.bg} ${cfg.text} rounded-full flex items-center justify-center font-display font-bold flex-shrink-0`}>
      {cfg.symbol}
    </div>
  );
}
