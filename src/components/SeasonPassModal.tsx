import React from 'react';
import { DepthOSState, CosmeticRarity } from '../types/depthos';

interface SeasonPassModalProps {
  state: DepthOSState;
  onClaimTier: (tier: number) => void;
  onClose: () => void;
}

interface SeasonTierDef {
  tier: number;
  name: string;
  type: string;
  rarity: CosmeticRarity;
  claimedReward: string;
}

export const SeasonPassModal: React.FC<SeasonPassModalProps> = ({
  state,
  onClaimTier,
  onClose,
}) => {
  const tiers: SeasonTierDef[] = [
    { tier: 1, name: 'Starting Cache', type: 'bytes', rarity: 'common', claimedReward: '+2,500 Banked Bytes' },
    { tier: 2, name: 'Amber Glow Badge', type: 'title', rarity: 'common', claimedReward: 'Title: "Phosphor Enthusiast"' },
    { tier: 3, name: 'Silicon Stimulus', type: 'bytes', rarity: 'rare', claimedReward: '+10,000 Banked Bytes' },
    { tier: 4, name: 'Quantum Seed', type: 'qbits', rarity: 'rare', claimedReward: '+15 Quantum Bits' },
    { tier: 5, name: 'RGB Braided Cable Harness', type: 'hardware', rarity: 'epic', claimedReward: 'Cosmetic Relic: RGB Cables' },
    { tier: 6, name: 'Thermal Vanguard Title', type: 'title', rarity: 'epic', claimedReward: 'Title: "Thermal Vanguard"' },
    { tier: 7, name: 'Mega Cache Burst', type: 'bytes', rarity: 'rare', claimedReward: '+50,000 Banked Bytes' },
    { tier: 8, name: 'Quantum Micro-Core', type: 'qbits', rarity: 'legendary', claimedReward: '+35 Quantum Bits' },
    { tier: 9, name: 'Neon Coolant Flask', type: 'hardware', rarity: 'epic', claimedReward: 'Relic: Cryogenic Liquid Neon' },
    { tier: 10, name: 'Singularity Prototype Shell', type: 'theme', rarity: 'mythic', claimedReward: 'Theme: Holographic Aurora OS' },
  ];

  const currentLevel = state.seasonLevel;
  const currentXP = state.seasonXP;
  const requiredXP = currentLevel * 200;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 font-mono select-none">
      <div className="bg-[#0b0e14] border-2 border-emerald-500/60 rounded-xl w-full max-w-4xl text-emerald-400 p-6 shadow-[0_0_50px_rgba(16,185,129,0.25)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-900 pb-4 mb-4">
          <div>
            <h2 className="text-xl font-bold tracking-widest text-white flex items-center gap-2">
              <span className="w-3 h-3 bg-emerald-400 inline-block animate-pulse"></span>
              SEASON 1: SILICON GENESIS BATTLE PASS
            </h2>
            <p className="text-xs text-emerald-500 mt-1">
              Earn Season XP automatically by processing cycles, banking flushes, and surviving the Thermal Surge.
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-red-950/60 border border-red-500/50 hover:bg-red-800 text-red-200 text-xs font-bold rounded"
          >
            [ESC] CLOSE
          </button>
        </div>

        {/* Season Progression Header Bar */}
        <div className="bg-emerald-950/20 border border-emerald-800/60 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <div>
              <span className="text-xs text-gray-400 uppercase font-bold">CURRENT SEASON LEVEL:</span>
              <span className="text-xl font-black text-white ml-2 tabular-nums">TIER {currentLevel} / 10</span>
            </div>
            <div className="text-xs text-gray-400">
              Season XP: <strong className="text-white tabular-nums">{currentXP} / {requiredXP} XP</strong>
            </div>
          </div>

          <div className="w-full h-3 bg-black/80 rounded border border-emerald-900 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
              style={{ width: `${Math.min(100, (currentXP / requiredXP) * 100)}%` }}
            />
          </div>
        </div>

        {/* Reward Tiers List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {tiers.map((t) => {
            const isUnlocked = currentLevel >= t.tier;
            const isClaimed = state.claimedSeasonTiers.includes(t.tier);

            return (
              <div
                key={t.tier}
                className={`p-3.5 rounded-lg border flex items-center justify-between transition-all ${
                  isClaimed
                    ? 'bg-black/30 border-gray-800/60 opacity-60'
                    : isUnlocked
                    ? 'bg-emerald-950/30 border-emerald-500 shadow-md'
                    : 'bg-[#10141d] border-gray-800'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg font-black flex items-center justify-center text-sm border ${
                      isUnlocked
                        ? 'bg-emerald-500 text-black border-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                        : 'bg-black/50 text-gray-500 border-gray-700'
                    }`}
                  >
                    T{t.tier}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{t.name}</h4>
                      <span className="text-[10px] text-gray-400 uppercase">({t.rarity})</span>
                    </div>
                    <div className="text-xs text-emerald-300 mt-0.5">{t.claimedReward}</div>
                  </div>
                </div>

                <div>
                  {isClaimed ? (
                    <span className="text-xs text-gray-500 font-bold px-3 py-1">CLAIMED ✓</span>
                  ) : isUnlocked ? (
                    <button
                      onClick={() => onClaimTier(t.tier)}
                      className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-black font-black text-xs uppercase rounded shadow-lg transition-transform active:scale-95"
                    >
                      CLAIM REWARD
                    </button>
                  ) : (
                    <span className="text-xs text-gray-500 px-3 py-1 border border-gray-800 rounded">
                      LOCKED (TIER {t.tier})
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
