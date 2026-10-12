// GRAPH EVALUATOR. Kahn topological sort -> compute each node once with its connected inputs.
// Disconnect an edge and the input simply disappears (node falls back to its param defaults);
// nodes inside a cycle are skipped (no result) instead of looping forever.
import { NODE_DEFS } from './registry';
import { defaultsOf, EvalCtx } from './types';
export function evaluate(nodes: any[], edges: any[], ctx: EvalCtx): Record<string, Record<string, any>> {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const valid = edges.filter((e) => byId.has(e.source) && byId.has(e.target));
  const indeg = new Map<string, number>(nodes.map((n) => [n.id, 0]));
  valid.forEach((e) => indeg.set(e.target, (indeg.get(e.target) || 0) + 1));
  const q = [...indeg].filter(([, d]) => d === 0).map(([id]) => id);
  const order: string[] = [];
  while (q.length) {
    const id = q.shift()!; order.push(id);
    for (const e of valid) if (e.source === id) {
      const d = indeg.get(e.target)! - 1; indeg.set(e.target, d); if (d === 0) q.push(e.target);
    }
  }
  const res: Record<string, Record<string, any>> = {};
  for (const id of order) {
    const node = byId.get(id), def = NODE_DEFS[node.data.type];
    if (!def) continue;
    const inp: Record<string, any> = {};
    for (const e of valid) if (e.target === id) {
      const v = res[e.source]?.[e.sourceHandle ?? ''];
      if (v !== undefined) inp[e.targetHandle ?? ''] = v;
    }
    try { res[id] = def.compute(inp, { ...defaultsOf(def), ...node.data.params }, ctx, id); }
    catch (err: any) { res[id] = { _error: String(err?.message || err) }; }
  }
  return res;
}
