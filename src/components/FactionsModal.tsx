import React from 'react';
import { FactionId, DepthOSState } from '../types/depthos';

interface FactionsModalProps {
  state: DepthOSState;
  onPledgeFaction: (factionId: FactionId) => void;
  onClose: () => void;
}

export const FactionsModal: React.FC<FactionsModalProps> = ({ state, onPledgeFaction, onClose }) => {
  const factions = [
    {
      id: 'cryodyn' as FactionId,
      name: 'CryoDyn Logistics',
      slogan: 'Sub-Zero Silicon Mastery',
      color: '#00d2ff',
      accentBg: 'bg-cyan-950/40 border-cyan-500/60',
      description: 'Pioneers of sub-zero liquid nitrogen and phase-change closed loops. Maximizes thermal dissipation.',
      perk: '+15% Base Passive Cooling Rate across all hardware',
      themeReward: 'CryoDyn Ice Blizzard OS Theme (Rank 3)',
    },
    {
      id: 'overvolt' as FactionId,
      name: 'Overvolt Dynamics',
      slogan: 'Redline Pure Power',
      color: '#f59e0b',
      accentBg: 'bg-amber-950/40 border-amber-500/60',
      description: 'Extreme overclocking cartel. Pushes transistors past manufacturer safety tolerances for exponential yields.',
      perk: '+15% Thermal Surge Multiplier (scales to 11.5x at 99.9°C)',
      themeReward: 'Overvolt Golden Glow OS Theme (Rank 3)',
    },
    {
      id: 'aetherbus' as FactionId,
      name: 'AetherBus Systems',
      slogan: 'Instant Data Velocity',
      color: '#c084fc',
      accentBg: 'bg-purple-950/40 border-purple-500/60',
      description: 'Quantum memory optical bus architects. Shrinks cache flushing times to near instantaneous transfers.',
      perk: '-20% Cache Flush Channel Duration',
      themeReward: 'Retro Synthwave 1984 OS Theme (Rank 3)',
    },
  ];

  const getRankTitle = (rank: number) => {
    if (rank >= 5) return 'Corporate Director';
    if (rank >= 4) return 'Master Overclock Lord';
    if (rank >= 3) return 'Lead Silicon Architect';
    if (rank >= 2) return 'Senior Hardware Engineer';
    return 'Field Associate';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 font-mono select-none">
      <div className="bg-[#0b0e14] border-2 border-cyan-500/60 rounded-xl w-full max-w-4xl text-cyan-400 p-6 shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-900 pb-4 mb-4">
          <div>
            <h2 className="text-xl font-bold tracking-widest text-white flex items-center gap-2">
              <span className="w-3 h-3 bg-cyan-400 inline-block animate-pulse"></span>
              CORPORATE ALLIANCES & MEGACORP PLEDGE
            </h2>
            <p className="text-xs text-cyan-500 mt-1">
              Align with a global tech titan to receive permanent hardware passives, rank titles, and exclusive OS themes.
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-red-950/60 border border-red-500/50 hover:bg-red-800 text-red-200 text-xs font-bold rounded"
          >
            [ESC] CLOSE
          </button>
        </div>

        {/* Current Faction Status Card */}
        <div className="bg-cyan-950/20 border border-cyan-800/60 rounded-lg p-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wider block">YOUR CURRENT ALLEGIANCE:</span>
            <div className="text-lg font-black text-white mt-0.5 flex items-center gap-2">
              {state.faction === 'unaligned' ? (
                <span className="text-gray-500">Unaligned Freelance Operator</span>
              ) : (
                <span className="capitalize text-cyan-300">
                  {state.faction} Megacorp • {getRankTitle(state.factionRank)} (Rank {state.factionRank})
                </span>
              )}
            </div>
          </div>

          {state.faction !== 'unaligned' && (
            <div className="text-right">
              <div className="text-xs text-gray-400">Corporate Reputation XP</div>
              <div className="text-sm font-bold text-white tabular-nums">
                {state.factionReputation.toLocaleString()} / {(state.factionRank * 500).toLocaleString()} Rep
              </div>
            </div>
          )}
        </div>

        {/* Faction Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-y-auto pr-1">
          {factions.map((f) => {
            const isPledged = state.faction === f.id;
            return (
              <div
                key={f.id}
                className={`p-4 rounded-lg border flex flex-col justify-between transition-all ${
                  isPledged
                    ? `${f.accentBg} shadow-lg ring-1 ring-cyan-400`
                    : 'bg-[#10141d] border-gray-800 hover:border-gray-700'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-white text-base" style={{ color: f.color }}>
                      {f.name}
                    </h3>
                    {isPledged && (
                      <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded font-bold border border-cyan-700">
                        ACTIVE PLEDGE
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-400 italic mt-0.5">{f.slogan}</div>
                  <p className="text-xs text-gray-300 mt-3 leading-relaxed">{f.description}</p>

                  <div className="mt-4 pt-3 border-t border-gray-800/80 space-y-2 text-xs">
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase font-bold">Passive Bonus:</span>
                      <span className="font-bold text-white">{f.perk}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase font-bold">Reward at Rank 3:</span>
                      <span className="text-amber-300 text-[11px]">{f.themeReward}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-800/80">
                  <button
                    disabled={isPledged}
                    onClick={() => onPledgeFaction(f.id)}
                    className={`w-full py-2 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                      isPledged
                        ? 'bg-gray-800 text-gray-500 cursor-default'
                        : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-black shadow'
                    }`}
                  >
                    {isPledged ? 'CURRENT FACTION' : 'PLEDGE ALLEGIANCE'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
