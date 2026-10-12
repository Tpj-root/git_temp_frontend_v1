// LOGIC GATE NODE (multi-indicator confirmation). In: a, b (signals), trend (series, e.g. EMA 200).
//  AND          : pass BUY only if a AND b are both +1 on the bar (same for SELL)
//  OR           : pass when either fires
//  TREND_FILTER : pass signal a only when it agrees with price vs `trend` (BUY above, SELL below)
import { NodeDef, P } from '../types';
export const logicGateNode: NodeDef = {
  type: 'logicGate', title: 'Logic Gate', category: 'Signal', color: '#6366f1', description: 'Combine signals: AND / OR / TREND_FILTER.',
  inputs: [P('a', 'a', 'signal'), P('b', 'b', 'signal'), P('trend', 'trend', 'series')], outputs: [P('signal', 'gated', 'signal')],
  params: [{ key: 'mode', label: 'mode', kind: 'select', default: 'TREND_FILTER', options: ['AND', 'OR', 'TREND_FILTER'] }],
  compute(inp, p, ctx) {
    const c = ctx.candles, n = c.length, a: number[] = inp.a ?? new Array(n).fill(0), b: number[] = inp.b ?? new Array(n).fill(0);
    const tr = Array.isArray(inp.trend) ? inp.trend : null;
    const out = a.map((x, i) => {
      if (p.mode === 'AND') return x !== 0 && x === b[i] ? x : 0;
      if (p.mode === 'OR') return x !== 0 ? x : b[i];
      const t = tr?.[i]; if (t == null || x === 0) return x === 0 ? 0 : tr ? 0 : x;
      return (x > 0 && c[i].close > t) || (x < 0 && c[i].close < t) ? x : 0;
    });
    const j = n - 2;
    return { signal: out, _show: { mode: p.mode, 'last closed': j >= 0 ? (out[j] > 0 ? 'BUY' : out[j] < 0 ? 'SELL' : 'blocked/none') : '-' } };
  },
};
