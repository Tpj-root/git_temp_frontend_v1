// MACD = EMA(fast) - EMA(slow); signal = EMA(macd, g); hist = macd - signal.
import { ema } from './ema';
export function macd(c: number[], fast = 12, slow = 26, g = 9) {
  const ef = ema(c, fast), es = ema(c, slow);
  const line = ef.map((a, i) => (a != null && es[i] != null ? a - (es[i] as number) : null));
  const sig = ema(line, g);
  const hist = line.map((a, i) => (a != null && sig[i] != null ? a - (sig[i] as number) : null));
  return { macd: line, signal: sig, hist };
}
