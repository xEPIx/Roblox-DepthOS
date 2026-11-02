import React from 'react';
import { FloatingRewardItem } from '../types';

interface FloatingNumberFxProps {
  items: FloatingRewardItem[];
}

export const FloatingNumberFx: React.FC<FloatingNumberFxProps> = ({ items }) => {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            left: `${item.x}px`,
            top: `${item.y}px`,
            color: item.color,
            transform: `translate(-50%, -50%) scale(${item.scale || 1})`,
          }}
          className={`absolute font-mono font-black select-none transition-all duration-700 ease-out drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] ${
            item.isSurge
              ? 'text-2xl sm:text-4xl text-amber-300 drop-shadow-[0_0_20px_rgba(251,191,36,0.9)] animate-pulse'
              : 'text-xl sm:text-2xl animate-bounce'
          }`}
        >
          <div
            className={`flex items-center gap-2 whitespace-nowrap px-3 py-1 rounded-lg border backdrop-blur-md shadow-2xl ${
              item.isSurge
                ? 'bg-gradient-to-r from-red-950/90 to-amber-950/90 border-amber-400/80 ring-2 ring-amber-400/30'
                : 'bg-black/80 border-cyan-500/50'
            }`}
          >
            {item.isSurge && <span className="animate-spin text-lg sm:text-xl">🔥</span>}
            <span className="tracking-tight">{item.text}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
