// Heikin-Ashi with the TradingView seed rule:  haOpen[0] = (open+close)/2, then (prevHaOpen+prevHaClose)/2.
import { Candle } from '../../types';
export function heikinAshi(c: Candle[]): Candle[] {
  const out: Candle[] = []; let po = 0, pc = 0;
  c.forEach((b, i) => {
    const hc = (b.open + b.high + b.low + b.close) / 4;
    const ho = i === 0 ? (b.open + b.close) / 2 : (po + pc) / 2;
    out.push({ time: b.time, open: ho, high: Math.max(b.high, ho, hc), low: Math.min(b.low, ho, hc), close: hc });
    po = ho; pc = hc;
  });
  return out;
}
