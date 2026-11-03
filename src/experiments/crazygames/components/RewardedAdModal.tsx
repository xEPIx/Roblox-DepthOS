import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RewardedAdState } from '../types';
import { AdAttemptController, AdStatus, REQUEST_TIMEOUT_MS } from '../adAttemptController';

export { REQUEST_TIMEOUT_MS };

interface RewardedAdModalProps {
  adState: RewardedAdState;
  onReward: (attemptId: string) => void;
  onClose: () => void;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
  onAttemptActiveChange?: (isActive: boolean) => void;
  onConfirmedPlayback?: (attemptId: string) => void;
}

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({
  adState,
  onReward,
  onClose,
  onPlaybackStateChange,
  onAttemptActiveChange,
  onConfirmedPlayback,
}) => {
  // 1. Hooks called unconditionally at top of component (Rule of Hooks)
  const [adStatus, setAdStatus] = useState<AdStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Keep latest callbacks in refs to avoid recreating controller
  const onRewardRef = useRef(onReward);
  onRewardRef.current = onReward;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const onPlaybackStateChangeRef = useRef(onPlaybackStateChange);
  onPlaybackStateChangeRef.current = onPlaybackStateChange;
  const onAttemptActiveChangeRef = useRef(onAttemptActiveChange);
  onAttemptActiveChangeRef.current = onAttemptActiveChange;
  const onConfirmedPlaybackRef = useRef(onConfirmedPlayback);
  onConfirmedPlaybackRef.current = onConfirmedPlayback;

  // Single persistent AdAttemptController instance across renders
  const controllerRef = useRef<AdAttemptController | null>(null);
  if (!controllerRef.current) {
    controllerRef.current = new AdAttemptController({
      onStatusChange: (status, msg) => {
        setAdStatus(status);
        setErrorMessage(msg);
      },
      onPlaybackStateChange: (isPlaying) => {
        onPlaybackStateChangeRef.current?.(isPlaying);
      },
      onAttemptActiveChange: (isActive) => {
        onAttemptActiveChangeRef.current?.(isActive);
      },
      onConfirmedPlayback: (attemptId) => {
        onConfirmedPlaybackRef.current?.(attemptId);
      },
      onReward: (attemptId) => {
        onRewardRef.current(attemptId);
      },
      onClose: () => {
        onCloseRef.current();
      },
    });
  }

  // Safe dismiss callback for UI buttons
  const handleDismiss = useCallback(() => {
    controllerRef.current?.dismiss();
    onCloseRef.current();
  }, []);

  // Ad Lifecycle Effect: triggers startAttempt when open with attemptId
  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller) return;

    if (!adState.isOpen || !adState.attemptId) {
      controller.dismiss();
      setAdStatus('idle');
      setErrorMessage('');
      return;
    }

    controller.startAttempt(adState.attemptId);

    return () => {
      controller.dismiss();
    };
  }, [adState.isOpen, adState.attemptId]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      controllerRef.current?.dispose();
    };
  }, []);

  // 2. Return early strictly AFTER all hooks are called
  if (!adState.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl font-mono select-none animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-[#0a1222] border-2 border-amber-400/80 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(251,191,36,0.5)] ring-4 ring-amber-400/20 text-center relative overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                adStatus === 'playing'
                  ? 'bg-amber-400 animate-ping'
                  : adStatus === 'unavailable'
                  ? 'bg-cyan-400'
                  : adStatus === 'error'
                  ? 'bg-red-400'
                  : 'bg-emerald-400'
              }`}
            />
            <span className="text-xs font-black text-amber-300 uppercase tracking-widest">
              CRAZYGAMES REWARDED BOOST
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className="text-xs text-gray-400 hover:text-white px-2 py-0.5 rounded border border-gray-700 hover:border-gray-500 transition-colors"
          >
            DISMISS [✕]
          </button>
        </div>

        {/* Content Body Based on Status */}
        {adStatus === 'unavailable' ? (
          <div className="my-6 p-5 bg-black/60 rounded-2xl border border-cyan-500/40 text-left">
            <div className="flex items-center gap-2 text-cyan-300 font-black text-sm mb-2">
              <span>⚠️ ADS UNAVAILABLE IN PREVIEW</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed mb-3">
              The CrazyGames SDK rewarded ad provider is not available in this standalone preview environment. Rewarded video ads only serve inside the live CrazyGames player container.
            </p>
            <div className="p-2.5 bg-cyan-950/40 border border-cyan-800/60 rounded-lg text-[11px] text-cyan-200">
              <strong>Reward Target:</strong> {adState.title} ({adState.rewardLabel})
            </div>
            <p className="text-[11px] text-gray-400 mt-2 italic">
              Production compliance rule: Rewards are strictly granted upon verified SDK ad completion. No automatic rewards or simulated completions are granted.
            </p>
          </div>
        ) : adStatus === 'error' ? (
          <div className="my-6 p-5 bg-red-950/40 rounded-2xl border border-red-500/50 text-left">
            <div className="flex items-center gap-2 text-red-400 font-black text-sm mb-2">
              <span>❌ AD COULD NOT BE COMPLETED</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed mb-3">
              {errorMessage || 'The ad was closed before finishing or ad inventory was unavailable.'}
            </p>
            <div className="text-[11px] text-gray-400 italic">
              Notice: As required by fair play standards, rewards are only granted when an ad finishes playing in full.
            </div>
          </div>
        ) : (
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
            <div className="mt-3 text-xs text-amber-300 font-bold flex items-center gap-2 bg-black/60 px-3 py-1 rounded-full border border-amber-500/40">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-spin" />
              <span>
                {adStatus === 'requesting' ? 'Requesting ad from CrazyGames...' : 'Playing ad via CrazyGames SDK...'}
              </span>
            </div>
          </div>
        )}

        {/* Footer Dismiss Button */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleDismiss}
            className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white font-black text-xs uppercase tracking-widest rounded-xl transition-colors"
          >
            {adStatus === 'unavailable' || adStatus === 'error' ? 'CLOSE' : 'CANCEL AD'}
          </button>
        </div>
      </div>
    </div>
  );
};
