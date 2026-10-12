// INCREMENT / DECREMENT NODES. In: in (series|number), trigger (signal, optional).
//  mode "offset" : out = in +/- step                     (shift a value up/down)
//  mode "counter": out[i] = out[i-1] +/- step on every bar where trigger != 0 (starts at `start`)
//                  e.g. count how many BUY signals fired, or ratchet a level by hand.
import { NodeDef, P } from '../types';
import { asSeries, f, last } from '../../lib/series';
const make = (type: string, title: string, sign: 1 | -1): NodeDef => ({
  type, title, category: 'Math', color: sign > 0 ? '#4ade80' : '#f87171', description: sign > 0 ? 'Adds step to a value or counts triggers up.' : 'Subtracts step from a value or counts triggers down.',
  inputs: [P('in', 'in', 'series'), P('trigger', 'trigger', 'signal')], outputs: [P('out', 'out', 'series')],
  params: [{ key: 'step', label: 'step', kind: 'number', default: 1, step: 0.1 }, { key: 'mode', label: 'mode', kind: 'select', default: 'offset', options: ['offset', 'counter'] },
    { key: 'start', label: 'start', kind: 'number', default: 0 }],
  compute(inp, p, ctx) {
    const n = ctx.candles.length;
    if (p.mode === 'offset') {
      if (typeof inp.in === 'number') return { out: inp.in + sign * p.step, _show: { out: f(inp.in + sign * p.step, 4) } };
      const out = asSeries(inp.in, n).map((v) => (v == null ? null : v + sign * p.step)); return { out, _show: { last: f(last(out), 4) } };
    }
    const trig: number[] = inp.trigger ?? []; let v = p.start; const out = new Array(n).fill(0).map((_, i) => ((trig[i] || 0) !== 0 && (v += sign * p.step), v));
    return { out, _show: { count: f(v, 2) } };
  },
});
export const incrementNode = make('increment', 'Increment (+)', 1);
export const decrementNode = make('decrement', 'Decrement (−)', -1);
