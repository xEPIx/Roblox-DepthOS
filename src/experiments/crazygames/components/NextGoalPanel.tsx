import React from 'react';
import { ActiveGoalInfo } from '../goals';

interface NextGoalPanelProps {
  goalInfo: ActiveGoalInfo;
  onClaimGoal: () => void;
  onClaimDouble?: () => void;
  unlockedAchievementsCount: number;
  totalAchievementsCount: number;
  unlockedMilestonesCount: number;
  onOpenAchievements: () => void;
  onOpenMilestones: () => void;
  unlockedResearchCount?: number;
  totalResearchCount?: number;
  isResearching?: boolean;
  onOpenResearch?: () => void;
}

export const NextGoalPanel: React.FC<NextGoalPanelProps> = ({
  goalInfo,
  onClaimGoal,
  onClaimDouble,
  unlockedAchievementsCount,
  totalAchievementsCount,
  unlockedMilestonesCount,
  onOpenAchievements,
  onOpenMilestones,
  unlockedResearchCount = 0,
  totalResearchCount = 15,
  isResearching = false,
  onOpenResearch,
}) => {
  const { goal, current, target, percent, isCompleted, isClaimed, stepIndex, totalGoals } = goalInfo;

  if (!goal) return null;

  return (
    <div className="w-full bg-[#060c18]/95 backdrop-blur-md border-b-2 border-cyan-500/50 px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 font-mono shadow-[0_4px_30px_rgba(0,0,0,0.8)] z-30">
      {/* Left: Progression Goal Badge, Title & Context Action Hint */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="flex flex-col items-center justify-center px-2 sm:px-2.5 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 border border-cyan-300 text-white rounded-lg shadow-[0_0_12px_rgba(6,182,212,0.5)]">
          <span className="text-[10px] font-black uppercase tracking-wider">GOAL</span>
          <span className="text-xs font-black tracking-tight">
            {stepIndex + 1}/{totalGoals}
          </span>
        </div>

        <div className="flex flex-col">
          <div className="text-white text-xs sm:text-sm font-black tracking-wide flex items-center gap-2">
            <span>{goal.title}</span>
            {isCompleted && !isClaimed && (
              <span className="text-emerald-400 text-[11px] font-bold animate-pulse">
                [READY TO CLAIM!]
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-amber-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-black/60 px-2 py-0.2 rounded border border-amber-500/30">
              ⚡ {goal.actionHint}
            </span>
            <span className="text-gray-400 text-[11px] font-normal hidden md:inline">
              {goal.description}
            </span>
          </div>
        </div>
      </div>

      {/* Center: Real-Time Interactive Progress Bar */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-1 max-w-xs min-w-[140px]">
        <div className="w-full bg-gray-950 border border-gray-700 h-3.5 rounded-full overflow-hidden relative shadow-inner">
          <div
            className={`h-full transition-all duration-300 relative ${
              isCompleted
                ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-300 shadow-[0_0_12px_rgba(52,211,153,0.8)]'
                : 'bg-gradient-to-r from-cyan-600 to-cyan-400'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-xs font-mono font-bold text-cyan-300 tabular-nums whitespace-nowrap">
          {current.toLocaleString()} / {target.toLocaleString()}
        </span>
      </div>

      {/* Right: Claim Bounty Action + Achievement & Milestone Quick Buttons */}
      <div className="flex items-center gap-2">
        {isCompleted && !isClaimed ? (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onClaimGoal}
              className="px-3.5 sm:px-4 py-2 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.8)] transition-transform active:scale-95 animate-pulse"
            >
              CLAIM +${goal.rewardCash.toLocaleString()}
            </button>
            {onClaimDouble && (
              <button
                onClick={onClaimDouble}
                className="px-3 py-2 bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(251,191,36,0.9)] transition-transform active:scale-95 flex items-center gap-1 ring-2 ring-amber-300"
              >
                <span>🚀 2X (+${(goal.rewardCash * 2).toLocaleString()})</span>
                <span className="text-[9px] bg-black/25 px-1 rounded font-mono">AD</span>
              </button>
            )}
          </div>
        ) : (
          <div className="text-xs text-emerald-400 font-bold tracking-wider uppercase flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>REWARD: +${goal.rewardCash.toLocaleString()}</span>
          </div>
        )}

        {/* Quick Launchers: Achievements & Milestones */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-gray-800">
          <button
            onClick={onOpenAchievements}
            className="px-2.5 py-1.5 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/50 text-amber-300 text-xs font-black rounded-lg transition-colors flex items-center gap-1.5"
            title="View Achievements"
          >
            <span>🏆</span>
            <span className="hidden sm:inline">ACHIEVEMENTS</span>
            <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.2 rounded font-mono">
              {unlockedAchievementsCount}/{totalAchievementsCount}
            </span>
          </button>

          <button
            onClick={onOpenMilestones}
            className="px-2.5 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/50 text-cyan-300 text-xs font-black rounded-lg transition-colors flex items-center gap-1.5"
            title="View Milestones & Buffs"
          >
            <span>⭐</span>
            <span className="hidden sm:inline">BUFFS</span>
            <span className="text-[10px] bg-cyan-500/20 px-1.5 py-0.2 rounded font-mono">
              {unlockedMilestonesCount}
            </span>
          </button>

          {onOpenResearch && (
            <button
              onClick={onOpenResearch}
              className={`px-2.5 py-1.5 border text-xs font-black rounded-lg transition-all flex items-center gap-1.5 ${
                isResearching
                  ? 'bg-purple-950/80 border-purple-400 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.7)] animate-pulse'
                  : 'bg-purple-950/40 hover:bg-purple-900/60 border-purple-500/50 text-purple-300'
              }`}
              title="Open R&D Quantum Research Lab"
            >
              <span>🔬</span>
              <span className="hidden sm:inline">RESEARCH</span>
              <span className="text-[10px] bg-purple-500/20 px-1.5 py-0.2 rounded font-mono">
                {isResearching ? '⏳' : `${unlockedResearchCount}/${totalResearchCount}`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
