// MATH NODES: Add / Subtract / Multiply / Divide. In: a, b (series or number; unconnected input uses its param).
// Out: series (or a plain number when both sides are scalars). Division by 0 -> null (a gap).
import { NodeDef, P } from '../types';
import { asSeries, f, last } from '../../lib/series';
const make = (type: string, title: string, sym: string, fn: (a: number, b: number) => number | null): NodeDef => ({
  type, title, category: 'Math', color: '#38bdf8', description: `out = a ${sym} b (per bar).`,
  inputs: [P('a', 'a', 'series'), P('b', 'b', 'series')], outputs: [P('out', 'out', 'series')],
  params: [{ key: 'a_value', label: 'a (if open)', kind: 'number', default: 0, step: 0.1 }, { key: 'b_value', label: 'b (if open)', kind: 'number', default: 1, step: 0.1 }],
  compute(inp, p, ctx) {
    const A = inp.a ?? p.a_value, B = inp.b ?? p.b_value, n = ctx.candles.length;
    if (typeof A === 'number' && typeof B === 'number') { const v = fn(A, B); return { out: v, _show: { result: f(v, 4) } }; }
    const a = asSeries(A, n), b = asSeries(B, n);
    const out = a.map((x, i) => (x == null || b[i] == null ? null : fn(x, b[i] as number)));
    return { out, _show: { last: f(last(out), 4) } };
  },
});
export const addNode = make('add', 'Add (+)', '+', (a, b) => a + b);
export const subNode = make('sub', 'Subtract (−)', '-', (a, b) => a - b);
export const mulNode = make('mul', 'Multiply (×)', '*', (a, b) => a * b);
export const divNode = make('div', 'Divide (÷)', '/', (a, b) => (b === 0 ? null : a / b));
