import React from 'react';

interface BSODOverlayProps {
  countdown: number;
}

export const BSODOverlay: React.FC<BSODOverlayProps> = ({ countdown }) => {
  const progressPercent = Math.max(0, Math.min(100, ((5.0 - countdown) / 5.0) * 100));

  return (
    <div className="absolute inset-0 z-50 bg-[#0000aa] text-white font-mono p-8 flex flex-col justify-between select-none overflow-hidden animate-pulse">
      <div className="max-w-3xl space-y-6">
        <div className="text-8xl font-bold tracking-tighter">:(</div>
        <div className="space-y-3">
          <h1 className="text-2xl font-bold uppercase tracking-wider">
            Your PC ran into a problem and needs to restart.
          </h1>
          <p className="text-blue-200 text-sm leading-relaxed">
            CRITICAL_PROCESS_DIED: SYSTEM OVERHEAT THRESHOLD EXCEEDED (100.0°C).
            <br />
            Volatile memory dump in progress. Unbanked cache has been purged to prevent permanent silicon meltdown.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 pt-4">
          <div className="flex justify-between text-xs text-blue-200">
            <span>Rebooting kernel & thermal normalization</span>
            <span className="font-bold tabular-nums">{progressPercent.toFixed(0)}% complete ({countdown.toFixed(1)}s)</span>
          </div>
          <div className="w-full h-3 bg-blue-950 border border-blue-400/40 rounded overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="space-y-1 text-xs text-blue-300 border-t border-blue-800 pt-4">
          <div>Stop code: KERNEL_THERMAL_MELTDOWN_100C</div>
          <div>What failed: CPU_SILICON_CORE.SYS</div>
          <div>Memory Address: 0x000000DEAD777</div>
        </div>
      </div>

      <div className="text-xs text-blue-300 text-center tracking-widest uppercase">
        DepthOS Kernel v1.0.4 - Hardware Safety Lockout Engaged
      </div>
    </div>
  );
};
