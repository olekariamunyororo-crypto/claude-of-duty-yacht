import { create } from 'zustand';
import { resetWorldMatch, world } from '../world';

export type Phase = 'menu' | 'loading' | 'countdown' | 'playing' | 'paused' | 'gameover';
export interface KillfeedEntry { id: number; killer: string; victim: string; weapon: string; headshot: boolean; t: number }
export interface PopupItem { id: number; text: string; big: boolean; t: number }
export interface ScoreRow { name: string; score: number; isPlayer: boolean }

interface Hooks { respawn: () => void }
let hooks: Hooks | null = null;
export function bindGameHooks(h: Hooks) { hooks = h; }

const KILL_TARGET = 30;
let feedId = 1;
let popupId = 1;

interface GameState {
  phase: Phase;
  countdown: number;
  playerScore: number;
  bestName: string; bestScore: number;
  killfeed: KillfeedEntry[];
  popups: PopupItem[];
  death: { killer: string; t: number } | null;
  startMatch: () => void;
  endMatch: () => void;
  pause: () => void;
  resume: () => void;
  quit: () => void;
  setPhase: (p: Phase) => void;
  addKill: (killer: string, victim: string, weapon: string, headshot: boolean, byPlayer: boolean) => void;
  addPopup: (text: string, big?: boolean) => void;
  setDeath: (killer: string | null) => void;
  tick: (dt: number) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'menu',
  countdown: 0,
  playerScore: 0,
  bestName: '', bestScore: 0,
  killfeed: [],
  popups: [],
  death: null,

  startMatch: () => {
    resetWorldMatch();
    set({
      phase: 'countdown', countdown: 3.2, playerScore: 0, bestName: '', bestScore: 0,
      killfeed: [], popups: [], death: null,
    });
  },

  endMatch: () => set({ phase: 'gameover' }),
  pause: () => set((s) => (s.phase === 'playing' ? { phase: 'paused' } : s)),
  resume: () => set((s) => (s.phase === 'paused' ? { phase: 'playing' } : s)),
  quit: () => set({ phase: 'menu', killfeed: [], popups: [], death: null }),
  setPhase: (p) => set({ phase: p }),

  addKill: (killer, victim, weapon, headshot, byPlayer) => {
    const entry: KillfeedEntry = { id: feedId++, killer, victim, weapon, headshot, t: world.time };
    const feed = [entry, ...get().killfeed].slice(0, 5);
    let playerScore = get().playerScore;
    let bestName = get().bestName, bestScore = get().bestScore;

    for (const b of world.bots) if (b.score > bestScore) { bestName = b.name; bestScore = b.score; }
    if (byPlayer) playerScore += 1;
    set({ killfeed: feed, playerScore, bestName, bestScore });
    if (playerScore >= KILL_TARGET || bestScore >= KILL_TARGET) get().endMatch();
  },

  addPopup: (text, big = false) =>
    set((s) => ({ popups: [...s.popups.slice(-3), { id: popupId++, text, big, t: world.time }] })),

  setDeath: (killer) => set({ death: killer ? { killer, t: world.time } : null }),

  tick: (dt) => {
    const s = get();
    if (s.phase === 'countdown') {
      const c = s.countdown - dt;
      set({ countdown: c, phase: c <= 0 ? 'playing' : 'countdown' });
      return;
    }
    if (s.phase !== 'playing') return;
    const now = world.time;
    const feed = s.killfeed.filter((k) => now - k.t < 6);
    const popups = s.popups.filter((p) => now - p.t < 1.5);
    if (feed.length !== s.killfeed.length || popups.length !== s.popups.length) set({ killfeed: feed, popups });
    const d = s.death;
    if (d && now - d.t > 3.4) {
      hooks?.respawn();
      set({ death: null });
    }
  },
}));

export function scoreboard(): ScoreRow[] {
  const rows: ScoreRow[] = world.bots.map((b) => ({ name: b.name, score: b.score, isPlayer: false }));
  rows.push({ name: 'YOU', score: useGameStore.getState().playerScore, isPlayer: true });
  return rows.sort((a, b) => b.score - a.score);
}
