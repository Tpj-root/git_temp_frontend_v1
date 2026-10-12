// MACD NODE. In: candles. Out: macd, signal_line, hist (series) and signal (+1 macd crosses above signal, -1 below).
import { NodeDef, P } from '../types';
import { macd } from '../../lib/indicators/macd';
import { f, tail } from '../../lib/series';
export const macdNode: NodeDef = {
  type: 'macd', title: 'MACD', category: 'Indicator', color: '#14b8a6', description: 'Momentum with crossover signal.',
  inputs: [P('candles', 'candles', 'candles')],
  outputs: [P('macd', 'macd', 'series'), P('sigline', 'signal_line', 'series'), P('hist', 'hist', 'series'), P('signal', 'cross', 'signal')],
  params: [{ key: 'fast', label: 'fast', kind: 'number', default: 12 }, { key: 'slow', label: 'slow', kind: 'number', default: 26 }, { key: 'sig', label: 'signal', kind: 'number', default: 9 }],
  compute(inp, p, ctx) {
    const c = inp.candles ?? ctx.candles, m = macd(c.map((x) => x.close), p.fast, p.slow, p.sig);
    const cross = m.hist.map((h, i) => { const ph = m.hist[i - 1]; return h == null || ph == null ? 0 : ph <= 0 && h > 0 ? 1 : ph >= 0 && h < 0 ? -1 : 0; });
    const n = c.length - 1;
    return { macd: m.macd, sigline: m.signal, hist: m.hist, signal: cross, _spark: tail(m.hist), _show: { macd: f(m.macd[n], 3), signal: f(m.signal[n], 3), hist: f(m.hist[n], 3) } };
  },
};
