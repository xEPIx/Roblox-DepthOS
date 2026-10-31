import React, { useState } from 'react';
import { DepthOSState } from '../types/depthos';

interface PlayerProfileModalProps {
  state: DepthOSState;
  onUpdateOperatorTag: (tag: string) => void;
  onEquipTitle: (title: string) => void;
  onClose: () => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  state,
  onUpdateOperatorTag,
  onEquipTitle,
  onClose,
}) => {
  const [tagInput, setTagInput] = useState(state.operatorTag);
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveTag = () => {
    if (tagInput.trim().length > 0) {
      onUpdateOperatorTag(tagInput.trim().slice(0, 16));
    }
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 font-mono select-none">
      <div className="bg-[#0b0e14] border-2 border-cyan-500/60 rounded-xl w-full max-w-2xl text-cyan-400 p-6 shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-900 pb-4 mb-4">
          <div>
            <h2 className="text-xl font-bold tracking-widest text-white flex items-center gap-2">
              <span className="w-3 h-3 bg-cyan-400 inline-block animate-pulse"></span>
              OPERATOR IDENTITY & SYSTEM PASSPORT
            </h2>
            <p className="text-xs text-cyan-500 mt-1">
              Customize your operator callsign, equip prestige titles, and inspect your lifetime hardware analytics.
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-red-950/60 border border-red-500/50 hover:bg-red-800 text-red-200 text-xs font-bold rounded"
          >
            [ESC] CLOSE
          </button>
        </div>

        {/* Passport Card */}
        <div className="bg-[#101522] border border-cyan-800/80 rounded-lg p-4 mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-cyan-950 border border-cyan-500 flex items-center justify-center text-2xl text-cyan-300 font-black shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              OP
            </div>
            <div>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={16}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    className="bg-black border border-cyan-400 text-white px-2 py-0.5 text-sm rounded font-bold"
                  />
                  <button
                    onClick={handleSaveTag}
                    className="px-2 py-0.5 bg-cyan-500 text-black text-xs font-bold rounded"
                  >
                    SAVE
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white">{state.operatorTag}</h3>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-bold"
                  >
                    EDIT
                  </button>
                </div>
              )}

              <div className="text-xs text-amber-300 font-bold mt-0.5">
                « {state.activeTitle} »
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-gray-500 uppercase">OS Clearance:</div>
            <div className="text-sm font-bold text-white">Version {state.osLevel}.0 Master</div>
          </div>
        </div>

        {/* Lifetime Stats Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 text-xs">
          <div className="bg-black/40 border border-gray-800 p-2.5 rounded">
            <span className="text-gray-500 block text-[10px]">TOTAL FLUSHES</span>
            <span className="text-base font-bold text-white tabular-nums">
              {state.successfulFlushes}
            </span>
          </div>
          <div className="bg-black/40 border border-gray-800 p-2.5 rounded">
            <span className="text-gray-500 block text-[10px]">MAX SURGE TIME</span>
            <span className="text-base font-bold text-red-400 tabular-nums">
              {state.maxSurgeDuration.toFixed(1)}s
            </span>
          </div>
          <div className="bg-black/40 border border-gray-800 p-2.5 rounded">
            <span className="text-gray-500 block text-[10px]">BSOD CRASHES</span>
            <span className="text-base font-bold text-blue-400 tabular-nums">
              {state.totalCrashes}
            </span>
          </div>
          <div className="bg-black/40 border border-gray-800 p-2.5 rounded">
            <span className="text-gray-500 block text-[10px]">A.R.I.A. AFFINITY</span>
            <span className="text-base font-bold text-emerald-400 tabular-nums">
              Lvl {state.aria.affinityLevel}
            </span>
          </div>
        </div>

        {/* Titles Selection */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <div className="text-xs uppercase font-bold text-cyan-300 border-b border-cyan-950 pb-1 mb-2">
            Equipable Operator Titles
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {state.unlockedTitles.map((title) => {
              const isEquipped = state.activeTitle === title;
              return (
                <button
                  key={title}
                  onClick={() => onEquipTitle(title)}
                  className={`p-2.5 rounded border text-left flex items-center justify-between transition-all ${
                    isEquipped
                      ? 'bg-cyan-950/40 border-cyan-400 text-white'
                      : 'bg-[#10141d] border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="font-bold">{title}</span>
                  {isEquipped ? (
                    <span className="text-[10px] text-cyan-400 font-bold">EQUIPPED</span>
                  ) : (
                    <span className="text-[10px] text-gray-600">EQUIP</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
