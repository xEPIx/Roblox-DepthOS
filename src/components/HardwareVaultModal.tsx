import React from 'react';
import { CollectibleHardwareItem, CosmeticRarity } from '../types/depthos';

interface HardwareVaultModalProps {
  collectibles: CollectibleHardwareItem[];
  onToggleEquip: (id: string) => void;
  onClose: () => void;
}

export const HardwareVaultModal: React.FC<HardwareVaultModalProps> = ({
  collectibles,
  onToggleEquip,
  onClose,
}) => {
  const getRarityBadge = (rarity: CosmeticRarity) => {
    switch (rarity) {
      case 'mythic':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded font-black tracking-widest text-white uppercase bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 shadow-[0_0_12px_rgba(236,72,153,0.6)] animate-pulse">
            ★ MYTHIC
          </span>
        );
      case 'legendary':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded font-black tracking-widest text-black uppercase bg-gradient-to-r from-amber-400 to-yellow-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]">
            ★ LEGENDARY
          </span>
        );
      case 'epic':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded font-bold tracking-wider text-purple-200 uppercase bg-purple-900 border border-purple-500 shadow">
            EPIC
          </span>
        );
      case 'rare':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded font-bold tracking-wider text-blue-200 uppercase bg-blue-900 border border-blue-500">
            RARE
          </span>
        );
      default:
        return (
          <span className="text-[10px] px-2 py-0.5 rounded font-bold tracking-wider text-gray-300 uppercase bg-gray-800 border border-gray-600">
            COMMON
          </span>
        );
    }
  };

  const getBorderColor = (rarity: CosmeticRarity, unlocked: boolean) => {
    if (!unlocked) return 'border-gray-800 opacity-60';
    switch (rarity) {
      case 'mythic':
        return 'border-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.3)]';
      case 'legendary':
        return 'border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]';
      case 'epic':
        return 'border-purple-500/70';
      case 'rare':
        return 'border-blue-500/70';
      default:
        return 'border-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 font-mono select-none">
      <div className="bg-[#0b0e14] border-2 border-purple-500/60 rounded-xl w-full max-w-4xl text-purple-400 p-6 shadow-[0_0_50px_rgba(168,85,247,0.25)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-900 pb-4 mb-4">
          <div>
            <h2 className="text-xl font-bold tracking-widest text-white flex items-center gap-2">
              <span className="w-3 h-3 bg-purple-400 inline-block animate-pulse"></span>
              HARDWARE VAULT: COLLECTIBLES & COSMETIC RELICS
            </h2>
            <p className="text-xs text-purple-400 mt-1">
              Equip rare silicon dies, gold sintered vapor chambers, and cryogenic fluids to buff your rig.
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-red-950/60 border border-red-500/50 hover:bg-red-800 text-red-200 text-xs font-bold rounded"
          >
            [ESC] CLOSE
          </button>
        </div>

        {/* Vault Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto pr-1">
          {collectibles.map((item) => {
            return (
              <div
                key={item.id}
                className={`p-4 rounded-lg border bg-[#10141d] flex flex-col justify-between transition-all ${getBorderColor(
                  item.rarity,
                  item.unlocked
                )}`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-bold text-white text-sm">{item.name}</h3>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                        Category: {item.category}
                      </div>
                    </div>
                    <div>{getRarityBadge(item.rarity)}</div>
                  </div>

                  <p className="text-xs text-gray-300 mt-2.5 leading-relaxed">{item.description}</p>

                  <div className="mt-3 p-2 rounded bg-black/40 border border-purple-900/40 text-xs flex justify-between items-center">
                    <span className="text-gray-400 text-[11px]">Passive Bonus:</span>
                    <span className="font-bold text-amber-300">{item.effectLabel}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-800 flex justify-between items-center">
                  <span className="text-[11px] text-gray-500">
                    {item.unlocked ? (item.equipped ? 'CURRENTLY EQUIPPED' : 'IN INVENTORY') : 'LOCKED (SEASON / PRESTIGE DROP)'}
                  </span>

                  {item.unlocked && (
                    <button
                      onClick={() => onToggleEquip(item.id)}
                      className={`px-3 py-1 rounded text-xs font-bold uppercase transition-all ${
                        item.equipped
                          ? 'bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-200'
                          : 'bg-purple-600 hover:bg-purple-500 text-white shadow'
                      }`}
                    >
                      {item.equipped ? 'UNEQUIP' : 'EQUIP TO RIG'}
                    </button>
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
