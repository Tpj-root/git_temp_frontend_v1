// FUNCTION NODE. Write a JS function BODY; it is called once per bar as
//     (a, b, c, i, candles, out) => number | null
// where a,b,c are the FULL connected series arrays, i the bar index, out the results so far (so you can build
// recursive/stateful logic). Example:  return a[i] != null && a[i-1] != null ? a[i] - a[i-1] : null;
// This is real JS (new Function) - it runs only in YOUR browser on YOUR code; don't paste code you don't trust.
import { NodeDef, P } from '../types';
import { asSeries, f, last } from '../../lib/series';
export const functionNode: NodeDef = {
  type: 'function', title: 'Function (JS)', category: 'Math', color: '#0ea5e9', description: 'Custom per-bar JavaScript function.',
  inputs: [P('a', 'a', 'series'), P('b', 'b', 'series'), P('c', 'c', 'series')], outputs: [P('out', 'out', 'series')],
  params: [{ key: 'code', label: 'code', kind: 'textarea', default: 'return a[i] != null && a[i-1] != null ? a[i] - a[i-1] : null;' }],
  compute(inp, p, ctx, id) {
    const m = ctx.mem(id);
    if (m.src !== p.code) { m.fn = new Function('a', 'b', 'c', 'i', 'candles', 'out', 'Math', p.code); m.src = p.code; }
    const n = ctx.candles.length, A = asSeries(inp.a, n), B = asSeries(inp.b, n), C = asSeries(inp.c, n), out: (number | null)[] = [];
    for (let i = 0; i < n; i++) { const v = m.fn(A, B, C, i, ctx.candles, out, Math); out.push(typeof v === 'number' && isFinite(v) ? v : null); }
    return { out, _show: { last: f(last(out), 4) } };
  },
};
