import React from 'react';
import { ToastNotification } from '../types';

interface ToastNotificationOverlayProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const ToastNotificationOverlay: React.FC<ToastNotificationOverlayProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none font-mono select-none">
      {toasts.map((toast) => {
        const isAchievement = toast.type === 'achievement';
        const isMilestone = toast.type === 'milestone';
        const isResearch = toast.type === 'research';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full p-4 rounded-2xl border-2 backdrop-blur-xl shadow-2xl transition-all duration-300 animate-in slide-in-from-top-4 fade-in ${
              isAchievement
                ? 'bg-[#0b1626]/95 border-amber-400/90 shadow-[0_0_35px_rgba(251,191,36,0.6)] ring-2 ring-amber-400/30'
                : isMilestone
                ? 'bg-[#061521]/95 border-cyan-400/90 shadow-[0_0_35px_rgba(6,182,212,0.6)] ring-2 ring-cyan-400/30'
                : isResearch
                ? 'bg-[#160924]/95 border-purple-400/90 shadow-[0_0_35px_rgba(168,85,247,0.7)] ring-2 ring-purple-400/30'
                : 'bg-[#091811]/95 border-emerald-400/90 shadow-[0_0_35px_rgba(16,185,129,0.6)] ring-2 ring-emerald-400/30'
            }`}
          >
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border shadow-inner ${
                    isAchievement
                      ? 'bg-amber-950/80 border-amber-400 text-amber-300'
                      : isMilestone
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300'
                      : isResearch
                      ? 'bg-purple-950/80 border-purple-400 text-purple-300'
                      : 'bg-emerald-950/80 border-emerald-400 text-emerald-300'
                  }`}
                >
                  {toast.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                        isAchievement
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                          : isMilestone
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                          : isResearch
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                      }`}
                    >
                      {isAchievement
                        ? '🏆 ACHIEVEMENT UNLOCKED'
                        : isMilestone
                        ? '⭐ MILESTONE REACHED'
                        : isResearch
                        ? '🔬 RESEARCH COMPLETE'
                        : '🎯 GOAL COMPLETED'}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-white mt-1 leading-tight tracking-wide">
                    {toast.title}
                  </h4>
                </div>
              </div>
              <button
                onClick={() => onDismiss(toast.id)}
                className="text-gray-400 hover:text-white text-xs px-1.5 py-0.5 rounded border border-gray-700 hover:border-gray-500 transition-colors"
                title="Dismiss"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-300 mt-2 pl-1 leading-relaxed">
              {toast.subtitle}
            </p>

            {toast.rewardText && (
              <div
                className={`mt-2.5 px-3 py-1.5 rounded-lg text-xs font-black flex items-center justify-between border ${
                  isAchievement
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                    : isMilestone
                    ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200'
                    : isResearch
                    ? 'bg-purple-950/40 border-purple-500/50 text-purple-200'
                    : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                }`}
              >
                <span>{isResearch ? 'BONUS UNLOCKED:' : 'REWARD REAPED:'}</span>
                <span className="tracking-wider">{toast.rewardText}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
