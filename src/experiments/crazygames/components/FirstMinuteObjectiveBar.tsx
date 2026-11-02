import React from 'react';
import { ArcadeObjective } from '../types';

interface FirstMinuteObjectiveBarProps {
  objective: ArcadeObjective | null;
  stepIndex: number;
  totalSteps: number;
  onClaim: () => void;
}

export const FirstMinuteObjectiveBar: React.FC<FirstMinuteObjectiveBarProps> = ({
  objective,
  stepIndex,
  totalSteps,
  onClaim,
}) => {
  if (!objective) return null;

  const pct = Math.min(100, Math.round((objective.current / objective.target) * 100));

  return (
    <div className="w-full bg-black/80 backdrop-blur-md border-y border-cyan-500/40 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-mono shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
      {/* Left: Quest Badge & Title */}
      <div className="flex items-center gap-3">
        <span className="px-2 py-0.5 bg-cyan-950/80 border border-cyan-500 text-cyan-300 text-xs font-black rounded uppercase tracking-wider animate-pulse">
          STAGE {stepIndex + 1}/{totalSteps}
        </span>
        <div>
          <div className="text-white text-xs sm:text-sm font-bold flex items-center gap-2">
            <span>{objective.title}</span>
            <span className="text-gray-400 font-normal hidden md:inline text-xs">
              — {objective.description}
            </span>
          </div>
        </div>
      </div>

      {/* Center: Interactive Progress Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xs min-w-[140px]">
        <div className="w-full bg-gray-900 border border-gray-700 h-2.5 rounded-full overflow-hidden relative">
          <div
            className={`h-full transition-all duration-300 ${
              objective.completed
                ? 'bg-gradient-to-r from-emerald-400 to-cyan-300'
                : 'bg-cyan-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-mono font-bold text-gray-300 whitespace-nowrap">
          {objective.current} / {objective.target}
        </span>
      </div>

      {/* Right: Claim or Status Button */}
      <div>
        {objective.completed && !objective.claimed ? (
          <button
            onClick={onClaim}
            className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-black font-black text-xs uppercase tracking-wider rounded shadow-[0_0_15px_rgba(16,185,129,0.7)] animate-bounce transition-transform active:scale-95 flex items-center gap-1.5"
          >
            <span>CLAIM +{objective.rewardBytes} BYTES</span>
            <span>⚡</span>
          </button>
        ) : (
          <div className="text-xs text-cyan-400/80 font-bold tracking-wider uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>REWARD: +{objective.rewardBytes} BYTES</span>
          </div>
        )}
      </div>
    </div>
  );
};
