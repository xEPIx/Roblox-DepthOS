import React, { useState, useEffect } from 'react';
import { DepthOSState, OSTheme } from '../types/depthos';
import {
  calculateThermalMultiplier,
  calculateBytesPerProcess,
  calculateHeatPerProcess,
  calculateFlushDuration,
  calculateFlushPayout,
  getCpuUpgradeCost,
  getRamUpgradeCost,
  getCoolingUpgradeCost,
  getBusUpgradeCost,
  getThermalPasteCost,
  getSurgeThreshold,
  calculateMultiUpgrade,
  BuyMultiplier,
  CRITICAL_TEMP,
} from '../game/simulation';
import {
  RobuxIcon,
  QBitIcon,
  CpuIllustration,
  RamIllustration,
  CoolerIllustration,
  BusIllustration,
  PasteIllustration,
  RobloxLogo,
  FlameIllustration,
  MemoryIllustration,
} from './RobloxIcons';

interface DepthOSDesktopProps {
  state: DepthOSState;
  onProcessClick: () => void;
  onStartFlush: () => void;
  onCancelFlush: () => void;
  onEmergencyVent: () => void;
  onPurchaseUpgrade: (type: 'cpu' | 'ram' | 'cooling' | 'bus' | 'paste', count?: number) => void;
  onOpenPrestige: () => void;
  onOpenDaemons: () => void;
  onOpenBounties: () => void;
  onOpenRobloxExport: () => void;
  onOpenSettings: () => void;
  onOpenFactions: () => void;
  onOpenVault: () => void;
  onOpenSeasonPass: () => void;
  onOpenProfile: () => void;
  onOpenSingularity: () => void;
  onToggle3DView: () => void;
  is3DFullscreen: boolean;
}

