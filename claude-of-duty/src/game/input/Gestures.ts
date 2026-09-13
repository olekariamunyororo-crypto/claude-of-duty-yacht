export interface TapDetector { tap: () => void; reset: () => void }
export function makeTapDetector(cb: () => void, windowMs = 280): TapDetector {
  let last = -1e9;
  return {
    tap() {
      const now = Date.now();
      if (now - last < windowMs) { cb(); last = -1e9; } else last = now;
    },
    reset() { last = -1e9; },
  };
}
