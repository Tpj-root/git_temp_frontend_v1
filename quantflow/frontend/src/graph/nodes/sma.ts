// SMA NODE. In: candles. Out: series. Draws an overlay line on the chart.
import { NodeDef, P } from '../types';
import { sma } from '../../lib/indicators/sma';
import { sourceOf, f } from '../../lib/series';
export const smaNode: NodeDef = {
  type: 'sma', title: 'SMA', category: 'Indicator', color: '#eab308', description: 'Simple moving average overlay.',
  inputs: [P('candles', 'candles', 'candles')], outputs: [P('series', 'sma', 'series')],
  params: [{ key: 'period', label: 'period', kind: 'number', default: 20, min: 2, max: 500 },
    { key: 'source', label: 'source', kind: 'select', default: 'close', options: ['close', 'open', 'high', 'low', 'hl2', 'ohlc4'] },
    { key: 'show', label: 'draw', kind: 'bool', default: true }, { key: 'color', label: 'color', kind: 'color', default: '#eab308' }],
  compute(inp, p, ctx, id) {
    const c = inp.candles ?? ctx.candles, s = sma(sourceOf(c, p.source), p.period), v = s[s.length - 1], px = c[c.length - 1]?.close;
    return { series: s, _draw: p.show ? [{ kind: 'line', id, color: p.color, width: 1, data: s }] : [],
      _show: { value: f(v), price: v != null && px != null ? (px > v ? 'ABOVE' : 'BELOW') : '-' } };
  },
};
