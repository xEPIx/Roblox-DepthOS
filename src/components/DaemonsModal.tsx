import React from 'react';
import { DaemonId, DepthOSState } from '../types/depthos';

interface DaemonsModalProps {
  state: DepthOSState;
  onClose: () => void;
  onToggleDaemon: (slotIndex: number, daemonId: DaemonId) => void;
}

export const DaemonsModal: React.FC<DaemonsModalProps> = ({
  state,
  onClose,
  onToggleDaemon,
}) => {
  const slotUnlocks = [5, 20, 40, 75];

  const availableDaemons = [
    {
      id: 'miner_d' as DaemonId,
      name: 'Auto-Process Alpha',
      filename: 'miner_d.exe',
      requiredLevel: 5,
      ramUsageMB: 16,
      description: 'Executes 2 continuous process cycles per second. Generates steady thermal load and volatile bytes.',
    },
    {
      id: 'flush_d' as DaemonId,
      name: 'Auto-Flush Guardian',
      filename: 'flush_d.exe',
      requiredLevel: 20,
      ramUsageMB: 32,
      description: 'Monitors risk thresholds. Automatically initiates cache flushes when RAM reaches 90% or heat hits 96.0°C.',
    },
    {
      id: 'governor_d' as DaemonId,
      name: 'Dynamic Overclock Governor',
      filename: 'governor_d.exe',
      requiredLevel: 40,
      ramUsageMB: 128,
      description: 'Dynamically modulates daemon execution. Throttles background tasks when heat exceeds 97.0°C to avert BSOD.',
    },
  ];

  // Calculate current daemon RAM overhead
  let currentDaemonRam = 0;
  state.daemons.forEach((dId) => {
    const found = availableDaemons.find((d) => d.id === dId);
    if (found) currentDaemonRam += found.ramUsageMB;
  });
  const maxDaemonRamAllowed = state.ramMaxMB * 0.75;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 font-mono">
      <div className="bg-[#0c1017] border-2 border-emerald-500/60 rounded-lg w-full max-w-3xl text-emerald-400 p-6 shadow-[0_0_50px_rgba(16,185,129,0.25)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-900 pb-4 mb-4">
          <div>
            <h2 className="text-xl font-bold tracking-widest text-white flex items-center gap-2">
              <span className="w-3 h-3 bg-emerald-400 inline-block animate-pulse"></span>
              DAEMON THREAD CONTROLLER (BACKGROUND AUTOMATION)
            </h2>
            <p className="text-xs text-emerald-500 mt-1">
              Configure autonomous background executable scripts running inside system memory.
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-red-950/60 border border-red-500/50 hover:bg-red-800 text-red-200 text-xs font-bold rounded"
          >
            [ESC] CLOSE
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-emerald-950/30 border border-emerald-800/40 rounded p-3 text-xs mb-6 flex justify-between">
          <div>
            <span className="text-emerald-600 block">DAEMON RAM ALLOCATION:</span>
            <span className="font-bold text-white text-sm tabular-nums">
              {currentDaemonRam} MB / {maxDaemonRamAllowed.toFixed(0)} MB Max ({((currentDaemonRam / maxDaemonRamAllowed) * 100).toFixed(0)}%)
            </span>
          </div>
          <div>
            <span className="text-emerald-600 block">SYSTEM STATUS:</span>
            <span className="font-bold text-emerald-300">
              {currentDaemonRam > 0 ? 'ACTIVE BACKGROUND LOAD' : 'IDLE'}
            </span>
          </div>
        </div>

        {/* 4 Daemon Slots */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto pr-1">
          {state.daemons.map((assignedDaemonId, slotIdx) => {
            const isSlotUnlocked = state.osLevel >= slotUnlocks[slotIdx];
            const assignedConfig = availableDaemons.find((d) => d.id === assignedDaemonId);

            return (
              <div
                key={slotIdx}
                className={`p-4 rounded border flex flex-col justify-between ${
                  isSlotUnlocked
                    ? 'bg-[#101722] border-emerald-800/60'
                    : 'bg-[#0d1117] border-gray-800/40 opacity-60'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      THREAD SLOT {slotIdx + 1}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        isSlotUnlocked ? 'bg-emerald-950 text-emerald-400' : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {isSlotUnlocked ? 'SOCKET READY' : `UNLOCKS AT LVL ${slotUnlocks[slotIdx]}`}
                    </span>
                  </div>

                  {isSlotUnlocked ? (
                    assignedConfig ? (
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                          {assignedConfig.filename}
                        </div>
                        <div className="text-xs text-emerald-500 mt-1">{assignedConfig.name}</div>
                        <div className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                          {assignedConfig.description}
                        </div>
                        <div className="text-xs text-amber-300 mt-2">
                          RAM Overhead: {assignedConfig.ramUsageMB} MB
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 py-4 italic">
                        Empty Daemon Socket. Select an available program below to mount.
                      </div>
                    )
                  ) : (
                    <div className="text-xs text-gray-500 py-6 text-center">
                      Locked socket. Reach OS Level {slotUnlocks[slotIdx]} to activate this daemon thread.
                    </div>
                  )}
                </div>

                {isSlotUnlocked && (
                  <div className="mt-4 pt-3 border-t border-emerald-950/60 flex flex-wrap gap-2">
                    {assignedConfig ? (
                      <button
                        onClick={() => onToggleDaemon(slotIdx, 'none')}
                        className="px-3 py-1 bg-red-900/60 hover:bg-red-800 border border-red-700 text-red-200 text-xs font-bold rounded"
                      >
                        UNMOUNT DAEMON
                      </button>
                    ) : (
                      availableDaemons.map((d) => {
                        const canMount = state.osLevel >= d.requiredLevel;
                        return (
                          <button
                            key={d.id}
                            disabled={!canMount}
                            onClick={() => onToggleDaemon(slotIdx, d.id)}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 disabled:bg-gray-800 disabled:text-gray-500 text-black text-xs font-bold rounded"
                          >
                            + {d.filename} {canMount ? '' : `(Lvl ${d.requiredLevel})`}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
