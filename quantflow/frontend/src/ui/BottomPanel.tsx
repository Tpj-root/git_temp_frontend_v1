// BOTTOM TABS: Positions (with #1/#2 + TOTAL row) · Signal status · Order list · Profit report.
// Report data: LIVE -> backend /api/trades (stored in the .db); OFFLINE -> local broker trades.
import { useEffect, useState } from 'react';
import { useStore } from '../runtime/store';
import { api } from '../lib/api';
import { fmt } from '../lib/time';
import { buildReport } from '../lib/report';
import { closeAll, closePosition } from '../runtime/broker';
import { ClosedTrade } from '../types';

const pc = (v: number) => (v >= 0 ? 'up' : 'dn');
export function BottomPanel() {
  const [tab, setTab] = useState<'pos' | 'sig' | 'ord' | 'rep'>('pos');
  const s = useStore(); const [dbTrades, setDb] = useState<ClosedTrade[]>([]);
  useEffect(() => {
    if (tab !== 'rep' || s.mode !== 'live') return;
    const load = () => api('/api/trades').then((r) => setDb(r.rows)).catch(() => {}); load(); const t = setInterval(load, 5000); return () => clearInterval(t);
  }, [tab, s.mode]);
  const pos = s.positions.filter((p) => p.symbol === s.symbol || true), tot = pos.reduce((a, p) => a + p.profit, 0), vol = pos.reduce((a, p) => a + p.lots, 0);
  const ce: any = Object.values(s.results).find((r: any) => r?._signalEvent !== undefined && r?.direction !== undefined) as any;
  const pend: any = Object.values(s.results).map((r: any) => r?._pending).find(Boolean);
  const rep = buildReport(s.mode === 'live' ? dbTrades : s.closedTrades);
  return (
    <div className="bottom">
      <div className="tabs">
        {([['pos', `Positions (${pos.length})`], ['sig', 'Signal status'], ['ord', `Order list (${s.orders.length})`], ['rep', 'Profit report']] as const).map(([k, l]) =>
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k as any)}>{l}</button>)}
        <div className="sp" /><button onClick={closeAll}>Close all</button>
      </div>
      <div className="tabbody">
        {tab === 'pos' && (<table><thead><tr><th>#</th><th>Ticket</th><th>Side</th><th>Lots</th><th>Entry</th><th>SL</th><th>TP</th><th>Price</th><th>P&L</th><th>Opened</th><th /></tr></thead><tbody>
          {pos.map((p, i) => <tr key={p.ticket}><td>{i + 1}</td><td>{p.ticket.slice(-6)}</td><td className={p.side === 'buy' ? 'up' : 'dn'}>{p.side.toUpperCase()}</td><td>{p.lots}</td><td>{p.open_price.toFixed(2)}</td>
            <td>{p.sl?.toFixed(2) ?? '-'}</td><td>{p.tp?.toFixed(2) ?? '-'}</td><td>{p.current_price.toFixed(2)}</td><td className={pc(p.profit)}>{p.profit.toFixed(2)}</td><td>{fmt(p.open_time, s.tz)}</td><td><button onClick={() => closePosition(p.ticket)}>close</button></td></tr>)}
          <tr><td colSpan={3}><b>TOTAL</b></td><td><b>{vol.toFixed(2)}</b></td><td colSpan={4} /><td className={pc(tot)}><b>{tot.toFixed(2)}</b></td><td colSpan={2} /></tr></tbody></table>)}
        {tab === 'sig' && (<div className="grid">
          <div className="stat">Auto trade<b className={s.autoArmed ? 'up' : 'mut'}>{s.autoArmed ? 'ARMED' : 'OFF'}</b></div>
          <div className="stat">Trend (Chandelier)<b className={ce?.direction > 0 ? 'up' : 'dn'}>{ce ? (ce.direction > 0 ? 'LONG ▲' : 'SHORT ▼') : '-'}</b></div>
          <div className="stat">Pending delay<b>{pend ? `${pend.side} ${pend.remaining.toFixed(1)}s` : 'none'}</b></div>
          <div className="stat">Feed<b>{s.mode === 'live' ? s.feed.state : 'replay'}</b></div>
          <div className="stat" style={{ gridColumn: '1/-1' }}><table><thead><tr><th>Time</th><th>Side</th><th>Price</th><th>TF</th></tr></thead><tbody>
            {s.signals.map((x, i) => <tr key={i}><td>{fmt(x.ts, s.tz)}</td><td className={x.side === 'BUY' ? 'up' : 'dn'}>{x.side}</td><td>{x.price.toFixed(2)}</td><td>{x.tf}s</td></tr>)}</tbody></table></div></div>)}
        {tab === 'ord' && (<table><thead><tr><th>Time</th><th>Symbol</th><th>Side</th><th>Lots</th><th>Fill</th><th>Source</th><th>Broker</th><th>Result</th></tr></thead><tbody>
          {s.orders.map((o, i) => <tr key={i}><td>{fmt(o.ts, s.tz)}</td><td>{o.symbol}</td><td className={o.side === 'buy' ? 'up' : 'dn'}>{o.side}</td><td>{o.lots}</td><td>{o.fill_price?.toFixed(2) ?? '-'}</td><td>{o.source}</td><td>{o.broker ?? '-'}</td>
            <td className={o.accepted ? 'up' : 'dn'}>{o.accepted ? 'FILLED' : 'REJECTED ' + (o.reject_reason ?? '')}</td></tr>)}</tbody></table>)}
        {tab === 'rep' && (<div className="grid">
          {([['Net profit', rep.net.toFixed(2), rep.net >= 0], ['Trades', `${rep.trades} (${rep.wins}W/${rep.losses}L)`], ['Win rate', rep.winRate.toFixed(1) + '%'], ['Profit factor', rep.profitFactor?.toFixed(2) ?? '-'],
            ['Gross profit', rep.grossProfit.toFixed(2), true], ['Gross loss', '-' + rep.grossLoss.toFixed(2), false], ['Avg win', rep.avgWin.toFixed(2)], ['Avg loss', rep.avgLoss.toFixed(2)],
            ['Expectancy/trade', rep.expectancy.toFixed(2)], ['Best / worst', `${rep.best.toFixed(2)} / ${rep.worst.toFixed(2)}`], ['Max drawdown', rep.maxDrawdown.toFixed(2), false],
            ['Equity / balance', s.account ? `${s.account.equity.toFixed(2)} / ${s.account.balance.toFixed(2)}` : '-']] as any[]).map(([l, v, g]) =>
            <div className="stat" key={l}>{l}<b className={g === undefined ? '' : g ? 'up' : 'dn'}>{v}</b></div>)}
          <div className="stat" style={{ gridColumn: '1/-1' }}>By day: {Object.entries(rep.byDay).map(([d, v]) => <span key={d} style={{ marginRight: 14 }}>{d} <b className={pc(v)}>{v.toFixed(2)}</b></span>)}</div></div>)}
      </div>
    </div>);
}
