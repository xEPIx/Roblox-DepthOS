import React from 'react';
import { OnboardingStage } from '../types';

interface CrazyGamesOnboardingOverlayProps {
  currentStage: OnboardingStage;
  onAdvance: () => void;
  onSkip: () => void;
}

export const CrazyGamesOnboardingOverlay: React.FC<CrazyGamesOnboardingOverlayProps> = ({
  currentStage,
  onAdvance,
  onSkip,
}) => {
  if (currentStage === 'completed') return null;

  const stageData: Record<
    Exclude<OnboardingStage, 'completed'>,
    { title: string; hint: string; keyHint: string; accent: string }
  > = {
    click_to_mine: {
      title: '1. PROCESS RAW BYTES',
      hint: 'Click the big Processor Core or press [SPACE] to mine volatile bytes!',
      keyHint: 'Click or [SPACE]',
      accent: 'border-cyan-400 text-cyan-300 shadow-cyan-500/30',
    },
    watch_heat: {
      title: '2. RIDE THE THERMAL SURGE',
      hint: 'Heat builds up with every click! 85°C–99.9°C gives up to 10X PAYOUTS. Avoid 100°C meltdown!',
      keyHint: 'Stay under 100°C',
      accent: 'border-amber-400 text-amber-300 shadow-amber-500/30',
    },
    flush_cash: {
      title: '3. BANK YOUR PROFITS',
      hint: 'Hold [F] or click "FLUSH CACHE" to secure your volatile bytes into permanent cash.',
      keyHint: 'Hold [F] or Click Flush',
      accent: 'border-emerald-400 text-emerald-300 shadow-emerald-500/30',
    },
    buy_upgrade: {
      title: '4. UPGRADE HARDWARE',
      hint: 'Spend your banked bytes to upgrade your CPU, RAM, and Cooling fans!',
      keyHint: 'Buy 1st Upgrade',
      accent: 'border-purple-400 text-purple-300 shadow-purple-500/30',
    },
  };

  const step = stageData[currentStage as Exclude<OnboardingStage, 'completed'>];
  if (!step) return null;

  return (
    <div className="pointer-events-none fixed bottom-20 left-1/2 -translate-x-1/2 z-40 max-w-lg w-11/12">
      <div
        className={`pointer-events-auto bg-black/90 border-2 ${step.accent} p-4 rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <h3 className="font-mono font-black text-sm uppercase tracking-wider text-white">
              {step.title}
            </h3>
          </div>
          <button
            onClick={onSkip}
            className="text-[10px] font-mono text-gray-400 hover:text-white uppercase tracking-wider px-2 py-0.5 border border-gray-700 rounded hover:border-gray-500 transition-colors"
          >
            Skip Guide [ESC]
          </button>
        </div>

        <p className="mt-2 text-xs sm:text-sm font-mono text-gray-200 leading-snug">
          {step.hint}
        </p>

        <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/10">
          <span className="text-[11px] font-mono bg-white/10 text-cyan-200 px-2 py-0.5 rounded font-bold">
            {step.keyHint}
          </span>
          <button
            onClick={onAdvance}
            className="text-xs font-mono font-bold text-cyan-400 hover:text-cyan-200 uppercase tracking-wider flex items-center gap-1"
          >
            <span>Next Tip</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
