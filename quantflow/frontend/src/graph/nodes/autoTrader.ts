// AUTO TRADER NODE  (the only node that opens positions).
// In : signal, long, short (Chandelier stops), broker, volume, sl_points, tp_points, tp_rr, max_pos
//      (every number input overrides the same-named param when connected)
// Rules (all evaluated on the LAST CLOSED bar j = n-2, so nothing repaints):
//  1. Only when AUTO is armed in the top bar; signals that existed before arming are ignored.
//  2. one order per signal bar (idempotent key symbol:tf:barEpoch:dir; backend also dedupes).
//  3. SL: "chandelier" -> distance from entry to the Chandelier stop of the signal bar (converted to POINTS),
//         "points" -> fixed SL points, "none".   TP: "rr" -> SL distance * tp_rr, "points", "none".
//  4. max_pos: skip if open positions (after closing opposite ones when `reverse`) >= max_pos.
// Emits `order`/`close` actions + `_config` (pushed to backend risk guard) - see runtime/effects.ts.
import { NodeDef, P } from '../types';
import { num } from '../../lib/series';
export const autoTraderNode: NodeDef = {
  type: 'autoTrader', title: 'Auto Trader', category: 'Trading', color: '#10b981', description: 'Turns closed-bar signals into paper/MT5 orders.',
  inputs: [P('signal', 'signal', 'signal'), P('long', 'long_stop', 'series'), P('short', 'short_stop', 'series'), P('broker', 'broker', 'text'),
    P('volume', 'volume', 'number'), P('sl_points', 'sl_points', 'number'), P('tp_points', 'tp_points', 'number'), P('tp_rr', 'tp_rr', 'number'), P('max_pos', 'max_pos', 'number')],
  outputs: [P('count', 'open count', 'number')],
  params: [
    { key: 'broker', label: 'broker', kind: 'select', default: 'paper', options: ['paper', 'mt5'] },
    { key: 'volume', label: 'volume', kind: 'number', default: 0.1, min: 0.01, step: 0.01 },
    { key: 'sl_mode', label: 'SL mode', kind: 'select', default: 'chandelier', options: ['chandelier', 'points', 'none'] },
    { key: 'sl_points', label: 'SL points', kind: 'number', default: 50, min: 1 },
    { key: 'tp_mode', label: 'TP mode', kind: 'select', default: 'rr', options: ['rr', 'points', 'none'] },
    { key: 'tp_points', label: 'TP points', kind: 'number', default: 100, min: 1 },
    { key: 'tp_rr', label: 'TP R:R', kind: 'number', default: 2, min: 0.1, step: 0.1 },
    { key: 'max_pos', label: 'max positions', kind: 'number', default: 2, min: 1, max: 5 },
    { key: 'reverse', label: 'close opposite', kind: 'bool', default: true },
    { key: 'max_daily_loss', label: 'max daily loss', kind: 'number', default: 50, min: 1 },
    { key: 'max_trades', label: 'max trades/day', kind: 'number', default: 20, min: 1 },
  ],
  compute(inp, p, ctx, id) {
    const m = ctx.mem(id), c = ctx.candles, n = c.length, j = n - 2, sig: number[] = inp.signal ?? [];
    const broker = (inp.broker as string) || p.broker, vol = num(inp.volume, p.volume), slPts = num(inp.sl_points, p.sl_points);
    const tpPts = num(inp.tp_points, p.tp_points), rr = num(inp.tp_rr, p.tp_rr), maxPos = Math.round(num(inp.max_pos, p.max_pos));
    const mine = ctx.positions.filter((x) => x.symbol === ctx.symbol);
    const actions: any[] = []; let note = ctx.armed ? 'armed - waiting' : 'DISARMED';
    m.fired ??= new Set<number>();
    if (j >= 0) {
      const ep = c[j].time;
      if (!ctx.armed || m.baseline == null) m.baseline = ep;                 // remember last bar seen while disarmed
      else if (sig[j] && ep > m.baseline && !m.fired.has(ep)) {
        m.fired.add(ep);
        const side = sig[j] > 0 ? 'buy' : 'sell', px = c[n - 1].close;
        const opp = mine.filter((x) => x.side !== side);
        if (p.reverse) opp.forEach((x) => actions.push({ kind: 'close', key: `cl:${ep}:${x.ticket}`, ticket: x.ticket }));
        const remaining = mine.length - (p.reverse ? opp.length : 0);
        if (remaining >= maxPos) note = `skip: max positions ${maxPos}`;
        else {
          const stop = side === 'buy' ? inp.long?.[j] : inp.short?.[j];
          let sl = 0;
          if (p.sl_mode === 'chandelier') { const d = stop != null ? Math.abs(px - stop) / ctx.point : 0; sl = d > 0 ? d : slPts; }
          else if (p.sl_mode === 'points') sl = slPts;
          const tp = p.tp_mode === 'rr' ? sl * rr : p.tp_mode === 'points' ? tpPts : 0;
          actions.push({ kind: 'order', key: `ord:${ep}:${sig[j]}`, side, lots: vol, sl_points: +sl.toFixed(2), tp_points: +tp.toFixed(2), broker, idem: `${ctx.symbol}:${ctx.tf}:${ep}:${sig[j]}` });
          note = `${side.toUpperCase()} sent (SL ${sl.toFixed(1)} / TP ${tp.toFixed(1)} pts)`;
        }
      }
    }
    m.lastNote = actions.length || !ctx.armed ? note : m.lastNote ?? note;
    return { count: mine.length, _actions: actions, _broker: broker,
      _config: { lots: vol, max_concurrent_positions: maxPos, stop_loss_points: Math.max(slPts, 1), take_profit_points: Math.max(tpPts, 1), max_daily_loss: p.max_daily_loss, max_trades_per_day: Math.round(p.max_trades) },
      _show: { status: m.lastNote, broker: ctx.live ? broker : 'local paper', volume: vol, open: `${mine.length}/${maxPos}` } };
  },
};
