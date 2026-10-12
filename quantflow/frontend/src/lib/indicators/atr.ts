// Wilder ATR seeded with the simple mean of the first `n` true ranges (matches backend chandelier.py).
import { Candle } from '../../types';
export function atr(c: Candle[], n: number): (number | null)[] {
  const out: (number | null)[] = []; let a: number | null = null; let seed = 0;
  for (let i = 0; i < c.length; i++) {
    const tr = i === 0 ? c[i].high - c[i].low
      : Math.max(c[i].high - c[i].low, Math.abs(c[i].high - c[i - 1].close), Math.abs(c[i].low - c[i - 1].close));
    if (a == null) { seed += tr; if (i === n - 1) a = seed / n; out.push(a); }
    else { a = (a * (n - 1) + tr) / n; out.push(a); }
  }
  return out;
}
