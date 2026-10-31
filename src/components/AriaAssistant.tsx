import React, { useState } from 'react';
import { AriaState } from '../types/depthos';

interface AriaAssistantProps {
  aria: AriaState;
  heat: number;
  isBSOD: boolean;
  onInteract: () => void;
}

export const AriaAssistant: React.FC<AriaAssistantProps> = ({ aria, heat, isBSOD, onInteract }) => {
  const [isMinimized, setIsMinimized] = useState(false);

  // Expression face mapping
  const renderFace = () => {
    if (isBSOD || aria.mood === 'crashed') {
      return (
        <div className="flex items-center justify-center gap-1.5 text-blue-300 font-bold text-sm tracking-widest">
          <span>&gt;_&lt;</span>
        </div>
      );
    }
    if (aria.mood === 'panic' || heat >= 98.0) {
      return (
        <div className="flex items-center justify-center gap-1.5 text-red-400 font-bold text-sm tracking-widest animate-bounce">
          <span>O_O;</span>
        </div>
      );
    }
    if (aria.mood === 'surge_hype' || heat >= 85.0) {
      return (
        <div className="flex items-center justify-center gap-1.5 text-amber-300 font-bold text-sm tracking-widest">
          <span>★_★</span>
        </div>
      );
    }
    if (aria.mood === 'warning') {
      return (
        <div className="flex items-center justify-center gap-1.5 text-yellow-300 font-bold text-sm tracking-widest">
          <span>•_•</span>
        </div>
      );
    }
    if (aria.mood === 'proud') {
      return (
        <div className="flex items-center justify-center gap-1.5 text-emerald-300 font-bold text-sm tracking-widest">
          <span>^‿^</span>
        </div>
      );
    }
    // Default calm
    return (
      <div className="flex items-center justify-center gap-1.5 text-cyan-300 font-bold text-sm tracking-widest">
        <span>◕‿◕</span>
      </div>
    );
  };

  const getBorderColor = () => {
    if (isBSOD) return 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]';
    if (heat >= 98.0) return 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse';
    if (heat >= 85.0) return 'border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]';
    return 'border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.2)]';
  };

  return (
    <div
      className={`fixed bottom-14 right-4 z-40 font-mono transition-all duration-200 select-none ${
        isMinimized ? 'w-12 h-12' : 'w-72 sm:w-80'
      }`}
    >
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className={`w-12 h-12 rounded-full bg-[#0c121d] border-2 ${getBorderColor()} flex items-center justify-center text-white shadow-xl hover:scale-110 active:scale-95 transition-transform`}
          title="Open A.R.I.A. AI Companion"
        >
          {renderFace()}
        </button>
      ) : (
        <div className={`bg-[#080d16]/95 border-2 ${getBorderColor()} rounded-xl p-3 text-xs shadow-2xl flex flex-col gap-2 relative overflow-hidden backdrop-blur-none`}>
          {/* Subtle Cyber Grid Background */}
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-cyan-900/60 pb-1.5">
            <div className="flex items-center gap-2">
              {/* Animated Avatar Icon */}
              <div className="w-7 h-7 rounded-lg bg-black/60 border border-cyan-600/80 flex items-center justify-center">
                {renderFace()}
              </div>
              <div>
                <div className="font-bold text-white text-[11px] flex items-center gap-1.5">
                  <span>A.R.I.A.</span>
                  <span className="text-[9px] bg-cyan-950 text-cyan-300 px-1 py-0.2 rounded border border-cyan-800">
                    AI v3.4
                  </span>
                </div>
                <div className="text-[9px] text-cyan-400">
                  Affinity Lvl {aria.affinityLevel} ({aria.affinityXP}/{aria.affinityLevel * 100} XP)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={onInteract}
                className="px-1.5 py-0.5 bg-cyan-950 hover:bg-cyan-800 border border-cyan-800 text-[10px] text-cyan-200 rounded font-bold"
                title="Pet / Talk to A.R.I.A."
              >
                ♥
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="text-gray-400 hover:text-white px-1 text-xs"
                title="Minimize A.R.I.A."
              >
                ─
              </button>
            </div>
          </div>

          {/* Speech Message Bubble */}
          <div className="p-2 rounded bg-black/50 border border-cyan-900/40 text-[11px] leading-relaxed text-gray-200 min-h-[38px] flex items-center">
            <p className="animate-fadeIn">{aria.message}</p>
          </div>

          {/* Affinity Progress Bar */}
          <div className="space-y-0.5">
            <div className="flex justify-between text-[9px] text-gray-400">
              <span>Bond Level {aria.affinityLevel}</span>
              <span className="text-cyan-400">
                {((aria.affinityXP / (aria.affinityLevel * 100)) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-1 bg-black/60 rounded-full overflow-hidden border border-cyan-950">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                style={{
                  width: `${Math.min(100, (aria.affinityXP / (aria.affinityLevel * 100)) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
