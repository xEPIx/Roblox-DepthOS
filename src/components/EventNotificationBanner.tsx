import React from 'react';
import { RareSystemEvent } from '../types/depthos';

interface EventNotificationBannerProps {
  event: RareSystemEvent;
}

export const EventNotificationBanner: React.FC<EventNotificationBannerProps> = ({ event }) => {
  const getBannerColor = () => {
    switch (event.type) {
      case 'solar_flare':
        return 'border-amber-500 bg-amber-950/80 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.4)]';
      case 'cryo_leak':
        return 'border-cyan-400 bg-cyan-950/80 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.4)]';
      case 'bull_run':
        return 'border-emerald-400 bg-emerald-950/80 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.4)]';
      default:
        return 'border-purple-500 bg-purple-950/80 text-purple-200';
    }
  };

  const percent = Math.max(0, Math.min(100, (event.timeRemaining / event.durationSeconds) * 100));

  return (
    <div
      className={`fixed top-12 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[92%] p-3 rounded-lg border-2 ${getBannerColor()} font-mono select-none flex flex-col gap-1.5 animate-bounce-short`}
    >
      <div className="flex justify-between items-center text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
          <span className="font-black tracking-widest uppercase text-white">{event.title}</span>
        </div>
        <span className="font-bold tabular-nums text-white">
          {event.timeRemaining.toFixed(1)}s REMAINING
        </span>
      </div>

      <div className="text-[11px] leading-snug opacity-95">{event.description}</div>

      <div className="w-full h-1 bg-black/60 rounded-full overflow-hidden mt-0.5">
        <div
          className="h-full bg-white transition-all duration-100 ease-linear"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};
