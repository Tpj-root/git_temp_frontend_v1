// BOLLINGER NODE. In: candles. Out: upper, mid, lower (series). Draws 3 lines.
import { NodeDef, P } from '../types';
import { bollinger } from '../../lib/indicators/bollinger';
import { f } from '../../lib/series';
export const bollingerNode: NodeDef = {
  type: 'bollinger', title: 'Bollinger Bands', category: 'Indicator', color: '#ec4899', description: 'SMA +/- k*stdev channel.',
  inputs: [P('candles', 'candles', 'candles')], outputs: [P('upper', 'upper', 'series'), P('mid', 'mid', 'series'), P('lower', 'lower', 'series')],
  params: [{ key: 'period', label: 'period', kind: 'number', default: 20, min: 2, max: 200 }, { key: 'k', label: 'stdev k', kind: 'number', default: 2, step: 0.1 },
    { key: 'color', label: 'color', kind: 'color', default: '#ec4899' }],
  compute(inp, p, ctx, id) {
    const c = inp.candles ?? ctx.candles, b = bollinger(c.map((x) => x.close), p.period, p.k), n = c.length - 1;
    const bw = b.upper[n] != null && b.mid[n] ? (((b.upper[n] as number) - (b.lower[n] as number)) / (b.mid[n] as number)) * 100 : null;
    return { upper: b.upper, mid: b.mid, lower: b.lower,
      _draw: [{ kind: 'line', id: id + 'u', color: p.color, width: 1, data: b.upper }, { kind: 'line', id: id + 'm', color: p.color + '66', width: 1, data: b.mid }, { kind: 'line', id: id + 'l', color: p.color, width: 1, data: b.lower }],
      _show: { upper: f(b.upper[n]), mid: f(b.mid[n]), lower: f(b.lower[n]), 'bandwidth%': f(bw) } };
  },
};
