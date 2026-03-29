let audioContext: AudioContext | null = null;
let warmedUp = false;

function getCtx(): AudioContext {
  if (!audioContext) audioContext = new AudioContext();
  return audioContext;
}

export function warmUpAudio(): void {
  if (warmedUp) return;
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
    warmedUp = true;
  } catch { /* ignore */ }
}

function playNote(ctx: AudioContext, dest: AudioNode, freq: number, time: number, dur: number, vol: number) {
  // Marimba-like: sine + soft attack + fast decay
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, time);

  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(vol, time + 0.005);
  gain.gain.exponentialRampToValueAtTime(vol * 0.3, time + dur * 0.3);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + dur + 0.05);

  // Soft harmonic for warmth
  const h = ctx.createOscillator();
  const hg = ctx.createGain();
  h.type = "sine";
  h.frequency.setValueAtTime(freq * 2, time);
  hg.gain.setValueAtTime(0, time);
  hg.gain.linearRampToValueAtTime(vol * 0.08, time + 0.005);
  hg.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.5);
  h.connect(hg);
  hg.connect(dest);
  h.start(time);
  h.stop(time + dur + 0.05);
}

/**
 * Gentle marimba melody — pleasant and musical.
 * Plays a short ascending pattern twice.
 */
export function playAlarmSound(): void {
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(ctx.destination);

    // Gentle C major arpeggio: C5 → E5 → G5 → C6
    const melody = [
      { freq: 523, time: 0, dur: 0.4, vol: 0.5 },       // C5
      { freq: 659, time: 0.15, dur: 0.35, vol: 0.45 },   // E5
      { freq: 784, time: 0.30, dur: 0.35, vol: 0.4 },    // G5
      { freq: 1047, time: 0.45, dur: 0.6, vol: 0.5 },    // C6 (hold)
    ];

    // Play twice with pause
    [0, 1.4].forEach((offset) => {
      melody.forEach(({ freq, time, dur, vol }) => {
        playNote(ctx, master, freq, now + offset + time, dur, vol);
      });
    });

  } catch {
    try {
      const a = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2JkYuAc2xydX+Ij42GfHJxc3l/goOBf3x7fH5+f39+fn5+fn5+f39/f39/f4CBgoKDg4OEhISFhYWGhoaHh4eIiIiJiYk=");
      a.volume = 1.0;
      a.play().catch(() => {});
    } catch { /* no audio */ }
  }
}