export const DepthOSDesktop: React.FC<DepthOSDesktopProps> = ({
  state,
  onProcessClick,
  onStartFlush,
  onCancelFlush,
  onEmergencyVent,
  onPurchaseUpgrade,
  onOpenPrestige,
  onOpenDaemons,
  onOpenBounties,
  onOpenRobloxExport,
  onOpenSettings,
  onOpenFactions,
  onOpenVault,
  onOpenSeasonPass,
  onOpenProfile,
  onOpenSingularity,
  onToggle3DView,
  is3DFullscreen,
}) => {
  const [systemTime, setSystemTime] = useState<string>('');
  const [isProcessPressed, setIsProcessPressed] = useState<boolean>(false);
  const [buyMultiplier, setBuyMultiplier] = useState<BuyMultiplier>(1);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSystemTime(now.toTimeString().split(' ')[0]);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Theme styling helpers
  const themeClasses: Record<OSTheme, { text: string; border: string; bg: string; cardBg: string; accent: string }> = {
    cyber_green: {
      text: 'text-emerald-400',
      border: 'border-[#26332a]',
      bg: 'bg-[#0f1418]',
      cardBg: 'bg-[#151d20]/95',
      accent: 'text-emerald-300',
    },
    amber_phosphor: {
      text: 'text-amber-400',
      border: 'border-[#3b2d1c]',
      bg: 'bg-[#15110d]',
      cardBg: 'bg-[#1f1913]/95',
      accent: 'text-amber-300',
    },
    midnight_matrix: {
      text: 'text-cyan-400',
      border: 'border-[#1e2c3d]',
      bg: 'bg-[#0d141e]',
      cardBg: 'bg-[#131d2b]/95',
      accent: 'text-cyan-300',
    },
    holographic_aurora: {
      text: 'text-pink-400',
      border: 'border-[#381e3a]',
      bg: 'bg-[#160f1c]',
      cardBg: 'bg-[#201529]/95',
      accent: 'text-fuchsia-300',
    },
    cryodyn_ice: {
      text: 'text-sky-300',
      border: 'border-[#1b3145]',
      bg: 'bg-[#0b1622]',
      cardBg: 'bg-[#112133]/95',
      accent: 'text-sky-200',
    },
    overvolt_gold: {
      text: 'text-amber-300',
      border: 'border-[#3b301a]',
      bg: 'bg-[#18130b]',
      cardBg: 'bg-[#241d11]/95',
      accent: 'text-yellow-200',
    },
    synthwave_1984: {
      text: 'text-purple-300',
      border: 'border-[#381d45]',
      bg: 'bg-[#170e22]',
      cardBg: 'bg-[#221433]/95',
      accent: 'text-fuchsia-300',
    },
  };

  const theme = themeClasses[state.activeTheme] || themeClasses.cyber_green;

  // Thermal surge and multipliers
  const surgeThreshold = getSurgeThreshold(state.rootTree);
  const inSurge = state.heat >= surgeThreshold && state.heat < CRITICAL_TEMP;
  const inWarning = state.heat >= 70.0 && state.heat < surgeThreshold;
  const thermalMult = calculateThermalMultiplier(state.heat, state.rootTree, state.faction);

  // Calculations for current moment
  const nextYield = calculateBytesPerProcess(state);
  const nextHeatAdd = calculateHeatPerProcess(state);
  const flushDuration = calculateFlushDuration(state);
  const flushPayout = calculateFlushPayout(state);

  const ramPercent = state.ramMaxMB > 0 ? (state.ramUsedMB / state.ramMaxMB) * 100 : 0;
  const heatPercent = Math.min(100, Math.max(0, ((state.heat - 25) / 75) * 100));
  const xpPercent = (state.currentXP / state.requiredXP) * 100;

  // Multi-buy calculations for current multiplier
  const cpuUpgrade = calculateMultiUpgrade('cpu', state.hardware.cpuLevel, state.bankedBytes, buyMultiplier);
  const ramUpgrade = calculateMultiUpgrade('ram', state.hardware.ramLevel, state.bankedBytes, buyMultiplier);
  const coolingUpgrade = calculateMultiUpgrade('cooling', state.hardware.coolingLevel, state.bankedBytes, buyMultiplier);
  const busUpgrade = calculateMultiUpgrade('bus', state.hardware.busLevel, state.bankedBytes, buyMultiplier);
  const pasteUpgrade = calculateMultiUpgrade('paste', state.hardware.thermalPasteLevel, state.bankedBytes, buyMultiplier);

  // Danger vignette intensity (starts appearing at 75°C, gets severe at 85°C+)
  const dangerAlpha = state.heat >= 75 ? Math.min(0.65, ((state.heat - 75) / 25) * 0.65) : 0;

  return (
    <div
      className={`relative w-full h-full flex flex-col font-sans select-none overflow-hidden transition-colors duration-300 ${
        is3DFullscreen ? 'bg-transparent pointer-events-none' : 'bg-[#12141c]'
      }`}
    >
      {/* Thermal Danger Overlay */}
      {dangerAlpha > 0 && (
        <div
          className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-100"
          style={{
            background: `radial-gradient(circle, transparent 40%, rgba(255, 0, 40, ${dangerAlpha}) 100%)`,
          }}
        />
      )}

      {/* ROBLOX TOPBAR */}
      <div
        className={`h-12 px-4 flex items-center justify-between border-b border-[#2b3347] bg-[#1a1d28]/95 z-40 text-xs ${
          is3DFullscreen ? 'pointer-events-auto bg-[#1a1d28]' : ''
        }`}
      >
        {/* Left: Roblox Logo, Title & Time */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#242938] px-2.5 py-1 rounded-lg border border-[#333b50]">
            <RobloxLogo className="w-4 h-4 text-red-500" />
            <span className="font-black tracking-wider text-white text-sm">
              DEPTH<span className="text-emerald-400">OS</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-gray-400 pl-1 text-[11px]">
            <span>{systemTime}</span>
            <span className="text-gray-600">·</span>
            <span className="text-emerald-400 font-bold">10Hz CLOCK</span>
          </div>
        </div>

        {/* Center: Roblox Level Badge & XP Bar */}
        <div className="flex-1 max-w-xs mx-4 hidden md:flex items-center gap-2 bg-[#242938] px-3 py-1 rounded-full border border-[#333b50]">
          <span className="font-black text-amber-400 text-xs whitespace-nowrap flex items-center gap-1">
            <span>★</span> LVL {state.osLevel}
          </span>
          <div className="flex-1 h-2.5 bg-[#12141c] rounded-full overflow-hidden border border-[#3c455c]">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-150"
              style={{ width: `${Math.min(100, xpPercent)}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-300 font-bold tabular-nums">
            {state.currentXP.toLocaleString()}/{state.requiredXP.toLocaleString()}
          </span>
        </div>

        {/* Right: Robux/Bytes & Q-Bits Currencies + Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Robux/Bytes Counter */}
          <div className="flex items-center gap-1.5 bg-[#192420] border border-emerald-500/40 px-2.5 py-1 rounded-lg shadow-sm">
            <RobuxIcon className="w-4 h-4" />
            <span className="font-black text-white text-xs sm:text-sm tabular-nums">
              {state.bankedBytes.toLocaleString()}
            </span>
          </div>

          {/* Q-Bits Counter */}
          <div className="flex items-center gap-1.5 bg-[#2a2114] border border-amber-500/40 px-2.5 py-1 rounded-lg shadow-sm">
            <QBitIcon className="w-4 h-4" />
            <span className="font-black text-amber-400 text-xs sm:text-sm tabular-nums">
              {state.quantumBits}
            </span>
          </div>

          {/* Profile Passport Button */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#333b50] bg-[#242938] hover:bg-[#2d3447] text-white font-bold text-[11px] transition-all"
            title="Inspect Operator Profile"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span className="hidden lg:inline">{state.operatorTag}</span>
          </button>

          {/* 3D Battlestation Toggle Button */}
          <button
            onClick={onToggle3DView}
            className={`px-2.5 py-1 text-[11px] font-black rounded-lg border transition-all ${
              is3DFullscreen
                ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_3px_0_#0891b2]'
                : 'bg-[#242938] text-cyan-400 border-[#333b50] hover:bg-[#2d3447]'
            }`}
          >
            {is3DFullscreen ? '🖥 2D UI' : '🕹 3D PC'}
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg border border-[#333b50] bg-[#242938] hover:bg-[#2d3447] text-gray-300"
            title="Settings & Themes"
          >
            ⚙
          </button>
        </div>
      </div>

      {/* MAIN GAMEPLAY WORKSPACE: 3 COLUMNS */}
      <div
        className={`flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 overflow-y-auto z-40 ${
          is3DFullscreen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {/* LEFT COLUMN: SYSTEM VITALS (col-span-3) */}
        <div className="lg:col-span-3 flex flex-col gap-3 p-3.5 rounded-2xl border border-[#2b3347] bg-[#1a1d28]/95 shadow-md justify-between">
          <div className="space-y-3">
            {/* Vitals Header with Pulsing Status */}
            <div className="flex items-center justify-between border-b border-[#2c3347] pb-2">
              <span className="text-xs font-black tracking-wider text-gray-300 uppercase flex items-center gap-1.5">
                <FlameIllustration className="w-4 h-4 text-amber-400" />
                SYSTEM VITALS
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ACTIVE
              </span>
            </div>

            {/* CORE TEMPERATURE GAUGE */}
            <div className="p-3 rounded-xl bg-[#141620] border border-[#262c3d] space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 font-bold">CORE TEMP</span>
                <span
                  className={`font-black text-lg tabular-nums ${
                    inSurge ? 'text-red-400 animate-pulse' : inWarning ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {state.heat.toFixed(1)}°C
                </span>
              </div>

              {/* Graphical Temp Bar */}
              <div className="w-full h-4 bg-[#0d0f17] rounded-full border border-[#2c3347] overflow-hidden relative p-0.5">
                <div
                  className="h-full rounded-full transition-all duration-75 ease-out"
                  style={{
                    width: `${heatPercent}%`,
                    background:
                      state.heat >= 85.0
                        ? 'linear-gradient(90deg, #10b981 0%, #f59e0b 60%, #ef4444 85%, #dc2626 100%)'
                        : state.heat >= 70.0
                        ? 'linear-gradient(90deg, #10b981 0%, #f59e0b 100%)'
                        : 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                  }}
                />
                {/* Surge Marker Line */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-sm"
                  style={{ left: `${((surgeThreshold - 25) / 75) * 100}%` }}
                  title="Surge Threshold"
                />
              </div>

              {/* Thermal Surge Status Card */}
              <div
                className={`p-2 rounded-lg text-center text-xs font-bold transition-all border ${
                  inSurge
                    ? 'bg-red-950/80 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse'
                    : inWarning
                    ? 'bg-amber-950/60 text-amber-300 border-amber-600/50'
                    : 'bg-[#181c28] text-gray-400 border-[#262c3d]'
                }`}
              >
                {inSurge ? (
                  <div>
                    <div className="text-[11px] font-black text-red-300 tracking-wider">⚡ THERMAL SURGE ACTIVE ⚡</div>
                    <div className="text-sm font-extrabold text-white mt-0.5">{thermalMult.toFixed(2)}x PAYOUT</div>
                  </div>
                ) : inWarning ? (
                  <div>
                    <div className="text-[10px] text-amber-400 font-bold">WARNING BAND (70°C+)</div>
                    <div className="text-xs text-amber-200">1.25x Multiplier Active</div>
                  </div>
                ) : (
                  <div className="text-[11px] text-gray-400">
                    NOMINAL 1.0x • SURGE AT {surgeThreshold.toFixed(0)}°C
                  </div>
                )}
              </div>
            </div>

            {/* RAM BUFFER GAUGE */}
            <div className="p-3 rounded-xl bg-[#141620] border border-[#262c3d] space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 font-bold flex items-center gap-1">
                  <MemoryIllustration className="w-3.5 h-3.5 text-cyan-400" />
                  RAM BUFFER
                </span>
                <span
                  className={`font-black text-xs tabular-nums ${
                    state.isBufferStalled ? 'text-red-400 animate-pulse' : 'text-cyan-400'
                  }`}
                >
                  {state.ramUsedMB.toFixed(0)}/{state.ramMaxMB} MB ({ramPercent.toFixed(0)}%)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-[#0d0f17] rounded-full border border-[#2c3347] overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-75 ${
                    state.isBufferStalled
                      ? 'bg-red-500 animate-pulse'
                      : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500'
                  }`}
                  style={{ width: `${Math.min(100, ramPercent)}%` }}
                />
              </div>

              {state.isBufferStalled && (
                <div className="bg-red-950/90 border border-red-500 text-red-200 p-1.5 rounded-lg text-[11px] font-black text-center animate-pulse">
                  ⚠ RAM FULL — FLUSH CACHE NOW!
                </div>
              )}
            </div>

            {/* DAEMONS OVERVIEW */}
            <div className="p-3 rounded-xl bg-[#141620] border border-[#262c3d] space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 font-bold">DAEMONS</span>
                <button
                  onClick={onOpenDaemons}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-black uppercase underline"
                >
                  MANAGE
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {state.daemons.map((dId, idx) => {
                  const hasApp = dId !== 'none';
                  return (
                    <div
                      key={idx}
                      className={`p-1.5 rounded-lg border text-center text-[10px] font-bold ${
                        hasApp
                          ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-300'
                          : 'bg-[#1a1d28] border-[#2c3347] text-gray-500'
                      }`}
                    >
                      <div className="truncate">{hasApp ? dId : `Slot ${idx + 1}`}</div>
                      <div className="text-[9px] opacity-80">{hasApp ? 'RUNNING' : 'EMPTY'}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cryo Emergency Vent Button */}
          <div className="pt-2">
            <button
              disabled={state.emergencyVentCooldown > 0}
              onClick={onEmergencyVent}
              className={`w-full py-2.5 rounded-xl font-black text-xs border transition-all flex items-center justify-center gap-2 shadow-sm ${
                state.emergencyVentCooldown > 0
                  ? 'bg-[#181c28] border-[#2c3347] text-gray-500 cursor-not-allowed'
                  : state.heat >= 75
                  ? 'affordable-pulse bg-gradient-to-r from-sky-400 to-blue-500 text-black border-white shadow-[0_4px_0_#0284c7] active:translate-y-1 active:shadow-none'
                  : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-black border-sky-300 shadow-[0_4px_0_#0284c7] active:translate-y-1 active:shadow-none'
              }`}
            >
              <span>❄ CRYO VENT</span>
              {state.emergencyVentCooldown > 0 ? (
                <span className="tabular-nums font-mono text-[10px] text-gray-400">
                  ({state.emergencyVentCooldown.toFixed(0)}s)
                </span>
              ) : (
                <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded font-bold">READY</span>
              )}
            </button>
          </div>
        </div>

        {/* CENTER COLUMN: ROBLOX WORKLOAD & INTERACTION CORE (col-span-5) */}
        <div className="lg:col-span-5 flex flex-col gap-3 p-4 rounded-2xl border border-[#2b3347] bg-[#1a1d28]/95 shadow-md justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#2c3347] pb-2">
              <span className="text-xs font-black tracking-wider text-gray-300 uppercase">
                WORKLOAD EXECUTION CORE
              </span>
              <span className="text-[11px] font-bold text-gray-400">HOLD [SPACE] OR CLICK</span>
            </div>

            {/* UNBANKED VOLATILE CACHE CARD */}
            <div className="mt-3 p-4 rounded-2xl bg-gradient-to-b from-[#18212d] to-[#121922] border-2 border-cyan-500/30 text-center shadow-lg">
              <div className="text-[11px] uppercase tracking-widest text-cyan-400 font-black">
                VOLATILE CACHE (UNBANKED)
              </div>
              <div className="text-4xl sm:text-5xl font-black text-white mt-1 tabular-nums tracking-tight flex items-center justify-center gap-2">
                <span>{state.volatileBytes.toLocaleString()}</span>
                <span className="text-xl sm:text-2xl text-cyan-400">B</span>
              </div>
              <div className="text-xs font-bold text-gray-300 mt-2 flex justify-center items-center gap-3">
                <span className="bg-[#121a24] px-2.5 py-1 rounded-full border border-cyan-800/60">
                  Click: <strong className="text-emerald-400">+{nextYield} B</strong>
                </span>
                <span className="bg-[#121a24] px-2.5 py-1 rounded-full border border-amber-800/60">
                  Heat: <strong className="text-amber-400">+{nextHeatAdd.toFixed(2)}°C</strong>
                </span>
              </div>
            </div>
          </div>

          {/* MAIN 3D ROBLOX PROCESS BUTTON */}
          <div className="py-2">
            <button
              disabled={state.isBufferStalled || state.isFlushing}
              onMouseDown={() => {
                setIsProcessPressed(true);
                onProcessClick();
              }}
              onMouseUp={() => setIsProcessPressed(false)}
              className={`w-full py-8 sm:py-10 rounded-2xl font-black text-lg sm:text-2xl uppercase tracking-wider transition-all transform flex flex-col items-center justify-center cursor-pointer select-none ${
                state.isBufferStalled
                  ? 'bg-[#242938] border-2 border-red-700 text-red-400 shadow-none cursor-not-allowed opacity-90'
                  : state.isFlushing
                  ? 'bg-[#242938] border-2 border-gray-700 text-gray-500 shadow-none cursor-not-allowed'
                  : inSurge
                  ? 'bg-gradient-to-b from-red-500 to-rose-700 text-white border-2 border-rose-300 shadow-[0_8px_0_#9f1239] active:shadow-none active:translate-y-2 hover:brightness-110 animate-pulse'
                  : isProcessPressed
                  ? 'bg-[#00965e] text-white border-2 border-emerald-300 translate-y-2 shadow-none'
                  : 'bg-gradient-to-b from-[#00c97e] to-[#00a867] hover:from-[#00d686] hover:to-[#00b06f] text-white border-2 border-emerald-200 shadow-[0_8px_0_#007a4d] active:shadow-none active:translate-y-2 hover:brightness-105'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{state.isBufferStalled ? '⛔ RAM BUFFER LOCKED' : inSurge ? '⚡ OVERCLOCK SURGE' : '⚡ PROCESS WORKLOAD'}</span>
              </div>
              <span className="text-xs font-bold normal-case opacity-90 mt-1">
                {state.isBufferStalled
                  ? 'Flush cache to clear memory'
                  : inSurge
                  ? `Push redline for ${thermalMult.toFixed(2)}x rewards!`
                  : 'Click or hold Spacebar'}
              </span>
            </button>
          </div>

          {/* FLUSH CACHE BUTTON */}
          <div className="space-y-2">
            <button
              disabled={state.volatileBytes <= 0 || state.isFlushing}
              onMouseDown={onStartFlush}
              onMouseUp={onCancelFlush}
              className={`w-full py-3.5 rounded-xl font-black text-sm tracking-wide uppercase border-2 transition-all flex flex-col items-center justify-center select-none ${
                state.isFlushing
                  ? 'bg-blue-950 border-cyan-400 text-cyan-200 shadow-none'
                  : state.volatileBytes > 0
                  ? 'affordable-pulse bg-gradient-to-b from-[#0086ff] to-[#006bd6] hover:from-[#1a93ff] hover:to-[#0074e0] border-cyan-300 text-white shadow-[0_6px_0_#004fa3] active:translate-y-1.5 active:shadow-none'
                  : 'bg-[#181c28] border-[#2c3347] text-gray-600 cursor-not-allowed shadow-none'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{state.isFlushing ? 'TRANSFERRING...' : '💾 FLUSH CACHE TO BANK'}</span>
              </div>
              <span className="text-[11px] font-bold normal-case opacity-90 mt-0.5">
                Bank +{flushPayout.toLocaleString()} Bytes ({flushDuration.toFixed(1)}s) • Hold [F]
              </span>
            </button>

            {/* Flush Progress Bar */}
            {state.isFlushing && (
              <div className="w-full h-2.5 bg-[#0d0f17] rounded-full overflow-hidden border border-cyan-500/60 p-0.5">
                <div
                  className="h-full bg-cyan-400 rounded-full transition-all duration-75"
                  style={{ width: `${state.flushProgress * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: HARDWARE UPGRADE SHOP (col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-3 p-3.5 rounded-2xl border border-[#2b3347] bg-[#1a1d28]/95 shadow-md">
          {/* Shop Header */}
          <div className="flex items-center justify-between border-b border-[#2c3347] pb-2">
            <span className="text-xs font-black tracking-wider text-gray-300 uppercase">
              HARDWARE UPGRADES
            </span>
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-800">
              <RobuxIcon className="w-3.5 h-3.5" />
              <span>{state.bankedBytes.toLocaleString()} B</span>
            </div>
          </div>

          {/* Upgrade Cards List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {/* 1. CPU Clock Card */}
            <div
              className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                isCpuAffordable
                  ? 'affordable-pulse border-emerald-400/90 bg-emerald-950/30'
                  : 'border-[#2b3347] bg-[#141620]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <CpuIllustration className="w-9 h-9 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white truncate">CPU Clock</span>
                    <span className="text-[10px] bg-[#242938] px-1.5 py-0.2 rounded font-bold text-cyan-300">
                      Lvl {state.hardware.cpuLevel}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-emerald-400">
                    +2 B/clk
                  </div>
                </div>
              </div>

              <button
                disabled={!isCpuAffordable}
                onClick={() => onPurchaseUpgrade('cpu')}
                className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  isCpuAffordable
                    ? 'bg-[#00b06f] hover:bg-[#00c67d] text-white shadow-[0_4px_0_#007a4d] active:translate-y-1 active:shadow-none'
                    : 'bg-[#242938] text-gray-500 border border-[#333b50] cursor-not-allowed'
                }`}
              >
                <RobuxIcon className="w-3.5 h-3.5" />
                <span>{cpuCost.toLocaleString()}</span>
              </button>
            </div>

            {/* 2. RAM Stick Card */}
            <div
              className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                isRamAffordable
                  ? 'affordable-pulse border-emerald-400/90 bg-emerald-950/30'
                  : 'border-[#2b3347] bg-[#141620]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <RamIllustration className="w-9 h-9 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white truncate">RAM Buffer</span>
                    <span className="text-[10px] bg-[#242938] px-1.5 py-0.2 rounded font-bold text-purple-300">
                      Lvl {state.hardware.ramLevel}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-purple-400">
                    +64 MB Max
                  </div>
                </div>
              </div>

              <button
                disabled={!isRamAffordable}
                onClick={() => onPurchaseUpgrade('ram')}
                className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  isRamAffordable
                    ? 'bg-[#00b06f] hover:bg-[#00c67d] text-white shadow-[0_4px_0_#007a4d] active:translate-y-1 active:shadow-none'
                    : 'bg-[#242938] text-gray-500 border border-[#333b50] cursor-not-allowed'
                }`}
              >
                <RobuxIcon className="w-3.5 h-3.5" />
                <span>{ramCost.toLocaleString()}</span>
              </button>
            </div>

            {/* 3. Chassis Cooling Fan Card */}
            <div
              className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                isCoolingAffordable
                  ? 'affordable-pulse border-emerald-400/90 bg-emerald-950/30'
                  : 'border-[#2b3347] bg-[#141620]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <CoolerIllustration className="w-9 h-9 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white truncate">Chassis Fan</span>
                    <span className="text-[10px] bg-[#242938] px-1.5 py-0.2 rounded font-bold text-blue-300">
                      Lvl {state.hardware.coolingLevel}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-sky-400">
                    +1.8°/s Cool
                  </div>
                </div>
              </div>

              <button
                disabled={!isCoolingAffordable}
                onClick={() => onPurchaseUpgrade('cooling')}
                className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  isCoolingAffordable
                    ? 'bg-[#00b06f] hover:bg-[#00c67d] text-white shadow-[0_4px_0_#007a4d] active:translate-y-1 active:shadow-none'
                    : 'bg-[#242938] text-gray-500 border border-[#333b50] cursor-not-allowed'
                }`}
              >
                <RobuxIcon className="w-3.5 h-3.5" />
                <span>{coolingCost.toLocaleString()}</span>
              </button>
            </div>

            {/* 4. Bus Ribbon Buffer Card */}
            <div
              className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                isBusAffordable
                  ? 'affordable-pulse border-emerald-400/90 bg-emerald-950/30'
                  : 'border-[#2b3347] bg-[#141620]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <BusIllustration className="w-9 h-9 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white truncate">Bus Ribbon</span>
                    <span className="text-[10px] bg-[#242938] px-1.5 py-0.2 rounded font-bold text-amber-300">
                      Lvl {state.hardware.busLevel}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-amber-400">
                    -0.1s Flush Time
                  </div>
                </div>
              </div>

              <button
                disabled={!isBusAffordable}
                onClick={() => onPurchaseUpgrade('bus')}
                className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  isBusAffordable
                    ? 'bg-[#00b06f] hover:bg-[#00c67d] text-white shadow-[0_4px_0_#007a4d] active:translate-y-1 active:shadow-none'
                    : 'bg-[#242938] text-gray-500 border border-[#333b50] cursor-not-allowed'
                }`}
              >
                <RobuxIcon className="w-3.5 h-3.5" />
                <span>{busCost.toLocaleString()}</span>
              </button>
            </div>

            {/* 5. Thermal Paste Syringe Card */}
            <div
              className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                isPasteAffordable
                  ? 'affordable-pulse border-emerald-400/90 bg-emerald-950/30'
                  : 'border-[#2b3347] bg-[#141620]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <PasteIllustration className="w-9 h-9 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white truncate">Thermal Paste</span>
                    <span className="text-[10px] bg-[#242938] px-1.5 py-0.2 rounded font-bold text-rose-300">
                      Lvl {state.hardware.thermalPasteLevel}/5
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-rose-400">
                    -5% Heat Gen
                  </div>
                </div>
              </div>

              {pasteCost !== null ? (
                <button
                  disabled={!isPasteAffordable}
                  onClick={() => onPurchaseUpgrade('paste')}
                  className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    isPasteAffordable
                      ? 'bg-[#00b06f] hover:bg-[#00c67d] text-white shadow-[0_4px_0_#007a4d] active:translate-y-1 active:shadow-none'
                      : 'bg-[#242938] text-gray-500 border border-[#333b50] cursor-not-allowed'
                  }`}
                >
                  <RobuxIcon className="w-3.5 h-3.5" />
                  <span>{pasteCost.toLocaleString()}</span>
                </button>
              ) : (
                <span className="text-[11px] text-gray-500 font-black px-3 py-2 bg-[#181c28] rounded-xl border border-[#2c3347]">
                  MAXED
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ROBLOX DOCK / ACTION BAR */}
      <div
        className={`h-14 px-4 border-t border-[#2b3347] bg-[#1a1d28]/95 flex items-center justify-between z-40 text-xs ${
          is3DFullscreen ? 'pointer-events-auto bg-[#1a1d28]' : ''
        }`}
      >
        {/* Navigation Tabs with Roblox Chunky Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {/* Prestige Button */}
          <button
            onClick={onOpenPrestige}
            className={`px-3 py-2 rounded-xl font-black text-xs transition-all whitespace-nowrap ${
              state.osLevel >= 10
                ? 'affordable-pulse bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-[0_4px_0_#b45309] active:translate-y-1 active:shadow-none'
                : 'bg-[#242938] text-gray-500 border border-[#333b50] hover:text-gray-300'
            }`}
          >
            ★ PRESTIGE {state.osLevel >= 10 ? '(READY)' : '(L10)'}
          </button>

          {/* Season Pass */}
          <button
            onClick={onOpenSeasonPass}
            className="px-3 py-2 bg-gradient-to-r from-[#17382d] to-[#164434] hover:from-[#1d4739] hover:to-[#1c5541] text-emerald-300 border border-emerald-500/50 rounded-xl font-black text-xs whitespace-nowrap shadow-sm active:translate-y-0.5"
          >
            🏆 SEASON 1
          </button>

          {/* Hardware Vault */}
          <button
            onClick={onOpenVault}
            className="px-3 py-2 bg-[#242938] hover:bg-[#2d3447] text-purple-300 border border-purple-800/60 rounded-xl font-black text-xs whitespace-nowrap shadow-sm active:translate-y-0.5"
          >
            📦 VAULT
          </button>

          {/* Factions */}
          <button
            onClick={onOpenFactions}
            className="px-3 py-2 bg-[#242938] hover:bg-[#2d3447] text-cyan-300 border border-cyan-800/60 rounded-xl font-black text-xs whitespace-nowrap shadow-sm active:translate-y-0.5"
          >
            🏢 FACTIONS
          </button>

          {/* Singularity Project */}
          <button
            onClick={onOpenSingularity}
            className="px-3 py-2 bg-[#242938] hover:bg-[#2d3447] text-fuchsia-300 border border-fuchsia-800/60 rounded-xl font-black text-xs whitespace-nowrap shadow-sm active:translate-y-0.5"
          >
            🌌 SINGULARITY
          </button>

          {/* Daemons */}
          <button
            onClick={onOpenDaemons}
            className="px-3 py-2 bg-[#242938] hover:bg-[#2d3447] text-emerald-300 border border-[#333b50] rounded-xl font-black text-xs whitespace-nowrap shadow-sm active:translate-y-0.5"
          >
            ⚙ DAEMONS
          </button>

          {/* Bounties & Daily Missions */}
          <button
            onClick={onOpenBounties}
            className="px-3 py-2 bg-[#242938] hover:bg-[#2d3447] text-amber-300 border border-[#333b50] rounded-xl font-black text-xs whitespace-nowrap shadow-sm active:translate-y-0.5"
          >
            🎯 BOUNTIES
          </button>

          {/* Roblox Studio Export */}
          <button
            onClick={onOpenRobloxExport}
            className="px-3 py-2 bg-red-950/70 hover:bg-red-900 text-red-200 border border-red-700/80 rounded-xl font-black text-xs flex items-center gap-1.5 whitespace-nowrap shadow-sm active:translate-y-0.5"
          >
            <RobloxLogo className="w-3.5 h-3.5 text-red-400" />
            LUAU
          </button>
        </div>

        {/* Right Status Summary */}
        <div className="hidden md:flex items-center gap-3 text-xs font-bold text-gray-400">
          <span>CRASHES: <strong className="text-red-400">{state.totalCrashes}</strong></span>
          <span className="text-gray-600">·</span>
          <span>FLUSHES: <strong className="text-emerald-400">{state.successfulFlushes}</strong></span>
        </div>
      </div>
    </div>
  );
};
