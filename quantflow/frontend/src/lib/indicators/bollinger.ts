// Bollinger Bands: SMA(n) +/- k * population stdev.
import { sma } from './sma';
export function bollinger(c: number[], n = 20, k = 2) {
  const mid = sma(c, n); const up: (number | null)[] = [], lo: (number | null)[] = [];
  for (let i = 0; i < c.length; i++) {
    const m = mid[i];
    if (m == null) { up.push(null); lo.push(null); continue; }
    let s = 0; for (let j = i - n + 1; j <= i; j++) s += (c[j] - m) ** 2;
    const sd = Math.sqrt(s / n); up.push(m + k * sd); lo.push(m - k * sd);
  }
  return { upper: up, mid, lower: lo };
}
