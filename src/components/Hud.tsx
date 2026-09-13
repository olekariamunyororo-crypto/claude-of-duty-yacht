import React from 'react';
import { Crosshair, ShieldAlert, Zap } from 'lucide-react';
import type { KillfeedItem, PopupMedal, DamageIndicator } from '../types';

interface HudProps {
  hp: number;
  maxHp: number;
  mag: number;
  reserve: number;
  grenades: number;
  reloading: boolean;
  reloadProgress: number;
  yaw: number;
  px: number;
  pz: number;
  bloom: number;
  adsT: number;
  fps: number;
  showFps: boolean;
  score: number;
  leaderScore: number;
  hitmarker: { visible: boolean; isKill: boolean };
  damageIndicators: DamageIndicator[];
  killfeed: KillfeedItem[];
  popups: PopupMedal[];
  botRadar: { x: number; z: number; alive: boolean }[];
  onPause: () => void;
  isTouchDevice: boolean;
}

export const Hud: React.FC<HudProps> = ({
  hp,
  maxHp,
  mag,
  reserve,
  grenades,
  reloading,
  reloadProgress,
  yaw,
  px,
  pz,
  bloom,
  adsT,
  fps,
  showFps,
  score,
  leaderScore,
  hitmarker,
  damageIndicators,
  killfeed,
  popups,
  botRadar,
  onPause,
  isTouchDevice,
}) => {
  // Crosshair gap calculation
  const baseGap = (12 + bloom * 60) * (1 - adsT * 0.75);
  const crosshairOpacity = Math.max(0.2, 1 - adsT * 0.65);

  // Compass Heading
  const headingDeg = ((-yaw * 180) / Math.PI % 360 + 360) % 360;
  const compassLabels = [
    { deg: 0, label: 'N' },
    { deg: 45, label: 'NE' },
    { deg: 90, label: 'E' },
    { deg: 135, label: 'SE' },
    { deg: 180, label: 'S' },
    { deg: 225, label: 'SW' },
    { deg: 270, label: 'W' },
    { deg: 315, label: 'NW' },
  ];

  // Minimap Radar calculations (Radar Radius: 60px, Scale: 1.8px per meter)
  const radarR = 56;
  const radarScale = 1.6;

  // Low HP Vignette opacity
  const lowHpIntensity = Math.max(0, (40 - hp) / 40);

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-mono">
      {/* Low Health Blood Vignette */}
      {lowHpIntensity > 0 && (
        <div
          className="absolute inset-0 transition-opacity duration-150"
          style={{
            background: `radial-gradient(ellipse at center, transparent 45%, rgba(185, 28, 28, ${lowHpIntensity * 0.75}) 100%)`,
          }}
        />
      )}

      {/* Top Header Bar: Score, Compass & Pause Button */}
      <div className="absolute top-2 left-0 right-0 px-4 flex items-center justify-between pointer-events-auto">
        {/* Radar Minimap */}
        <div className="relative w-28 h-28 rounded-full bg-slate-950/80 border-2 border-cyan-500/40 backdrop-blur-sm overflow-hidden shadow-lg shadow-cyan-950/50">
          {/* Compass Rings */}
          <div className="absolute inset-0 rounded-full border border-cyan-500/20" />
          <div className="absolute inset-3 rounded-full border border-dashed border-cyan-500/20" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-cyan-500/20 -translate-x-1/2" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-500/20 -translate-y-1/2" />

          {/* Yacht Hull outline projected relative to player pos & yaw */}
          <div
            className="absolute inset-0 origin-center"
            style={{
              transform: `rotate(${-yaw}rad)`,
            }}
          >
            {/* Yacht schematic centered at world (0,0) */}
            <div
              className="absolute border border-slate-400/40 rounded-t-xl bg-slate-800/30"
              style={{
                width: 14 * radarScale,
                height: 60 * radarScale,
                left: `calc(50% + ${(-px - 7) * radarScale}px)`,
                top: `calc(50% + ${(-pz - 30) * radarScale}px)`,
              }}
            >
              {/* Helipad circle mark */}
              <div
                className="absolute w-5 h-5 rounded-full border border-amber-400/50 flex items-center justify-center text-[8px] text-amber-300 font-bold"
                style={{ top: '6px', left: 'calc(50% - 10px)' }}
              >
                H
              </div>
            </div>
          </div>

          {/* Enemy Bot Blips on Radar */}
          {botRadar.map((b, idx) => {
            if (!b.alive) return null;
            const dx = b.x - px;
            const dz = b.z - pz;
            const dist = Math.hypot(dx, dz);
            const clampedDist = Math.min(dist, (radarR - 6) / radarScale);
            const scaleFactor = dist > 0 ? clampedDist / dist : 1;

            // Rotate into player's view space (up = forward)
            const c = Math.cos(yaw);
            const s = Math.sin(yaw);
            const rx = (dx * c - dz * s) * scaleFactor * radarScale;
            const ry = (dx * s + dz * c) * scaleFactor * radarScale;

            return (
              <div
                key={idx}
                className="absolute w-2 h-2 -ml-1 -mt-1 rounded-full bg-red-500 shadow-sm shadow-red-500 animate-pulse"
                style={{
                  left: `calc(50% + ${rx}px)`,
                  top: `calc(50% + ${ry}px)`,
                }}
              />
            );
          })}

          {/* Player Direction Arrow (Center) */}
          <div className="absolute left-1/2 top-1/2 -ml-1.5 -mt-2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-cyan-400 shadow-sm shadow-cyan-400 drop-shadow" />
        </div>

        {/* Center: Compass Heading & Score Match */}
        <div className="flex flex-col items-center">
          {/* Compass Ribbon */}
          <div className="relative w-56 h-7 bg-slate-950/60 border border-slate-700/50 rounded px-2 flex items-center justify-center overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 bottom-0 w-1 bg-cyan-400/80 z-10" />
            <div className="flex items-center space-x-6 text-[11px] font-bold tracking-wider">
              {compassLabels.map(({ deg, label }) => {
                let diff = deg - headingDeg;
                while (diff > 180) diff -= 360;
                while (diff < -180) diff += 360;
                const offset = diff * 1.6;
                if (Math.abs(offset) > 100) return null;
                return (
                  <span
                    key={label}
                    className="absolute transition-transform duration-75"
                    style={{
                      transform: `translateX(${offset}px)`,
                      color: label === 'N' ? '#38bdf8' : '#cbd5e1',
                    }}
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          </div>

          {/* FFA Match Scoreboard Status */}
          <div className="mt-1 flex items-center space-x-3 text-xs bg-slate-900/80 px-3 py-0.5 rounded border border-slate-700/40">
            <span className="text-cyan-400 font-bold tracking-wider">YOU: {score}</span>
            <span className="text-slate-500">|</span>
            <span className="text-amber-400 font-bold tracking-wider">LEADER: {leaderScore}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">LIMIT: 30</span>
          </div>
        </div>

        {/* Top Right: Settings / Pause */}
        <div className="flex items-center space-x-2">
          {showFps && (
            <div className="px-2 py-1 bg-slate-950/70 border border-slate-700/50 rounded text-xs text-emerald-400 font-mono">
              {fps} FPS
            </div>
          )}
          <button
            onClick={onPause}
            className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-100 text-xs font-bold rounded border border-slate-600 transition-colors pointer-events-auto"
            title="Pause Game [ESC / P]"
          >
            PAUSE
          </button>
        </div>
      </div>

      {/* Killfeed (Top Right below header) */}
      <div className="absolute top-16 right-4 flex flex-col items-end space-y-1 z-10 pointer-events-none">
        {killfeed.slice(0, 5).map((item) => (
          <div
            key={item.id}
            className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-950/80 border border-slate-800 rounded text-xs animate-in fade-in slide-in-from-right-4 duration-150 shadow"
          >
            <span className={item.killer === 'YOU' ? 'text-cyan-400 font-bold' : 'text-red-400 font-medium'}>
              {item.killer}
            </span>
            <span className="text-slate-400 text-[10px] bg-slate-800 px-1 py-0.5 rounded font-mono">
              {item.weapon}
            </span>
            {item.headshot && <span className="text-amber-400 text-xs" title="Headshot">💀</span>}
            <span className={item.victim === 'YOU' ? 'text-cyan-400 font-bold' : 'text-red-400 font-medium'}>
              {item.victim}
            </span>
          </div>
        ))}
      </div>

      {/* Screen Center: Crosshair, Hitmarker, Damage Wedges & Reload Bar */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        {/* Dynamic Crosshair */}
        <div
          className="relative w-16 h-16 flex items-center justify-center transition-opacity duration-100"
          style={{ opacity: crosshairOpacity }}
        >
          {/* Center tiny dot */}
          <div className="w-1 h-1 bg-white rounded-full opacity-80" />

          {/* Crosshair ticks */}
          <div
            className="absolute w-3 h-0.5 bg-white shadow-sm"
            style={{ transform: `translateY(-${baseGap}px)` }}
          />
          <div
            className="absolute w-3 h-0.5 bg-white shadow-sm"
            style={{ transform: `translateY(${baseGap}px)` }}
          />
          <div
            className="absolute h-3 w-0.5 bg-white shadow-sm"
            style={{ transform: `translateX(-${baseGap}px)` }}
          />
          <div
            className="absolute h-3 w-0.5 bg-white shadow-sm"
            style={{ transform: `translateX(${baseGap}px)` }}
          />
        </div>

        {/* Hitmarker X */}
        {hitmarker.visible && (
          <div
            className={`absolute -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 text-2xl font-black select-none pointer-events-none ${
              hitmarker.isKill ? 'text-red-500 scale-125' : 'text-white'
            }`}
            style={{ textShadow: hitmarker.isKill ? '0 0 8px #ef4444' : '0 0 4px #fff' }}
          >
            ✕
          </div>
        )}

        {/* Reloading Progress Bar */}
        {reloading && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 w-28 flex flex-col items-center">
            <span className="text-[10px] text-amber-300 font-bold tracking-widest mb-0.5">RELOADING</span>
            <div className="w-full h-1.5 bg-slate-900/80 rounded-full border border-slate-700/60 overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-75 ease-linear"
                style={{ width: `${Math.round(reloadProgress * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Damage Direction Wedges */}
        {damageIndicators.map((ind, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 w-48 h-48 -ml-24 -mt-24 pointer-events-none"
            style={{ transform: `rotate(${ind.angle}rad)` }}
          >
            <div className="w-8 h-2 mx-auto bg-red-600/90 rounded-full shadow-[0_0_12px_rgba(239,68,68,0.9)] animate-ping" />
          </div>
        ))}
      </div>

      {/* Center Action Popups (Kill / Medals) */}
      <div className="absolute top-1/3 left-0 right-0 flex flex-col items-center pointer-events-none space-y-2">
        {popups.map((p) => (
          <div
            key={p.id}
            className={`font-black tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] transition-all animate-bounce ${
              p.big
                ? 'text-2xl text-amber-300 border-b-2 border-amber-400 pb-1'
                : 'text-lg text-cyan-300'
            }`}
          >
            {p.text}
          </div>
        ))}
      </div>

      {/* Bottom Left: Health & Status */}
      <div className="absolute bottom-4 left-4 flex flex-col space-y-1.5 pointer-events-none">
        <div className="flex items-center space-x-2">
          <div
            className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs ${
              hp < 30 ? 'bg-red-950 text-red-400 border border-red-500/50 animate-pulse' : 'bg-slate-900/90 text-cyan-400 border border-cyan-500/30'
            }`}
          >
            +
          </div>
          <span className="text-xl font-bold tracking-tight text-white drop-shadow">
            {Math.max(0, Math.round(hp))}
          </span>
          <span className="text-xs text-slate-400">/ {maxHp}</span>
        </div>

        {/* Health Bar */}
        <div className="w-52 h-2.5 bg-slate-950/80 rounded-full border border-slate-700/60 p-0.5 overflow-hidden backdrop-blur-sm">
          <div
            className={`h-full rounded-full transition-all duration-150 ${
              hp < 30 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : hp < 60 ? 'bg-amber-400' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
            }`}
            style={{ width: `${Math.max(0, Math.min(100, (hp / maxHp) * 100))}%` }}
          />
        </div>

        <div className="text-[10px] text-slate-400 font-mono">
          AUTOMATIC REGEN AFTER 3.5s
        </div>
      </div>

      {/* Bottom Right: Weapon Ammo & Grenades */}
      <div className="absolute bottom-4 right-4 flex items-end space-y-0 space-x-4 pointer-events-none">
        {/* Frag Grenades */}
        <div className="flex flex-col items-center bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded backdrop-blur-sm">
          <span className="text-[10px] text-slate-400 font-bold tracking-wider mb-0.5">FRAG [G]</span>
          <div className="flex items-center space-x-1">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-4 rounded-sm border ${
                  i < grenades
                    ? 'bg-emerald-500/90 border-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.7)]'
                    : 'bg-slate-800/60 border-slate-700 opacity-40'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Weapon Ammo Count */}
        <div className="bg-slate-950/80 border border-slate-700/60 px-4 py-2 rounded flex items-baseline space-x-2 backdrop-blur-sm shadow-xl">
          <div className="flex flex-col">
            <span className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase">
              NV-4 CARBINE
            </span>
            <div className="flex items-baseline space-x-1">
              <span className={`text-4xl font-black ${mag <= 5 ? 'text-red-500 animate-pulse' : 'text-amber-400'}`}>
                {mag}
              </span>
              <span className="text-slate-400 text-sm font-semibold">/ {reserve}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Controls Hint at bottom center (if not touch) */}
      {!isTouchDevice && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 tracking-wider bg-slate-950/60 px-3 py-0.5 rounded border border-slate-800/40">
          WASD: Move | MOUSE: Look | L-CLICK: Fire | R-CLICK: ADS | R: Reload | G: Frag | SHIFT: Sprint | SPACE: Jump
        </div>
      )}
    </div>
  );
};
