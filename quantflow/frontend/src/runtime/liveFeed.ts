// LIVE FEED: connects to backend WebSocket /stream (messages {type,data}) and mirrors it into the store.
//   status   -> feed health, broker, mode           history -> full candle array for (symbol,granularity)
//   ohlc     -> forming-bar update                  positions -> open positions + account
//   order / alert -> order list rows, toasts        (backend `signal` events are ignored: signals come from the node graph)
import { api, wsUrl } from '../lib/api';
import { useStore } from './store';
import { Candle } from '../types';
let ws: WebSocket | null = null, retry: any = null, alive = false;
const toCandle = (c: any): Candle => ({ time: c.epoch, open: c.open, high: c.high, low: c.low, close: c.close });

export function startLive() {
  stopLive(); alive = true; open(); loadSymbols(); loadMarket();
}
export function stopLive() { alive = false; clearTimeout(retry); ws?.close(); ws = null; useStore.getState().set({ feed: { wsOpen: false, state: 'idle', transport: '-', stale: true } }); }

function open() {
  const S = useStore.getState();
  S.set({ feed: { ...S.feed, wsOpen: false, state: 'connecting' } });
  ws = new WebSocket(wsUrl());
  ws.onopen = () => { const s = useStore.getState(); s.set({ feed: { ...s.feed, wsOpen: true, state: 'live' } }); loadMarket(); };
  ws.onclose = () => { const s = useStore.getState(); s.set({ feed: { ...s.feed, wsOpen: false, state: 'backend offline', stale: true } }); if (alive) retry = setTimeout(open, 3000); };
  ws.onmessage = (ev) => { try { handle(JSON.parse(ev.data)); } catch (e) { console.error(e); } };
}

function handle(m: { type: string; data: any }) {
  const s = useStore.getState(), d = m.data;
  if (s.mode !== 'live') return;
  if (m.type === 'status') {
    s.set({ feed: { wsOpen: true, state: d.feed, transport: d.transport, stale: d.symbol_stale?.[s.symbol] ?? d.feed_stale }, account: d.broker ?? s.account, backendBroker: d.broker?.broker ?? s.backendBroker, backendMode: d.mode });
  } else if (m.type === 'history' && d.symbol === s.symbol && d.granularity === s.tf) {
    s.set({ candles: d.candles.map(toCandle) });
  } else if (m.type === 'ohlc' && d.symbol === s.symbol && d.granularity === s.tf) {
    const c = s.candles.slice(), b = toCandle(d.bar), last = c[c.length - 1];
    if (last && last.time === b.time) c[c.length - 1] = b; else if (!last || b.time > last.time) c.push(b);
    s.set({ candles: c, tick: { time: Date.now() / 1000, price: b.close }, tickCount: s.tickCount + 1, clock: Date.now() / 1000 });
  } else if (m.type === 'positions') {
    s.set({ positions: d.positions, account: d.account });
  } else if (m.type === 'order') {
    s.set({ orders: [{ ts: Date.now() / 1000, symbol: d.symbol, side: d.side, lots: d.lots ?? 0, accepted: d.ok ? 1 : 0, reject_reason: d.ok ? null : `${d.reason ?? ''} ${d.detail ?? d.message ?? ''}`, fill_price: d.price, source: d.source, ticket: d.ticket }, ...s.orders].slice(0, 300) });
  } else if (m.type === 'alert') s.notify(d.message);
}

export async function loadSymbols() {
  try { const r = await api('/api/symbols'); useStore.getState().set({ symbols: r.symbols.map((x: any) => ({ code: x.code, display: x.display, point: x.point })) }); } catch {}
}
/** (Re)subscribe the backend to symbol/timeframe and load its candles. Also loads recent orders. */
export async function loadMarket() {
  const s = useStore.getState(); if (s.mode !== 'live') return;
  try {
    const r = await api(`/api/candles?symbol=${s.symbol}&tf=${s.tf}&count=1000`);
    s.set({ candles: r.candles.map(toCandle), tick: r.candles.length ? { time: Date.now() / 1000, price: r.candles[r.candles.length - 1].close } : null });
    const o = await api('/api/log?table=orders&limit=100');
    s.set({ orders: o.rows.map((x: any) => ({ ts: x.ts, symbol: x.symbol, side: x.side, lots: x.lots, accepted: x.accepted, reject_reason: x.reject_reason, fill_price: x.fill_price, source: x.source, broker: x.broker, ticket: x.ticket })) });
  } catch (e: any) { s.notify('Backend: ' + e.message); }
}
