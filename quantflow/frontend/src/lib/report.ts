// PROFIT REPORT from closed trades (same function for live DB trades and offline trades).
import { ClosedTrade } from '../types';
export function buildReport(trades: ClosedTrade[]) {
  const t = [...trades].sort((a, b) => a.close_time - b.close_time);
  const wins = t.filter((x) => x.profit > 0), losses = t.filter((x) => x.profit <= 0);
  const gp = wins.reduce((a, x) => a + x.profit, 0), gl = Math.abs(losses.reduce((a, x) => a + x.profit, 0));
  let eq = 0, peak = 0, mdd = 0; const curve: number[] = [];
  for (const x of t) { eq += x.profit; curve.push(eq); peak = Math.max(peak, eq); mdd = Math.max(mdd, peak - eq); }
  const byDay: Record<string, number> = {};
  for (const x of t) { const d = new Date(x.close_time * 1000).toISOString().slice(0, 10); byDay[d] = (byDay[d] || 0) + x.profit; }
  return {
    trades: t.length, wins: wins.length, losses: losses.length,
    winRate: t.length ? (wins.length / t.length) * 100 : 0,
    net: eq, grossProfit: gp, grossLoss: gl, profitFactor: gl > 0 ? gp / gl : null,
    avgWin: wins.length ? gp / wins.length : 0, avgLoss: losses.length ? -gl / losses.length : 0,
    expectancy: t.length ? eq / t.length : 0,
    best: t.length ? Math.max(...t.map((x) => x.profit)) : 0, worst: t.length ? Math.min(...t.map((x) => x.profit)) : 0,
    maxDrawdown: mdd, curve, byDay,
  };
}
