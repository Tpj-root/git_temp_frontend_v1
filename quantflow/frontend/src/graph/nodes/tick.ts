// TICK NODE (source). Inputs: none.  Outputs: ticks (latest tick object), price (number).
// Live: price = forming-bar close from Deriv; Deriv OHLC feed carries no bid/ask, so spread is n/a.
import { NodeDef, P } from '../types';
import { f } from '../../lib/series';
import { fmt } from '../../lib/time';
export const tickNode: NodeDef = {
  type: 'tick', title: 'Tick Stream', category: 'Source', color: '#34d399',
  description: 'Live (Deriv) or replayed (CSV) price, connection state and tick counter.',
  inputs: [], outputs: [P('ticks', 'ticks', 'ticks'), P('price', 'price', 'number')], params: [],
  compute(_i, _p, ctx) {
    const t = ctx.tick;
    return { ticks: t, price: t?.price ?? null,
      _show: { price: f(t?.price, 2), spread: 'n/a (OHLC feed)', state: ctx.feedState, mode: ctx.live ? 'LIVE' : 'OFFLINE', ticks: ctx.tickCount, time: fmt(t?.time, ctx.tz, false) } };
  },
};
