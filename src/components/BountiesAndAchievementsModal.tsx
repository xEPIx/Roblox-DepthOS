import React, { useState, useEffect } from 'react';
import { DepthOSState, MissionDifficulty } from '../types/depthos';
import {
  calculateMissionRewardBytes,
  calculateMissionRewardQBits,
  calculateAllClearBonus,
} from '../game/simulation';

interface BountiesAndAchievementsModalProps {
  state: DepthOSState;
  onClose: () => void;
  onClaimBounty: (bountyId: string) => void;
  onClaimDailyMission: (missionId: string) => void;
  onClaimAllClear: () => void;
}

export const BountiesAndAchievementsModal: React.FC<BountiesAndAchievementsModalProps> = ({
  state,
  onClose,
  onClaimBounty,
  onClaimDailyMission,
  onClaimAllClear,
}) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'achievements'>('daily');
  const [timeUntilReset, setTimeUntilReset] = useState<string>('00:00:00');

  const dailyMissions = state.dailyMissions?.missions || [];
  const completedCount = dailyMissions.filter((m) => m.completed).length;
  const isAllClearReady = dailyMissions.length > 0 && completedCount === dailyMissions.length;
  const isAllClearClaimed = state.dailyMissions?.allClearClaimed;

  const allClearReward = calculateAllClearBonus(state.osLevel);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const lastReset = state.dailyMissions?.lastResetTimestamp || now;
      const nextReset = lastReset + 24 * 60 * 60 * 1000;
      const diff = Math.max(0, nextReset - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeUntilReset(
        `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      );
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [state.dailyMissions]);

  const getDifficultyBadge = (diff: MissionDifficulty) => {
    switch (diff) {
      case 'extreme':
        return (
          <span className="text-[9px] px-1.5 py-0.2 rounded font-black tracking-wider bg-red-950 text-red-300 border border-red-700">
            EXTREME
          </span>
        );
      case 'hard':
        return (
          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold tracking-wider bg-amber-950 text-amber-300 border border-amber-700">
            HARD
          </span>
        );
      case 'medium':
        return (
          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-800">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold tracking-wider bg-gray-800 text-gray-300 border border-gray-700">
            EASY
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 font-mono select-none">
      <div className="bg-[#0b0e14] border-2 border-amber-500/60 rounded-xl w-full max-w-4xl text-amber-400 p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-900 pb-4 mb-4">
          <div>
            <h2 className="text-xl font-bold tracking-widest text-white flex items-center gap-2">
              <span className="w-3 h-3 bg-amber-400 inline-block animate-pulse"></span>
              DIAGNOSTIC BOUNTIES & DAILY MISSIONS
            </h2>
            <p className="text-xs text-amber-500 mt-1">
              Complete dynamic daily stress challenges with scaling rewards based on your current OS Level ({state.osLevel}).
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-red-950/60 border border-red-500/50 hover:bg-red-800 text-red-200 text-xs font-bold rounded"
          >
            [ESC] CLOSE
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4 text-xs">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-3 py-1.5 rounded font-bold transition-all ${
                activeTab === 'daily'
                  ? 'bg-amber-500 text-black shadow'
                  : 'bg-gray-900 text-gray-400 hover:text-white'
              }`}
            >
              📅 DYNAMIC DAILY MISSIONS ({completedCount}/4)
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`px-3 py-1.5 rounded font-bold transition-all ${
                activeTab === 'achievements'
                  ? 'bg-amber-500 text-black shadow'
                  : 'bg-gray-900 text-gray-400 hover:text-white'
              }`}
            >
              🏆 LIFETIME ACHIEVEMENTS
            </button>
          </div>

          <div className="text-[11px] text-gray-400 flex items-center gap-2">
            <span>Next Refresh In:</span>
            <span className="font-bold text-white tabular-nums bg-black/60 px-2 py-0.5 rounded border border-gray-800">
              {timeUntilReset}
            </span>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {activeTab === 'daily' && (
            <>
              {/* Daily All-Clear Protocol Card */}
              <div className="bg-gradient-to-r from-amber-950/30 via-yellow-950/20 to-black/40 border border-amber-500/50 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">★</span>
                    <h3 className="font-black text-white text-sm">
                      DAILY ALL-CLEAR PROTOCOL ({completedCount}/4 COMPLETED)
                    </h3>
                  </div>
                  <p className="text-xs text-gray-300 mt-1">
                    Clear all 4 daily mission objectives to claim the Level-Scaled Master Dividend.
                  </p>
                  <div className="text-xs text-amber-300 font-bold mt-1.5 flex items-center gap-3">
                    <span>Bonus: +{allClearReward.bytes.toLocaleString()} Bytes</span>
                    <span className="text-gray-600">|</span>
                    <span>+{allClearReward.qbits} Quantum Bits</span>
                    <span className="text-[10px] text-amber-500 font-normal">
                      [Scaled to Level {state.osLevel}]
                    </span>
                  </div>
                </div>

                <div>
                  {isAllClearClaimed ? (
                    <span className="text-xs text-emerald-400 font-bold bg-emerald-950 px-3 py-1.5 rounded border border-emerald-800">
                      ✓ ALL-CLEAR SECURED
                    </span>
                  ) : isAllClearReady ? (
                    <button
                      onClick={onClaimAllClear}
                      className="px-5 py-2 bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-black font-black text-xs uppercase tracking-wider rounded shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-transform active:scale-95 animate-pulse"
                    >
                      CLAIM ALL-CLEAR DIVIDEND
                    </button>
                  ) : (
                    <span className="text-xs text-gray-500 bg-black/60 px-3 py-1.5 rounded border border-gray-800">
                      COMPLETE ALL 4 MISSIONS
                    </span>
                  )}
                </div>
              </div>

              {/* Dynamic Mission Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {dailyMissions.map((mission) => {
                  const progressPct = Math.min(100, (mission.progress / mission.target) * 100);
                  const scaledBytes = calculateMissionRewardBytes(mission.baseRewardBytes, state.osLevel);
                  const scaledQBits = calculateMissionRewardQBits(mission.baseRewardQBits, state.osLevel);

                  return (
                    <div
                      key={mission.id}
                      className={`p-3.5 rounded-lg border flex flex-col justify-between transition-all ${
                        mission.claimed
                          ? 'bg-black/40 border-gray-800/60 opacity-60'
                          : mission.completed
                          ? 'bg-amber-950/20 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                          : 'bg-[#10141d] border-gray-800'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-white text-xs">{mission.name}</h4>
                          <div className="flex items-center gap-1.5">
                            {getDifficultyBadge(mission.difficulty)}
                            {mission.completed && (
                              <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-700 px-1.5 py-0.2 rounded font-bold">
                                COMPLETE
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-[11px] text-gray-300 mt-1 leading-snug">
                          {mission.description}
                        </p>

                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                            <span>Objective Progress</span>
                            <span className="font-bold text-white tabular-nums">
                              {mission.unit === 'Bytes' || mission.unit === 'B'
                                ? `${Math.round(mission.progress).toLocaleString()} / ${mission.target.toLocaleString()} ${mission.unit}`
                                : `${mission.progress.toFixed(0)} / ${mission.target} ${mission.unit}`}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-black rounded-full overflow-hidden border border-gray-800">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-200"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Reward Footer */}
                      <div className="mt-4 pt-2.5 border-t border-gray-800/80 flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-bold text-amber-300">
                            +{scaledBytes.toLocaleString()} Bytes{' '}
                            {scaledQBits > 0 && <span>• +{scaledQBits} Q-Bits</span>}
                          </div>
                          <div className="text-[9px] text-gray-500">
                            Scaled for OS Level {state.osLevel}
                          </div>
                        </div>

                        {mission.claimed ? (
                          <span className="text-[11px] text-gray-500 font-bold">CLAIMED ✓</span>
                        ) : mission.completed ? (
                          <button
                            onClick={() => onClaimDailyMission(mission.id)}
                            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase rounded shadow transition-transform active:scale-95"
                          >
                            CLAIM
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-500">IN PROGRESS</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legacy Rotating Tasks Note */}
              <div className="mt-3 pt-3 border-t border-gray-800/80">
                <div className="text-xs uppercase font-bold text-gray-400 mb-2">
                  Permanent Hardware Stress Targets
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  {state.bounties.map((b) => (
                    <div key={b.id} className="p-2.5 rounded bg-black/40 border border-gray-800 text-gray-400 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white text-[11px]">{b.name}</div>
                        <div className="text-[10px] text-gray-500">{b.progress.toFixed(0)}/{b.target} {b.unit}</div>
                      </div>
                      {b.completed && !b.claimed && (
                        <button
                          onClick={() => onClaimBounty(b.id)}
                          className="px-2 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded"
                        >
                          CLAIM
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'achievements' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {state.achievements.map((ach) => (
                <div
                  key={ach.id}
                  className={`p-3.5 rounded-lg border flex items-center justify-between ${
                    ach.unlocked
                      ? 'bg-amber-950/20 border-amber-500/50 text-white'
                      : 'bg-[#0f131a] border-gray-800/60 text-gray-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-base ${ach.unlocked ? 'text-amber-400' : 'text-gray-600'}`}>
                        {ach.unlocked ? '★' : '☆'}
                      </span>
                      <h4 className="font-bold text-xs">{ach.codename}</h4>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">{ach.condition}</p>
                    <div className="text-[10px] text-amber-400 mt-1">Perk: {ach.reward}</div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      ach.unlocked
                        ? 'bg-amber-950 text-amber-300 border border-amber-700'
                        : 'bg-gray-900 text-gray-500'
                    }`}
                  >
                    {ach.unlocked ? 'UNLOCKED' : 'LOCKED'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
