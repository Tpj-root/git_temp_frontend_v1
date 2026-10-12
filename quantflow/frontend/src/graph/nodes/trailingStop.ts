// TRAILING STOP NODE. In: pos (connect Positions.pos1 OR pos2), long, short (Chandelier stops).
//  mode "chandelier": BUY SL follows long_stop, SELL SL follows short_stop (value at the last CLOSED bar)
//  mode "points"    : SL trails `points` behind the current price
// The SL only ever moves in the profitable direction (ratchet) and never past the current price.
// It emits a `modify` action -> POST /api/modify (paper or MT5) / local broker offline.
import { NodeDef, P } from '../types';
import { f } from '../../lib/series';
export const trailingStopNode: NodeDef = {
  type: 'trailingStop', title: 'Trailing Stop', category: 'Trading', color: '#f59e0b', description: 'Ratchets the SL of the connected position.',
  inputs: [P('pos', 'position', 'position'), P('long', 'long_stop', 'series'), P('short', 'short_stop', 'series')], outputs: [P('sl', 'new SL', 'number')],
  params: [{ key: 'mode', label: 'mode', kind: 'select', default: 'chandelier', options: ['chandelier', 'points'] },
    { key: 'points', label: 'points', kind: 'number', default: 50, min: 1 }, { key: 'min_step', label: 'min step pts', kind: 'number', default: 1, min: 0 }],
  compute(inp, p, ctx) {
    const pos = inp.pos; if (!pos) return { sl: null, _show: { state: 'no position connected / open' } };
    const n = ctx.candles.length, j = n - 2, px = ctx.candles[n - 1]?.close ?? pos.current_price, buy = pos.side === 'buy', pt = ctx.point;
    let cand: number | null = p.mode === 'points' ? (buy ? px - p.points * pt : px + p.points * pt) : (buy ? inp.long?.[j] : inp.short?.[j]) ?? null;
    let act: any[] = [], why = 'hold';
    if (cand != null) {
      const better = pos.sl == null || (buy ? cand > pos.sl : cand < pos.sl), valid = buy ? cand < px : cand > px;
      const stepOk = pos.sl == null || Math.abs(cand - pos.sl) >= p.min_step * pt;
      if (better && valid && stepOk) { act = [{ kind: 'modify', key: `mod:${pos.ticket}:${cand.toFixed(6)}`, ticket: pos.ticket, sl: cand }]; why = 'moving SL'; }
    }
    return { sl: cand, _actions: act, _show: { position: `#${pos.ticket.slice(-4)} ${pos.side}`, 'current SL': f(pos.sl), candidate: f(cand), action: why } };
  },
};
