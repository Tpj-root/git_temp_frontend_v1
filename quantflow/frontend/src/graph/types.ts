// NODE SYSTEM CONTRACT. Every node = one NodeDef (one file in ./nodes).
// compute(inputs, params, ctx) is a PURE function (state lives only in ctx.mem(id)).
// Special keys a node may return besides its output ports:
//   _show   {label: value}  telemetry printed in the node card
//   _spark  number[]        mini sparkline in the card
//   _draw   DrawItem[]      things the chart should draw (lines, points, markers, candle colours)
//   _actions Action[]       side effects (order / close / modify) executed by runtime/effects.ts
//   _config {...}           risk config pushed to backend PUT /api/config
//   _error  string          shown in red
import { Account, Candle, Position, Tick, Tz } from '../types';
export type PortType = 'ticks' | 'candles' | 'anchors' | 'series' | 'number' | 'signal' | 'position' | 'text' | 'any';
export const PORT_COLORS: Record<PortType, string> = {
  ticks: '#34d399', candles: '#22d3ee', anchors: '#fbbf24', series: '#60a5fa', number: '#93c5fd',
  signal: '#f472b6', position: '#fb923c', text: '#a78bfa', any: '#94a3b8',
};
const NUMERIC: PortType[] = ['series', 'number'];
/** Connection rule: equal types, 'any' with anything, and series<->number (scalars broadcast). */
export const compatible = (a: PortType, b: PortType) =>
  a === 'any' || b === 'any' || a === b || (NUMERIC.includes(a) && NUMERIC.includes(b));

export interface PortDef { id: string; label: string; type: PortType }
export interface ParamDef {
  key: string; label: string; kind: 'number' | 'select' | 'bool' | 'text' | 'textarea' | 'color';
  default: any; options?: string[]; min?: number; max?: number; step?: number;
}
export interface EvalCtx {
  candles: Candle[]; tick: Tick | null; tickCount: number; symbol: string; tf: number; point: number;
  positions: Position[]; account: Account | null; clock: number; live: boolean;
  feedState: string; armed: boolean; tz: Tz; mem: (id: string) => any;
}
export interface NodeDef {
  type: string; title: string; category: string; color: string; description: string;
  inputs: PortDef[]; outputs: PortDef[]; params: ParamDef[];
  compute: (inp: Record<string, any>, p: Record<string, any>, ctx: EvalCtx, id: string) => Record<string, any>;
}
export const P = (id: string, label: string, type: PortType): PortDef => ({ id, label, type });
export const defaultsOf = (d: NodeDef) => Object.fromEntries(d.params.map((x) => [x.key, x.default]));
