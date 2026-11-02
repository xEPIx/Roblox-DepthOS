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
    <div className="w-full bg-[#070d18]/95 backdrop-blur-md border-b-2 border-cyan-500/50 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 font-mono shadow-[0_4px_25px_rgba(0,0,0,0.8)] z-30">
      {/* Left: Quest Badge & Action */}
      <div className="flex items-center gap-3">
        <span className="px-2.5 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 border border-cyan-300 text-white text-xs font-black rounded uppercase tracking-wider shadow-[0_0_10px_rgba(6,182,212,0.5)]">
          MISSION {stepIndex + 1}/{totalSteps}
        </span>
        <div className="flex flex-col">
          <div className="text-white text-xs sm:text-sm font-black tracking-wide flex items-center gap-2">
            <span>{objective.title}</span>
            {objective.completed && !objective.claimed && (
              <span className="text-emerald-400 text-xs font-bold animate-pulse">
                [READY TO CLAIM!]
              </span>
            )}
          </div>
          <span className="text-gray-400 text-[11px] font-normal hidden sm:inline">
            {objective.description}
          </span>
        </div>
      </div>

      {/* Center: Interactive Progress Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xs min-w-[150px]">
        <div className="w-full bg-gray-950 border border-gray-700 h-3.5 rounded-full overflow-hidden relative shadow-inner">
          <div
            className={`h-full transition-all duration-300 relative ${
              objective.completed
                ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-300 shadow-[0_0_12px_rgba(52,211,153,0.8)]'
                : 'bg-gradient-to-r from-cyan-600 to-cyan-400'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-mono font-bold text-cyan-300 tabular-nums whitespace-nowrap">
          {objective.current} / {objective.target}
        </span>
      </div>

      {/* Right: Claim or Reward Bounty Button */}
      <div>
        {objective.completed && !objective.claimed ? (
          <button
            onClick={onClaim}
            className="px-5 py-2 bg-gradient-to-r from-emerald-400 via-emerald-500 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-black font-black text-xs uppercase tracking-wider rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.9)] animate-bounce transition-transform active:scale-90 flex items-center gap-2 ring-2 ring-emerald-300"
          >
            <span>CLAIM +${objective.rewardBytes} CASH</span>
            <span className="text-sm">⚡</span>
          </button>
        ) : (
          <div className="text-xs text-emerald-400 font-bold tracking-wider uppercase flex items-center gap-1.5 bg-black/50 px-3 py-1 rounded border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>REWARD: +${objective.rewardBytes}</span>
          </div>
        )}
      </div>
    </div>
  );
};
