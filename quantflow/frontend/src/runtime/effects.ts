// EFFECT RUNNER. Nodes are pure; anything that touches the outside world is an Action returned in `_actions`.
// Here we (1) execute actions once (dedupe by action.key), (2) play the buy/sell sound, (3) push the risk config
// to the backend, (4) switch broker, (5) record signals, (6) snapshot node values into the backend .db every 5 s.
import { api } from '../lib/api';
import { playSignal } from '../lib/sound';
import { closePosition, modifySl, placeOrder } from './broker';
import { useStore } from './store';
import { NODE_DEFS } from '../graph/registry';

const done = new Set<string>();       // action keys already executed
let busy = false, lastCfg = '', lastBroker = '', lastSnap = 0, cfgCache: any = null;
const seenSignals = new Set<string>();

export async function runEffects(results: Record<string, any>) {
  const s = useStore.getState();
  // ---- signals list (every chandelier signal on a closed bar, once) ----
  for (const [id, r] of Object.entries(results)) {
    const ev = r?._signalEvent; if (!ev) continue;
    const k = `${id}:${ev.epoch}`; if (seenSignals.has(k)) continue; seenSignals.add(k);
    s.set({ signals: [{ ts: ev.epoch, symbol: s.symbol, tf: s.tf, side: ev.side, price: ev.price, bar: ev.epoch, node: id }, ...useStore.getState().signals].slice(0, 200) });
  }
  if (busy) return; busy = true;
  try {
    // ---- merge risk config + broker choice from AutoTrader nodes ----
    let cfg: any = null, broker = '';
    for (const r of Object.values(results)) { if (r?._config) cfg = r._config; if (r?._broker) broker = r._broker; }
    if (s.mode === 'live') {
      if (cfg && JSON.stringify(cfg) !== lastCfg) {
        try {
          cfgCache ??= await api('/api/config');
          await api('/api/config', 'PUT', { ...cfgCache, auto: { ...cfgCache.auto, ...cfg }, manual: { ...cfgCache.manual, lots: cfg.lots } });
          lastCfg = JSON.stringify(cfg);
        } catch (e: any) { lastCfg = JSON.stringify(cfg); s.notify('Config push: ' + e.message); }
      }
      if (broker && s.backendBroker !== '-' && broker !== s.backendBroker && broker !== lastBroker) {
        lastBroker = broker;
        try { await api('/api/broker', 'POST', { kind: broker }); s.notify(`Broker switched to ${broker.toUpperCase()}`); } catch (e: any) { s.notify('Broker switch: ' + e.message); }
      }
      if (broker === s.backendBroker) lastBroker = '';
    }
    // ---- actions ----
    for (const r of Object.values(results)) for (const a of r?._actions ?? []) {
      if (done.has(a.key)) continue; done.add(a.key);
      try {
        if (a.kind === 'close') await closePosition(a.ticket);
        else if (a.kind === 'modify') await modifySl(a.ticket, a.sl);
        else if (a.kind === 'order') {
          const res: any = await placeOrder(a);
          if (res?.ok) { if (s.soundOn && useStore.getState().autoArmed) playSignal(a.side); }
          else s.notify(`Order rejected: ${res?.reason ?? ''} ${res?.detail ?? res?.message ?? ''}`);
        }
      } catch (e: any) { s.notify(`${a.kind} failed: ${e.message}`); }
    }
    // ---- DB snapshot (live or offline; silently skipped if the backend is not reachable) ----
    if (s.persist && Date.now() - lastSnap > 5000) {
      lastSnap = Date.now();
      const rows: any[] = [];
      for (const [id, r] of Object.entries(results)) for (const [k, v] of Object.entries(r?._show ?? {})) rows.push({ node: id, key: k, value: typeof v === 'number' ? v : parseFloat(String(v)), text: String(v) });
      const acc = s.account; if (acc) rows.push({ node: 'account', key: 'equity', value: acc.equity, text: String(acc.equity) }, { node: 'account', key: 'balance', value: acc.balance, text: String(acc.balance) });
      if (rows.length) api('/api/db/node_values', 'POST', { symbol: s.symbol, mode: s.mode, rows }).catch(() => {});
    }
  } finally { busy = false; }
}
void NODE_DEFS;
