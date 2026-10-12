// Buy/sell audio cue via WebAudio (no asset files). BUY = rising two-tone, SELL = falling two-tone.
// Browsers block audio until a user gesture, so unlockAudio() is called from the first click.
let ctx: AudioContext | null = null;
export function unlockAudio() {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
}
function tone(freq: number, start: number, dur: number) {
  if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime + start); o.stop(ctx.currentTime + start + dur + 0.05);
}
export function playSignal(side: 'buy' | 'sell') {
  unlockAudio();
  if (side === 'buy') { tone(660, 0, 0.15); tone(990, 0.16, 0.25); }
  else { tone(520, 0, 0.15); tone(330, 0.16, 0.25); }
}
