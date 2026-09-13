import React from 'react';
import { Trophy, RotateCcw, Home, Skull } from 'lucide-react';
import type { ScoreRow } from '../types';

interface ScoreboardModalProps {
  scores: ScoreRow[];
  isGameOver: boolean;
  onRematch: () => void;
  onQuit: () => void;
}

export const ScoreboardModal: React.FC<ScoreboardModalProps> = ({
  scores,
  isGameOver,
  onRematch,
  onQuit,
}) => {
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const playerWon = sorted[0]?.isPlayer;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 select-none font-mono">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 flex flex-col items-center">
        {isGameOver ? (
          <div className="text-center mb-5">
            <div className="inline-flex p-3 rounded-full bg-slate-800 border border-slate-600 mb-2">
              {playerWon ? (
                <Trophy className="w-8 h-8 text-amber-400 animate-bounce" />
              ) : (
                <Skull className="w-8 h-8 text-red-400 animate-pulse" />
              )}
            </div>
            <h2 className={`text-3xl font-black tracking-wider ${playerWon ? 'text-amber-400' : 'text-red-400'}`}>
              {playerWon ? 'VICTORY' : 'DEFEAT'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {playerWon ? 'YOU WON THE FREE-FOR-ALL MATCH!' : 'OUT-VIBED BY GHOST SQUAD!'}
            </p>
          </div>
        ) : (
          <div className="text-center mb-4">
            <h2 className="text-2xl font-black text-white tracking-widest">MATCH STANDINGS</h2>
            <p className="text-xs text-slate-400">FIRST OPERATOR TO 30 KILLS WINS</p>
          </div>
        )}

        {/* Scoreboard Table */}
        <div className="w-full bg-slate-950/70 border border-slate-800 rounded-lg overflow-hidden mb-6">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-slate-700 text-xs font-bold text-slate-400">
            <span>OPERATOR</span>
            <span>KILLS</span>
          </div>
          <div className="divide-y divide-slate-800/60">
            {sorted.map((row, idx) => (
              <div
                key={row.name}
                className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                  row.isPlayer
                    ? 'bg-cyan-950/40 text-cyan-300 font-bold border-l-4 border-l-cyan-400'
                    : 'text-slate-300 hover:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 w-4">#{idx + 1}</span>
                  <span>{row.name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="font-mono text-base font-bold">{row.score}</span>
                  <span className="text-[10px] text-slate-500">/ 30</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 w-full">
          <button
            onClick={onRematch}
            className="flex-1 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black tracking-wider text-sm rounded-lg flex items-center justify-center space-x-2 shadow-lg transition-transform active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>REMATCH</span>
          </button>
          <button
            onClick={onQuit}
            className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-lg flex items-center justify-center space-x-2 border border-slate-600 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
