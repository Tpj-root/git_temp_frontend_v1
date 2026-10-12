// OFFLINE INPUT. Parses a tick CSV like:   times,prices \n 1790274600,4274.65 \n ...
// Column order is auto-detected from the header; millisecond epochs are converted to seconds;
// duplicate seconds are dropped (keeps the first) and the result is sorted by time.
import { Tick } from '../types';
export function parseTicksCsv(text: string): Tick[] {
  const lines = text.trim().split(/\r?\n/);
  const head = lines[0].split(',').map((h) => h.trim().toLowerCase());
  let ti = head.findIndex((h) => h.includes('time') || h === 't' || h === 'ts');
  let pi = head.findIndex((h) => h.includes('price') || h === 'p' || h === 'close' || h === 'last');
  if (ti < 0) ti = 0;
  if (pi < 0) pi = 1;
  const seen = new Set<number>();
  const out: Tick[] = [];
  for (let k = 1; k < lines.length; k++) {
    const parts = lines[k].split(',');
    let t = parseFloat(parts[ti]);
    const p = parseFloat(parts[pi]);
    if (!isFinite(t) || !isFinite(p)) continue;
    if (t > 1e11) t = Math.floor(t / 1000);
    t = Math.floor(t);
    if (seen.has(t)) continue;
    seen.add(t);
    out.push({ time: t, price: p });
  }
  return out.sort((a, b) => a.time - b.time);
}
