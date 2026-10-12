// UTC <-> IST display helper. IST = UTC+05:30 = +19800 s. Data is ALWAYS stored in UTC;
// we only shift when drawing/printing. lightweight-charts has no timezone option, so the
// chart receives (time + offset) and shows it as if it were UTC.
import { Tz } from '../types';
export const tzOffset = (tz: Tz) => (tz === 'IST' ? 19800 : 0);
export function fmt(ts: number | undefined | null, tz: Tz, withDate = true): string {
  if (!ts) return '-';
  const s = new Date((ts + tzOffset(tz)) * 1000).toISOString();
  return (withDate ? s.slice(0, 10) + ' ' : '') + s.slice(11, 19) + ' ' + tz;
}
