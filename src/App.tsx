import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Settings as SettingsIcon, Shield, Crosshair, Award, Volume2, Download } from 'lucide-react';
import { GameEngine } from './game/renderer';
import { audio } from './game/audio';
import { Hud } from './components/Hud';
import { TouchControls } from './components/TouchControls';
import { ScoreboardModal } from './components/ScoreboardModal';
import { SettingsModal } from './components/SettingsModal';
import type { GamePhase, GameSettings, KillfeedItem, PopupMedal, DamageIndicator, ScoreRow } from './types';

const MEME_KILL_POPUPS = [
  'VIBE SLOP!',
  'GET CLAUDED',
  'PROMPT INJECTED',
  'HALLUCINATED!',
  'TOKENS SPENT',
  'FRICKIE APPROVES',
  'SKIBIDI DOWNED',
  'MAX CONTEXT KILL',
];

export default function App() {
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [countdown, setCountdown] = useState(3);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Settings
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem('codv_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      sensitivity: 5.0,
      invertY: false,
      volume: 0.8,
      quality: 'medium',
      showFps: false,
    };
  });

  // Game Telemetry State for HUD
  const [hudState, setHudState] = useState({
    hp: 100,
    mag: 30,
    reserve: 120,
    grenades: 2,
    reloading: false,
    reloadProgress: 0,
    yaw: Math.PI,
    px: 0,
    pz: -25,
    bloom: 0,
    adsT: 0,
    fps: 60,
    alive: true,
    botRadar: [] as { x: number; z: number; alive: boolean }[],
  });

  const [playerScore, setPlayerScore] = useState(0);
  const [leaderScore, setLeaderScore] = useState(0);
  const [hitmarker, setHitmarker] = useState({ visible: false, isKill: false });
  const [killfeed, setKillfeed] = useState<KillfeedItem[]>([]);
  const [popups, setPopups] = useState<PopupMedal[]>([]);
  const [damageIndicators, setDamageIndicators] = useState<DamageIndicator[]>([]);
  const [deathInfo, setDeathInfo] = useState<{ killer: string; respawnIn: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const hitmarkerTimeout = useRef<number | null>(null);

  // Detect touch
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Save settings
  const handleSaveSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('codv_settings', JSON.stringify(newSettings));
    } catch {}
    if (engineRef.current) {
      engineRef.current.updateSettings(newSettings);
    }
  };

  // Start match deploy
  const handleDeploy = () => {
    audio.init();
    audio.setVolume(settings.volume);
    setPlayerScore(0);
    setLeaderScore(0);
    setKillfeed([]);
    setPopups([]);
    setDeathInfo(null);
    setPhase('countdown');
    setCountdown(3);

    // Audio cue
    audio.play('ui', { gain: 0.6 });
  };

  // Countdown timer
  useEffect(() => {
    if (phase === 'countdown') {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setPhase('playing');
            audio.play('ui', { gain: 0.8, rate: 1.4 });
            // Attempt pointer lock on desktop
            if (canvasRef.current && !isTouchDevice) {
              canvasRef.current.requestPointerLock?.();
            }
            return 0;
          }
          audio.play('ui', { gain: 0.5, rate: 0.9 + (4 - prev) * 0.1 });
          return prev - 1;
        });
      }, 950);
      return () => clearInterval(interval);
    }
  }, [phase, isTouchDevice]);

  // Initialize GameEngine
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current, settings);
    engineRef.current = engine;

    // Connect callbacks
    engine.onHudUpdate = (data) => {
      setHudState(data);
    };

    engine.onHitmarker = (isKill) => {
      setHitmarker({ visible: true, isKill });
      if (hitmarkerTimeout.current) clearTimeout(hitmarkerTimeout.current);
      hitmarkerTimeout.current = window.setTimeout(() => {
        setHitmarker({ visible: false, isKill: false });
      }, 160);
    };

    engine.onDamageTaken = (sourcePos) => {
      const p = engine.player;
      const dx = sourcePos.x - p.pos.x;
      const dz = sourcePos.z - p.pos.z;
      const worldAng = Math.atan2(dx, -dz);
      const relAng = worldAng + p.yaw;

      const newIndicator: DamageIndicator = { angle: relAng, t: Date.now() };
      setDamageIndicators((prev) => [...prev.slice(-2), newIndicator]);

      setTimeout(() => {
        setDamageIndicators((prev) => prev.filter((item) => item !== newIndicator));
      }, 800);
    };

    engine.onKill = (killer, victim, weapon, headshot, byPlayer) => {
      const item: KillfeedItem = {
        id: Date.now() + Math.random(),
        killer,
        victim,
        weapon,
        headshot,
        t: Date.now(),
      };
      setKillfeed((prev) => [item, ...prev].slice(0, 6));

      if (byPlayer) {
        setPlayerScore((s) => {
          const nextScore = s + 1;
          if (nextScore >= 30) {
            setPhase('gameover');
          }
          return nextScore;
        });

        const phrase = MEME_KILL_POPUPS[Math.floor(Math.random() * MEME_KILL_POPUPS.length)];
        const popupText = headshot ? `+100 💀 HEADSHOT` : `+100 ${phrase}`;
        const newPopup: PopupMedal = {
          id: Date.now() + Math.random(),
          text: popupText,
          big: headshot,
          t: Date.now(),
        };
        setPopups((prev) => [...prev.slice(-2), newPopup]);
        setTimeout(() => {
          setPopups((prev) => prev.filter((p) => p !== newPopup));
        }, 1400);
      } else {
        // Bot scored
        const bot = engine.bots.find((b) => b.name === killer);
        if (bot) {
          bot.score += 1;
          setLeaderScore((cur) => Math.max(cur, bot.score));
          if (bot.score >= 30) {
            setPhase('gameover');
          }
        }
      }
    };

    engine.onPlayerDeath = (killer) => {
      setDeathInfo({ killer, respawnIn: 3.5 });
      let remaining = 3.5;
      const timer = setInterval(() => {
        remaining -= 0.5;
        if (remaining <= 0) {
          clearInterval(timer);
          setDeathInfo(null);
          engine.respawnPlayer();
        } else {
          setDeathInfo({ killer, respawnIn: Math.max(0, parseFloat(remaining.toFixed(1))) });
        }
      }, 500);
    };

    engine.start();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Desktop Keyboard & Mouse Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const engine = engineRef.current;
      if (!engine) return;

      if (e.code === 'KeyW' || e.code === 'ArrowUp') engine.input.forward = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') engine.input.backward = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') engine.input.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') engine.input.right = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') engine.input.sprint = true;
      if (e.code === 'Space') engine.input.jump = true;
      if (e.code === 'KeyR') engine.input.reload = true;
      if (e.code === 'KeyG') engine.input.frag = true;

      // Pause toggle
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (phase === 'playing') {
          setPhase('paused');
          document.exitPointerLock?.();
        } else if (phase === 'paused') {
          setPhase('playing');
          canvasRef.current?.requestPointerLock?.();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      if (e.code === 'KeyW' || e.code === 'ArrowUp') engine.input.forward = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') engine.input.backward = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') engine.input.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') engine.input.right = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') engine.input.sprint = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      const engine = engineRef.current;
      if (!engine || phase !== 'playing') return;

      if (e.button === 0) {
        engine.input.fire = true;
      } else if (e.button === 2) {
        engine.input.ads = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      if (e.button === 0) {
        engine.input.fire = false;
      } else if (e.button === 2) {
        engine.input.ads = false;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const engine = engineRef.current;
      if (!engine || phase !== 'playing') return;
      if (document.pointerLockElement === canvasRef.current) {
        engine.input.lookDX += e.movementX;
        engine.input.lookDY += e.movementY;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [phase]);

  // Click canvas to resume pointer lock
  const handleCanvasClick = () => {
    if (phase === 'playing' && !isTouchDevice && canvasRef.current) {
      if (document.pointerLockElement !== canvasRef.current) {
        canvasRef.current.requestPointerLock?.();
      }
    }
  };

  // Compile full scoreboard rows
  const getScoreRows = (): ScoreRow[] => {
    const rows: ScoreRow[] = [
      { name: 'YOU', score: playerScore, isPlayer: true },
    ];
    if (engineRef.current) {
      engineRef.current.bots.forEach((b) => {
        rows.push({ name: b.name, score: b.score, isPlayer: false });
      });
    }
    return rows;
  };

  return (
    <div className="relative w-screen h-screen bg-slate-950 overflow-hidden select-none">
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="absolute inset-0 w-full h-full block cursor-crosshair"
      />

      {/* Main Start / Deploy Menu */}
      {phase === 'menu' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-6 font-mono">
          <div className="max-w-lg w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center">
            {/* Tagline */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-bold tracking-widest uppercase mb-4">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>UNOFFICIAL FAN OPERATION</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-wider leading-none mb-1 drop-shadow-md">
              CLAUDE OF DUTY
            </h1>
            <h2 className="text-xl sm:text-2xl font-black text-amber-400 tracking-[0.25em] mb-6">
              VIBE SLOPS II
            </h2>

            <p className="text-xs text-slate-300 mb-8 max-w-sm leading-relaxed">
              Hijacked Superyacht Arena • NV-4 Carbine • Ghost Bot Squad • Web Audio Synthesizer • Procedural 3D
            </p>

            <div className="w-full space-y-3 mb-6">
              <button
                onClick={handleDeploy}
                className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black tracking-widest text-base rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition-transform active:scale-95 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-slate-950" />
                <span>TAP TO DEPLOY</span>
              </button>

              <button
                onClick={() => setSettingsOpen(true)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold tracking-wider text-xs rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <SettingsIcon className="w-4 h-4 text-cyan-400" />
                <span>SETTINGS & CONTROLS</span>
              </button>

              <a
                href="/Claude-of-Duty.zip"
                download="Claude-of-Duty.zip"
                className="w-full py-2.5 bg-slate-900/80 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-700/60 font-semibold tracking-wider text-[11px] rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>DOWNLOAD CLAUDE-OF-DUTY.ZIP</span>
              </a>
            </div>

            <div className="text-[11px] text-slate-500 max-w-xs">
              Desktop: WASD + Mouse aim & click to lock.
              <br />
              Mobile: Dual-stick on-screen virtual touch controls.
            </div>
          </div>
        </div>
      )}

      {/* Countdown Overlay */}
      {phase === 'countdown' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/40 pointer-events-none font-mono select-none">
          <div className="text-center animate-pulse">
            <span className="text-8xl font-black text-amber-400 drop-shadow-[0_4px_16px_rgba(251,191,36,0.6)]">
              {countdown > 0 ? countdown : 'SEND IT'}
            </span>
            <div className="text-cyan-300 tracking-[0.3em] font-bold text-sm mt-3">
              PREPARING OPERATOR DEPLOYMENT
            </div>
          </div>
        </div>
      )}

      {/* Active Game HUD */}
      {(phase === 'playing' || phase === 'countdown') && (
        <Hud
          hp={hudState.hp}
          maxHp={100}
          mag={hudState.mag}
          reserve={hudState.reserve}
          grenades={hudState.grenades}
          reloading={hudState.reloading}
          reloadProgress={hudState.reloadProgress}
          yaw={hudState.yaw}
          px={hudState.px}
          pz={hudState.pz}
          bloom={hudState.bloom}
          adsT={hudState.adsT}
          fps={hudState.fps}
          showFps={settings.showFps}
          score={playerScore}
          leaderScore={leaderScore}
          hitmarker={hitmarker}
          damageIndicators={damageIndicators}
          killfeed={killfeed}
          popups={popups}
          botRadar={hudState.botRadar}
          onPause={() => setPhase('paused')}
          isTouchDevice={isTouchDevice}
        />
      )}

      {/* Touch Screen Virtual Controls (Mobile / Tablet) */}
      {(phase === 'playing' || phase === 'countdown') && isTouchDevice && engineRef.current && (
        <TouchControls input={engineRef.current.input} />
      )}

      {/* Death Screen Overlay */}
      {deathInfo && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-950/40 pointer-events-none font-mono">
          <div className="text-center animate-in fade-in zoom-in duration-200">
            <h2 className="text-4xl font-black text-red-500 tracking-widest drop-shadow-[0_2px_12px_rgba(239,68,68,0.8)]">
              ELIMINATED
            </h2>
            <p className="text-sm text-slate-200 font-bold mt-1">
              by <span className="text-red-400">{deathInfo.killer}</span>
            </p>
            <div className="mt-3 text-xs text-amber-300 font-semibold tracking-wider">
              Redeploying in {deathInfo.respawnIn.toFixed(1)}s...
            </div>
          </div>
        </div>
      )}

      {/* Pause Menu Overlay */}
      {phase === 'paused' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 font-mono">
          <div className="max-w-sm w-full bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 flex flex-col items-center text-center">
            <h2 className="text-2xl font-black text-white tracking-widest mb-6">GAME PAUSED</h2>

            <div className="w-full space-y-3">
              <button
                onClick={() => {
                  setPhase('playing');
                  if (!isTouchDevice) canvasRef.current?.requestPointerLock?.();
                }}
                className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black tracking-wider text-sm rounded-xl transition-transform active:scale-95"
              >
                RESUME
              </button>

              <button
                onClick={() => setSettingsOpen(true)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                SETTINGS
              </button>

              <button
                onClick={() => {
                  setPhase('menu');
                  document.exitPointerLock?.();
                }}
                className="w-full py-3 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 font-bold text-xs rounded-xl transition-colors"
              >
                ABORT MATCH
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {phase === 'gameover' && (
        <ScoreboardModal
          scores={getScoreRows()}
          isGameOver={true}
          onRematch={handleDeploy}
          onQuit={() => setPhase('menu')}
        />
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
