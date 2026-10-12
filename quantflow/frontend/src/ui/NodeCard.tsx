// GENERIC NODE CARD: renders ANY NodeDef (ports with typed colour handles, params editor, live readouts, sparkline).
// Because every node renders from its definition, adding a node = adding one file in graph/nodes.
import { Fragment, memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { NODE_DEFS } from '../graph/registry';
import { defaultsOf, ParamDef, PORT_COLORS } from '../graph/types';
import { useStore } from '../runtime/store';

function Field({ d, v, on }: { d: ParamDef; v: any; on: (v: any) => void }) {
  if (d.kind === 'bool') return <input type="checkbox" className="nodrag" checked={!!v} onChange={(e) => on(e.target.checked)} />;
  if (d.kind === 'select') return <select className="nodrag" value={v} onChange={(e) => on(e.target.value)}>{d.options!.map((o) => <option key={o}>{o}</option>)}</select>;
  if (d.kind === 'color') return <input type="color" className="nodrag" value={v} onChange={(e) => on(e.target.value)} />;
  if (d.kind === 'number') return <input type="number" className="nodrag" value={v} min={d.min} max={d.max} step={d.step ?? 1} onChange={(e) => on(Number(e.target.value))} />;
  if (d.kind === 'textarea') return <textarea className="nodrag nowheel" value={v} onChange={(e) => on(e.target.value)} />;
  return <input type="text" className="nodrag" value={v} onChange={(e) => on(e.target.value)} />;
}
const Spark = ({ d }: { d: number[] }) => {
  if (d.length < 2) return null;
  const lo = Math.min(...d), hi = Math.max(...d), r = hi - lo || 1;
  return <svg width="100%" height="28" viewBox={`0 0 ${d.length - 1} 28`} preserveAspectRatio="none"><polyline fill="none" stroke="#22d3ee" strokeWidth="1.2" vectorEffect="non-scaling-stroke"
    points={d.map((y, i) => `${i},${26 - ((y - lo) / r) * 24}`).join(' ')} /></svg>;
};
export const NodeCard = memo(({ id, data, selected }: any) => {
  const def = NODE_DEFS[data.type];
  const r = useStore((s) => s.results[id]);
  const setParam = useStore((s) => s.setParam), removeNode = useStore((s) => s.removeNode);
  if (!def) return <div className="node">unknown node {data.type}</div>;
  const params = { ...defaultsOf(def), ...data.params };
  return (
    <div className={'node' + (selected ? ' sel' : '')} style={{ borderColor: def.color }} title={def.description}>
      <div className="node-h" style={{ background: def.color + '33' }}>
        <b style={{ color: def.color }}>{def.title}</b>
        <button className="x nodrag" title="delete node" onClick={() => removeNode(id)}>×</button>
      </div>
      {(def.inputs.length > 0 || def.outputs.length > 0) && (
        <div className="ports">
          <div className="col">{def.inputs.map((p) => (
            <div className="port in" key={p.id}><Handle type="target" position={Position.Left} id={p.id} style={{ background: PORT_COLORS[p.type] }} /><span>{p.label}</span><i>{p.type}</i></div>))}</div>
          <div className="col right">{def.outputs.map((p) => (
            <div className="port" key={p.id}><i>{p.type}</i><span>{p.label}</span><Handle type="source" position={Position.Right} id={p.id} style={{ background: PORT_COLORS[p.type] }} /></div>))}</div>
        </div>)}
      {def.params.length > 0 && (
        <div className="params">{def.params.map((d) => (<Fragment key={d.key}><label>{d.label}</label><Field d={d} v={params[d.key]} on={(v) => setParam(id, d.key, v)} /></Fragment>))}</div>)}
      <div className="readout">
        {r?._error && <div className="err">⚠ {r._error}</div>}
        {!r && <div className="mut">no data / cycle</div>}
        {r?._show && Object.entries(r._show).map(([k, v]) => <div key={k}><span className="mut">{k}</span><span>{String(v)}</span></div>)}
        {r?._spark && <Spark d={r._spark} />}
      </div>
    </div>);
});
