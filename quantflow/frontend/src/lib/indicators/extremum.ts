// EXTREMUM ENGINE: produces the upper/lower ANCHOR that the Chandelier subtracts/adds ATR*mult to.
//  close        rolling max/min over `period` (use_close=true -> CLOSE prices, wicks ignored; false -> High/Low)
//  range_ma     rolling max/min over a short `lookback`
//  crest_trough last turning points of an EMA(maLen) -> wave-based anchors
//  pivot_sr     last confirmed 3-bar swing high / swing low
import { Candle } from '../../types';
export type Formula = 'close' | 'range_ma' | 'crest_trough' | 'pivot_sr';
export function extremum(c: Candle[], o: { formula: Formula; useClose: boolean; period: number; maLen: number; lookback: number }) {
  const n = c.length, H = (b: Candle) => (o.useClose ? b.close : b.high), L = (b: Candle) => (o.useClose ? b.close : b.low);
  const upper: number[] = new Array(n), lower: number[] = new Array(n);
  const roll = (w: number) => {
    for (let i = 0; i < n; i++) {
      let hi = -Infinity, lo = Infinity;
      for (let j = Math.max(0, i - w + 1); j <= i; j++) { hi = Math.max(hi, H(c[j])); lo = Math.min(lo, L(c[j])); }
      upper[i] = hi; lower[i] = lo;
    }
  };
  if (o.formula === 'range_ma') roll(o.lookback);
  else if (o.formula === 'crest_trough') {
    const k = 2 / (o.maLen + 1); const ma: number[] = [];
    c.forEach((b, i) => ma.push(i === 0 ? b.close : b.close * k + ma[i - 1] * (1 - k)));
    let cr = c[0]?.high ?? 0, tr = c[0]?.low ?? 0;
    for (let i = 0; i < n; i++) {
      if (i >= 2) {
        const dc = ma[i] - ma[i - 1], dp = ma[i - 1] - ma[i - 2];
        if (dp > 0 && dc <= 0) cr = ma[i - 1];     // MA turned down -> crest
        if (dp < 0 && dc >= 0) tr = ma[i - 1];     // MA turned up   -> trough
      }
      upper[i] = cr; lower[i] = tr;
    }
  } else if (o.formula === 'pivot_sr') {
    let res = c[0]?.high ?? 0, sup = c[0]?.low ?? 0;
    for (let i = 0; i < n; i++) {
      if (i >= 2) {
        if (H(c[i - 1]) > H(c[i]) && H(c[i - 1]) > H(c[i - 2])) res = H(c[i - 1]);
        if (L(c[i - 1]) < L(c[i]) && L(c[i - 1]) < L(c[i - 2])) sup = L(c[i - 1]);
      }
      upper[i] = res; lower[i] = sup;
    }
  } else roll(o.period);
  const wickNoise = c.reduce((a, b) => a + Math.max(0, b.high - b.close) + Math.max(0, b.close - b.low), 0);
  return { upper, lower, wickNoise };
}
