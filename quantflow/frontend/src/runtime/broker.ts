// BROKER FACADE: the nodes only emit actions; this file decides WHERE they go.
//   LIVE    -> backend REST (paper or MT5, server-side risk guard still applies)
//   OFFLINE -> local OfflineBroker (CSV replay)
import { api } from '../lib/api';
import { offlineBroker } from './offlineBroker';
import { pointOf, useStore } from './store';

export async function placeOrder(a: { side: 'buy' | 'sell'; lots: number; sl_points: number; tp_points: number; idem: string }) {
  const s = useStore.getState();
  if (s.mode === 'offline') {
    const px = s.candles[s.candles.length - 1]?.close; if (px == null) return { ok: false };
    offlineBroker.place(s.symbol, a.side, a.lots, a.sl_points, a.tp_points, px, s.clock, pointOf(s));
    s.set({ positions: [...offlineBroker.positions.values()].map((p) => ({ ...p })), orders: offlineBroker.orders.slice(0, 300), account: offlineBroker.account() });
    return { ok: true };
  }
  // source "auto": the backend requires auto mode to be armed (top-bar AUTO button does POST /api/mode)
  return api('/api/order', 'POST', { symbol: s.symbol, side: a.side, lots: a.lots, sl: a.sl_points, tp: a.tp_points, source: 'auto', idem_key: a.idem });
}
export async function closePosition(ticket: string) {
  const s = useStore.getState();
  if (s.mode === 'offline') { const p = offlineBroker.positions.get(ticket); if (p) offlineBroker.close(ticket, s.candles[s.candles.length - 1].close, s.clock, pointOf(s)); sync(); return; }
  await api(`/api/close?ticket=${ticket}`, 'POST');
}
export async function closeAll() {
  const s = useStore.getState();
  if (s.mode === 'offline') { [...offlineBroker.positions.keys()].forEach((t) => closePosition(t)); return; }
  await api('/api/close-all', 'POST');
}
export async function modifySl(ticket: string, sl: number) {
  const s = useStore.getState();
  if (s.mode === 'offline') { offlineBroker.modify(ticket, sl); sync(); return; }
  await api('/api/modify', 'POST', { ticket, sl });
}
function sync() { useStore.getState().set({ positions: [...offlineBroker.positions.values()].map((p) => ({ ...p })), account: offlineBroker.account(), closedTrades: [...offlineBroker.trades] }); }

/** Top-bar AUTO button. Live: arms/disarms the backend risk guard bound to the CURRENT symbol+timeframe. */
export async function setArmed(on: boolean) {
  const s = useStore.getState();
  if (s.mode === 'live') {
    try { await api('/api/mode', 'POST', on ? { mode: 'auto', symbol: s.symbol, granularity: s.tf } : { mode: 'manual' }); }
    catch (e: any) { s.notify(e.message); return; }
  }
  s.set({ autoArmed: on });
}
export async function kill() {
  const s = useStore.getState();
  if (s.mode === 'live') { try { await api('/api/kill', 'POST'); } catch (e: any) { s.notify(e.message); } }
  else closeAll();
  s.set({ autoArmed: false });
}
