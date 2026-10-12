// DELAY NODE. In: signal. Out: signal (same series, but the newest closed-bar signal is MASKED
// until buy_delay / sell_delay seconds have elapsed since it was first seen), plus a countdown.
// The card shows e.g. "BUY waiting 3.8s"; TopBar also shows it. Uses ctx.clock so it also
// works in OFFLINE replay (clock = replayed tick time).
import { NodeDef, P } from '../types';
export const delayNode: NodeDef = {
  type: 'delay', title: 'Signal Delay', category: 'Signal', color: '#f97316',
  description: 'Holds a signal N seconds before releasing it to execution.',
  inputs: [P('signal', 'signal', 'signal')], outputs: [P('signal', 'verified', 'signal')],
  params: [
    { key: 'enabled', label: 'enabled', kind: 'bool', default: true },
    { key: 'buy_delay', label: 'buy delay s', kind: 'number', default: 5, min: 0, max: 3600 },
    { key: 'sell_delay', label: 'sell delay s', kind: 'number', default: 5, min: 0, max: 3600 },
  ],
  compute(inp, p, ctx, id) {
    const sig: number[] = inp.signal ?? [], out = sig.slice(), m = ctx.mem(id);
    m.seen ??= {};
    const j = sig.length - 2; let pending: any = null;
    if (p.enabled && j >= 0 && sig[j] !== 0) {
      const key = ctx.candles[j]?.time + ':' + sig[j];
      if (m.seen[key] == null) m.seen[key] = ctx.clock;
      const delay = sig[j] > 0 ? p.buy_delay : p.sell_delay, remain = m.seen[key] + delay - ctx.clock;
      if (remain > 0) { out[j] = 0; pending = { side: sig[j] > 0 ? 'BUY' : 'SELL', remaining: remain, delay }; }
    }
    return { signal: out, _pending: pending,
      _show: { state: pending ? `${pending.side} waiting ${pending.remaining.toFixed(1)}s` : p.enabled ? 'ready' : 'passthrough' } };
  },
};
