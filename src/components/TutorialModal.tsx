import React, { useState } from 'react';
import {
  RobuxIcon,
  QBitIcon,
  CpuIllustration,
  RamIllustration,
  CoolerIllustration,
  FlameIllustration,
  MemoryIllustration,
  RobloxLogo,
} from './RobloxIcons';

interface TutorialModalProps {
  onClose: () => void;
  onComplete: () => void;
}

interface TutorialStep {
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  illustration: React.ReactNode;
  content: {
    heading: string;
    description: string;
    actionHint: string;
    keyShortcut?: string;
  };
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ onClose, onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps: TutorialStep[] = [
    {
      title: 'PROCESS WORKLOAD',
      subtitle: 'Build up volatile bytes',
      badge: 'STEP 1 / 5',
      badgeColor: 'bg-emerald-950 text-emerald-400 border-emerald-700',
      illustration: (
        <div className="relative flex items-center justify-center p-6 bg-gradient-to-b from-[#162720] to-[#121c17] rounded-2xl border-2 border-emerald-500/40 shadow-inner">
          <CpuIllustration className="w-20 h-20 text-emerald-400 animate-pulse" />
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded text-[11px] font-bold text-emerald-300">
            <RobuxIcon className="w-3.5 h-3.5" />
            <span>+2 B/click</span>
          </div>
        </div>
      ),
      content: {
        heading: 'Generate Unbanked Bytes',
        description:
          'Click the massive green 3D button or hold [SPACE] to execute workload cycles. Each click generates Volatile Bytes, increases Core Temperature, and consumes RAM buffer capacity.',
        actionHint: 'Keep an eye on heat and memory as you compute.',
        keyShortcut: '[SPACE] or Click',
      },
    },
    {
      title: 'THERMAL SURGE',
      subtitle: 'Push silicon to the redline',
      badge: 'STEP 2 / 5',
      badgeColor: 'bg-rose-950 text-rose-400 border-rose-700',
      illustration: (
        <div className="relative flex items-center justify-center p-6 bg-gradient-to-b from-[#2a1318] to-[#1a0e12] rounded-2xl border-2 border-rose-500/50 shadow-inner">
          <FlameIllustration className="w-20 h-20 text-rose-400 animate-bounce" />
          <div className="absolute top-2 right-2 bg-red-950/80 border border-red-500 px-2 py-0.5 rounded text-[10px] font-black text-rose-200">
            ⚡ 85°C–99.9°C
          </div>
        </div>
      ),
      content: {
        heading: 'Ride the 10x Multiplier Band',
        description:
          'When core temperature reaches 85.0°C, you trigger Thermal Surge! Your byte yield scales quadratically up to 10.0x payout. But reaching 100.0°C triggers a BSOD Meltdown, wiping unbanked cache!',
        actionHint: 'Emergency Cryo Vent [SPACE + E] cools core instantly if you push too far.',
        keyShortcut: '[SPACE + E] Cryo Dump',
      },
    },
    {
      title: 'FLUSH CACHE',
      subtitle: 'Bank your earned profits',
      badge: 'STEP 3 / 5',
      badgeColor: 'bg-blue-950 text-blue-400 border-blue-700',
      illustration: (
        <div className="relative flex items-center justify-center p-6 bg-gradient-to-b from-[#131d2e] to-[#0e1624] rounded-2xl border-2 border-cyan-500/40 shadow-inner">
          <MemoryIllustration className="w-20 h-20 text-cyan-400" />
          <div className="absolute bottom-2 flex items-center gap-1.5 bg-cyan-950/80 border border-cyan-500 px-3 py-1 rounded-full text-xs font-bold text-white">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>TRANSFER CHANNEL</span>
          </div>
        </div>
      ),
      content: {
        heading: 'Lock in Permanent Banked Bytes',
        description:
          'Hold [F] or click Flush Cache to channel volatile bytes into permanent Banked currency. Flushes initiated at 97.0°C+ count as Viral Clutches with bonus reputation!',
        actionHint: 'If RAM is full, you cannot process until you flush.',
        keyShortcut: 'Hold [F] to Flush',
      },
    },
    {
      title: 'HARDWARE UPGRADES',
      subtitle: 'Spot the glowing affordables',
      badge: 'STEP 4 / 5',
      badgeColor: 'bg-amber-950 text-amber-400 border-amber-700',
      illustration: (
        <div className="grid grid-cols-2 gap-2 p-4 bg-[#141824] rounded-2xl border-2 border-[#2c3347]">
          <div className="affordable-pulse p-2 rounded-xl bg-emerald-950/40 border border-emerald-400 flex items-center gap-2">
            <CpuIllustration className="w-7 h-7" />
            <div className="text-[10px] text-white font-bold">CPU Clock</div>
          </div>
          <div className="p-2 rounded-xl bg-[#1c2130] border border-gray-700 flex items-center gap-2">
            <CoolerIllustration className="w-7 h-7" />
            <div className="text-[10px] text-gray-400 font-bold">Chassis Fan</div>
          </div>
          <div className="p-2 rounded-xl bg-[#1c2130] border border-gray-700 flex items-center gap-2">
            <RamIllustration className="w-7 h-7" />
            <div className="text-[10px] text-gray-400 font-bold">RAM Stick</div>
          </div>
          <div className="affordable-pulse p-2 rounded-xl bg-emerald-950/40 border border-emerald-400 flex items-center gap-2">
            <RobuxIcon className="w-6 h-6" />
            <div className="text-[10px] text-emerald-300 font-bold">BUY READY</div>
          </div>
        </div>
      ),
      content: {
        heading: 'Pulsing Glowing Items = Affordable',
        description:
          'Whenever you have enough Banked Bytes for an upgrade, its card will pulse with a green glowing fade effect! Upgrade CPU for base throughput, RAM to delay buffer stalls, and Cooling to dissipate heat faster.',
        actionHint: 'Look for glowing items on the right hardware shop panel.',
      },
    },
    {
      title: 'PRESTIGE & ENDGAME',
      subtitle: 'A.R.I.A., Factions, & Singularity',
      badge: 'STEP 5 / 5',
      badgeColor: 'bg-purple-950 text-purple-400 border-purple-700',
      illustration: (
        <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#21142e] to-[#150d1e] rounded-2xl border-2 border-purple-500/40 shadow-inner text-center">
          <div className="w-14 h-14 rounded-2xl bg-black/60 border border-cyan-400 flex items-center justify-center text-cyan-300 font-black text-xl shadow-lg">
            ^‿^
          </div>
          <div className="mt-2 text-xs font-black text-white flex items-center gap-1.5">
            <span>A.R.I.A. AI COMPANION</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[10px] text-amber-400 font-bold">
            <QBitIcon className="w-3.5 h-3.5" />
            <span>HARVEST QUANTUM BITS AT LVL 10</span>
          </div>
        </div>
      ),
      content: {
        heading: 'Long-Term Megaproject Progression',
        description:
          'Chat with A.R.I.A. for affinity bonuses. Reach OS Level 10 to Prestige for Quantum Bits, join Factions (Overvolt, CryoDyn, AetherBus), and fund the community Singularity Core Project!',
        actionHint: 'You are now ready to operate DepthOS!',
      },
    },
  ];

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    try {
      localStorage.setItem('depthos_tutorial_completed', 'true');
    } catch {}
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm select-none font-sans">
      <div className="bg-[#181c28] border-2 border-emerald-500/60 rounded-3xl w-full max-w-xl text-white p-6 sm:p-8 shadow-[0_0_50px_rgba(0,176,111,0.35)] flex flex-col justify-between relative overflow-hidden">
        {/* Glow Ambient Corner */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[#2b3347]">
            <div className="flex items-center gap-2.5">
              <RobloxLogo className="w-5 h-5 text-red-500" />
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-wide text-white">
                  DEPTH<span className="text-emerald-400">OS</span> OPERATOR ACADEMY
                </h3>
                <p className="text-xs text-gray-400 font-bold">Quick Start Guide</p>
              </div>
            </div>

            <button
              onClick={handleComplete}
              className="text-xs font-bold text-gray-400 hover:text-white bg-[#242938] hover:bg-[#2d3447] px-3 py-1.5 rounded-xl border border-[#333b50] transition-colors"
              title="Skip tutorial"
            >
              SKIP
            </button>
          </div>

          {/* Step Pill & Title */}
          <div className="mt-4 flex items-center gap-2">
            <span
              className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${currentStep.badgeColor}`}
            >
              {currentStep.badge}
            </span>
            <span className="text-xs font-black text-gray-300 uppercase tracking-wider">
              {currentStep.title}
            </span>
          </div>
        </div>

        {/* Center Illustration & Body */}
        <div className="my-5 space-y-4">
          {currentStep.illustration}

          <div>
            <h4 className="text-lg font-black text-white">{currentStep.content.heading}</h4>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mt-1">
              {currentStep.content.description}
            </p>

            <div className="mt-3 flex items-center justify-between p-2.5 rounded-xl bg-[#12141c] border border-[#2b3347] text-xs">
              <span className="text-emerald-400 font-bold">💡 {currentStep.content.actionHint}</span>
              {currentStep.content.keyShortcut && (
                <span className="bg-[#242938] text-white px-2 py-0.5 rounded font-mono font-bold text-[11px] border border-[#333b50]">
                  {currentStep.content.keyShortcut}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="pt-4 border-t border-[#2b3347] flex items-center justify-between">
          {/* Step Dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? 'w-6 bg-emerald-400'
                    : 'w-2 bg-[#2d3447] hover:bg-gray-500'
                }`}
                aria-label={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                onClick={handleBack}
                className="px-4 py-2.5 rounded-xl bg-[#242938] hover:bg-[#2d3447] border border-[#333b50] text-gray-300 font-bold text-xs transition-all active:translate-y-0.5"
              >
                BACK
              </button>
            )}

            <button
              onClick={handleNext}
              className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                isLastStep
                  ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-black shadow-[0_4px_0_#007a4d] active:translate-y-1 active:shadow-none'
                  : 'bg-[#00b06f] hover:bg-[#00c67d] text-white shadow-[0_4px_0_#007a4d] active:translate-y-1 active:shadow-none'
              }`}
            >
              <span>{isLastStep ? "LET'S PLAY! 🚀" : 'NEXT'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
