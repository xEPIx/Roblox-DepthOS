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
    { title: string; hint: string; keyHint: string; accent: string; icon: string }
  > = {
    click_to_mine: {
      title: 'STEP 1: GENERATE DATA',
      hint: 'Click the big Processor Core or tap [SPACE] to mine volatile cash!',
      keyHint: 'CLICK OR [SPACE]',
      accent: 'border-cyan-400 bg-cyan-950/90 text-cyan-200 shadow-cyan-500/40',
      icon: '⚡',
    },
    watch_heat: {
      title: 'STEP 2: RIDE THERMAL SURGE',
      hint: 'Heat builds with every click. 85°C–99.9°C pays up to 10X Cash! Avoid 100°C meltdown!',
      keyHint: 'SURGE ZONE: 85°C–99°C',
      accent: 'border-amber-400 bg-amber-950/90 text-amber-200 shadow-amber-500/40',
      icon: '🔥',
    },
    flush_cash: {
      title: 'STEP 3: BANK PROFITS',
      hint: 'Hold [F] or click "FLUSH CACHE" to secure your volatile bytes into permanent cash.',
      keyHint: 'HOLD [F] TO BANK',
      accent: 'border-emerald-400 bg-emerald-950/90 text-emerald-200 shadow-emerald-500/40',
      icon: '💰',
    },
    buy_upgrade: {
      title: 'STEP 4: UPGRADE HARDWARE',
      hint: 'Spend your banked profits on CPU & Cooling upgrades to multiply your yields!',
      keyHint: 'CLICK SHOP UPGRADE',
      accent: 'border-purple-400 bg-purple-950/90 text-purple-200 shadow-purple-500/40',
      icon: '⚙️',
    },
  };

  const step = stageData[currentStage as Exclude<OnboardingStage, 'completed'>];
  if (!step) return null;

  return (
    <div className="pointer-events-none fixed bottom-16 left-1/2 -translate-x-1/2 z-40 max-w-lg w-11/12">
      <div
        className={`pointer-events-auto border-2 ${step.accent} p-4 rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-200 ring-1 ring-white/20`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{step.icon}</span>
            <h3 className="font-mono font-black text-xs sm:text-sm uppercase tracking-wider text-white">
              {step.title}
            </h3>
          </div>
          <button
            onClick={onSkip}
            className="text-[10px] font-mono text-gray-400 hover:text-white uppercase tracking-wider px-2 py-0.5 border border-white/20 rounded-md hover:border-white transition-colors"
          >
            Skip [ESC]
          </button>
        </div>

        <p className="mt-2 text-xs sm:text-sm font-mono text-gray-100 leading-snug">
          {step.hint}
        </p>

        <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/10">
          <span className="text-xs font-mono font-black bg-black/60 text-white px-2.5 py-1 rounded-md border border-white/10">
            {step.keyHint}
          </span>
          <button
            onClick={onAdvance}
            className="text-xs font-mono font-bold text-white hover:text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 transition-colors"
          >
            <span>Next Tip</span>
            <span>➔</span>
          </button>
        </div>
      </div>
    </div>
  );
};
