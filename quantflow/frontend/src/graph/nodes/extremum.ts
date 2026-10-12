// EXTREMUM NODE. In: candles (usually HA). Out: anchors {upper,lower} -> feeds the Chandelier.
// Params: formula (close | range_ma | crest_trough | pivot_sr), use_close (ignore wicks), period, ma_len, lookback.
import { NodeDef, P } from '../types';
import { extremum } from '../../lib/indicators/extremum';
import { f } from '../../lib/series';
export const extremumNode: NodeDef = {
  type: 'extremum', title: 'Extremum / Noise Filter', category: 'Transform', color: '#fbbf24',
  description: 'Upper/lower anchor prices; use_close ignores wicks.',
  inputs: [P('candles', 'candles', 'candles')], outputs: [P('anchors', 'anchors', 'anchors')],
  params: [
    { key: 'formula', label: 'formula', kind: 'select', default: 'close', options: ['close', 'range_ma', 'crest_trough', 'pivot_sr'] },
    { key: 'use_close', label: 'use_close', kind: 'bool', default: true },
    { key: 'period', label: 'period', kind: 'number', default: 22, min: 2, max: 200 },
    { key: 'ma_len', label: 'ma_len', kind: 'number', default: 20, min: 2, max: 200 },
    { key: 'lookback', label: 'lookback', kind: 'number', default: 5, min: 2, max: 50 },
  ],
  compute(inp, p, ctx) {
    const c = inp.candles ?? ctx.candles;
    const r = extremum(c, { formula: p.formula, useClose: p.use_close, period: p.period, maLen: p.ma_len, lookback: p.lookback });
    return { anchors: r, _show: { upper: f(r.upper[r.upper.length - 1]), lower: f(r.lower[r.lower.length - 1]), 'wick noise': f(r.wickNoise) } };
  },
};
