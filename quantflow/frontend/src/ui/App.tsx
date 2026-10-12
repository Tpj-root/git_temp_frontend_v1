// APP SHELL: Top bar + banner / [ chart + bottom tabs ] | [ node editor ]. Starts the engine loop and the live feed once.
import { useEffect } from 'react';
import { TopBar } from './TopBar';
import { ChartPane } from './ChartPane';
import { FlowPane } from './FlowPane';
import { BottomPanel } from './BottomPanel';
import { startEngine } from '../runtime/engine';
import { startLive } from '../runtime/liveFeed';
import { useStore } from '../runtime/store';
export default function App() {
  const toast = useStore((s) => s.toast), set = useStore((s) => s.set);
  useEffect(() => { const stop = startEngine(); startLive(); return stop; }, []);
  return (
    <div className="app">
      <TopBar />
      <div className="main">
        <div className="left"><ChartPane /><BottomPanel /></div>
        <div className="right"><FlowPane /></div>
      </div>
      {toast && <div className="toast" onClick={() => set({ toast: null })}>{toast}</div>}
    </div>);
}
