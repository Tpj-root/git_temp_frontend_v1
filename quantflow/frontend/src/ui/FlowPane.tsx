// RIGHT SIDE: node editor (xyflow). Drag handle->handle to ATTACH, select an edge + Backspace (or double-click it) to DETACH,
// drag an edge end onto another handle to RE-ATTACH. Ports are type-checked (see compatible() in graph/types.ts).
// Mouse wheel / pinch = zoom like TradingView, drag background = pan, +/-/fit controls bottom-left.
import { useState } from 'react';
import { Background, Controls, MiniMap, ReactFlow, ReactFlowProvider, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { NodeCard } from './NodeCard';
import { NODE_DEFS, NODE_LIST } from '../graph/registry';
import { compatible } from '../graph/types';
import { useStore } from '../runtime/store';
const nodeTypes = { qf: NodeCard };

function Inner() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onReconnect, addNode, resetGraph } = useStore();
  const rf = useReactFlow(); const [open, setOpen] = useState(false);
  const cats = [...new Set(NODE_LIST.map((n) => n.category))];
  const isValid = (c: any) => {
    const sn = nodes.find((n) => n.id === c.source), tn = nodes.find((n) => n.id === c.target); if (!sn || !tn || c.source === c.target) return false;
    const so = NODE_DEFS[sn.data.type]?.outputs.find((p) => p.id === c.sourceHandle), ti = NODE_DEFS[tn.data.type]?.inputs.find((p) => p.id === c.targetHandle);
    return !!so && !!ti && compatible(so.type, ti.type);
  };
  return (
    <>
      <div className="flowbar">
        <button className={open ? 'on' : ''} onClick={() => setOpen(!open)}>＋ Add node</button>
        <button onClick={() => rf.fitView({ padding: 0.1, duration: 300 })}>Fit</button>
        <button onClick={() => confirm('Reset graph to default pipeline?') && (resetGraph(), setTimeout(() => rf.fitView(), 50))}>Reset</button>
        <span className="mut" style={{ alignSelf: 'center' }}>{nodes.length} nodes · {edges.length} wires · dbl-click wire = detach</span>
      </div>
      {open && (<div className="palette">{cats.map((c) => (<div key={c}><h4>{c.toUpperCase()}</h4>{NODE_LIST.filter((n) => n.category === c).map((n) => (
        <button key={n.type} title={n.description} onClick={() => { addNode(n.type, rf.screenToFlowPosition({ x: window.innerWidth * 0.75, y: 150 + Math.random() * 120 })); setOpen(false); }}>
          <span style={{ color: n.color }}>●</span> {n.title}<div className="mut" style={{ fontSize: 9 }}>in {n.inputs.length} · out {n.outputs.length} · params {n.params.length}</div></button>))}</div>))}</div>)}
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
        onReconnect={onReconnect} isValidConnection={isValid} edgesReconnectable deleteKeyCode={['Backspace', 'Delete']}
        onEdgeDoubleClick={(_, e) => onEdgesChange([{ type: 'remove', id: e.id }])}
        fitView minZoom={0.1} maxZoom={2} colorMode="dark" defaultEdgeOptions={{ animated: true, style: { stroke: '#22c55e' } }} proOptions={{ hideAttribution: true }}>
        <Background color="#1e2638" gap={20} /><Controls /><MiniMap pannable zoomable nodeColor="#2a3550" maskColor="rgba(11,14,20,.75)" />
      </ReactFlow>
    </>);
}
export const FlowPane = () => <ReactFlowProvider><Inner /></ReactFlowProvider>;
