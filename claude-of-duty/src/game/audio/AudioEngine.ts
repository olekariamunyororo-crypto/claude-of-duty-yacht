import { Audio, type Sound } from 'expo-av';
import * as FS from 'expo-file-system';
import { fromByteArray } from 'base64-js';
import { log } from '../utils/Logger';
import * as S from './ProceduralGunshot';

export type SfxName =
  | 'shot' | 'shotFar' | 'hit' | 'kill' | 'reloadA' | 'reloadB' | 'step' | 'step2'
  | 'jump' | 'land' | 'empty' | 'bounce' | 'explode' | 'hurt' | 'ui';

const POOL_SIZE: Partial<Record<SfxName, number>> = { shot: 6, shotFar: 4, step: 3, step2: 3 };
const DIR = `${FS.cacheDirectory}codv-audio/`;

function toWav(samples: Float32Array, sr: number): Uint8Array {
  const n = samples.length;
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); ws(8, 'WAVE'); ws(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  ws(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Uint8Array(buf);
}

class Pool {
  items: Sound[] = [];
  idx = 0;
  async init(uri: string, count: number) {
    for (let i = 0; i < count; i++) {
      try {
        const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false, volume: 1 });
        this.items.push(sound);
      } catch {}
    }
  }
  play(vol: number, rate: number, pan: number) {
    if (!this.items.length) return;
    const s = this.items[this.idx++ % this.items.length];
    const v = Math.max(0, Math.min(1, vol));
    (s as any).replayAsync?.({ shouldPlay: true, volume: v, positionMillis: 0, pan })
      .then(() => s.setRateAsync(rate, true))
      .catch(() => {});
  }
}

const pools = new Map<SfxName, Pool>();
let inited = false;
let masterVolume = 0.8;

export const audio = {
  get ready() { return inited; },
  setVolume(v: number) { masterVolume = Math.max(0, Math.min(1, v)); },
  async init(): Promise<void> {
    if (inited) return;
    inited = true;
    try {
      await Audio.setAudioModeAsync({ playsInSilentMode: true, staysActiveInBackground: false, shouldDuckAndroid: true }).catch(() => undefined);
      const samples = new Map<SfxName, Float32Array>();
      samples.set('shot', S.synthGunshot(1));
      samples.set('shotFar', S.synthShotFar());
      samples.set('hit', S.synthTick(1700, 0.05));
      samples.set('kill', S.synthKill());
      samples.set('reloadA', S.synthReloadClick(false));
      samples.set('reloadB', S.synthReloadClick(true));
      samples.set('step', S.synthStep(3));
      samples.set('step2', S.synthStep(5));
      samples.set('jump', S.synthJump());
      samples.set('land', S.synthLand());
      samples.set('empty', S.synthEmpty());
      samples.set('bounce', S.synthBounce());
      samples.set('explode', S.synthExplosion());
      samples.set('hurt', S.synthHurt());
      samples.set('ui', S.synthTick(880, 0.06));

      await FS.makeDirectoryAsync(DIR, { intermediates: true }).catch(() => undefined);
      for (const [name, buf] of samples) {
        const path = `${DIR}${name}.wav`;
        const b64 = fromByteArray(toWav(buf, S.SR));
        await FS.writeAsStringAsync(path, b64, { encoding: FS.EncodingType.Base64 });
        const pool = new Pool();
        await pool.init(path, POOL_SIZE[name] ?? 2);
        pools.set(name, pool);
      }
      log.info('audio ready —', pools.size, 'procedural sounds');
    } catch (e) {
      log.warn('audio init error:', e);
    }
  },
  play(name: SfxName, opts: { gain?: number; pan?: number; rate?: number } = {}): void {
    const pool = pools.get(name);
    if (!pool) return;
    pool.play((opts.gain ?? 1) * masterVolume, opts.rate ?? 1, opts.pan ?? 0);
  },
};
