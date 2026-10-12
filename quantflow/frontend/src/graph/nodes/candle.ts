// CANDLE NODE. Inputs: ticks (optional, for wiring clarity). Outputs: candles (OHLC array).
// Timeframe comes from the top bar (1M/5M/15M/1H/4H). Shows the forming bar and countdown to close.
import { NodeDef, P } from '../types';
import { f } from '../../lib/series';
export const candleNode: NodeDef = {
  type: 'candle', title: 'Candles (OHLC)', category: 'Source', color: '#22d3ee',
  description: 'Forming candle OHLC + countdown for the selected timeframe.',
  inputs: [P('ticks', 'ticks', 'ticks')], outputs: [P('candles', 'candles', 'candles')], params: [],
  compute(_i, _p, ctx) {
    const c = ctx.candles, b = c[c.length - 1];
    const left = b ? Math.max(0, b.time + ctx.tf - ctx.clock) : 0;
    return { candles: c, _show: { tf: ctx.tf + 's', bars: c.length, O: f(b?.open), H: f(b?.high), L: f(b?.low), C: f(b?.close), 'closes in': Math.floor(left) + 's' } };
  },
};
