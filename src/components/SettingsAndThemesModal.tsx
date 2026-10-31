import React from 'react';
import { KeyboardSoundpack, OSTheme } from '../types/depthos';

interface SettingsAndThemesModalProps {
  currentTheme: OSTheme;
  currentSoundpack: KeyboardSoundpack;
  isMuted: boolean;
  sfxVolume: number;
  musicVolume: number;
  cameraPreset: 'desk' | 'monitor' | 'motherboard';
  onSelectTheme: (theme: OSTheme) => void;
  onSelectSoundpack: (soundpack: KeyboardSoundpack) => void;
  onToggleMute: () => void;
  onChangeVolume: (sfx: number, music: number) => void;
  onSelectCameraPreset: (preset: 'desk' | 'monitor' | 'motherboard') => void;
  onRestartTutorial: () => void;
  onClose: () => void;
}

export const SettingsAndThemesModal: React.FC<SettingsAndThemesModalProps> = ({
  currentTheme,
  currentSoundpack,
  isMuted,
  sfxVolume,
  musicVolume,
  cameraPreset,
  onSelectTheme,
  onSelectSoundpack,
  onToggleMute,
  onChangeVolume,
  onSelectCameraPreset,
  onRestartTutorial,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 font-mono">
      <div className="bg-[#0b0e14] border-2 border-cyan-500/60 rounded-lg w-full max-w-2xl text-cyan-400 p-6 shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-900 pb-4 mb-4">
          <div>
            <h2 className="text-xl font-bold tracking-widest text-white flex items-center gap-2">
              <span className="w-3 h-3 bg-cyan-400 inline-block animate-pulse"></span>
              SYSTEM CONFIGURATION & SHELL PREFERENCES
            </h2>
            <p className="text-xs text-cyan-500 mt-1">
              Customize CRT display phosphor, mechanical audio feedback, and 3D camera angles.
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-red-950/60 border border-red-500/50 hover:bg-red-800 text-red-200 text-xs font-bold rounded"
          >
            [ESC] CLOSE
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1 text-xs">
          {/* OS Themes */}
          <div>
            <div className="text-xs uppercase font-bold text-cyan-300 border-b border-cyan-950 pb-1 mb-3">
              OS Shell Color Scheme
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'cyber_green', name: 'Cyber Phosphor Green', color: '#10b981' },
                { id: 'amber_phosphor', name: 'Vintage Amber CRT', color: '#f59e0b' },
                { id: 'midnight_matrix', name: 'Midnight Matrix Cyan', color: '#06b6d4' },
                { id: 'holographic_aurora', name: 'Holographic Aurora OS', color: '#ec4899' },
                { id: 'cryodyn_ice', name: 'CryoDyn Ice Blizzard', color: '#38bdf8' },
                { id: 'overvolt_gold', name: 'Overvolt Golden Glow', color: '#fbbf24' },
                { id: 'synthwave_1984', name: 'Retro Synthwave 1984', color: '#c084fc' },
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => onSelectTheme(theme.id as OSTheme)}
                  className={`p-3 rounded border text-left flex items-center justify-between transition-all ${
                    currentTheme === theme.id
                      ? 'bg-cyan-950/40 border-cyan-400 text-white'
                      : 'bg-[#10141d] border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.color }}></span>
                    <span>{theme.name}</span>
                  </div>
                  {currentTheme === theme.id && <span className="text-[10px] text-cyan-400 font-bold">ACTIVE</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Keyboard Audio Soundpacks */}
          <div>
            <div className="text-xs uppercase font-bold text-cyan-300 border-b border-cyan-950 pb-1 mb-3">
              Mechanical Keyboard Soundpack
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'cherry_blue', name: 'Cherry MX Blue (Crisp Click)', desc: 'High tactile click and sharp release' },
                { id: 'ibm_model_m', name: 'IBM Model M (Buckling Spring)', desc: 'Heavy clacking industrial spring' },
                { id: 'laser_synth', name: 'Laser Synth (Futuristic Zap)', desc: 'Synthesized high-tech frequency pulse' },
                { id: 'retro_bubble', name: 'Retro Bubble (Popping Membrane)', desc: 'Satisfying rounded bubble pop' },
              ].map((sp) => (
                <button
                  key={sp.id}
                  onClick={() => onSelectSoundpack(sp.id as KeyboardSoundpack)}
                  className={`p-3 rounded border text-left flex flex-col justify-between transition-all ${
                    currentSoundpack === sp.id
                      ? 'bg-cyan-950/40 border-cyan-400 text-white'
                      : 'bg-[#10141d] border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold flex justify-between">
                    <span>{sp.name}</span>
                    {currentSoundpack === sp.id && <span className="text-[10px] text-cyan-400">ACTIVE</span>}
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1">{sp.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3D Camera Presets */}
          <div>
            <div className="text-xs uppercase font-bold text-cyan-300 border-b border-cyan-950 pb-1 mb-3">
              3D Battlestation Camera Viewpoint
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'desk', label: 'Desk Overview', desc: 'Full view of glowing PC rig, keyboard & desk' },
                { id: 'monitor', label: 'Monitor Focus', desc: 'Diegetic head-on view of the CRT display' },
                { id: 'motherboard', label: 'Hardware Rig', desc: 'Close-up of spinning LED cooler & heat tubes' },
              ].map((cp) => (
                <button
                  key={cp.id}
                  onClick={() => onSelectCameraPreset(cp.id as 'desk' | 'monitor' | 'motherboard')}
                  className={`p-3 rounded border text-left transition-all ${
                    cameraPreset === cp.id
                      ? 'bg-cyan-950/40 border-cyan-400 text-white'
                      : 'bg-[#10141d] border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold">{cp.label}</div>
                  <div className="text-[10px] text-gray-500 mt-1">{cp.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Audio Sliders & Mute */}
          <div>
            <div className="text-xs uppercase font-bold text-cyan-300 border-b border-cyan-950 pb-1 mb-3">
              Audio Volume & Master Output
            </div>
            <div className="space-y-3 bg-[#10141d] p-4 rounded border border-cyan-900/40">
              <div className="flex items-center justify-between">
                <span>Master Sound Output:</span>
                <button
                  onClick={onToggleMute}
                  className={`px-3 py-1 rounded font-bold text-xs ${
                    isMuted ? 'bg-red-900 text-red-200' : 'bg-emerald-700 text-black'
                  }`}
                >
                  {isMuted ? 'MUTED' : 'UNMUTED (ACTIVE)'}
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-cyan-500">
                  <span>SFX & Mechanical Click Volume</span>
                  <span className="tabular-nums font-bold">{(sfxVolume * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={sfxVolume}
                  onChange={(e) => onChangeVolume(parseFloat(e.target.value), musicVolume)}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-cyan-500">
                  <span>Ambient Drone / Fan Hum Volume</span>
                  <span className="tabular-nums font-bold">{(musicVolume * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={musicVolume}
                  onChange={(e) => onChangeVolume(sfxVolume, parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* Operator Academy & Tutorial */}
          <div>
            <div className="text-xs uppercase font-bold text-cyan-300 border-b border-cyan-950 pb-1 mb-3">
              Operator Academy & Onboarding
            </div>
            <div className="bg-[#10141d] p-4 rounded border border-cyan-900/40 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>🎓</span>
                  <span>Beginner's Guide & Core Systems Tutorial</span>
                </div>
                <div className="text-[11px] text-gray-400 mt-1">
                  Replays the 5-step visual guide explaining Workload clicks, Thermal Surge, Cache Flushes, and Upgrades.
                </div>
              </div>
              <button
                onClick={onRestartTutorial}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-black font-black text-xs rounded-lg shadow-[0_3px_0_#007a4d] active:translate-y-0.5 active:shadow-none whitespace-nowrap ml-4 transition-all"
              >
                RESTART TUTORIAL
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
