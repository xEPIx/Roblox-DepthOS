import React, { useState, useEffect, useRef } from 'react';
import { RewardedAdState } from '../types';

interface RewardedAdModalProps {
  adState: RewardedAdState;
  onReward: () => void;
  onClose: () => void;
}

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({
  adState,
  onReward,
  onClose,
}) => {
  if (!adState.isOpen) return null;

  const [countdown, setCountdown] = useState<number>(5);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const hasTriggeredRef = useRef<boolean>(false);

  useEffect(() => {
    // Attempt real CrazyGames SDK v2 integration if available in window
    const win = window as unknown as {
      CrazyGames?: {
        SDK?: {
          ad?: {
            requestAd: (
              type: string,
              callbacks: {
                adStarted?: () => void;
                adFinished?: () => void;
                adError?: (error: unknown) => void;
              }
            ) => void;
          };
        };
      };
    };

    if (win.CrazyGames?.SDK?.ad?.requestAd && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      try {
        win.CrazyGames.SDK.ad.requestAd('rewarded', {
          adStarted: () => {
            console.log('CrazyGames rewarded ad started');
          },
          adFinished: () => {
            onReward();
            onClose();
          },
          adError: (err) => {
            console.warn('CrazyGames ad error, falling back to simulated player:', err);
          },
        });
      } catch (e) {
        console.warn('CrazyGames SDK call caught:', e);
      }
    }

    // High-polish interactive countdown fallback for review & preview environments
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onReward, onClose]);

  const handleClaimReward = () => {
    onReward();
    onClose();
  };

  const progressPercent = Math.min(100, Math.round(((5 - countdown) / 5) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl font-mono select-none animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-[#0a1222] border-2 border-amber-400/80 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(251,191,36,0.5)] ring-4 ring-amber-400/20 text-center relative overflow-hidden">
        {/* Top Sponsored Badge */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-black text-amber-300 uppercase tracking-widest">
              CRAZYGAMES REWARDED BOOST
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-white px-2 py-0.5 rounded border border-gray-700 hover:border-gray-500 transition-colors"
          >
            CANCEL [✕]
          </button>
        </div>

        {/* Video Canvas Simulation */}
        <div className="my-6 relative aspect-video bg-black/80 rounded-2xl border border-gray-700 overflow-hidden flex flex-col items-center justify-center p-4 shadow-inner">
          <div className="text-4xl mb-2 animate-bounce">
            {adState.type === 'double_flush' ? '💰' : adState.type === 'cryo_dump' ? '❄️' : '⚡'}
          </div>
          <div className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
            {adState.title}
          </div>
          <div className="text-xs text-emerald-400 font-bold mt-1">
            {adState.rewardLabel}
          </div>

          {/* Countdown Overlay */}
          <div className="absolute top-3 right-3 bg-black/70 px-2.5 py-1 rounded-md border border-white/10 text-xs font-bold text-amber-300 tabular-nums">
            {isCompleted ? '✓ READY' : `${countdown}s`}
          </div>

          {/* Progress Bar inside Video */}
          <div className="absolute bottom-0 inset-x-0 h-2 bg-gray-900">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Action Button */}
        {isCompleted ? (
          <button
            onClick={handleClaimReward}
            className="w-full py-4 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-300 hover:from-emerald-300 hover:to-cyan-200 text-black font-black text-sm uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.8)] animate-bounce transition-transform active:scale-95 flex items-center justify-center gap-2 ring-2 ring-emerald-300"
          >
            <span>CLAIM REWARD BOOST</span>
            <span>⚡</span>
          </button>
        ) : (
          <div className="text-xs text-gray-400 font-mono py-2 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-spin" />
            <span>Ad playing... reward unlocks in {countdown}s</span>
          </div>
        )}
      </div>
    </div>
  );
};
