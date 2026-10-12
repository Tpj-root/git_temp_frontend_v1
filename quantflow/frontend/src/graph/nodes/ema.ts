// EMA NODE. In: candles. Out: series. Common use: trend filter into the Logic Gate.
import { NodeDef, P } from '../types';
import { ema } from '../../lib/indicators/ema';
import { sourceOf, f } from '../../lib/series';
export const emaNode: NodeDef = {
  type: 'ema', title: 'EMA', category: 'Indicator', color: '#3b82f6', description: 'Exponential moving average / trend bias.',
  inputs: [P('candles', 'candles', 'candles')], outputs: [P('series', 'ema', 'series')],
  params: [{ key: 'period', label: 'period', kind: 'number', default: 50, min: 2, max: 500 },
    { key: 'source', label: 'source', kind: 'select', default: 'close', options: ['close', 'open', 'high', 'low', 'hl2', 'ohlc4'] },
    { key: 'show', label: 'draw', kind: 'bool', default: true }, { key: 'color', label: 'color', kind: 'color', default: '#3b82f6' }],
  compute(inp, p, ctx, id) {
    const c = inp.candles ?? ctx.candles, s = ema(sourceOf(c, p.source), p.period), v = s[s.length - 1], px = c[c.length - 1]?.close;
    return { series: s, _draw: p.show ? [{ kind: 'line', id, color: p.color, width: 1, data: s }] : [],
      _show: { value: f(v), bias: v != null && px != null ? (px > v ? 'BULL' : 'BEAR') : '-' } };
  },
};
