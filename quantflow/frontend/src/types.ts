// Shared data shapes. All times are UTC epoch SECONDS. Timezone (UTC/IST) is applied only when DISPLAYING.
export interface Candle { time: number; open: number; high: number; low: number; close: number }
export interface Tick { time: number; price: number }
export interface Position {
  ticket: string; symbol: string; side: 'buy' | 'sell'; lots: number;
  open_price: number; open_time: number; sl: number | null; tp: number | null;
  profit: number; current_price: number;
}
export interface Account { broker: string; balance: number; equity: number; margin?: number; currency: string; connected: boolean }
export interface ClosedTrade {
  ticket: string; symbol: string; side: 'buy' | 'sell'; lots: number;
  open_price: number; close_price: number; open_time: number; close_time: number; profit: number; reason?: string;
}
export interface OrderRow { ts: number; symbol: string; side: string; lots: number; accepted: number; reject_reason?: string | null; fill_price?: number | null; source?: string; broker?: string; ticket?: string | null }
export interface SignalRow { ts: number; symbol: string; tf: number; side: 'BUY' | 'SELL'; price: number; bar: number; node: string }
export type Tz = 'UTC' | 'IST';
export type Mode = 'live' | 'offline';

// ---- drawing primitives that ANY node may emit in its `_draw` array; the chart renders them ----
export type DrawItem =
  | { kind: 'line'; id: string; color: string; width: number; data: (number | null)[]; title?: string }
  | { kind: 'points'; id: string; color: string; size: number; data: (number | null)[] }
  | { kind: 'marker'; index: number; position: 'aboveBar' | 'belowBar'; shape: 'arrowUp' | 'arrowDown' | 'circle' | 'square'; color: string; text?: string }
  | { kind: 'candle'; index: number; color: string };
