import React from 'react';
import { DepthOSState } from '../types/depthos';

interface SingularityProjectModalProps {
  state: DepthOSState;
  onContributeQBits: (amount: number) => void;
  onClose: () => void;
}

export const SingularityProjectModal: React.FC<SingularityProjectModalProps> = ({
  state,
  onContributeQBits,
  onClose,
}) => {
  const currentQBits = state.singularityContributedQBits;
  const targetQBits = 1000;
  const progressPct = Math.min(100, (currentQBits / targetQBits) * 100);

  const stages = [
    { target: 250, title: 'Stage 1: Sub-Atomic Magnetic Ring', perk: '+10% Passive Cooling Efficiency', reached: currentQBits >= 250 },
    { target: 500, title: 'Stage 2: Tachyon Flux Pipeline', perk: '+20% Global Byte Multiplier', reached: currentQBits >= 500 },
    { target: 1000, title: 'Stage 3: Singularity Ignition', perk: 'Cosmic Prismatic Shell & "Singularity Architect" Title', reached: currentQBits >= 1000 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 font-mono select-none">
      <div className="bg-[#0b0e14] border-2 border-fuchsia-500/60 rounded-xl w-full max-w-3xl text-fuchsia-400 p-6 shadow-[0_0_50px_rgba(217,70,239,0.25)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-fuchsia-900 pb-4 mb-4">
          <div>
            <h2 className="text-xl font-bold tracking-widest text-white flex items-center gap-2">
              <span className="w-3 h-3 bg-fuchsia-400 inline-block animate-pulse"></span>
              THE SINGULARITY CORE MEGASTRUCTURE PROJECT
            </h2>
            <p className="text-xs text-fuchsia-400 mt-1">
              The ultimate long-term endgame goal beyond standard prestige. Channel excess Quantum Bits to ignite the Singularity Core.
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-red-950/60 border border-red-500/50 hover:bg-red-800 text-red-200 text-xs font-bold rounded"
          >
            [ESC] CLOSE
          </button>
        </div>

        {/* Global Progress Gauge */}
        <div className="bg-[#120a1c] border border-fuchsia-800/60 rounded-lg p-5 mb-5 text-center">
          <div className="text-xs uppercase font-bold tracking-widest text-fuchsia-300">
            TOTAL QUANTUM BITS CHANNELLED
          </div>
          <div className="text-4xl sm:text-5xl font-black text-white mt-1 tabular-nums">
            {currentQBits} <span className="text-xl text-fuchsia-400">/ {targetQBits} Q-BITS</span>
          </div>

          <div className="w-full h-4 bg-black/80 rounded-full border border-fuchsia-900 overflow-hidden mt-4">
            <div
              className="h-full bg-gradient-to-r from-fuchsia-600 via-purple-500 to-cyan-400 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-2">
            Singularity Completion: <strong className="text-white">{progressPct.toFixed(1)}%</strong>
          </div>
        </div>

        {/* Stages Checklist */}
        <div className="space-y-3 mb-6 flex-1 overflow-y-auto pr-1">
          {stages.map((s, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-lg border flex items-center justify-between ${
                s.reached
                  ? 'bg-fuchsia-950/30 border-fuchsia-400 text-white'
                  : 'bg-[#10141d] border-gray-800 text-gray-500'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${s.reached ? 'text-fuchsia-400' : 'text-gray-600'}`}>
                    {s.reached ? '✓' : '○'}
                  </span>
                  <h4 className="font-bold text-xs">{s.title}</h4>
                </div>
                <div className="text-[11px] text-fuchsia-300 mt-1 pl-5">Reward: {s.perk}</div>
              </div>

              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  s.reached
                    ? 'bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-700'
                    : 'bg-black/50 text-gray-500'
                }`}
              >
                {s.reached ? 'ACTIVATED' : `${s.target} Q-BITS NEEDED`}
              </span>
            </div>
          ))}
        </div>

        {/* Contribution Actions */}
        <div className="pt-3 border-t border-fuchsia-900 flex flex-col sm:flex-row items-center justify-between gap-3 bg-fuchsia-950/20 p-3 rounded">
          <div className="text-xs">
            <span className="text-gray-400">Available Wallet: </span>
            <strong className="text-amber-300 tabular-nums">{state.quantumBits} Q-Bits</strong>
          </div>

          <div className="flex items-center gap-2">
            {[5, 25, 100].map((amt) => (
              <button
                key={amt}
                disabled={state.quantumBits < amt}
                onClick={() => onContributeQBits(amt)}
                className="px-3 py-1.5 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-gray-800 disabled:text-gray-600 text-black text-xs font-bold rounded shadow transition-all active:scale-95"
              >
                + {amt} Q-Bits
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
