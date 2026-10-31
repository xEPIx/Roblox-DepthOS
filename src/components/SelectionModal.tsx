import React, { useState } from 'react';
import { FactionId, DepthOSState } from '../types/depthos';

interface SelectionModalProps {
  state: DepthOSState;
  onConfirmSelection: (faction: FactionId, starterRelicId: string, starterBonus: number) => void;
  onClose: () => void;
}

export const SelectionModal: React.FC<SelectionModalProps> = ({
  state,
  onConfirmSelection,
  onClose,
}) => {
  const [selectedFaction, setSelectedFaction] = useState<FactionId>(
    state.faction !== 'unaligned' ? state.faction : 'overvolt'
  );
  const [selectedRelic, setSelectedRelic] = useState<string>('gold_heatpipe');

  const factions = [
    {
      id: 'overvolt' as FactionId,
      name: 'Overvolt Dynamics',
      tagline: 'Pure Overclocking Power',
      icon: '⚡',
      color: 'text-amber-400 border-amber-500 bg-amber-950/30',
      bonus: '+15% Thermal Surge Yield (Up to 11.5x Multiplier)',
    },
    {
      id: 'cryodyn' as FactionId,
      name: 'CryoDyn Logistics',
      tagline: 'Sub-Zero Thermal Mastery',
      icon: '❄',
      color: 'text-cyan-400 border-cyan-500 bg-cyan-950/30',
      bonus: '+15% Base Passive Cooling Rate across all hardware',
    },
    {
      id: 'aetherbus' as FactionId,
      name: 'AetherBus Systems',
      tagline: 'Quantum Data Velocity',
      icon: '🚀',
      color: 'text-purple-400 border-purple-500 bg-purple-950/30',
      bonus: '-20% Cache Flush Channel Duration',
    },
  ];

  const relics = [
    {
      id: 'gold_heatpipe',
      name: '24K Gold Sintered Heatpipe',
      rarity: 'Legendary',
      effect: '+2.5°C/s Passive Cooling Boost',
      desc: 'Sintered pure copper core with 24K electroplated gold vapor distribution.',
    },
    {
      id: 'floppy_drive',
      name: 'Vintage 3.5" Floppy Relic',
      rarity: 'Rare',
      effect: '+1,500 Starting Banked Bytes',
      desc: 'Ancestral magnetic disk containing lost kernel optimization algorithms.',
    },
    {
      id: 'rgb_braided',
      name: 'Chroma Braided Cable Harness',
      rarity: 'Epic',
      effect: 'Cosmetic Prismatic Glow + 5% XP Gain',
      desc: 'High-density woven power cables pulsing with RGB spectrum light.',
    },
  ];

  const handleConfirm = () => {
    onConfirmSelection(selectedFaction, selectedRelic, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 font-mono select-none">
      <div className="bg-[#0b0e14] border-2 border-cyan-500 rounded-xl w-full max-w-3xl text-white p-6 shadow-[0_0_60px_rgba(6,182,212,0.3)] flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-900 pb-3 mb-4">
          <div>
            <div className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">
              OPERATOR PROTOCOL INITIALIZATION
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-wider text-white flex items-center gap-2 mt-0.5">
              <span className="w-3 h-3 bg-cyan-400 inline-block animate-pulse"></span>
              SELECT YOUR OPERATING SYSTEM LOADOUT
            </h2>
          </div>
          <button
            onClick={onClose}
            className="px-2.5 py-1 bg-red-950/60 border border-red-700 text-red-300 text-xs font-bold rounded"
          >
            [ESC]
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* STEP 1: FACTION SELECTION */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-300 mb-2 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-900 text-cyan-300 flex items-center justify-center text-[10px]">
                1
              </span>
              <span>SELECT YOUR MEGACORPORATION ALLEGIANCE</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {factions.map((f) => {
                const isSelected = selectedFaction === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFaction(f.id)}
                    className={`p-3 rounded-lg border-2 text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? `${f.color} ring-2 ring-white/50 scale-[1.02] shadow-lg`
                        : 'bg-[#10141d] border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <div>
                      <div className="text-2xl mb-1">{f.icon}</div>
                      <div className="font-black text-sm text-white">{f.name}</div>
                      <div className="text-[10px] text-gray-400 italic mt-0.5">{f.tagline}</div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-800/80 text-[11px] font-bold text-cyan-200">
                      {f.bonus}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: HARDWARE RELIC SELECTION */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-300 mb-2 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-900 text-cyan-300 flex items-center justify-center text-[10px]">
                2
              </span>
              <span>SELECT YOUR STARTER HARDWARE RELIC</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {relics.map((r) => {
                const isSelected = selectedRelic === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRelic(r.id)}
                    className={`p-3 rounded-lg border-2 text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-purple-400 bg-purple-950/40 text-white ring-2 ring-white/40 scale-[1.02] shadow-lg'
                        : 'bg-[#10141d] border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] uppercase font-bold text-purple-300">{r.rarity}</span>
                        {isSelected && <span className="text-xs text-purple-400 font-bold">✓ SELECTED</span>}
                      </div>
                      <div className="font-bold text-sm text-white">{r.name}</div>
                      <div className="text-[10px] text-gray-400 mt-1 leading-snug">{r.desc}</div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-800/80 text-[11px] font-bold text-amber-300">
                      {r.effect}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Button Footer */}
        <div className="mt-5 pt-4 border-t border-cyan-900 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-gray-400">
            Selected Protocol awards <strong className="text-emerald-400">+1,000 Bonus Starter Bytes</strong> and immediate corporate perks.
          </div>

          <button
            onClick={handleConfirm}
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-300 hover:from-cyan-300 hover:to-emerald-300 text-black font-black text-xs uppercase tracking-widest rounded-lg shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-transform active:scale-95"
          >
            CONFIRM LOADOUT SELECTION
          </button>
        </div>
      </div>
    </div>
  );
};
