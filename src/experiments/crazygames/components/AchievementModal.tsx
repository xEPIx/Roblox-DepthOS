import React, { useState, useEffect } from 'react';
import { Achievement, Milestone, MilestoneBuffs } from '../types';

interface AchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: Achievement[];
  milestones: Milestone[];
  milestoneBuffs: MilestoneBuffs;
  lifetimeBankedBytes: number;
  initialTab?: 'achievements' | 'milestones';
}

export const AchievementModal: React.FC<AchievementModalProps> = ({
  isOpen,
  onClose,
  achievements,
  milestones,
  milestoneBuffs,
  lifetimeBankedBytes,
  initialTab = 'achievements',
}) => {
  const [activeTab, setActiveTab] = useState<'achievements' | 'milestones'>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unlockedCount = achievements.filter((a) => Boolean(a.unlockedAt)).length;
  const totalAchievements = achievements.length;
  const achievementPct = Math.round((unlockedCount / totalAchievements) * 100);

  const unlockedMilestonesCount = milestones.filter((m) => m.unlocked).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl font-mono select-none animate-in fade-in duration-200">
      <div className="max-w-2xl w-full max-h-[90vh] flex flex-col bg-[#070e1c] border-2 border-cyan-400 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.5)] ring-4 ring-cyan-500/20 overflow-hidden relative">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-gray-800 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl">🏆</span>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center gap-2">
                <span>SYSTEM ACHIEVEMENTS & MILESTONES</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Track long-term progression, permanent hardware buffs & bounties
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-xl border border-gray-700 hover:border-gray-500 transition-colors text-sm font-bold"
          >
            ✕ [ESC]
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-800 bg-black/20 px-4 sm:px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('achievements')}
            className={`pb-3 px-4 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'achievements'
                ? 'border-amber-400 text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>🏆 ACHIEVEMENTS</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-200">
              {unlockedCount}/{totalAchievements}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('milestones')}
            className={`pb-3 px-4 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'milestones'
                ? 'border-cyan-400 text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>⭐ MILESTONES & BUFFS</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-200">
              {unlockedMilestonesCount}/{milestones.length}
            </span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'achievements' ? (
            <>
              {/* Progress Summary Card */}
              <div className="p-4 rounded-2xl bg-[#0b1626]/80 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="w-full sm:w-auto">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
                    <span>OVERALL COMPLETION</span>
                    <span>•</span>
                    <span className="text-white font-black">{achievementPct}% COMPLETED</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Unlocked {unlockedCount} of {totalAchievements} achievements across mining, hardware & economy.
                  </div>
                </div>

                <div className="w-full sm:w-48 bg-black/80 h-3 rounded-full overflow-hidden border border-gray-700 relative shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-500 shadow-[0_0_10px_rgba(251,191,36,0.8)]"
                    style={{ width: `${achievementPct}%` }}
                  />
                </div>
              </div>

              {/* Achievements Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {achievements.map((ach) => {
                  const isUnlocked = Boolean(ach.unlockedAt);
                  return (
                    <div
                      key={ach.id}
                      className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                        isUnlocked
                          ? 'bg-[#0b1828]/95 border-amber-400/80 shadow-[0_0_15px_rgba(251,191,36,0.3)] ring-1 ring-amber-400/30'
                          : 'bg-black/50 border-gray-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border shrink-0 ${
                            isUnlocked
                              ? 'bg-amber-950 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                              : 'bg-gray-900 border-gray-800 text-gray-600'
                          }`}
                        >
                          {ach.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4
                              className={`text-xs sm:text-sm font-black truncate ${
                                isUnlocked ? 'text-white' : 'text-gray-400'
                              }`}
                            >
                              {ach.title}
                            </h4>
                            {isUnlocked ? (
                              <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/40 shrink-0">
                                ✓ UNLOCKED
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-500 bg-gray-900 px-1.5 py-0.5 rounded shrink-0">
                                🔒 LOCKED
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                            {ach.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-gray-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-gray-500 uppercase text-[10px] tracking-wider">
                          CATEGORY: <strong className="text-gray-300">{ach.category}</strong>
                        </span>
                        <span className="text-amber-300 font-black">
                          +${ach.rewardCash.toLocaleString()} BOUNTY
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              {/* Active Permanent Buffs Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/80 to-[#071727] border-2 border-cyan-400/80 shadow-[0_0_25px_rgba(6,182,212,0.3)]">
                <div className="flex items-center gap-2 text-xs font-black text-cyan-300 uppercase tracking-wider mb-2">
                  <span>⚡ ACTIVE PERMANENT HARDWARE BUFFS</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-black/60 border border-cyan-500/30">
                    <span className="text-[10px] text-gray-400 uppercase block">DATA PRODUCTION</span>
                    <span className="text-sm font-black text-emerald-400">
                      +{Math.round((milestoneBuffs.dataMultiplier - 1) * 100)}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/60 border border-cyan-500/30">
                    <span className="text-[10px] text-gray-400 uppercase block">BONUS RAM BUFFER</span>
                    <span className="text-sm font-black text-cyan-300">
                      +{milestoneBuffs.bonusRamMB} MB
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/60 border border-cyan-500/30">
                    <span className="text-[10px] text-gray-400 uppercase block">COOLING EFFICIENCY</span>
                    <span className="text-sm font-black text-blue-400">
                      +{Math.round((milestoneBuffs.coolingMultiplier - 1) * 100)}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/60 border border-cyan-500/30">
                    <span className="text-[10px] text-gray-400 uppercase block">SURGE MULTIPLIER</span>
                    <span className="text-sm font-black text-amber-400">
                      +{Math.round((milestoneBuffs.surgeMultiplier - 1) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Milestones List */}
              <div className="space-y-3">
                {milestones.map((ms) => {
                  const pct = Math.min(100, Math.round((lifetimeBankedBytes / ms.targetBytes) * 100));
                  return (
                    <div
                      key={ms.id}
                      className={`p-4 rounded-2xl border-2 transition-all ${
                        ms.unlocked
                          ? 'bg-[#061524]/90 border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                          : 'bg-black/50 border-gray-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl border shrink-0 ${
                              ms.unlocked
                                ? 'bg-cyan-950 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                                : 'bg-gray-900 border-gray-800 text-gray-600'
                            }`}
                          >
                            {ms.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-white">{ms.title}</h4>
                              <span className="text-[11px] font-bold text-amber-300">
                                (${ms.targetBytes.toLocaleString()} Bytes)
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">{ms.description}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider block border ${
                              ms.unlocked
                                ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                                : 'bg-gray-900 border-gray-700 text-gray-500'
                            }`}
                          >
                            {ms.unlocked ? '✓ BUFF ACTIVE' : 'LOCKED'}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar & Buff Badge */}
                      <div className="mt-3 pt-3 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                        <div className="w-full sm:flex-1 flex items-center gap-3">
                          <div className="w-full bg-black/80 h-3 rounded-full overflow-hidden border border-gray-700 relative">
                            <div
                              className={`h-full transition-all duration-300 ${
                                ms.unlocked
                                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                                  : 'bg-cyan-700'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-cyan-300 tabular-nums shrink-0">
                            ${Math.min(ms.targetBytes, lifetimeBankedBytes).toLocaleString()} / ${ms.targetBytes.toLocaleString()}
                          </span>
                        </div>

                        <span className="px-3 py-1 bg-black/60 border border-cyan-500/40 rounded-lg text-xs font-black text-cyan-200 shrink-0">
                          PERMANENT REWARD: <strong className="text-amber-300">{ms.buffLabel}</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-800 bg-black/40 flex justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-6 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white font-black text-xs uppercase tracking-widest rounded-xl transition-colors"
          >
            CLOSE [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
