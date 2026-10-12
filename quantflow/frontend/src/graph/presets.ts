// DEFAULT GRAPH: Tick -> Candles -> HA -> Extremum -> Chandelier -> Delay -> AutoTrader,
// + Buy/Sell arrows, Main Variables, Broker Select, Positions -> 2 Trailing Stops (pos1 / pos2).
const n = (id: string, type: string, x: number, y: number, params: any = {}) => ({ id, type: 'qf', position: { x, y }, data: { type, params } });
const e = (s: string, sh: string, t: string, th: string) => ({ id: `${s}.${sh}->${t}.${th}`, source: s, sourceHandle: sh, target: t, targetHandle: th, animated: true });
export const defaultGraph = () => ({
  nodes: [
    n('tick', 'tick', 0, 0), n('candle', 'candle', 290, 0), n('ha', 'heikinAshi', 580, 0), n('ext', 'extremum', 870, 0), n('ce', 'chandelier', 1160, 0),
    n('delay', 'delay', 1450, 0), n('mark', 'signalMarker', 1450, 230), n('vars', 'mainVars', 1450, 330), n('brk', 'brokerSelect', 1160, 520),
    n('auto', 'autoTrader', 1740, 0), n('pos', 'position', 1740, 560), n('tr1', 'trailingStop', 2030, 500), n('tr2', 'trailingStop', 2030, 780),
  ],
  edges: [
    e('tick', 'ticks', 'candle', 'ticks'), e('candle', 'candles', 'ha', 'candles'), e('ha', 'candles', 'ext', 'candles'), e('ha', 'candles', 'ce', 'candles'),
    e('ext', 'anchors', 'ce', 'anchors'), e('ce', 'signal', 'delay', 'signal'), e('ce', 'signal', 'mark', 'signal'), e('delay', 'signal', 'auto', 'signal'),
    e('ce', 'long', 'auto', 'long'), e('ce', 'short', 'auto', 'short'), e('vars', 'volume', 'auto', 'volume'), e('vars', 'max_pos', 'auto', 'max_pos'),
    e('vars', 'sl_points', 'auto', 'sl_points'), e('vars', 'tp_rr', 'auto', 'tp_rr'), e('brk', 'broker', 'auto', 'broker'),
    e('pos', 'pos1', 'tr1', 'pos'), e('pos', 'pos2', 'tr2', 'pos'), e('ce', 'long', 'tr1', 'long'), e('ce', 'short', 'tr1', 'short'),
    e('ce', 'long', 'tr2', 'long'), e('ce', 'short', 'tr2', 'short'),
  ],
});
