// CHANDELIER EXIT NODE (signal source).
// In : candles, anchors (optional - if missing it uses rolling High/Low or Close over `period`)
// Out: signal (+1/-1 per bar), long, short, stop (active stop series), direction, atr (numbers)
// The stop outputs are what AutoTrader (initial SL) and TrailingStop (ratchet SL) consume.
import { NodeDef, P } from '../types';
import { chandelier } from '../../lib/indicators/chandelier';
import { extremum } from '../../lib/indicators/extremum';
import { f } from '../../lib/series';
export const chandelierNode: NodeDef = {
  type: 'chandelier', title: 'Chandelier Exit', category: 'Signal', color: '#10b981',
  description: 'Long/short ratchet stops, direction and BUY/SELL flip signals.',
  inputs: [P('candles', 'candles', 'candles'), P('anchors', 'anchors', 'anchors')],
  outputs: [P('signal', 'signal', 'signal'), P('long', 'long_stop', 'series'), P('short', 'short_stop', 'series'),
    P('stop', 'active_stop', 'series'), P('direction', 'direction', 'number'), P('atr', 'atr', 'number')],
  params: [
    { key: 'period', label: 'ATR period', kind: 'number', default: 22, min: 1, max: 200 },
    { key: 'mult', label: 'ATR mult', kind: 'number', default: 3, min: 0.1, max: 15, step: 0.1 },
    { key: 'tv_ratchet', label: 'TV ratchet', kind: 'bool', default: true },
    { key: 'use_close', label: 'use_close*', kind: 'bool', default: true },
    { key: 'color_long', label: 'long color', kind: 'color', default: '#26a69a' },
    { key: 'color_short', label: 'short color', kind: 'color', default: '#ef5350' },
  ],
  compute(inp, p, ctx) {
    const c = inp.candles ?? ctx.candles, n = c.length;
    const a = inp.anchors ?? extremum(c, { formula: 'close', useClose: p.use_close, period: p.period, maLen: 20, lookback: 5 });
    const r = chandelier(c, a.upper, a.lower, p.period, p.mult, p.tv_ratchet);
    const dir = r.direction[n - 1] ?? 1, j = n - 2;
    // draw only the ACTIVE side (null elsewhere) so flips don't draw diagonal connector lines
    const dl = r.longStop.map((v, i) => (r.direction[i] > 0 ? v : null)), ds = r.shortStop.map((v, i) => (r.direction[i] < 0 ? v : null));
    const ev = j >= 0 && r.signal[j] !== 0 ? { epoch: c[j].time, side: r.signal[j] > 0 ? 'BUY' : 'SELL', price: c[j].close } : null;
    return {
      signal: r.signal, long: r.longStop, short: r.shortStop, stop: r.active, direction: dir, atr: r.atr[n - 1],
      _signalEvent: ev,
      _draw: [{ kind: 'line', id: 'ce_l', color: p.color_long, width: 2, data: dl }, { kind: 'line', id: 'ce_s', color: p.color_short, width: 2, data: ds }],
      _show: { trend: dir > 0 ? 'LONG ▲' : 'SHORT ▼', 'long stop': f(r.longStop[n - 1]), 'short stop': f(r.shortStop[n - 1]), atr: f(r.atr[n - 1], 3), 'last closed sig': j >= 0 && r.signal[j] ? (r.signal[j] > 0 ? 'BUY' : 'SELL') : '-' },
    };
  },
};
