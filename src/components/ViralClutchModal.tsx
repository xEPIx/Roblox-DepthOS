import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ViralClutchModalProps {
  temp: number;
  payout: number;
  onClose: () => void;
}

export const ViralClutchModal: React.FC<ViralClutchModalProps> = ({ temp, payout, onClose }) => {
  useEffect(() => {
    // Confetti cannon blast
    try {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
      });
    } catch {
      // fallback
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 font-mono select-none animate-fadeIn">
      <div className="bg-[#0b0e14] border-2 border-amber-400 rounded-2xl w-full max-w-lg text-white p-6 shadow-[0_0_60px_rgba(245,158,11,0.5)] flex flex-col items-center text-center relative overflow-hidden">
        {/* Glowing badge halo */}
        <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl mb-3 shadow-[0_0_30px_rgba(245,158,11,0.6)]">
          ⚡
        </div>

        <div className="text-xs uppercase tracking-widest text-amber-400 font-bold">
          VIRAL CLUTCH MOMENT ACHIEVED!
        </div>

        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
          LIVING ON THE EDGE: {temp.toFixed(1)}°C
        </h2>

        <p className="text-xs text-gray-300 mt-2 max-w-sm leading-relaxed">
          You pushed silicon within <span className="text-red-400 font-bold">{(100.0 - temp).toFixed(1)}°C</span> of fatal BSOD meltdown and successfully flushed your cache!
        </p>

        {/* Payout Display */}
        <div className="my-5 p-3 rounded-xl bg-amber-950/40 border border-amber-500/60 w-full">
          <div className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">
            SECURED BANKED PAYOUT
          </div>
          <div className="text-3xl font-black text-amber-300 tabular-nums mt-0.5">
            +{payout.toLocaleString()} <span className="text-sm text-white">BYTES</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-black font-black text-xs uppercase tracking-widest rounded-lg shadow-lg transition-transform active:scale-95"
        >
          CLAIM BRAGGING RIGHTS & CONTINUE
        </button>
      </div>
    </div>
  );
};
