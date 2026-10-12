// FORMULA NODE. Type a math expression over a, b, c (values of the connected series on each bar), i (bar index), n.
// Example:  (a + b) / 2      or     max(a, b) - abs(c)
// SAFE: identifiers are checked against a whitelist (no property access, no strings) before compiling.
import { NodeDef, P } from '../types';
import { asSeries, f, last } from '../../lib/series';
const FN = ['abs', 'min', 'max', 'sqrt', 'pow', 'log', 'exp', 'floor', 'ceil', 'round', 'sign'];
const OK = new Set(['a', 'b', 'c', 'i', 'n', ...FN]);
export const formulaNode: NodeDef = {
  type: 'formula', title: 'Formula', category: 'Math', color: '#06b6d4', description: 'Math expression of a,b,c per bar (safe parser).',
  inputs: [P('a', 'a', 'series'), P('b', 'b', 'series'), P('c', 'c', 'series')], outputs: [P('out', 'out', 'series')],
  params: [{ key: 'expr', label: 'expression', kind: 'text', default: '(a + b) / 2' }],
  compute(inp, p, ctx, id) {
    const m = ctx.mem(id), expr: string = p.expr;
    if (/[^0-9a-zA-Z_+\-*/%().,<>=!&|?: ]/.test(expr)) throw new Error('illegal character');
    for (const w of expr.match(/[A-Za-z_]\w*/g) || []) if (!OK.has(w)) throw new Error('unknown name: ' + w);
    if (m.src !== expr) { m.fn = new Function('a', 'b', 'c', 'i', 'n', ...FN, `return (${expr});`); m.src = expr; }
    const n = ctx.candles.length, A = asSeries(inp.a, n), B = asSeries(inp.b, n), C = asSeries(inp.c, n);
    const out = A.map((_, i) => { const v = m.fn(A[i] ?? NaN, B[i] ?? NaN, C[i] ?? NaN, i, n, Math.abs, Math.min, Math.max, Math.sqrt, Math.pow, Math.log, Math.exp, Math.floor, Math.ceil, Math.round, Math.sign);
      return typeof v === 'number' && isFinite(v) ? v : null; });
    return { out, _show: { expr, last: f(last(out), 4) } };
  },
};
