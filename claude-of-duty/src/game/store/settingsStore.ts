import { create } from 'zustand';
import { loadJSON, saveJSON } from './persist';

export type QualityTier = 'low' | 'medium' | 'high';
export interface SettingsState {
  sensitivity: number;
  invertY: boolean;
  volume: number;
  quality: QualityTier;
  showFps: boolean;
  proceduralModels: boolean;
  set: (patch: Partial<Omit<SettingsState, 'set'>>) => void;
}

const KEY = 'codv.settings.v1';
const DEFAULTS = { sensitivity: 5, invertY: false, volume: 0.8, quality: 'medium' as QualityTier, showFps: false, proceduralModels: false };

export const useSettings = create<SettingsState>((set, get) => ({
  ...DEFAULTS,
  ...loadJSON(KEY, {}),
  set: (patch) => {
    set(patch);
    const { set: _, ...rest } = get();
    saveJSON(KEY, rest);
  },
}));
