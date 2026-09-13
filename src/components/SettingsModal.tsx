import React from 'react';
import { X, Volume2, Eye, Gauge, Keyboard } from 'lucide-react';
import type { GameSettings } from '../types';

interface SettingsModalProps {
  settings: GameSettings;
  onSave: (settings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSave,
  onClose,
}) => {
  const [localSettings, setLocalSettings] = React.useState<GameSettings>({ ...settings });

  const handleChange = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 select-none font-mono">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h2 className="text-xl font-black text-cyan-400 tracking-wider flex items-center space-x-2">
            <span>SETTINGS & CONTROLS</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-5 divide-y divide-slate-800">
          {/* Look Sensitivity */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>Look Sensitivity</span>
              </label>
              <span className="text-sm text-cyan-300 font-bold">{localSettings.sensitivity.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={localSettings.sensitivity}
              onChange={(e) => handleChange('sensitivity', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Invert Y */}
          <div className="pt-4 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-200">Invert Y Axis</span>
            <button
              onClick={() => handleChange('invertY', !localSettings.invertY)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                localSettings.invertY
                  ? 'bg-cyan-500 text-black border-cyan-400'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {localSettings.invertY ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Master Volume */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span>Master Volume</span>
              </label>
              <span className="text-sm text-cyan-300 font-bold">{Math.round(localSettings.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={localSettings.volume}
              onChange={(e) => handleChange('volume', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Graphics Quality */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <span>Graphics Quality</span>
              </label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => handleChange('quality', tier)}
                  className={`py-2 text-xs font-bold rounded border uppercase transition-all ${
                    localSettings.quality === tier
                      ? 'bg-amber-400 text-black border-amber-300 shadow-md'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          {/* FPS Counter Toggle */}
          <div className="pt-4 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-200">Show FPS Counter</span>
            <button
              onClick={() => handleChange('showFps', !localSettings.showFps)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                localSettings.showFps
                  ? 'bg-emerald-500 text-black border-emerald-400'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {localSettings.showFps ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Controls Reference */}
          <div className="pt-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1 mb-2">
              <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
              <span>KEYBOARD & MOUSE CONTROLS</span>
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div><strong className="text-cyan-300">W, A, S, D:</strong> Move</div>
              <div><strong className="text-cyan-300">Mouse:</strong> Look Around</div>
              <div><strong className="text-cyan-300">Left Click:</strong> Fire Weapon</div>
              <div><strong className="text-cyan-300">Right Click:</strong> Aim (ADS)</div>
              <div><strong className="text-cyan-300">Shift:</strong> Sprint</div>
              <div><strong className="text-cyan-300">Space:</strong> Jump</div>
              <div><strong className="text-cyan-300">R:</strong> Reload</div>
              <div><strong className="text-cyan-300">G:</strong> Throw Frag Grenade</div>
              <div><strong className="text-cyan-300">ESC / P:</strong> Pause / Cursor</div>
              <div><strong className="text-cyan-300">Touch:</strong> Dual Virtual Joysticks</div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black tracking-wider text-sm rounded-lg transition-transform active:scale-95"
        >
          APPLY & CLOSE
        </button>
      </div>
    </div>
  );
};
