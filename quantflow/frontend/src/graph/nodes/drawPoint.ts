// POINT-DRAWING NODE. In: value (series, price level), trigger (signal, optional).
// Draws dots at (bar time, value). With a trigger: only on bars where trigger != 0.
// Without: on the last `last_n` bars. (Points sit EXACTLY on the price level, unlike arrow markers.)
import { NodeDef, P } from '../types';
export const drawPointNode: NodeDef = {
  type: 'drawPoint', title: 'Draw Points', category: 'Draw', color: '#facc15', description: 'Plot dots at a price series on the chart.',
  inputs: [P('value', 'value', 'series'), P('trigger', 'trigger', 'signal')], outputs: [],
  params: [{ key: 'color', label: 'color', kind: 'color', default: '#facc15' }, { key: 'size', label: 'size', kind: 'number', default: 4, min: 1, max: 12 },
    { key: 'last_n', label: 'last_n (no trigger)', kind: 'number', default: 50, min: 1, max: 1000 }],
  compute(inp, p, ctx, id) {
    const n = ctx.candles.length, v = Array.isArray(inp.value) ? inp.value : new Array(n).fill(typeof inp.value === 'number' ? inp.value : null), trig: number[] | undefined = inp.trigger;
    const data = v.map((x: number | null, i: number) => (trig ? (trig[i] ? x : null) : i >= n - p.last_n ? x : null));
    return { _draw: [{ kind: 'points', id, color: p.color, size: p.size, data }], _show: { points: data.filter((x: any) => x != null).length } };
  },
};
