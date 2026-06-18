import { useEffect, useRef } from 'react';

interface Props {
  value: string;
  size?: number;
}

// Minimal QR code visual placeholder using a canvas pattern
// In production replace with a real QR library like qrcode.react
export default function QRCode({ value, size = 160 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Generate a deterministic grid pattern from the value string
    const cells = 21;
    const cellSize = size / cells;

    ctx.fillStyle = '#0a0f14';
    ctx.fillRect(0, 0, size, size);

    // Hash the string to get consistent pattern
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = ((hash << 5) - hash) + value.charCodeAt(i);
      hash |= 0;
    }

    ctx.fillStyle = '#47b8c8';

    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        // Always fill position detection patterns (corners)
        const inTL = r < 7 && c < 7;
        const inTR = r < 7 && c >= cells - 7;
        const inBL = r >= cells - 7 && c < 7;

        const isFinderBorder =
          (inTL && (r === 0 || r === 6 || c === 0 || c === 6)) ||
          (inTR && (r === 0 || r === 6 || c === cells - 7 || c === cells - 1)) ||
          (inBL && (r === cells - 7 || r === cells - 1 || c === 0 || c === 6));

        const isFinderInner =
          (inTL && r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
          (inTR && r >= 2 && r <= 4 && c >= cells - 5 && c <= cells - 3) ||
          (inBL && r >= cells - 5 && r <= cells - 3 && c >= 2 && c <= 4);

        let fill = false;
        if (isFinderBorder || isFinderInner) {
          fill = true;
        } else if (!inTL && !inTR && !inBL) {
          // Data modules: derive from hash + position
          const seed = (hash ^ (r * 31 + c * 17)) & 1;
          fill = seed === 1;
        }

        if (fill) {
          ctx.fillRect(
            c * cellSize + 0.5,
            r * cellSize + 0.5,
            cellSize - 0.5,
            cellSize - 0.5
          );
        }
      }
    }
  }, [value, size]);

  return (
    <div className="flex justify-center mb-4">
      <div className="p-3 bg-ink rounded-xl border border-border inline-block">
        <canvas ref={canvasRef} width={size} height={size} />
        <p className="text-center text-stellar-800 text-xs font-mono mt-2">QR Code</p>
      </div>
    </div>
  );
}
