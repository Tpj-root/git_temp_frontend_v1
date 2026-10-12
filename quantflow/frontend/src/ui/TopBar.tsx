// TOP BAR: symbol, timeframe (1M 5M 15M 1H 4H), LIVE/OFFLINE switch + CSV loader + replay controls,
// UTC/IST toggle, sound toggle, DB-persist toggle, AUTO arm button, KILL switch, price + equity.
// Under it, ModeBanner shows a DIFFERENT coloured strip for live vs offline (and a pending-signal countdown).
import { useRef } from 'react';
import { useStore } from '../runtime/store';
import { fmt } from '../lib/time';
import { unlockAudio, playSignal } from '../lib/sound';
import { kill, setArmed } from '../runtime/broker';
import { startLive, stopLive, loadMarket } from '../runtime/liveFeed';
import { hasTicks, loadCsv, pause, play, rebuild, restart, setSpeed } from '../runtime/offlineFeed';

const TFS = [[60, '1M'], [300, '5M'], [900, '15M'], [3600, '1H'], [14400, '4H']] as const;

export function TopBar() {
  const s = useStore(); const file = useRef<HTMLInputElement>(null);
  const prev = useRef<number | null>(null);
  const disarmIfNeeded = () => { if (s.autoArmed) { setArmed(false); s.notify('AUTO disarmed: it is bound to one symbol + timeframe. Re-arm to continue.'); } };
  const setSymbol = (v: string) => { disarmIfNeeded(); s.set({ symbol: v, candles: [] }); s.mode === 'live' ? setTimeout(loadMarket, 0) : rebuild(); };
  const setTf = (v: number) => { disarmIfNeeded(); s.set({ tf: v, candles: s.mode === 'live' ? [] : s.candles }); s.mode === 'live' ? setTimeout(loadMarket, 0) : setTimeout(() => rebuild(), 0); };
  const setMode = (m: 'live' | 'offline') => {
    if (m === s.mode) return; if (s.autoArmed) setArmed(false);
    s.set({ mode: m, candles: [], positions: [], account: null, tick: null, orders: [], signals: [], closedTrades: [] });
    if (m === 'offline') { stopLive(); if (hasTicks()) rebuild(true); } else { pause(); startLive(); }
  };
  const onFile = async (f?: File) => { if (!f) return; if (s.mode !== 'offline') setMode('offline'); loadCsv(await f.text(), f.name); };
  const last = s.candles[s.candles.length - 1], chg = last ? last.close - last.open : 0, eq = s.account?.equity;
  void prev;
  return (
    <>
      <div className="topbar" onClick={unlockAudio}>
        <span className="brand">◈ QuantFlow</span>
        <select value={s.symbol} onChange={(e) => setSymbol(e.target.value)}>
          {s.symbols.map((x) => <option key={x.code} value={x.code}>{x.display} ({x.code})</option>)}</select>
        <div className="grp">{TFS.map(([v, l]) => <button key={v} className={s.tf === v ? 'on' : ''} onClick={() => setTf(v)}>{l}</button>)}</div>
        <div className="grp">
          <button className={s.mode === 'live' ? 'on' : ''} onClick={() => setMode('live')}>● LIVE</button>
          <button className={s.mode === 'offline' ? 'on' : ''} onClick={() => setMode('offline')}>⏺ OFFLINE CSV</button></div>
        {s.mode === 'offline' && (<div className="grp">
          <input ref={file} type="file" accept=".csv" hidden onChange={(e) => onFile(e.target.files?.[0])} />
          <button onClick={() => file.current?.click()}>📂 Load CSV</button>
          <button onClick={() => (s.offline.playing ? pause() : play())}>{s.offline.playing ? '⏸ Pause' : '▶ Play'}</button>
          <button onClick={restart}>⟲</button>
          <select value={s.offline.speed} onChange={(e) => setSpeed(Number(e.target.value))}>{[1, 5, 10, 50, 200, 1000].map((v) => <option key={v} value={v}>{v} tick/s</option>)}</select></div>)}
        <div className="sp" />
        <span className="price">{last ? last.close.toFixed(last.close > 1000 ? 2 : 3) : '---'}</span>
        <span className={chg >= 0 ? 'up' : 'dn'}>{chg >= 0 ? '▲' : '▼'} {Math.abs(chg).toFixed(2)}</span>
        {eq != null && <span className="mut">Equity <b style={{ color: '#d5dbe6' }}>{eq.toFixed(2)}</b></span>}
        <div className="grp"><button className={s.tz === 'UTC' ? 'on' : ''} onClick={() => s.set({ tz: 'UTC' })}>UTC</button><button className={s.tz === 'IST' ? 'on' : ''} onClick={() => s.set({ tz: 'IST' })}>IST</button></div>
        <button className={s.soundOn ? 'on' : ''} title="buy/sell sound when auto-trade fires (click to test)" onClick={() => { unlockAudio(); s.set({ soundOn: !s.soundOn }); if (!s.soundOn) playSignal('buy'); }}>🔔 {s.soundOn ? 'ON' : 'OFF'}</button>
        <button className={s.persist ? 'on' : ''} title="store node values in backend .db every 5 s" onClick={() => s.set({ persist: !s.persist })}>💾 DB</button>
        <button className={s.autoArmed ? 'buy' : ''} style={{ fontWeight: 700 }} onClick={() => { unlockAudio(); setArmed(!s.autoArmed); }}>{s.autoArmed ? '● AUTO ARMED' : '○ AUTO OFF'}</button>
        <button className="danger" onClick={() => confirm('KILL: close all positions and disarm auto?') && kill()}>KILL</button>
      </div>
      <ModeBanner />
    </>);
}

function ModeBanner() {
  const s = useStore(); const pend = Object.values(s.results).map((r: any) => r?._pending).find(Boolean);
  return (
    <>
      {s.mode === 'live' ? (
        <div className={'banner ' + (s.feed.wsOpen && !s.feed.stale ? 'live' : 'stale')}>
          <span>● LIVE MARKET</span><span>feed: {s.feed.state}{s.feed.stale ? ' · STALE / market closed?' : ''}</span><span>transport: {s.feed.transport}</span>
          <span>broker: {s.backendBroker}</span><span>backend mode: {s.backendMode}</span><span>last tick: {fmt(s.tick?.time, s.tz)}</span>
          {!s.feed.wsOpen && <span>⚠ backend not reachable (uvicorn on :8010?) - orders disabled</span>}
        </div>
      ) : (
        <div className="banner offline">
          <span>⏺ OFFLINE REPLAY — simulated, NOT real market</span><span>{s.offline.name || 'no CSV loaded - click Load CSV'}</span>
          <span>tick {s.offline.idx.toLocaleString()} / {s.offline.total.toLocaleString()}</span><span>clock: {fmt(s.clock, s.tz)}</span><span>broker: local paper</span>
        </div>)}
      {pend && <div className="banner pending">⏳ {pend.side} waiting {pend.remaining.toFixed(1)}s (delay {pend.delay}s)</div>}
    </>);
}
