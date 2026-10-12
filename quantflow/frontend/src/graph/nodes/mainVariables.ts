// MAIN VARIABLES NODE. The ONE place for the numbers the trader uses. In: none.
// Out: volume, sl_points, tp_points, tp_rr, max_pos (numbers) -> wire into AutoTrader inputs.
// (AutoTrader also has the same values as params; a wired input overrides its param.)
import { NodeDef, P } from '../types';
export const mainVariablesNode: NodeDef = {
  type: 'mainVars', title: 'Main Variables', category: 'Trading', color: '#a3e635', description: 'Volume, SL, TP and max positions in one node.',
  inputs: [], outputs: [P('volume', 'volume', 'number'), P('sl_points', 'sl_points', 'number'), P('tp_points', 'tp_points', 'number'), P('tp_rr', 'tp_rr', 'number'), P('max_pos', 'max_pos', 'number')],
  params: [{ key: 'volume', label: 'volume (lots)', kind: 'number', default: 0.1, min: 0.01, step: 0.01 }, { key: 'sl_points', label: 'SL points', kind: 'number', default: 50, min: 1 },
    { key: 'tp_points', label: 'TP points', kind: 'number', default: 100, min: 1 }, { key: 'tp_rr', label: 'TP risk:reward', kind: 'number', default: 2, min: 0.1, step: 0.1 },
    { key: 'max_pos', label: 'max positions', kind: 'number', default: 2, min: 1, max: 5 }],
  compute: (_i, p) => ({ volume: p.volume, sl_points: p.sl_points, tp_points: p.tp_points, tp_rr: p.tp_rr, max_pos: p.max_pos, _show: { vol: p.volume, SL: p.sl_points, TP: p.tp_points, maxPos: p.max_pos } }),
};
