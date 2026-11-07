import React, { useState, useEffect } from 'react';
import {
  ResearchBranch,
  ResearchNode,
  ResearchBonuses,
  ActiveResearch,
} from '../types';
import {
  RESEARCH_BRANCHES,
  RESEARCH_NODES,
  isTechAvailable,
  findTechById,
  getActiveResearchProgress,
} from '../research';

interface ResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankedBytes: number;
  unlockedTechIds: Set<string>;
  activeResearch: ActiveResearch | null;
  researchBonuses: ResearchBonuses;
  onStartResearch: (techId: string) => void;
  onRushResearchWithAd?: () => void;
}

export const ResearchModal: React.FC<ResearchModalProps> = ({
  isOpen,
  onClose,
  bankedBytes,
  unlockedTechIds,
  activeResearch,
  researchBonuses,
  onStartResearch,
  onRushResearchWithAd,
}) => {
  const [selectedBranch, setSelectedBranch] = useState<ResearchBranch | 'all'>('all');
  const [now, setNow] = useState<number>(Date.now());

  // 100ms ticker for smooth progress bars when research is active
  useEffect(() => {
    if (!isOpen || !activeResearch) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 100);
    return () => clearInterval(interval);
  }, [isOpen, activeResearch]);

  // Handle ESC key
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

  const activeTech = activeResearch ? findTechById(activeResearch.techId) : null;
  const activeProgress = getActiveResearchProgress(activeResearch, now);

  const branches = Object.values(RESEARCH_BRANCHES);
  const filteredNodes =
    selectedBranch === 'all'
      ? RESEARCH_NODES
      : RESEARCH_NODES.filter((n) => n.branch === selectedBranch);

  const unlockedCount = unlockedTechIds.size;
  const totalCount = RESEARCH_NODES.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md font-mono select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#070d18] border-2 border-purple-500/50 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.35)] overflow-hidden">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-[#0d1627] via-[#140f26] to-[#0d1627] border-b border-purple-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-400 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(168,85,247,0.5)]">
              🔬
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  R&D QUANTUM RESEARCH LAB
                </h2>
                <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-400/40 px-2 py-0.5 rounded">
                  {unlockedCount}/{totalCount} UNLOCKED
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Invest permanent banked capital into permanent computing architecture.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">
                Available Capital
              </span>
              <span className="text-base font-black text-emerald-400">
                ${bankedBytes.toLocaleString()}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-800/60 border border-gray-700/60 transition-colors text-lg"
              title="Close [ESC]"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Active Research Progress Banner */}
        {activeTech && (
          <div className="bg-gradient-to-r from-purple-950/80 via-[#1b0a2f] to-purple-950/80 border-b border-purple-400/50 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-900/60 border border-purple-300 flex items-center justify-center text-lg animate-pulse">
                {activeTech.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-300 bg-purple-900/50 px-2 py-0.2 rounded border border-purple-400/30 animate-pulse">
                    ⚡ SYNTHESIZING ARCHITECTURE...
                  </span>
                  <span className="text-xs font-black text-white">{activeTech.title}</span>
                </div>
                <span className="text-[11px] text-purple-200 mt-0.5 block font-bold">
                  Bonus: {activeTech.bonusLabel}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-1 max-w-md min-w-[200px]">
              <div className="w-full bg-black/80 border border-purple-500/40 h-3.5 rounded-full overflow-hidden relative shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-pink-400 to-cyan-300 transition-all duration-100 shadow-[0_0_15px_rgba(168,85,247,0.9)]"
                  style={{ width: `${activeProgress.progress}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-purple-300 tabular-nums whitespace-nowrap">
                {(activeProgress.remainingMs / 1000).toFixed(1)}s ({activeProgress.progress}%)
              </span>
            </div>

            {onRushResearchWithAd && (
              <button
                onClick={onRushResearchWithAd}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-black text-xs font-black uppercase rounded-lg shadow-[0_0_15px_rgba(251,191,36,0.8)] transition-transform active:scale-95 flex items-center gap-1.5"
                title="Rush Research with a quick rewarded ad"
              >
                <span>⚡ RUSH (AD)</span>
              </button>
            )}
          </div>
        )}

        {/* Branch Filter Tabs */}
        <div className="px-4 sm:px-6 pt-3 pb-2 bg-[#091120] border-b border-gray-800 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedBranch('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
              selectedBranch === 'all'
                ? 'bg-purple-600 text-white border-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                : 'bg-gray-900/60 text-gray-400 border-gray-800 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span>🌐</span>
            <span>ALL BRANCHES</span>
            <span className="text-[10px] bg-black/30 px-1.5 rounded">{totalCount}</span>
          </button>

          {branches.map((b) => {
            const countInBranch = RESEARCH_NODES.filter((n) => n.branch === b.id && unlockedTechIds.has(n.id)).length;
            const isSel = selectedBranch === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setSelectedBranch(b.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                  isSel
                    ? 'bg-gradient-to-r from-purple-900 to-indigo-900 text-white border-purple-400 shadow-md ring-1 ring-purple-400/50'
                    : 'bg-gray-900/60 text-gray-400 border-gray-800 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span>{b.icon}</span>
                <span className="uppercase">{b.name}</span>
                <span className="text-[10px] bg-black/40 px-1.5 rounded font-mono">
                  {countInBranch}/3
                </span>
              </button>
            );
          })}
        </div>

        {/* Technology Node Cards Grid */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredNodes.map((node) => {
            const isUnlocked = unlockedTechIds.has(node.id);
            const isCurrentActive = activeResearch?.techId === node.id;
            const canAfford = bankedBytes >= node.costBytes;
            const available = isTechAvailable(node, unlockedTechIds);
            const branchMeta = RESEARCH_BRANCHES[node.branch];

            const prereqNames = node.prerequisites
              .map((p) => findTechById(p)?.title)
              .filter(Boolean)
              .join(', ');

            return (
              <div
                key={node.id}
                className={`relative rounded-2xl border-2 p-4 flex flex-col justify-between transition-all duration-200 ${
                  isUnlocked
                    ? 'bg-[#081514]/90 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20'
                    : isCurrentActive
                    ? 'bg-[#150a24]/90 border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.4)] ring-2 ring-purple-400/40 animate-pulse'
                    : available
                    ? canAfford
                      ? 'bg-[#0b1322]/90 border-cyan-500/60 hover:border-cyan-400 shadow-lg hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                      : 'bg-[#0b1322]/80 border-gray-700/60 opacity-90'
                    : 'bg-[#070b13]/80 border-gray-800/80 opacity-60'
                }`}
              >
                {/* Top: Branch tag & Tier indicator */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{branchMeta.icon}</span>
                      <span
                        className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border"
                        style={{
                          backgroundColor: branchMeta.accentBg,
                          borderColor: branchMeta.borderColor,
                          color: branchMeta.color,
                        }}
                      >
                        {branchMeta.name} • TIER {node.tier}
                      </span>
                    </div>

                    {isUnlocked ? (
                      <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded flex items-center gap-1">
                        ✓ UNLOCKED
                      </span>
                    ) : isCurrentActive ? (
                      <span className="text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-400/40 px-2 py-0.5 rounded animate-pulse">
                        ⏳ IN PROGRESS
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-400">
                        ⏱ {node.durationSeconds}s
                      </span>
                    )}
                  </div>

                  {/* Title & Icon */}
                  <div className="flex items-start gap-2.5 mt-1">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border shadow-inner ${
                        isUnlocked
                          ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300'
                          : isCurrentActive
                          ? 'bg-purple-950/80 border-purple-400 text-purple-300'
                          : 'bg-gray-900 border-gray-700 text-gray-300'
                      }`}
                    >
                      {node.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white leading-tight">
                        {node.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1 leading-snug">
                        {node.description}
                      </p>
                    </div>
                  </div>

                  {/* Bonus Tag */}
                  <div className="mt-3 px-2.5 py-1.5 rounded-lg bg-black/50 border border-gray-800 text-xs font-bold flex items-center justify-between">
                    <span className="text-gray-400 text-[10px] uppercase">BONUS:</span>
                    <span
                      className={`font-black ${
                        isUnlocked
                          ? 'text-emerald-400'
                          : isCurrentActive
                          ? 'text-purple-300'
                          : 'text-amber-300'
                      }`}
                    >
                      {node.bonusLabel}
                    </span>
                  </div>

                  {/* Prerequisite warning if locked */}
                  {!available && !isUnlocked && (
                    <div className="mt-2 text-[10px] font-bold text-rose-400 bg-rose-950/30 border border-rose-800/40 rounded px-2 py-1 flex items-center gap-1">
                      <span>🔒</span>
                      <span>Requires: {prereqNames || 'Prerequisite'}</span>
                    </div>
                  )}
                </div>

                {/* Bottom: Cost & Research Button */}
                <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Cost</span>
                    <span
                      className={`text-xs font-black ${
                        isUnlocked
                          ? 'text-gray-500 line-through'
                          : canAfford
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      ${node.costBytes.toLocaleString()}
                    </span>
                  </div>

                  {isUnlocked ? (
                    <button
                      disabled
                      className="px-3.5 py-1.5 bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 rounded-xl text-xs font-black cursor-default flex items-center gap-1"
                    >
                      <span>✓</span>
                      <span>RESEARCHED</span>
                    </button>
                  ) : isCurrentActive ? (
                    <button
                      disabled
                      className="px-3.5 py-1.5 bg-purple-950/60 border border-purple-400 text-purple-300 rounded-xl text-xs font-black cursor-default animate-pulse"
                    >
                      ⏳ IN PROGRESS ({activeProgress.progress}%)
                    </button>
                  ) : activeResearch ? (
                    <button
                      disabled
                      className="px-3.5 py-1.5 bg-gray-900 border border-gray-700 text-gray-500 rounded-xl text-xs font-bold cursor-not-allowed"
                      title="Wait for the active research to finish"
                    >
                      LAB BUSY
                    </button>
                  ) : !available ? (
                    <button
                      disabled
                      className="px-3.5 py-1.5 bg-gray-900 border border-gray-800 text-gray-600 rounded-xl text-xs font-bold cursor-not-allowed flex items-center gap-1"
                    >
                      <span>🔒</span>
                      <span>LOCKED</span>
                    </button>
                  ) : !canAfford ? (
                    <button
                      disabled
                      className="px-3.5 py-1.5 bg-gray-900 border border-gray-800 text-gray-500 rounded-xl text-xs font-bold cursor-not-allowed"
                    >
                      NEED CASH
                    </button>
                  ) : (
                    <button
                      onClick={() => onStartResearch(node.id)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 hover:from-purple-400 hover:to-cyan-300 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.7)] transition-transform active:scale-95 animate-pulse"
                    >
                      INITIATE
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer: Active Permanent Multiplier Summary */}
        <div className="px-4 sm:px-6 py-3 bg-[#050a14] border-t border-purple-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-purple-300 font-bold">
            <span>🔬</span>
            <span className="uppercase tracking-wider">ACTIVE RESEARCH MULTIPLIERS:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] font-bold">
            {researchBonuses.dataMultiplier > 1 && (
              <span className="bg-sky-950/60 text-sky-300 px-2.5 py-1 rounded-lg border border-sky-400/40">
                +{Math.round((researchBonuses.dataMultiplier - 1) * 100)}% DATA
              </span>
            )}
            {researchBonuses.bonusRamMB > 0 && (
              <span className="bg-amber-950/60 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-400/40">
                +{researchBonuses.bonusRamMB}MB RAM
              </span>
            )}
            {researchBonuses.coolingMultiplier > 1 && (
              <span className="bg-cyan-950/60 text-cyan-300 px-2.5 py-1 rounded-lg border border-cyan-400/40">
                +{Math.round((researchBonuses.coolingMultiplier - 1) * 100)}% COOLING
              </span>
            )}
            {researchBonuses.payoutMultiplier > 1 && (
              <span className="bg-emerald-950/60 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-400/40">
                +{Math.round((researchBonuses.payoutMultiplier - 1) * 100)}% PAYOUT
              </span>
            )}
            {researchBonuses.autoRecovery && (
              <span className="bg-purple-950/60 text-purple-300 px-2.5 py-1 rounded-lg border border-purple-400/40">
                ⚡ AUTO RECOVERY
              </span>
            )}
            {researchBonuses.autoCryoVent && (
              <span className="bg-indigo-950/60 text-indigo-300 px-2.5 py-1 rounded-lg border border-indigo-400/40">
                🛡️ AUTO CRYO-VENT
              </span>
            )}
            {researchBonuses.upgradeCostDiscount > 0 && (
              <span className="bg-pink-950/60 text-pink-300 px-2.5 py-1 rounded-lg border border-pink-400/40">
                -{Math.round(researchBonuses.upgradeCostDiscount * 100)}% HARDWARE COSTS
              </span>
            )}
            {researchBonuses.dataMultiplier === 1 &&
              researchBonuses.bonusRamMB === 0 &&
              researchBonuses.coolingMultiplier === 1 &&
              researchBonuses.payoutMultiplier === 1 &&
              !researchBonuses.autoRecovery && (
                <span className="text-gray-500 italic">No technologies researched yet</span>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};
