import React from 'react';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenRobloxExport: () => void;
  onOpenSelection?: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStartGame, onOpenRobloxExport, onOpenSelection }) => {
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-between p-8 sm:p-12 font-mono select-none bg-gradient-to-b from-black/80 via-black/40 to-black/90 pointer-events-auto">
      {/* Top Spec Badge */}
      <div className="flex justify-between items-center text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          <span className="text-white font-bold tracking-wider">DEPTHOS KERNEL ARCHITECTURE</span>
          <span className="text-gray-600">|</span>
          <span className="text-cyan-400">ROBLOX PRODUCTION BLUEPRINT</span>
        </div>
        <button
          onClick={onOpenRobloxExport}
          className="px-3 py-1 bg-red-950/60 hover:bg-red-800 border border-red-700 text-red-200 text-xs font-bold rounded flex items-center gap-1.5 transition-all"
        >
          <span className="w-1.5 h-1.5 bg-red-400 rounded-sm"></span>
          VIEW ROBLOX STUDIO SCRIPTS
        </button>
      </div>

      {/* Hero Centerpiece: Bespoke SVG Title Lockup with 30-40% Negative Space */}
      <div className="max-w-2xl my-auto space-y-6">
        <div className="space-y-2">
          {/* Bespoke inline SVG Title Lockup */}
          <div className="flex items-center gap-3">
            <svg
              className="w-14 h-14 sm:w-16 sm:h-16 text-cyan-400"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="6" y="6" width="52" height="52" rx="10" stroke="currentColor" strokeWidth="3" fill="#060c14" />
              <path d="M16 20H48V44H16V20Z" stroke="#00ff88" strokeWidth="2.5" />
              <path d="M22 28L28 32L22 36" stroke="#00ff88" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="32" y1="36" x2="42" y2="36" stroke="#00e5ff" strokeWidth="3" strokeLinecap="round" />
              <circle cx="48" cy="16" r="3" fill="#ff0044" />
            </svg>
            <div>
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white flex items-center">
                DEPTH<span className="text-cyan-400">OS</span>
              </h1>
              <div className="text-xs sm:text-sm font-bold tracking-widest text-emerald-400 uppercase">
                Thermal Redline Systems Simulator
              </div>
            </div>
          </div>

          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed max-w-lg mt-3">
            Ride the lethal <span className="text-red-400 font-bold">Thermal Surge (85°C–99.9°C)</span> for up to{' '}
            <span className="text-amber-300 font-bold">10.0x byte multipliers</span>. Cash out before reaching{' '}
            <span className="text-red-500 font-bold">100.0°C BSOD meltdown</span> or filling RAM to capacity.
          </p>
        </div>

        {/* Primary Start CTA & Selection Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button
            onClick={onStartGame}
            className="px-8 py-4 bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-400 hover:from-emerald-400 hover:to-cyan-300 text-black font-black text-sm uppercase tracking-widest rounded-lg shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3"
          >
            <span>BOOT TERMINAL WORKSPACE</span>
            <span className="text-xs bg-black/30 text-black px-2 py-0.5 rounded font-mono font-bold">
              [ENTER / SPACE]
            </span>
          </button>

          {onOpenSelection && (
            <button
              onClick={onOpenSelection}
              className="px-6 py-4 bg-[#101726] hover:bg-[#151f33] border-2 border-cyan-500/70 text-cyan-300 font-bold text-xs uppercase tracking-wider rounded-lg shadow transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <span>⚙ SELECT LOADOUT PROTOCOL</span>
            </button>
          )}
        </div>
      </div>

      {/* Single Flat Control-Hint Line */}
      <div className="text-xs text-gray-400 text-center border-t border-gray-800/80 pt-4 flex flex-wrap justify-center gap-4">
        <span><strong className="text-white">[SPACE]</strong> Process Workload</span>
        <span className="text-gray-600">·</span>
        <span><strong className="text-cyan-300">[HOLD F]</strong> Flush Cache</span>
        <span className="text-gray-600">·</span>
        <span><strong className="text-blue-300">[SPACE + E]</strong> Cryo Vent</span>
        <span className="text-gray-600">·</span>
        <span><strong className="text-amber-300">[ESC]</strong> System Menu</span>
      </div>
    </div>
  );
};
