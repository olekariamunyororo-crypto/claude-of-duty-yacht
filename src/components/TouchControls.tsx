import React, { useRef, useState, useCallback } from 'react';
import type { InputState } from '../game/renderer';

interface TouchControlsProps {
  input: InputState;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ input }) => {
  const [stickActive, setStickActive] = useState(false);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const stickTouchId = useRef<number | null>(null);
  const stickOrigin = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const lookTouchId = useRef<number | null>(null);
  const lastLookPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Joystick handlers
  const handleStickStart = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    stickTouchId.current = touch.identifier;
    stickOrigin.current = { x: touch.clientX, y: touch.clientY };
    setStickActive(true);
    setStickPos({ x: 0, y: 0 });
  };

  const handleStickMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === stickTouchId.current) {
        const dx = touch.clientX - stickOrigin.current.x;
        const dy = touch.clientY - stickOrigin.current.y;
        const dist = Math.hypot(dx, dy);
        const maxR = 48;
        const clampedDist = Math.min(dist, maxR);
        const angle = Math.atan2(dy, dx);

        const nx = (Math.cos(angle) * clampedDist) / maxR;
        const ny = (Math.sin(angle) * clampedDist) / maxR;

        setStickPos({
          x: Math.cos(angle) * clampedDist,
          y: Math.sin(angle) * clampedDist,
        });

        input.virtualMoveX = nx;
        input.virtualMoveY = -ny; // inverted Y for screen coordinates (up is forward)
      }
    }
  };

  const handleStickEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === stickTouchId.current) {
        stickTouchId.current = null;
        setStickActive(false);
        setStickPos({ x: 0, y: 0 });
        input.virtualMoveX = 0;
        input.virtualMoveY = 0;
      }
    }
  };

  // Right look pad handlers
  const handleLookStart = (e: React.TouchEvent) => {
    // Only capture if not already tracking
    if (lookTouchId.current === null) {
      const touch = e.changedTouches[0];
      lookTouchId.current = touch.identifier;
      lastLookPos.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleLookMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchId.current) {
        const dx = touch.clientX - lastLookPos.current.x;
        const dy = touch.clientY - lastLookPos.current.y;

        input.lookDX += dx * 1.5;
        input.lookDY += dy * 1.5;

        lastLookPos.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  };

  const handleLookEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchId.current) {
        lookTouchId.current = null;
      }
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none touch-none z-20">
      {/* Right Look Area (covers right 60% of screen) */}
      <div
        className="absolute top-16 right-0 bottom-0 w-3/5 pointer-events-auto"
        onTouchStart={handleLookStart}
        onTouchMove={handleLookMove}
        onTouchEnd={handleLookEnd}
        onTouchCancel={handleLookEnd}
      />

      {/* Left Virtual Joystick Area */}
      <div
        className="absolute bottom-6 left-6 w-36 h-36 rounded-full bg-slate-900/40 border-2 border-slate-600/40 flex items-center justify-center pointer-events-auto backdrop-blur-sm"
        onTouchStart={handleStickStart}
        onTouchMove={handleStickMove}
        onTouchEnd={handleStickEnd}
        onTouchCancel={handleStickEnd}
      >
        {/* Joystick Stick Knob */}
        <div
          className="w-14 h-14 rounded-full bg-cyan-500/50 border border-cyan-300 shadow-md transition-transform duration-75 flex items-center justify-center text-[10px] text-cyan-200 font-bold"
          style={{
            transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
          }}
        >
          MOVE
        </div>
      </div>

      {/* Action Buttons on Right Side */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end space-y-3 pointer-events-auto">
        <div className="flex items-center space-x-3">
          {/* ADS Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              input.ads = true;
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              input.ads = false;
            }}
            className={`w-14 h-14 rounded-xl border font-bold text-xs shadow-lg transition-all ${
              input.ads
                ? 'bg-cyan-500 text-black border-cyan-300 scale-95'
                : 'bg-slate-900/80 text-cyan-300 border-cyan-500/40'
            }`}
          >
            ADS
          </button>

          {/* Jump Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              input.jump = true;
            }}
            className="w-14 h-14 rounded-xl bg-slate-900/80 active:bg-slate-700 text-slate-100 border border-slate-600 font-bold text-xs shadow-lg"
          >
            JUMP
          </button>

          {/* Big Fire Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              input.fire = true;
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              input.fire = false;
            }}
            className={`w-20 h-20 rounded-full border-2 font-black text-sm shadow-2xl transition-transform ${
              input.fire
                ? 'bg-red-600 border-red-300 scale-95 shadow-red-600/60'
                : 'bg-red-500/80 border-red-400 text-white'
            }`}
          >
            FIRE
          </button>
        </div>

        {/* Secondary Row: Reload & Frag */}
        <div className="flex items-center space-x-3 pr-2">
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              input.frag = true;
            }}
            className="px-3.5 py-2 rounded-lg bg-emerald-900/70 text-emerald-300 border border-emerald-500/50 text-xs font-bold shadow active:scale-95"
          >
            FRAG
          </button>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              input.reload = true;
            }}
            className="px-4 py-2 rounded-lg bg-amber-900/70 text-amber-300 border border-amber-500/50 text-xs font-bold shadow active:scale-95"
          >
            RELOAD
          </button>
        </div>
      </div>
    </div>
  );
};
