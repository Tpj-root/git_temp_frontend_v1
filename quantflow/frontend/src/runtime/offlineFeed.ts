// OFFLINE FEED: replay a tick CSV (times,prices) through the SAME node graph. No backend needed.
// Replay speed = ticks per second. A warm-up of ~60 bars is preloaded so indicators are ready immediately.
import { parseTicksCsv } from '../lib/csv';
import { applyTickMut, ticksToCandles } from '../lib/candles';
import { Tick } from '../types';
import { offlineBroker } from './offlineBroker';
import { pointOf, useStore } from './store';
let ticks: Tick[] = [], idx = 0, timer: any = null, acc = 0;

export function loadCsv(text: string, name: string) {
  const S = useStore.getState(); ticks = parseTicksCsv(text);
  if (!ticks.length) { S.notify('CSV has no valid ticks (need header: times,prices)'); return; }
  const sym = name.match(/(frx\w+?|stpRNG|R_\d+|1HZ\w+?)(?=_|\.|$)/)?.[1]; if (sym) S.set({ symbol: sym });
  offlineBroker.reset(); pause(); rebuild(true); S.notify(`Loaded ${ticks.length.toLocaleString()} ticks from ${name}`);
  S.set({ offline: { ...useStore.getState().offline, name, total: ticks.length } });
}
/** rebuild candles from ticks[0..idx). warm=true -> choose idx so ~60 bars exist (also used on restart). */
export function rebuild(warm = false) {
  const S = useStore.getState(), tf = S.tf;
  if (warm) { const seen = new Set<number>(); idx = ticks.length; for (let i = 0; i < ticks.length; i++) { seen.add(Math.floor(ticks[i].time / tf)); if (seen.size >= 60) { idx = i + 1; break; } } if (idx > ticks.length * 0.6) idx = Math.floor(ticks.length * 0.2); }
  const c = ticksToCandles(ticks.slice(0, idx), tf), last = ticks[idx - 1];
  S.set({ candles: c, tick: last ?? null, clock: last?.time ?? 0, offline: { ...S.offline, idx, total: ticks.length } });
}
function pump() {
  const S = useStore.getState(); acc += S.offline.speed * 0.05;
  let n = Math.floor(acc); acc -= n; if (n <= 0) return;
  const c = S.candles.map((b) => ({ ...b })), point = pointOf(S);   // copy once per batch
  let last: Tick | null = null;
  while (n-- > 0 && idx < ticks.length) { last = ticks[idx++]; applyTickMut(c, last, S.tf); offlineBroker.mark(last.price, last.time, point); }
  if (!last) { pause(); S.notify('Replay finished'); return; }
  S.set({ candles: c, tick: last, clock: last.time, tickCount: S.tickCount + 1, positions: [...offlineBroker.positions.values()].map((p) => ({ ...p })), account: offlineBroker.account(),
    orders: offlineBroker.orders.slice(0, 300), closedTrades: [...offlineBroker.trades], offline: { ...S.offline, idx } });
}
export const play = () => { if (!ticks.length || timer) return; timer = setInterval(pump, 50); useStore.getState().set({ offline: { ...useStore.getState().offline, playing: true } }); };
export function pause() { clearInterval(timer); timer = null; const o = useStore.getState().offline; useStore.getState().set({ offline: { ...o, playing: false } }); }
export const setSpeed = (v: number) => useStore.getState().set({ offline: { ...useStore.getState().offline, speed: v } });
export function restart() { pause(); offlineBroker.reset(); useStore.getState().set({ positions: [], closedTrades: [], orders: [], signals: [] }); rebuild(true); }
export const hasTicks = () => ticks.length > 0;
