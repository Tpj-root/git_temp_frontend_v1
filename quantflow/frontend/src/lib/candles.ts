// Tick -> candle bucketing (used by OFFLINE replay; live candles come from the backend).
import { Candle, Tick } from '../types';
export const bucket = (t: number, tf: number) => Math.floor(t / tf) * tf;

export function ticksToCandles(ticks: Tick[], tf: number): Candle[] {
  const out: Candle[] = [];
  for (const t of ticks) applyTickMut(out, t, tf);
  return out;
}
/** Fold one tick into a candle array IN PLACE (opens a new bar when the bucket changes). */
export function applyTickMut(c: Candle[], t: Tick, tf: number): void {
  const b = bucket(t.time, tf);
  const last = c[c.length - 1];
  if (last && last.time === b) {
    if (t.price > last.high) last.high = t.price;
    if (t.price < last.low) last.low = t.price;
    last.close = t.price;
  } else {
    c.push({ time: b, open: t.price, high: t.price, low: t.price, close: t.price });
  }
}
