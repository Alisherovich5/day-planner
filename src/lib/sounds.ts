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
    src.buffer = buf; src.connect(ctx.destination); src.start(0);
    warmedUp = true;
  } catch { /* */ }
}

function note(ctx: AudioContext, dest: AudioNode, freq: number, time: number, dur: number, vol: number, type: OscillatorType = "sine") {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type; osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(vol, time + 0.005);
  gain.gain.exponentialRampToValueAtTime(vol * 0.3, time + dur * 0.3);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
  osc.connect(gain); gain.connect(dest);
  osc.start(time); osc.stop(time + dur + 0.05);
}

// ===== Sound Library =====

function playMarimba(ctx: AudioContext, master: GainNode, now: number) {
  // Gentle C major arpeggio x2
  [0, 1.4].forEach((off) => {
    [{ f: 523, t: 0 }, { f: 659, t: 0.15 }, { f: 784, t: 0.3 }, { f: 1047, t: 0.45 }].forEach(({ f, t }) => {
      note(ctx, master, f, now + off + t, 0.5, 0.45);
    });
  });
}

function playChime(ctx: AudioContext, master: GainNode, now: number) {
  // Bright bell chime
  [0, 1.2, 2.4].forEach((off) => {
    [{ f: 1175, t: 0 }, { f: 1480, t: 0.2 }, { f: 1760, t: 0.4 }].forEach(({ f, t }) => {
      note(ctx, master, f, now + off + t, 0.3, 0.5);
      note(ctx, master, f * 2, now + off + t, 0.2, 0.1); // overtone
    });
  });
}

function playPiano(ctx: AudioContext, master: GainNode, now: number) {
  // Soft piano chord progression
  [0, 1.6].forEach((off) => {
    [{ f: 262, t: 0 }, { f: 330, t: 0.08 }, { f: 392, t: 0.16 }, { f: 523, t: 0.24 }].forEach(({ f, t }) => {
      note(ctx, master, f, now + off + t, 0.8, 0.35, "sine");
      note(ctx, master, f * 0.5, now + off + t, 0.6, 0.15, "triangle"); // bass
    });
  });
}

function playBirds(ctx: AudioContext, master: GainNode, now: number) {
  // Cheerful bird-like chirps
  [0, 0.8, 1.6].forEach((off) => {
    [{ f: 1800, t: 0, d: 0.08 }, { f: 2200, t: 0.1, d: 0.06 }, { f: 2600, t: 0.18, d: 0.1 }, { f: 2000, t: 0.3, d: 0.12 }].forEach(({ f, t, d }) => {
      note(ctx, master, f, now + off + t, d, 0.3);
    });
  });
}

function playZen(ctx: AudioContext, master: GainNode, now: number) {
  // Deep, calm singing bowl
  [0, 2].forEach((off) => {
    note(ctx, master, 220, now + off, 2, 0.3, "sine");
    note(ctx, master, 440, now + off + 0.1, 1.5, 0.15, "sine");
    note(ctx, master, 660, now + off + 0.2, 1, 0.08, "triangle");
  });
}

export type SoundName = "marimba" | "chime" | "piano" | "birds" | "zen";

export const SOUNDS: { id: SoundName; label: Record<string, string> }[] = [
  { id: "marimba", label: { uz: "Marimba", ru: "Маримба", en: "Marimba" } },
  { id: "chime", label: { uz: "Qo'ng'iroq", ru: "Колокольчик", en: "Chime" } },
  { id: "piano", label: { uz: "Piano", ru: "Пианино", en: "Piano" } },
  { id: "birds", label: { uz: "Qushlar", ru: "Птицы", en: "Birds" } },
  { id: "zen", label: { uz: "Zen", ru: "Дзен", en: "Zen" } },
];

const players: Record<SoundName, (ctx: AudioContext, m: GainNode, n: number) => void> = {
  marimba: playMarimba, chime: playChime, piano: playPiano, birds: playBirds, zen: playZen,
};

export function getSelectedSound(): SoundName {
  if (typeof window === "undefined") return "marimba";
  return (localStorage.getItem("flowday-sound") as SoundName) || "marimba";
}

export function setSelectedSound(s: SoundName): void {
  localStorage.setItem("flowday-sound", s);
}

export function playAlarmSound(soundOverride?: SoundName): void {
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    const master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(ctx.destination);
    const s = soundOverride || getSelectedSound();
    players[s](ctx, master, ctx.currentTime);
  } catch { /* */ }
}

export function previewSound(s: SoundName): void {
  warmUpAudio();
  playAlarmSound(s);
}
