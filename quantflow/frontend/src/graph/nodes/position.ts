// POSITION LIST NODE. In: none (reads the broker). Out: pos1, pos2 (position objects, oldest first),
// count, volume, profit (totals). Shows "#1 / #2 / TOTAL" like a mini blotter.
// Wire pos1 or pos2 into a Trailing-Stop node so each position gets its own trailing logic.
import { NodeDef, P } from '../types';
import { f } from '../../lib/series';
export const positionNode: NodeDef = {
  type: 'position', title: 'Positions', category: 'Trading', color: '#fb923c', description: 'Open positions #1/#2 and totals.',
  inputs: [], outputs: [P('pos1', 'position 1', 'position'), P('pos2', 'position 2', 'position'), P('count', 'count', 'number'), P('volume', 'total volume', 'number'), P('profit', 'total P&L', 'number')],
  params: [{ key: 'scope', label: 'scope', kind: 'select', default: 'symbol', options: ['symbol', 'all'] }],
  compute(_i, p, ctx) {
    const list = ctx.positions.filter((x) => p.scope === 'all' || x.symbol === ctx.symbol).sort((a, b) => a.open_time - b.open_time);
    const show: Record<string, any> = {};
    list.slice(0, 4).forEach((x, k) => (show[`#${k + 1} ${x.side.toUpperCase()} ${x.lots}`] = f(x.profit)));
    const vol = list.reduce((a, x) => a + x.lots, 0), pl = list.reduce((a, x) => a + x.profit, 0);
    show['TOTAL'] = `${list.length} pos | vol ${f(vol)} | P&L ${f(pl)}`;
    return { pos1: list[0] ?? null, pos2: list[1] ?? null, count: list.length, volume: vol, profit: pl, _show: show };
  },
};
