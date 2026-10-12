// GLOBAL STATE (zustand). One store for market data, broker state, UI toggles and the node graph.
// The graph (nodes+edges+params) is auto-saved to localStorage so your layout survives a refresh.
import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, addEdge, reconnectEdge } from '@xyflow/react';
import { Account, Candle, ClosedTrade, Mode, OrderRow, Position, SignalRow, Tick, Tz } from '../types';
import { defaultGraph } from '../graph/presets';

const KEY = 'qf_graph_v1';
function loadGraph() { try { const g = JSON.parse(localStorage.getItem(KEY) || ''); if (g?.nodes?.length) return g; } catch {} return defaultGraph(); }
const g0 = loadGraph();

export interface SymbolInfo { code: string; display: string; point: number }
export const FALLBACK_SYMBOLS: SymbolInfo[] = [{ code: 'stpRNG', display: 'Step Index', point: 0.1 }, { code: 'frxXAUUSD', display: 'Gold/USD', point: 0.01 }];

export interface S {
  mode: Mode; symbol: string; tf: number; tz: Tz; soundOn: boolean; autoArmed: boolean; persist: boolean;
  symbols: SymbolInfo[];
  candles: Candle[]; tick: Tick | null; tickCount: number; clock: number;
  feed: { wsOpen: boolean; state: string; transport: string; stale: boolean };
  backendBroker: string; backendMode: string;
  positions: Position[]; account: Account | null; orders: OrderRow[]; signals: SignalRow[]; closedTrades: ClosedTrade[];
  offline: { name: string; total: number; idx: number; playing: boolean; speed: number };
  toast: string | null;
  nodes: any[]; edges: any[]; results: Record<string, any>;
  set: (p: Partial<S>) => void;
  notify: (m: string) => void;
  onNodesChange: (c: any) => void; onEdgesChange: (c: any) => void; onConnect: (c: any) => void; onReconnect: (o: any, c: any) => void;
  setParam: (id: string, k: string, v: any) => void; addNode: (type: string, pos: { x: number; y: number }) => void; removeNode: (id: string) => void;
  resetGraph: () => void;
}
let toastTimer: any;
export const useStore = create<S>()((set, get) => ({
  mode: 'live', symbol: 'stpRNG', tf: 60, tz: 'UTC', soundOn: true, autoArmed: false, persist: true, symbols: FALLBACK_SYMBOLS,
  candles: [], tick: null, tickCount: 0, clock: Date.now() / 1000,
  feed: { wsOpen: false, state: 'connecting', transport: '-', stale: true }, backendBroker: '-', backendMode: 'manual',
  positions: [], account: null, orders: [], signals: [], closedTrades: [],
  offline: { name: '', total: 0, idx: 0, playing: false, speed: 10 }, toast: null,
  nodes: g0.nodes, edges: g0.edges, results: {},
  set: (p) => set(p),
  notify: (m) => { set({ toast: m }); clearTimeout(toastTimer); toastTimer = setTimeout(() => set({ toast: null }), 7000); },
  onNodesChange: (c) => set({ nodes: applyNodeChanges(c, get().nodes) }),
  onEdgesChange: (c) => set({ edges: applyEdgeChanges(c, get().edges) }),          // delete edge = DETACH
  onConnect: (c) => set({ edges: addEdge({ ...c, animated: true }, get().edges.filter((e) => !(e.target === c.target && e.targetHandle === c.targetHandle))) }), // drag handle->handle = ATTACH (one wire per input)
  onReconnect: (o, c) => set({ edges: reconnectEdge(o, c, get().edges) }),          // drag an edge end to move it
  setParam: (id, k, v) => set({ nodes: get().nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, params: { ...n.data.params, [k]: v } } } : n)) }),
  addNode: (type, pos) => set({ nodes: [...get().nodes, { id: `${type}_${Date.now().toString(36)}`, type: 'qf', position: pos, data: { type, params: {} } }] }),
  removeNode: (id) => set({ nodes: get().nodes.filter((n) => n.id !== id), edges: get().edges.filter((e) => e.source !== id && e.target !== id) }),
  resetGraph: () => { const g = defaultGraph(); set({ nodes: g.nodes, edges: g.edges }); },
}));
// auto-save graph (debounced)
let saveT: any;
useStore.subscribe((s, p) => {
  if (s.nodes === p.nodes && s.edges === p.edges) return;
  clearTimeout(saveT);
  saveT = setTimeout(() => localStorage.setItem(KEY, JSON.stringify({ nodes: s.nodes.map(({ selected, dragging, measured, ...n }: any) => n), edges: s.edges })), 400);
});
export const pointOf = (s: S) => s.symbols.find((x) => x.code === s.symbol)?.point ?? 0.1;
