// HEIKIN-ASHI NODE. In: candles. Out: candles (HA-smoothed, same length/index). Shows trend streak.
import { NodeDef, P } from '../types';
import { heikinAshi } from '../../lib/indicators/ha';
import { f } from '../../lib/series';
export const heikinAshiNode: NodeDef = {
  type: 'heikinAshi', title: 'Heikin-Ashi', category: 'Transform', color: '#a855f7',
  description: 'Smoothed synthetic candles + bull/bear streak.',
  inputs: [P('candles', 'candles', 'candles')], outputs: [P('candles', 'ha_candles', 'candles')],
  params: [{ key: 'enabled', label: 'enabled', kind: 'bool', default: true }],
  compute(inp, p, ctx) {
    const src = inp.candles ?? ctx.candles;
    const ha = p.enabled ? heikinAshi(src) : src;
    let streak = 0; const bull = ha.length ? ha[ha.length - 1].close >= ha[ha.length - 1].open : true;
    for (let i = ha.length - 1; i >= 0 && (ha[i].close >= ha[i].open) === bull; i--) streak++;
    const l = ha[ha.length - 1];
    return { candles: ha, _show: { trend: bull ? 'BULL' : 'BEAR', streak, haO: f(l?.open), haC: f(l?.close) } };
  },
};
