// Helpers for the value types that travel along node connections.
//   Series = one number|null per candle (same length/index as the candle array)
//   number = scalar.   Scalars are transparently broadcast to Series where needed.
import { Candle } from '../types';
export type Series = (number | null)[];
export const asSeries = (v: any, n: number): Series =>
  Array.isArray(v) ? v : typeof v === 'number' ? new Array(n).fill(v) : new Array(n).fill(null);
export const last = (s: any): number | null =>
  Array.isArray(s) ? (s.length ? s[s.length - 1] : null) : typeof s === 'number' ? s : null;
export const num = (v: any, d = 0) => (typeof v === 'number' && isFinite(v) ? v : d);
export const f = (v: any, d = 2) => (typeof v === 'number' && isFinite(v) ? v.toFixed(d) : '---');
export function sourceOf(c: Candle[], src: string): number[] {
  return c.map((b) => src === 'open' ? b.open : src === 'high' ? b.high : src === 'low' ? b.low
    : src === 'hl2' ? (b.high + b.low) / 2 : src === 'ohlc4' ? (b.open + b.high + b.low + b.close) / 4 : b.close);
}
export const tail = (s: Series, n = 60): number[] => s.slice(-n).filter((x): x is number => x != null);
