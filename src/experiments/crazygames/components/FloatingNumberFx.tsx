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
          className={`absolute font-mono font-black select-none transition-all duration-700 ease-out drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] ${
            item.isSurge
              ? 'text-2xl sm:text-3xl text-amber-300 drop-shadow-[0_0_25px_rgba(251,191,36,0.95)] animate-pulse'
              : 'text-xl sm:text-2xl animate-bounce'
          }`}
        >
          <div
            className={`flex items-center gap-2 whitespace-nowrap px-3.5 py-1 rounded-xl border backdrop-blur-xl shadow-2xl ${
              item.isSurge
                ? 'bg-gradient-to-r from-red-950/95 via-amber-950/95 to-black border-amber-400 ring-2 ring-amber-400/50'
                : 'bg-black/90 border-cyan-400/60 ring-1 ring-cyan-400/30'
            }`}
          >
            {item.isSurge && <span className="text-xl animate-spin">🔥</span>}
            <span className="tracking-tight text-white drop-shadow">{item.text}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
