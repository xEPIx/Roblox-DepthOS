import React from 'react';
import { DepthOSState } from '../types/depthos';
import { calculatePrestigeQBits } from '../game/simulation';

interface PrestigeModalProps {
  state: DepthOSState;
  onClose: () => void;
  onInitiateReset: () => void;
  onUpgradeNode: (nodeKey: 'superconductorBus' | 'cryogenicSubstrate' | 'nonVolatileRegisters' | 'surgeDriftExploiter', cost: number) => void;
}

export const PrestigeModal: React.FC<PrestigeModalProps> = ({
  state,
  onClose,
  onInitiateReset,
  onUpgradeNode,
}) => {
  const qbitsOnReset = calculatePrestigeQBits(state.lifetimeBankedBytes);
  const canPrestige = state.osLevel >= 10 && qbitsOnReset > 0;

  // Node Costs
  const busCosts = [10, 30, 100, 250, 600];
  const busNextCost = busCosts[state.rootTree.superconductorBus] ?? null;

  const cryoCosts = [5, 20, 50, 120, 300];
  const cryoNextCost = cryoCosts[state.rootTree.cryogenicSubstrate] ?? null;

  const regCosts = [5, 15, 45];
  const regNextCost = regCosts[state.rootTree.nonVolatileRegisters] ?? null;

  const exploiterCost = 150;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 font-mono">
      <div className="bg-[#0b0e14] border-2 border-cyan-500/60 rounded-lg w-full max-w-4xl text-cyan-400 p-6 shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-900 pb-4 mb-4">
          <div>
            <h2 className="text-xl font-bold tracking-widest text-white flex items-center gap-2">
              <span className="w-3 h-3 bg-cyan-400 inline-block animate-pulse"></span>
              ROOT ARCHITECTURE: KERNEL RESET & PRESTIGE
            </h2>
            <p className="text-xs text-cyan-500 mt-1">
              Purge volatile silicon and hardware layers to harvest non-inflationary Quantum Bits (Q-Bits).
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-red-950/60 border border-red-500/50 hover:bg-red-800 text-red-200 text-xs font-bold rounded"
          >
            [ESC] CLOSE
          </button>
        </div>

        {/* Status Bar */}
        <div className="grid grid-cols-3 gap-4 mb-6 bg-cyan-950/30 p-3 rounded border border-cyan-800/40 text-xs">
          <div>
            <span className="text-cyan-600 block">CURRENT OS LEVEL:</span>
            <span className="text-base font-bold text-white tabular-nums">Level {state.osLevel}</span>
            <span className="text-[10px] text-cyan-400 block">{state.osLevel >= 10 ? '✓ Kernel Reset Ready' : `(Unlocks at Level 10)`}</span>
          </div>
          <div>
            <span className="text-cyan-600 block">LIFETIME BANKED BYTES:</span>
            <span className="text-base font-bold text-white tabular-nums">{state.lifetimeBankedBytes.toLocaleString()} B</span>
          </div>
          <div>
            <span className="text-cyan-600 block">WALLET QUANTUM BITS:</span>
            <span className="text-xl font-extrabold text-amber-300 tabular-nums">{state.quantumBits} Q-Bits</span>
          </div>
        </div>

        {/* Scrollable Tree */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="text-xs uppercase font-bold tracking-wider text-cyan-300 border-b border-cyan-900/60 pb-1">
            Root Architecture Upgrade Nodes (Permanent Metaprogression)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Superconductor Bus */}
            <div className="bg-[#101520] p-4 rounded border border-cyan-800/60 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-white text-sm">Superconductor Bus</h3>
                  <span className="text-xs bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
                    Rank {state.rootTree.superconductorBus}/5
                  </span>
                </div>
                <p className="text-xs text-cyan-400/80 mt-2">
                  Quantum pipeline optimization. Permanently scales global byte generation yield.
                </p>
                <div className="text-xs text-amber-300 mt-2">
                  Current: +{(state.rootTree.superconductorBus * 15)}% Yield Multiplier
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-cyan-950 flex items-center justify-between">
                <span className="text-xs text-cyan-500">
                  {busNextCost !== null ? `Cost: ${busNextCost} Q-Bits` : 'MAX RANK REACHED'}
                </span>
                {busNextCost !== null && (
                  <button
                    disabled={state.quantumBits < busNextCost}
                    onClick={() => onUpgradeNode('superconductorBus', busNextCost)}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 disabled:text-gray-500 text-black text-xs font-bold rounded"
                  >
                    UPGRADE
                  </button>
                )}
              </div>
            </div>

            {/* Cryogenic Substrate */}
            <div className="bg-[#101520] p-4 rounded border border-cyan-800/60 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-white text-sm">Cryogenic Substrate</h3>
                  <span className="text-xs bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
                    Rank {state.rootTree.cryogenicSubstrate}/5
                  </span>
                </div>
                <p className="text-xs text-cyan-400/80 mt-2">
                  Enhances ambient thermal dispersion. Adds flat passive cooling rate at all times.
                </p>
                <div className="text-xs text-amber-300 mt-2">
                  Current: +{(state.rootTree.cryogenicSubstrate * 3.0).toFixed(1)}°C/s Base Dissipation
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-cyan-950 flex items-center justify-between">
                <span className="text-xs text-cyan-500">
                  {cryoNextCost !== null ? `Cost: ${cryoNextCost} Q-Bits` : 'MAX RANK REACHED'}
                </span>
                {cryoNextCost !== null && (
                  <button
                    disabled={state.quantumBits < cryoNextCost}
                    onClick={() => onUpgradeNode('cryogenicSubstrate', cryoNextCost)}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 disabled:text-gray-500 text-black text-xs font-bold rounded"
                  >
                    UPGRADE
                  </button>
                )}
              </div>
            </div>

            {/* Non-Volatile Registers */}
            <div className="bg-[#101520] p-4 rounded border border-cyan-800/60 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-white text-sm">Non-Volatile Registers</h3>
                  <span className="text-xs bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
                    Rank {state.rootTree.nonVolatileRegisters}/3
                  </span>
                </div>
                <p className="text-xs text-cyan-400/80 mt-2">
                  Retains a percentage of banked currency through a Kernel Reset reboot.
                </p>
                <div className="text-xs text-amber-300 mt-2">
                  Current: {state.rootTree.nonVolatileRegisters * 5}% Banked Bytes Retained
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-cyan-950 flex items-center justify-between">
                <span className="text-xs text-cyan-500">
                  {regNextCost !== null ? `Cost: ${regNextCost} Q-Bits` : 'MAX RANK REACHED'}
                </span>
                {regNextCost !== null && (
                  <button
                    disabled={state.quantumBits < regNextCost}
                    onClick={() => onUpgradeNode('nonVolatileRegisters', regNextCost)}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 disabled:text-gray-500 text-black text-xs font-bold rounded"
                  >
                    UPGRADE
                  </button>
                )}
              </div>
            </div>

            {/* Surge Drift Exploiter (Master Node) */}
            <div className="bg-[#101520] p-4 rounded border border-amber-500/50 flex flex-col justify-between relative overflow-hidden">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-amber-300 text-sm flex items-center gap-1">
                    ★ Surge Drift Exploiter
                  </h3>
                  <span className="text-xs bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-700">
                    {state.rootTree.surgeDriftExploiter ? 'ACTIVE' : 'LOCKED'}
                  </span>
                </div>
                <p className="text-xs text-amber-200/70 mt-2">
                  Expands the Thermal Surge zone to ignite at 80.0°C instead of 85.0°C! Increases operational high-multiplier window by 33%.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-amber-950 flex items-center justify-between">
                <span className="text-xs text-amber-400 font-bold">
                  {state.rootTree.surgeDriftExploiter ? 'UNLOCKED' : `Cost: ${exploiterCost} Q-Bits`}
                </span>
                {!state.rootTree.surgeDriftExploiter && (
                  <button
                    disabled={state.quantumBits < exploiterCost}
                    onClick={() => onUpgradeNode('surgeDriftExploiter', exploiterCost)}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-800 disabled:text-gray-500 text-black text-xs font-bold rounded"
                  >
                    UNLOCK
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Prestige Action Banner */}
        <div className="mt-6 pt-4 border-t border-cyan-900 flex flex-col md:flex-row items-center justify-between gap-4 bg-cyan-950/20 p-4 rounded border border-cyan-800/40">
          <div>
            <div className="text-sm font-bold text-white">
              INITIATE KERNEL REBOOT (PRESTIGE)
            </div>
            <div className="text-xs text-cyan-400 mt-1">
              Resets current hardware and active cache. Awards{' '}
              <span className="text-amber-300 font-bold text-sm">+{qbitsOnReset} Quantum Bits</span> based on lifetime throughput.
            </div>
          </div>
          <button
            disabled={!canPrestige}
            onClick={onInitiateReset}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 disabled:from-gray-800 disabled:to-gray-900 disabled:text-gray-600 text-black font-bold text-xs uppercase tracking-wider rounded shadow-lg transition-all"
          >
            {state.osLevel < 10
              ? 'LEVEL 10 REQUIRED'
              : qbitsOnReset <= 0
              ? 'MORE BYTES NEEDED'
              : `REBOOT FOR +${qbitsOnReset} Q-BITS`}
          </button>
        </div>
      </div>
    </div>
  );
};
