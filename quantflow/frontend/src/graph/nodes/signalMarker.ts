// BUY / SELL INDICATOR NODE. In: signal. Out: buy / sell (numbers: 1 if the LAST CLOSED bar fired it).
// Draws arrows on the chart. The still-forming bar's arrow is drawn as a hollow circle ("tentative"):
// it can still repaint, only closed bars are trusted for trading.
import { NodeDef, P } from '../types';
export const signalMarkerNode: NodeDef = {
  type: 'signalMarker', title: 'Buy/Sell Indicator', category: 'Draw', color: '#f472b6', description: 'Arrows on the chart for every BUY/SELL signal.',
  inputs: [P('signal', 'signal', 'signal')], outputs: [P('buy', 'buy', 'number'), P('sell', 'sell', 'number')],
  params: [{ key: 'text', label: 'show text', kind: 'bool', default: true }],
  compute(inp, p, ctx) {
    const sig: number[] = inp.signal ?? [], n = sig.length, d: any[] = [];
    sig.forEach((s, i) => { if (!s) return; const tentative = i === n - 1;
      d.push({ kind: 'marker', index: i, position: s > 0 ? 'belowBar' : 'aboveBar', shape: tentative ? 'circle' : s > 0 ? 'arrowUp' : 'arrowDown', color: s > 0 ? (tentative ? '#1d6f67' : '#26a69a') : (tentative ? '#8d3a38' : '#ef5350'), text: p.text ? (s > 0 ? 'BUY' : 'SELL') : '' }); });
    const j = n - 2;
    return { buy: j >= 0 && sig[j] > 0 ? 1 : 0, sell: j >= 0 && sig[j] < 0 ? 1 : 0, _draw: d, _show: { buys: sig.filter((x) => x > 0).length, sells: sig.filter((x) => x < 0).length } };
  },
};
