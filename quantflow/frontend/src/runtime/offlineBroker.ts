// LOCAL PAPER BROKER for OFFLINE (CSV replay) mode - same maths as backend/app/brokers/paper.py:
//   P&L = sign * (price - open) / point * lots     SL/TP checked on every replayed tick.
import { ClosedTrade, OrderRow, Position } from '../types';
export class OfflineBroker {
  balance = 10000; start = 10000; realised = 0; seq = 1;
  positions = new Map<string, Position>(); trades: ClosedTrade[] = []; orders: OrderRow[] = [];
  reset() { this.balance = this.start; this.realised = 0; this.positions.clear(); this.trades = []; this.orders = []; }
  place(symbol: string, side: 'buy' | 'sell', lots: number, slPts: number, tpPts: number, px: number, t: number, point: number) {
    const sign = side === 'buy' ? 1 : -1, ticket = 'O' + String(this.seq++).padStart(4, '0');
    this.positions.set(ticket, { ticket, symbol, side, lots, open_price: px, open_time: t, sl: slPts > 0 ? px - sign * slPts * point : null, tp: tpPts > 0 ? px + sign * tpPts * point : null, profit: 0, current_price: px });
    this.orders.unshift({ ts: t, symbol, side, lots, accepted: 1, fill_price: px, source: 'auto', broker: 'offline-paper', ticket });
    return ticket;
  }
  pnl(p: Position, px: number, point: number) { return ((p.side === 'buy' ? 1 : -1) * (px - p.open_price)) / point * p.lots; }
  close(ticket: string, px: number, t: number, point: number, reason = 'MANUAL') {
    const p = this.positions.get(ticket); if (!p) return;
    const profit = this.pnl(p, px, point); this.positions.delete(ticket); this.balance += profit; this.realised += profit;
    this.trades.push({ ticket, symbol: p.symbol, side: p.side, lots: p.lots, open_price: p.open_price, close_price: px, open_time: p.open_time, close_time: t, profit, reason });
  }
  modify(ticket: string, sl: number) { const p = this.positions.get(ticket); if (p) p.sl = sl; }
  /** called on every replayed tick: update floating P&L and trigger SL/TP */
  mark(px: number, t: number, point: number) {
    for (const p of [...this.positions.values()]) {
      p.current_price = px; p.profit = this.pnl(p, px, point);
      const buy = p.side === 'buy';
      if (p.sl != null && (buy ? px <= p.sl : px >= p.sl)) this.close(p.ticket, px, t, point, 'SL');
      else if (p.tp != null && (buy ? px >= p.tp : px <= p.tp)) this.close(p.ticket, px, t, point, 'TP');
    }
  }
  account() { const fl = [...this.positions.values()].reduce((a, p) => a + p.profit, 0);
    return { broker: 'offline-paper', balance: this.balance, equity: this.balance + fl, currency: 'USD', connected: true }; }
}
export const offlineBroker = new OfflineBroker();
