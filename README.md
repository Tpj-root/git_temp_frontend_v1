# QuantFlow — node trading terminal

```
quantflow/
  frontend/   React + Vite + xyflow + lightweight-charts   (npm i && npm run dev  -> http://localhost:3000)
  backend/    app/extras.py + PATCH.md  (add to YOUR existing FastAPI backend, port 8010)
```
Run: `uvicorn app.main:app --port 8010` (backend), `cd frontend && npm i && npm run dev`.
LIVE needs the backend; OFFLINE (CSV replay, local paper broker) works with **no backend**.

## Layout
Left = chart (wheel zoom, drag pan, ＋/－/Fit/Latest) + tabs Positions / Signal status / Order list / Profit report.
Right = node editor. Top = symbol, 1M 5M 15M 1H 4H, LIVE/OFFLINE, CSV loader + replay, UTC/IST, 🔔 sound, 💾 DB, AUTO, KILL.
Live strip is green (red if stale/backend down); offline strip is amber and says "simulated".

## Data flow
`Tick → Candles → Heikin-Ashi → Extremum → Chandelier → Delay → AutoTrader → (paper | MT5)`
Closed-bar rule: signals are read from the last CLOSED bar only. AUTO ignores signals that existed before you armed it.
SL = Chandelier stop distance (converted to points); TrailingStop then ratchets it. TP = R:R × SL (or fixed points).

## Connections
Drag handle→handle to attach (types are checked; one wire per input). Double-click a wire, or select + Backspace, to detach.
Drag a wire end to another handle to re-attach. Nodes: × button or select + Delete. Graph auto-saves to localStorage.

## Node reference (inputs · outputs · params)
| Node | Inputs | Outputs | Params |
|---|---|---|---|
| Tick | – | ticks, price | – (shows price, state, tick count; spread n/a on Deriv OHLC) |
| Candles | ticks | candles | – (TF from top bar; forming OHLC + countdown) |
| Heikin-Ashi | candles | candles | enabled |
| Extremum | candles | anchors | formula (close/range_ma/crest_trough/pivot_sr), use_close, period, ma_len, lookback |
| Chandelier | candles, anchors | signal, long_stop, short_stop, active_stop, direction, atr | period, mult, tv_ratchet, use_close, colors |
| Delay | signal | signal | enabled, buy_delay, sell_delay (countdown shown) |
| SMA / EMA | candles | series | period, source, draw, color |
| RSI | candles | rsi, signal | period, oversold, overbought |
| Bollinger | candles | upper, mid, lower | period, k, color |
| MACD | candles | macd, signal_line, hist, cross | fast, slow, signal |
| Logic Gate | a, b, trend | signal | mode AND / OR / TREND_FILTER |
| Add Sub Mul Div | a, b | out | a_value, b_value (used when open) |
| Increment / Decrement | in, trigger | out | step, mode offset/counter, start |
| Formula | a, b, c | out | expr e.g. `(a+b)/2` (safe whitelist) |
| Function (JS) | a, b, c | out | code body, called per bar |
| Buy/Sell Indicator | signal | buy, sell | text |
| Draw Points | value, trigger | – | color, size, last_n |
| Draw Candles | trigger | – | color |
| Positions | – | position 1, position 2, count, total volume, total P&L | scope |
| Trailing Stop | position, long_stop, short_stop | new SL | mode chandelier/points, points, min_step |
| Main Variables | – | volume, sl_points, tp_points, tp_rr, max_pos | same names |
| Broker Select | – | broker | paper / mt5 |
| Auto Trader | signal, long, short, broker, volume, sl_points, tp_points, tp_rr, max_pos | open count | broker, volume, sl_mode, sl_points, tp_mode, tp_points, tp_rr, max_pos, reverse, max_daily_loss, max_trades |

Port types: ticks, candles, anchors, series, number, signal, position, text. series↔number are interchangeable.
Add your own node: create `graph/nodes/x.ts` (one `NodeDef`), register it in `graph/registry.ts`. The card UI is generated.

## Database (backend SQLite `trading.db`)
`signals`, `orders` (already), plus `trades` (closed trades, feeds the report) and `node_values` (every node readout every 5 s).

## Limits to know
* Trailing/modify and runtime broker switch exist for paper and MT5 only (Deriv contract broker: not supported).
* MT5 closed trades are not mirrored into `trades` yet (paper and offline are).
* Not run here (no network in my sandbox): do `npm i` and check the console on first start.
