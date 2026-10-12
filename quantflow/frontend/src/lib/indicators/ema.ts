// EMA seeded with the SMA of the first n values (same as the backend overlays.py).
export function ema(v: (number | null)[], n: number): (number | null)[] {
  const out: (number | null)[] = []; const k = 2 / (n + 1); let run: number | null = null; let cnt = 0, acc = 0;
  for (let i = 0; i < v.length; i++) {
    const x = v[i];
    if (x == null) { out.push(null); continue; }
    cnt++;
    if (run == null) { acc += x; if (cnt === n) run = acc / n; out.push(run); }
    else { run = x * k + run * (1 - k); out.push(run); }
  }
  return out;
}
