// CHANDELIER EXIT (port of backend/app/indicators/chandelier.py so frontend == backend results).
//   longStop  = upperAnchor - mult*ATR     shortStop = lowerAnchor + mult*ATR
//   direction = +1 if close > prev shortStop, -1 if close < prev longStop, else unchanged
//   tv=true  : TradingView/everget ratchet (gated on PREVIOUS close, neither side reset)
//   tv=false : textbook ratchet (active side only, inactive side resets on flip)
// signal[i] = +1 (BUY) / -1 (SELL) on the bar where direction flips, else 0.
// Fold is strictly backward-looking: values for closed bars never change when a new bar forms.
import { Candle } from '../../types';
import { atr as atrFn } from './atr';
export function chandelier(c: Candle[], up: number[], lo: number[], period: number, mult: number, tv = true) {
  const n = c.length, A = atrFn(c, period);
  const longS: (number | null)[] = [], shortS: (number | null)[] = [], active: (number | null)[] = [];
  const dir: number[] = [], sig: number[] = [];
  let pl: number | null = null, ps: number | null = null, pd = 1, prevClose: number | null = null, prevReady = false;
  for (let i = 0; i < n; i++) {
    const a = A[i], close = c[i].close;
    if (a == null || i < period - 1) { longS.push(null); shortS.push(null); active.push(null); dir.push(pd); sig.push(0); prevClose = close; continue; }
    const rawL = up[i] - mult * a, rawS = lo[i] + mult * a;
    const lsp = tv ? (pl ?? rawL) : pl, ssp = tv ? (ps ?? rawS) : ps;
    let d = pd;
    if (ssp != null && close > ssp) d = 1; else if (lsp != null && close < lsp) d = -1;
    let L: number, S: number;
    if (tv) {
      L = prevClose != null && lsp != null && prevClose > lsp ? Math.max(rawL, lsp) : rawL;
      S = prevClose != null && ssp != null && prevClose < ssp ? Math.min(rawS, ssp) : rawS;
    } else if (d > 0) { L = pl == null || pd < 0 ? rawL : Math.max(rawL, pl); S = rawS; }
    else { S = ps == null || pd > 0 ? rawS : Math.min(rawS, ps); L = rawL; }
    sig.push(prevReady && d !== pd ? d : 0);
    longS.push(L); shortS.push(S); active.push(d > 0 ? L : S); dir.push(d);
    pl = L; ps = S; pd = d; prevClose = close; prevReady = true;
  }
  return { longStop: longS, shortStop: shortS, active, direction: dir, signal: sig, atr: A };
}
