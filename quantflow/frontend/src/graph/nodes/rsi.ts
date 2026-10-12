// RSI NODE. In: candles. Out: series (rsi), signal (+1 when RSI crosses UP through oversold,
// -1 when it crosses DOWN through overbought). Own pane is not drawn on the price chart; a sparkline is shown.
import { NodeDef, P } from '../types';
import { rsi } from '../../lib/indicators/rsi';
import { f, tail } from '../../lib/series';
export const rsiNode: NodeDef = {
  type: 'rsi', title: 'RSI', category: 'Indicator', color: '#8b5cf6', description: 'Oscillator with oversold/overbought cross signal.',
  inputs: [P('candles', 'candles', 'candles')], outputs: [P('series', 'rsi', 'series'), P('signal', 'signal', 'signal')],
  params: [{ key: 'period', label: 'period', kind: 'number', default: 14, min: 2, max: 100 },
    { key: 'oversold', label: 'oversold', kind: 'number', default: 30 }, { key: 'overbought', label: 'overbought', kind: 'number', default: 70 }],
  compute(inp, p, ctx) {
    const c = inp.candles ?? ctx.candles, r = rsi(c.map((b) => b.close), p.period);
    const sig = r.map((v, i) => { const pv = r[i - 1]; if (v == null || pv == null) return 0;
      return pv < p.oversold && v >= p.oversold ? 1 : pv > p.overbought && v <= p.overbought ? -1 : 0; });
    const v = r[r.length - 1];
    return { series: r, signal: sig, _spark: tail(r), _show: { rsi: f(v, 1), zone: v == null ? '-' : v >= p.overbought ? 'OVERBOUGHT' : v <= p.oversold ? 'OVERSOLD' : 'neutral' } };
  },
};
