export type SoundName = "radar" | "beacon" | "chime" | "marimba" | "piano";

export const SOUNDS: { id: SoundName; file: string; label: Record<string, string> }[] = [
  { id: "radar", file: "/sounds/radar.mp3", label: { uz: "Radar", ru: "Радар", en: "Radar" } },
  { id: "beacon", file: "/sounds/beacon.mp3", label: { uz: "Beacon", ru: "Маяк", en: "Beacon" } },
  { id: "chime", file: "/sounds/chime.mp3", label: { uz: "Qo'ng'iroq", ru: "Колокольчик", en: "Chime" } },
  { id: "marimba", file: "/sounds/marimba.mp3", label: { uz: "Marimba", ru: "Маримба", en: "Marimba" } },
  { id: "piano", file: "/sounds/piano.mp3", label: { uz: "Piano", ru: "Пианино", en: "Piano" } },
];

let audioEl: HTMLAudioElement | null = null;

export function warmUpAudio(): void {
  // Create audio element on first user gesture
  if (!audioEl && typeof window !== "undefined") {
    audioEl = new Audio();
    audioEl.volume = 1.0;
  }
}

export function getSelectedSound(): SoundName {
  if (typeof window === "undefined") return "radar";
  return (localStorage.getItem("flowday-sound") as SoundName) || "radar";
}

export function setSelectedSound(s: SoundName): void {
  localStorage.setItem("flowday-sound", s);
}

export function playAlarmSound(soundOverride?: SoundName): void {
  try {
    const s = soundOverride || getSelectedSound();
    const sound = SOUNDS.find(x => x.id === s) || SOUNDS[0];

    // Use Audio element — works on mobile + desktop
    const audio = new Audio(sound.file);
    audio.volume = 1.0;

    // Play 3 times with pause
    let count = 0;
    const playOnce = () => {
      count++;
      audio.currentTime = 0;
      audio.play().catch(() => {});
      if (count < 3) {
        audio.onended = () => {
          setTimeout(playOnce, 400);
        };
      }
    };
    playOnce();
  } catch {
    // Silent fallback
  }
}

export function previewSound(s: SoundName): void {
  warmUpAudio();
  const sound = SOUNDS.find(x => x.id === s) || SOUNDS[0];
  const audio = new Audio(sound.file);
  audio.volume = 1.0;
  audio.play().catch(() => {});
}
