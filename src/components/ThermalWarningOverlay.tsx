import React from 'react';

interface ThermalWarningOverlayProps {
  heat: number;
  isBSOD?: boolean;
}

/**
 * ThermalWarningOverlay
 * High-contrast 'THERMAL WARNING' text overlay that flashes across the screen
 * when the CPU temperature crosses the 85% / 85°C threshold.
 * Blink frequency dynamically accelerates from ~1.3 Hz up to ~7.7 Hz as temperature
 * approaches critical redline (100°C).
 */
export const ThermalWarningOverlay: React.FC<ThermalWarningOverlayProps> = ({
  heat,
  isBSOD = false,
}) => {
  const threshold = 85.0;

  // Only display if above 85% threshold and system is not already halted in BSOD
  if (heat < threshold || isBSOD) {
    return null;
  }

  // Calculate normalized severity between 85°C (0.0) and 100°C (1.0)
  const severity = Math.max(0, Math.min(1.0, (heat - threshold) / (100.0 - threshold)));

  // Dynamic blink period: scales from ~0.78s (1.3 Hz) down to ~0.13s (7.7 Hz) at redline
  const blinkPeriod = Math.max(0.12, 0.78 - Math.pow(severity, 1.25) * 0.65);
  const blinkHz = (1 / blinkPeriod).toFixed(1);

  // Critical status levels
  const isExtremeRedline = heat >= 95.0;

  return (
    <div className="fixed inset-0 pointer-events-none z-30 flex flex-col justify-between overflow-hidden select-none">
      {/* Top Warning Hazard Tape Bar */}
      <div
        className="w-full h-3 border-b border-black shadow-md thermal-warning-blink"
        style={{
          animationDuration: `${blinkPeriod}s`,
          backgroundImage:
            'repeating-linear-gradient(-45deg, #000000 0px, #000000 16px, #ef4444 16px, #ef4444 32px)',
        }}
      />

      {/* Main High-Contrast Floating Alert Banner (Spans across the screen) */}
      <div className="w-full flex justify-center px-4 pt-10 sm:pt-14">
        <div
          className="thermal-warning-blink flex flex-col items-center bg-[#07090e]/95 border-2 border-red-500 rounded-xl px-4 sm:px-8 py-2.5 sm:py-3 shadow-[0_0_35px_rgba(239,68,68,0.75)] backdrop-blur-xs max-w-2xl text-center"
          style={{ animationDuration: `${blinkPeriod}s` }}
        >
          {/* Top Badges */}
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="bg-red-950 border border-red-500/80 text-red-200 text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded">
              CRITICAL HEAT // {blinkHz} Hz STROBE
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          </div>

          {/* Primary High-Contrast Warning Text */}
          <h1
            className="text-xl sm:text-3xl md:text-4xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 drop-shadow-[0_2px_12px_rgba(255,0,60,0.9)]"
            style={{
              textShadow: '0 0 20px rgba(239, 68, 68, 0.9), 0 0 40px rgba(239, 68, 68, 0.5)',
            }}
          >
            ⚠ THERMAL WARNING ⚠
          </h1>

          {/* Real-time Telemetry & Guidance */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-1 text-xs sm:text-sm font-mono font-black">
            <span className="text-white drop-shadow-md">
              CORE: <strong className="text-red-400 text-sm sm:text-base">{heat.toFixed(1)}°C</strong> / 100.0°C
            </span>
            <span className="text-yellow-300">
              {isExtremeRedline ? '🚨 CATASTROPHIC BSOD IMMINENT' : '⚡ SILICON JUNCTION OVERHEAT'}
            </span>
          </div>

          {/* Action prompt */}
          <div className="mt-1.5 text-[10px] sm:text-xs font-bold text-gray-200 bg-black/60 px-3 py-0.5 rounded-full border border-red-500/40">
            PRESS <kbd className="px-1.5 py-0.5 bg-red-900/80 border border-red-400 rounded text-white font-mono font-black">V</kbd> OR{' '}
            <kbd className="px-1.5 py-0.5 bg-red-900/80 border border-red-400 rounded text-white font-mono font-black">E</kbd> TO EMERGENCY VENT
          </div>
        </div>
      </div>

      {/* Screen Edge Tactical Corner Accents */}
      <div className="w-full flex justify-between px-3 pb-2 text-[10px] font-mono font-black text-red-500 tracking-widest opacity-80">
        <span className="thermal-warning-blink" style={{ animationDuration: `${blinkPeriod}s` }}>
          [OVERTEMP: {((heat / 100) * 100).toFixed(0)}%]
        </span>
        <span className="thermal-warning-blink" style={{ animationDuration: `${blinkPeriod}s` }}>
          [REDLINE: 100.0°C]
        </span>
      </div>

      {/* Bottom Warning Hazard Tape Bar */}
      <div
        className="w-full h-3 border-t border-black shadow-md thermal-warning-blink"
        style={{
          animationDuration: `${blinkPeriod}s`,
          backgroundImage:
            'repeating-linear-gradient(45deg, #000000 0px, #000000 16px, #ef4444 16px, #ef4444 32px)',
        }}
      />
    </div>
  );
};
