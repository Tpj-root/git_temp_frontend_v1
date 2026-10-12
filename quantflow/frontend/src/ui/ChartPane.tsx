// LEFT SIDE: candlestick chart (lightweight-charts v5). Wheel = zoom time axis, drag = pan, drag price axis = scale (TradingView-like).
// It draws whatever nodes emit in `_draw`: lines (indicators/stops), points, BUY/SELL markers, highlighted candles,
// plus each open position's entry / SL / TP price lines. UTC/IST: times are shifted by tzOffset for display only.
import { useEffect, useRef } from 'react';
import { CandlestickSeries, createChart, createSeriesMarkers, LineSeries, LineStyle } from 'lightweight-charts';
import { useStore } from '../runtime/store';
import { tzOffset } from '../lib/time';
import { DrawItem } from '../types';

export function ChartPane() {
  const box = useRef<HTMLDivElement>(null);
  const chart = useRef<any>(null), series = useRef<any>(null), markers = useRef<any>(null), lines = useRef(new Map<string, any>()), plines = useRef<any[]>([]);
  const key = useRef(''), len = useRef(0);
  const { candles, results, tz, positions, symbol, tf } = useStore();

  useEffect(() => {
    const c = createChart(box.current!, { autoSize: true, layout: { background: { color: '#0e1117' }, textColor: '#9aa5b5' },
      grid: { vertLines: { color: '#161c26' }, horzLines: { color: '#161c26' } }, timeScale: { timeVisible: true, secondsVisible: false, borderColor: '#232b38', rightOffset: 6 }, rightPriceScale: { borderColor: '#232b38' } });
    series.current = c.addSeries(CandlestickSeries, { upColor: '#26a69a', downColor: '#ef5350', wickUpColor: '#26a69a', wickDownColor: '#ef5350', borderVisible: false });
    markers.current = createSeriesMarkers(series.current, []); chart.current = c;
    return () => { c.remove(); chart.current = null; lines.current.clear(); };
  }, []);

  useEffect(() => {
    if (!chart.current || !candles.length) return;
    const off = tzOffset(tz), n = candles.length;
    const draws: DrawItem[] = Object.values(results).flatMap((r: any) => r?._draw ?? []);
    const ov = new Map<number, string>(); draws.forEach((d) => d.kind === 'candle' && ov.set(d.index, d.color));
    const data = candles.map((b, i) => ({ time: (b.time + off) as any, open: b.open, high: b.high, low: b.low, close: b.close, ...(ov.has(i) ? { color: ov.get(i), wickColor: ov.get(i), borderColor: ov.get(i) } : {}) }));
    const k = `${symbol}|${tf}|${tz}`, fresh = k !== key.current;
    if (fresh || ov.size || Math.abs(n - len.current) > 1) {
      series.current.setData(data);
      if (fresh) chart.current.timeScale().setVisibleLogicalRange({ from: Math.max(0, n - 120), to: n + 8 });
    } else { if (n > 1) series.current.update(data[n - 2]); series.current.update(data[n - 1]); }
    key.current = k; len.current = n;

    // lines + points
    const want = new Set<string>();
    for (const d of draws) {
      if (d.kind !== 'line' && d.kind !== 'points') continue; want.add(d.id);
      let s = lines.current.get(d.id);
      if (!s) { s = chart.current.addSeries(LineSeries, { priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false, ...(d.kind === 'points' ? { lineVisible: false, pointMarkersVisible: true } : {}) }); lines.current.set(d.id, s); }
      s.applyOptions(d.kind === 'line' ? { color: d.color, lineWidth: d.width as any } : { color: d.color, pointMarkersRadius: d.size });
      s.setData(candles.map((b, i) => (d.data[i] != null ? { time: (b.time + off) as any, value: d.data[i] as number } : { time: (b.time + off) as any })));
    }
    for (const [id, s] of [...lines.current]) if (!want.has(id)) { chart.current.removeSeries(s); lines.current.delete(id); }

    // BUY/SELL markers
    markers.current.setMarkers(draws.filter((d): d is Extract<DrawItem, { kind: 'marker' }> => d.kind === 'marker' && !!candles[d.index])
      .map((d) => ({ time: (candles[d.index].time + off) as any, position: d.position, shape: d.shape, color: d.color, text: d.text, size: 1.2 })).sort((a, b) => a.time - b.time));

    // position price lines (entry white, SL red, TP green)
    plines.current.forEach((l) => series.current.removePriceLine(l)); plines.current = [];
    positions.filter((p) => p.symbol === symbol).forEach((p, i) => {
      const add = (price: number | null, color: string, title: string, style = LineStyle.Solid) => price != null && plines.current.push(series.current.createPriceLine({ price, color, lineWidth: 1, lineStyle: style, title, axisLabelVisible: true }));
      add(p.open_price, '#ffffff', `#${i + 1} ${p.side.toUpperCase()} ${p.lots}`, LineStyle.Dashed); add(p.sl, '#ef5350', 'SL'); add(p.tp, '#26a69a', 'TP');
    });
  }, [candles, results, tz, positions, symbol, tf]);

  const zoom = (f: number) => { const ts = chart.current?.timeScale(); ts?.applyOptions({ barSpacing: Math.max(1, ts.options().barSpacing * f) }); };
  return (
    <div className="chartwrap">
      <div className="zoombar">
        <button onClick={() => zoom(1.3)} title="zoom in">＋</button><button onClick={() => zoom(1 / 1.3)} title="zoom out">－</button>
        <button onClick={() => chart.current?.timeScale().fitContent()}>Fit</button><button onClick={() => chart.current?.timeScale().scrollToRealTime()}>Latest ⇥</button>
      </div>
      <div ref={box} className="chart" />
    </div>);
}
