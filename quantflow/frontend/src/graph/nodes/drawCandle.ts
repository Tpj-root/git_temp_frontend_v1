// CANDLE-DRAWING NODE. In: trigger (signal or series). Paints the candle body/wick of every bar where
// trigger != 0 in the chosen colour (e.g. highlight signal bars, or bars where RSI is overbought).
import { NodeDef, P } from '../types';
export const drawCandleNode: NodeDef = {
  type: 'drawCandle', title: 'Draw Candles', category: 'Draw', color: '#fb7185', description: 'Colour-highlight candles where trigger is on.',
  inputs: [P('trigger', 'trigger', 'signal')], outputs: [],
  params: [{ key: 'color', label: 'color', kind: 'color', default: '#facc15' }],
  compute(inp, p) {
    const trig: number[] = inp.trigger ?? [], d: any[] = [];
    trig.forEach((t, i) => t && d.push({ kind: 'candle', index: i, color: p.color }));
    return { _draw: d, _show: { highlighted: d.length } };
  },
};
