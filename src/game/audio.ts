// Web Audio API procedural sound synthesizer for Claude of Duty: Vibe Slops II
// Zero external audio files required — fully synthesized in browser.

export type SfxName =
  | 'shot'
  | 'shotFar'
  | 'hit'
  | 'kill'
  | 'reloadA'
  | 'reloadB'
  | 'step'
  | 'step2'
  | 'jump'
  | 'land'
  | 'empty'
  | 'bounce'
  | 'explode'
  | 'hurt'
  | 'ui';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.8;

  public init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public play(name: SfxName, opts: { gain?: number; rate?: number; pan?: number } = {}) {
    if (!this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const t = this.ctx.currentTime;
    const gainVal = (opts.gain ?? 1.0);
    const rate = opts.rate ?? 1.0;
    const pan = Math.max(-1, Math.min(1, opts.pan ?? 0));

    // Panner & Gain Node
    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    if (panner) panner.pan.setValueAtTime(pan, t);

    const sfxGain = this.ctx.createGain();
    sfxGain.gain.setValueAtTime(gainVal, t);

    if (panner) {
      sfxGain.connect(panner);
      panner.connect(this.masterGain);
    } else {
      sfxGain.connect(this.masterGain);
    }

    switch (name) {
      case 'shot':
        this.synthGunshot(t, sfxGain, rate);
        break;
      case 'shotFar':
        this.synthGunshotFar(t, sfxGain);
        break;
      case 'hit':
        this.synthHit(t, sfxGain);
        break;
      case 'kill':
        this.synthKill(t, sfxGain);
        break;
      case 'reloadA':
        this.synthClick(t, sfxGain, 650, 0.05);
        break;
      case 'reloadB':
        this.synthClick(t, sfxGain, 1200, 0.07);
        break;
      case 'step':
      case 'step2':
        this.synthFootstep(t, sfxGain, name === 'step2');
        break;
      case 'jump':
        this.synthJump(t, sfxGain);
        break;
      case 'land':
        this.synthLand(t, sfxGain);
        break;
      case 'empty':
        this.synthClick(t, sfxGain, 2400, 0.03);
        break;
      case 'bounce':
        this.synthBounce(t, sfxGain);
        break;
      case 'explode':
        this.synthExplosion(t, sfxGain);
        break;
      case 'hurt':
        this.synthHurt(t, sfxGain);
        break;
      case 'ui':
        this.synthUi(t, sfxGain);
        break;
    }
  }

  public playAt(name: SfxName, src: { x: number; y: number; z: number }, listener: { x: number; y: number; z: number }, yaw: number, baseGain = 1.0) {
    const dx = src.x - listener.x;
    const dy = src.y - listener.y;
    const dz = src.z - listener.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const gain = (baseGain / (1 + 0.08 * dist));
    if (gain < 0.01) return;

    // Stereo pan relative to listener yaw
    const rx = Math.cos(yaw);
    const rz = -Math.sin(yaw);
    const len = Math.max(dist, 0.5);
    const pan = Math.max(-1, Math.min(1, ((dx * rx + dz * rz) / len) * 0.8));

    this.play(name, { gain, pan });
  }

  private synthGunshot(t: number, out: GainNode, rate: number) {
    if (!this.ctx) return;

    // 1. Noise transient (high crack)
    const noiseBuffer = this.createNoiseBuffer(0.25);
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.playbackRate.setValueAtTime(rate, t);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4500 * rate, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.22);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(1.0, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(out);
    noise.start(t);

    // 2. Punch sub bass
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(160 * rate, t);
    sub.frequency.exponentialRampToValueAtTime(35, t + 0.18);

    subGain.gain.setValueAtTime(0.9, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    sub.connect(subGain);
    subGain.connect(out);
    sub.start(t);
    sub.stop(t + 0.2);
  }

  private synthGunshotFar(t: number, out: GainNode) {
    if (!this.ctx) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.3);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(150, t + 0.28);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    noise.start(t);
  }

  private synthHit(t: number, out: GainNode) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1750, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.04);

    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(g);
    g.connect(out);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  private synthKill(t: number, out: GainNode) {
    if (!this.ctx) return;
    const freqs = [700, 950, 1300];
    freqs.forEach((freq, idx) => {
      const startT = t + idx * 0.04;
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startT);

      g.gain.setValueAtTime(0.4, startT);
      g.gain.exponentialRampToValueAtTime(0.001, startT + 0.1);

      osc.connect(g);
      g.connect(out);
      osc.start(startT);
      osc.stop(startT + 0.1);
    });
  }

  private synthClick(t: number, out: GainNode, freq: number, dur: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);

    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(g);
    g.connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.01);
  }

  private synthFootstep(t: number, out: GainNode, alt: boolean) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(alt ? 95 : 110, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.07);

    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(g);
    g.connect(out);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  private synthJump(t: number, out: GainNode) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.12);

    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(g);
    g.connect(out);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  private synthLand(t: number, out: GainNode) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);

    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(g);
    g.connect(out);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  private synthBounce(t: number, out: GainNode) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1100, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.06);

    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(g);
    g.connect(out);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  private synthExplosion(t: number, out: GainNode) {
    if (!this.ctx) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(1.2);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + 0.8);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(1.0, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.1);

    noise.connect(filter);
    filter.connect(g);
    g.connect(out);
    noise.start(t);

    // Deep sub rumble
    const sub = this.ctx.createOscillator();
    const subG = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(85, t);
    sub.frequency.exponentialRampToValueAtTime(25, t + 0.7);

    subG.gain.setValueAtTime(1.0, t);
    subG.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

    sub.connect(subG);
    subG.connect(out);
    sub.start(t);
    sub.stop(t + 0.75);
  }

  private synthHurt(t: number, out: GainNode) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.16);

    g.gain.setValueAtTime(0.6, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(g);
    g.connect(out);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  private synthUi(t: number, out: GainNode) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);

    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(g);
    g.connect(out);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  private createNoiseBuffer(duration: number): AudioBuffer {
    const sampleRate = this.ctx!.sampleRate;
    const bufferSize = Math.floor(sampleRate * duration);
    const buffer = this.ctx!.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }
}

export const audio = new SoundEngine();
