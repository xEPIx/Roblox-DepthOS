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
          className={`absolute font-mono font-black select-none transition-all duration-700 ease-out animate-bounce drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] ${
            item.isSurge ? 'text-2xl sm:text-3xl text-amber-300 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]' : 'text-lg sm:text-xl'
          }`}
        >
          <div className="flex items-center gap-1.5 whitespace-nowrap bg-black/60 px-2 py-0.5 rounded border border-white/10 backdrop-blur-sm">
            {item.isSurge && <span className="animate-pulse">🔥</span>}
            <span>{item.text}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
