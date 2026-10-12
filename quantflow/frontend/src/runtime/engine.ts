// ENGINE LOOP: every 300 ms -> build context from the store -> evaluate the node graph -> publish results -> run effects.
// A timer (not "on every tick") keeps the UI smooth at 1000-ticks/s replay speed and lets the Delay node count down.
import { evaluate } from '../graph/evaluate';
import { EvalCtx } from '../graph/types';
import { runEffects } from './effects';
import { pointOf, useStore } from './store';
const memory = new Map<string, any>();
export function startEngine() {
  const step = () => {
    const s = useStore.getState();
    const ctx: EvalCtx = {
      candles: s.candles, tick: s.tick, tickCount: s.tickCount, symbol: s.symbol, tf: s.tf, point: pointOf(s), positions: s.positions, account: s.account,
      clock: s.mode === 'live' ? Date.now() / 1000 : s.clock, live: s.mode === 'live',
      feedState: s.mode === 'live' ? s.feed.state + (s.feed.stale ? ' (STALE)' : '') : 'replay', armed: s.autoArmed, tz: s.tz,
      mem: (id) => { let m = memory.get(id); if (!m) memory.set(id, (m = {})); return m; },
    };
    const results = s.candles.length ? evaluate(s.nodes, s.edges, ctx) : {};
    s.set({ results });
    runEffects(results);
  };
  const t = setInterval(step, 300);
  return () => clearInterval(t);
}
