// Simple moving average with a running sum (O(n)). First period-1 values are null.
export function sma(v: number[], n: number): (number | null)[] {
  const out: (number | null)[] = []; let acc = 0;
  for (let i = 0; i < v.length; i++) {
    acc += v[i]; if (i >= n) acc -= v[i - n];
    out.push(i >= n - 1 ? acc / n : null);
  }
  return out;
}
