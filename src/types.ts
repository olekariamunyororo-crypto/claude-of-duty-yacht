export type GamePhase = 'menu' | 'countdown' | 'playing' | 'paused' | 'gameover';

export interface KillfeedItem {
  id: number;
  killer: string;
  victim: string;
  weapon: string;
  headshot: boolean;
  t: number;
}

export interface PopupMedal {
  id: number;
  text: string;
  big: boolean;
  t: number;
}

export interface ScoreRow {
  name: string;
  score: number;
  isPlayer: boolean;
}

export interface GameSettings {
  sensitivity: number;
  invertY: boolean;
  volume: number;
  quality: 'low' | 'medium' | 'high';
  showFps: boolean;
}

export interface DamageIndicator {
  angle: number; // radians relative to camera view
  t: number;
}
