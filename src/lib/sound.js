// The navigation's click, from public/audio/Click.mp3.
// Only the navigation makes a sound: the bottom bar, the Menu button and the
// sections inside the mobile sheet.

// How long the page waits after the click before it moves, so the sound is
// heard on its own first. Callers pass this to a timeout around their navigation.
export const CLICK_BREATH = 190;

// A few elements, used in turn: one on its own cuts itself off when taps come
// quickly, and re-using a playing element restarts it mid-sound.
const VOICES = 3;
let voices = null;
let next = 0;

// Fetched up front, so the first click sounds at once instead of waiting on the
// network. Without this the sound lands well after the press.
function load() {
  if (voices || typeof window === "undefined" || typeof Audio === "undefined") return;
  voices = Array.from({ length: VOICES }, () => {
    const a = new Audio("/audio/Click.mp3");
    a.preload = "auto";
    a.load();
    return a;
  });
}

load();

export function playClick() {
  load();
  if (!voices) return;

  const a = voices[next];
  next = (next + 1) % VOICES;
  a.currentTime = 0;
  // a browser that won't play before the first gesture just stays silent
  a.play().catch(() => {});
}
