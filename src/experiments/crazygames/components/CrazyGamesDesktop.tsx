import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { DepthOSState } from '../../../types/depthos';
import { audio } from '../../../audio/depthosAudio';
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
  CRITICAL_TEMP,
} from '../../../game/simulation';
import { FloatingRewardItem, ArcadeObjective, OnboardingStage } from '../types';
import { FloatingNumberFx } from './FloatingNumberFx';
import { FirstMinuteObjectiveBar } from './FirstMinuteObjectiveBar';
import { CrazyGamesOnboardingOverlay } from './CrazyGamesOnboardingOverlay';

interface CrazyGamesDesktopProps {
  state: DepthOSState;
  onProcessClick: () => void;
  onStartFlush: () => void;
  onCancelFlush: () => void;
  onEmergencyVent: () => void;
  onPurchaseUpgrade: (type: 'cpu' | 'ram' | 'cooling' | 'bus' | 'paste') => void;
  onToggle3DView?: () => void;
  is3DActive?: boolean;
}

export const CrazyGamesDesktop: React.FC<CrazyGamesDesktopProps> = ({
  state,
  onProcessClick,
  onStartFlush,
  onCancelFlush,
  onEmergencyVent,
  onPurchaseUpgrade,
  onToggle3DView,
  is3DActive,
}) => {
  const [floatingItems, setFloatingItems] = useState<FloatingRewardItem[]>([]);
  const [isProcessActive, setIsProcessActive] = useState<boolean>(false);
  const nextIdRef = useRef<number>(1);

  // 4 Core First-Minute Micro-Missions
  const [objectives, setObjectives] = useState<ArcadeObjective[]>([
    {
      id: 'obj_mine',
      title: '1. Mine Volatile Bytes',
      description: 'Click processor core or tap [SPACE] 15 times',
      current: 0,
      target: 15,
      rewardBytes: 50,
      completed: false,
      claimed: false,
    },
    {
      id: 'obj_flush',
      title: '2. Bank Your Cash',
      description: 'Hold [F] or click Flush to bank at least $25',
      current: 0,
      target: 25,
      rewardBytes: 150,
      completed: false,
      claimed: false,
    },
    {
      id: 'obj_upgrade',
      title: '3. Upgrade Hardware',
      description: 'Purchase your first CPU upgrade in the shop',
      current: Math.max(0, state.hardware.cpuLevel - 1),
      target: 1,
      rewardBytes: 300,
      completed: state.hardware.cpuLevel > 1,
      claimed: false,
    },
    {
      id: 'obj_surge',
      title: '4. Ride Thermal Surge',
      description: 'Push CPU heat to 85°C for explosive 3x-10x multipliers',
      current: Math.round(state.heat),
      target: 85,
      rewardBytes: 1000,
      completed: state.heat >= 85,
      claimed: false,
    },
  ]);

  const [currentObjIndex, setCurrentObjIndex] = useState<number>(0);

  // Guided Coachmarks (remembers completion)
  const [onboardingStage, setOnboardingStage] = useState<OnboardingStage>(() => {
    try {
      if (localStorage.getItem('depthos_cg_onboarding_v2') === 'done') {
        return 'completed';
      }
    } catch {}
    return 'click_to_mine';
  });

  // Track objectives progress based on state changes
  useEffect(() => {
    setObjectives((prev) => {
      return prev.map((obj) => {
        if (obj.id === 'obj_flush') {
          const current = Math.min(obj.target, state.bankedBytes);
          return {
            ...obj,
            current,
            completed: current >= obj.target,
          };
        }
        if (obj.id === 'obj_upgrade') {
          const current = Math.max(0, state.hardware.cpuLevel - 1);
          return {
            ...obj,
            current,
            completed: current >= obj.target,
          };
        }
        if (obj.id === 'obj_surge') {
          const current = Math.min(obj.target, Math.round(state.heat));
          return {
            ...obj,
            current,
            completed: state.heat >= 85,
          };
        }
        return obj;
      });
    });
  }, [state.bankedBytes, state.hardware.cpuLevel, state.heat]);

  // Calculations
  const surgeThreshold = getSurgeThreshold(state.rootTree);
  const inSurge = state.heat >= surgeThreshold && state.heat < CRITICAL_TEMP && !state.isBSOD;
  const thermalMult = calculateThermalMultiplier(state.heat, state.rootTree, state.faction);
  const bytesPerClick = calculateBytesPerProcess(state);
  const heatPerClick = calculateHeatPerProcess(state);
  const flushDuration = calculateFlushDuration(state);
  const potentialPayout = calculateFlushPayout(state);

  // Hardware Upgrade Costs
  const cpuCost = getCpuUpgradeCost(state.hardware.cpuLevel);
  const ramCost = getRamUpgradeCost(state.hardware.ramLevel);
  const coolingCost = getCoolingUpgradeCost(state.hardware.coolingLevel);
  const busCost = getBusUpgradeCost(state.hardware.busLevel);
  const pasteCost = getThermalPasteCost(state.hardware.thermalPasteLevel);

  // Handle Mining Core Click
  const handleProcess = (e?: React.MouseEvent) => {
    if (state.isBufferStalled || state.isFlushing || state.isBSOD) return;
    onProcessClick();
    setIsProcessActive(true);
    setTimeout(() => setIsProcessActive(false), 70);

    // Increment click mission
    setObjectives((prev) =>
      prev.map((obj) => {
        if (obj.id === 'obj_mine' && !obj.completed) {
          const nextVal = obj.current + 1;
          return {
            ...obj,
            current: nextVal,
            completed: nextVal >= obj.target,
          };
        }
        return obj;
      })
    );

    // Advance onboarding
    if (onboardingStage === 'click_to_mine') {
      setOnboardingStage('watch_heat');
    }

    // Spawn floating number with kinetic spring physics
    const x = e ? e.clientX : window.innerWidth / 2;
    const y = e ? e.clientY - 25 : window.innerHeight / 2 - 40;
    const id = nextIdRef.current++;
    const newItem: FloatingRewardItem = {
      id,
      x: x + (Math.random() * 40 - 20),
      y: y + (Math.random() * 20 - 10),
      text: inSurge ? `+${bytesPerClick} (${thermalMult.toFixed(1)}x SURGE)` : `+${bytesPerClick}`,
      color: inSurge ? '#f59e0b' : '#38bdf8',
      scale: inSurge ? 1.35 : 1.05,
      isSurge: inSurge,
    };

    setFloatingItems((prev) => [...prev.slice(-7), newItem]);
    setTimeout(() => {
      setFloatingItems((prev) => prev.filter((item) => item.id !== id));
    }, 850);
  };

  const handleClaimActiveObjective = () => {
    const cur = objectives[currentObjIndex];
    if (!cur || !cur.completed || cur.claimed) return;

    audio.ensureContext();
    audio.playUpgradeSound();
    try {
      confetti({
        particleCount: 50,
        spread: 75,
        origin: { y: 0.15 },
        colors: ['#00ff88', '#00e5ff', '#ffdd00'],
      });
    } catch {}

    setObjectives((prev) =>
      prev.map((obj, i) => (i === currentObjIndex ? { ...obj, claimed: true } : obj))
    );

    // Credit bonus money directly
    state.bankedBytes += cur.rewardBytes;

    // Spawn celebration popup
    const id = nextIdRef.current++;
    setFloatingItems((prev) => [
      ...prev.slice(-6),
      {
        id,
        x: window.innerWidth / 2,
        y: 120,
        text: `★ +$${cur.rewardBytes} CASH CLAIMED!`,
        color: '#10b981',
        scale: 1.5,
        isSurge: true,
      },
    ]);
    setTimeout(() => {
      setFloatingItems((prev) => prev.filter((item) => item.id !== id));
    }, 1200);

    // Advance to next mission
    if (currentObjIndex < objectives.length - 1) {
      setCurrentObjIndex((prev) => prev + 1);
    }
  };

  const handleSkipOnboarding = () => {
    setOnboardingStage('completed');
    try {
      localStorage.setItem('depthos_cg_onboarding_v2', 'done');
    } catch {}
  };

  const handleAdvanceOnboarding = () => {
    if (onboardingStage === 'click_to_mine') setOnboardingStage('watch_heat');
    else if (onboardingStage === 'watch_heat') setOnboardingStage('flush_cash');
    else if (onboardingStage === 'flush_cash') setOnboardingStage('buy_upgrade');
    else handleSkipOnboarding();
  };

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between font-mono select-none overflow-hidden bg-[#050913] text-gray-200 ${
        inSurge ? 'surgeShake' : ''
      }`}
    >
      {/* Floating Damage / Reward Numbers Layer */}
      <FloatingNumberFx items={floatingItems} />

      {/* Top Arcade Mission Banner */}
      <FirstMinuteObjectiveBar
        objective={objectives[currentObjIndex] || null}
        stepIndex={currentObjIndex}
        totalSteps={objectives.length}
        onClaim={handleClaimActiveObjective}
      />

      {/* Main Arcade Cockpit Layout */}
      <div className="flex-1 p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 overflow-y-auto">
        {/* Left Column: Banked & Volatile Cash + Thermal Redline Gauge */}
        <div className="lg:col-span-4 flex flex-col gap-3 sm:gap-4">
          {/* Banked Capital Card */}
          <div className="bg-[#0b1220]/95 border-2 border-emerald-500/40 rounded-2xl p-4 shadow-xl backdrop-blur-md">
            <div className="flex justify-between items-center text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
              <span>Secure Banked Cash</span>
              <span className="text-emerald-400 font-black">● 100% PROTECTED</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight flex items-baseline gap-2">
              <span>${state.bankedBytes.toLocaleString()}</span>
            </div>

            {/* Volatile Cash Alert */}
            <div className="mt-3 pt-3 border-t border-gray-800/80 flex justify-between items-center">
              <div>
                <span className="text-xs text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Volatile Cash (At Risk)</span>
                </span>
                <span className="text-2xl font-black text-amber-300">
                  ${state.volatileBytes.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 uppercase block">RAM Buffer</span>
                <span
                  className={`text-xs font-bold ${
                    state.isBufferStalled ? 'text-red-400 font-black animate-pulse' : 'text-gray-300'
                  }`}
                >
                  {Math.round(state.ramUsedMB)} / {state.ramMaxMB} MB
                </span>
              </div>
            </div>
          </div>

          {/* Labeled Thermal Redline Gauge */}
          <div
            className={`border-2 rounded-2xl p-4 transition-all duration-200 backdrop-blur-md shadow-xl ${
              inSurge
                ? 'bg-red-950/60 border-red-500 shadow-[0_0_35px_rgba(239,68,68,0.5)] ring-2 ring-red-400/50'
                : 'bg-[#0b1220]/95 border-cyan-500/40'
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    inSurge ? 'bg-red-500 animate-ping' : 'bg-cyan-400'
                  }`}
                />
                <span className="text-white font-black">CPU TEMPERATURE</span>
              </span>
              <span
                className={`text-2xl sm:text-3xl font-black tabular-nums ${
                  inSurge ? 'text-red-400 animate-pulse' : 'text-cyan-300'
                }`}
              >
                {state.heat.toFixed(1)}°C
              </span>
            </div>

            {/* Segmented Thermal Bar with Explicit Labeled Zones */}
            <div className="w-full bg-black/80 border border-gray-700 h-5 rounded-xl overflow-hidden relative shadow-inner">
              <div
                className={`h-full transition-all duration-100 ${
                  inSurge
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 shadow-[0_0_15px_rgba(239,68,68,0.9)]'
                    : state.heat > 60
                    ? 'bg-gradient-to-r from-cyan-400 to-amber-400'
                    : 'bg-cyan-500'
                }`}
                style={{ width: `${Math.min(100, (state.heat / CRITICAL_TEMP) * 100)}%` }}
              />
              {/* Surge Threshold Marker (85°C) */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-yellow-400 z-10 shadow-[0_0_8px_rgba(250,204,21,1)]"
                style={{ left: `${(surgeThreshold / CRITICAL_TEMP) * 100}%` }}
              />
            </div>

            {/* Zone Legend */}
            <div className="mt-2.5 flex justify-between text-[10px] sm:text-[11px] font-bold text-gray-400">
              <span className="text-cyan-400">SAFE (1x)</span>
              <span className="text-amber-400">WARM</span>
              <span className="text-red-400 flex items-center gap-1">
                <span>🔥 85°C SURGE (10X)</span>
              </span>
              <span className="text-red-500 font-black">100°C 💀</span>
            </div>

            {/* Surge Status Banner */}
            <div
              className={`mt-3 py-1.5 px-3 rounded-lg flex justify-between items-center text-xs font-bold ${
                inSurge
                  ? 'bg-gradient-to-r from-amber-500 to-red-600 text-black font-black animate-pulse shadow-lg'
                  : 'bg-black/50 text-gray-300 border border-gray-800'
              }`}
            >
              <span>{inSurge ? '🔥 THERMAL SURGE ACTIVE!' : 'SURGE MULTIPLIER:'}</span>
              <span className="text-sm">{thermalMult.toFixed(1)}X CASH</span>
            </div>

            {/* Emergency Vent Button */}
            <button
              onClick={onEmergencyVent}
              className="w-full mt-3 py-2.5 bg-blue-950/80 hover:bg-blue-900 border border-blue-400 text-blue-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
            >
              <span>❄ CRYO VENT HEAT (-15°C)</span>
              <span className="text-[10px] bg-black/50 px-2 py-0.5 rounded text-gray-300 font-mono">
                [SPACE + E]
              </span>
            </button>
          </div>
        </div>

        {/* Center Column: Big Tactile Action Core (Process & Flush) */}
        <div className="lg:col-span-5 flex flex-col justify-center items-center gap-4 sm:gap-6">
          {/* Surge Warning Prompt */}
          {inSurge && (
            <div className="w-full max-w-sm py-2 px-3 bg-red-950/80 border-2 border-red-500 text-red-200 text-center text-xs font-black uppercase rounded-xl animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]">
              ⚠️ SURGE MULTIPLIER ACTIVE! HOLD [F] BEFORE 100°C MELTDOWN!
            </div>
          )}

          {/* Primary Action Button: Process Bytes Core */}
          <div className="w-full flex flex-col items-center">
            <button
              onClick={handleProcess}
              disabled={state.isBufferStalled || state.isFlushing || state.isBSOD}
              className={`w-full max-w-sm aspect-square sm:aspect-[4/3] rounded-3xl flex flex-col items-center justify-center p-6 border-4 transition-all duration-100 transform active:scale-90 ${
                state.isBufferStalled
                  ? 'bg-amber-950/90 border-amber-500 text-amber-200 shadow-[0_0_40px_rgba(245,158,11,0.6)] animate-pulse'
                  : state.isFlushing
                  ? 'bg-cyan-950/60 border-cyan-700 text-cyan-300 cursor-wait'
                  : inSurge
                  ? 'bg-gradient-to-br from-amber-600/40 via-red-900/60 to-black border-amber-400 text-amber-200 shadow-[0_0_60px_rgba(251,191,36,0.7)] hover:scale-102 ring-4 ring-amber-400/40'
                  : isProcessActive
                  ? 'bg-cyan-400/30 border-cyan-200 text-white scale-95 shadow-[0_0_35px_rgba(6,182,212,0.8)]'
                  : 'bg-[#0f1b32] hover:bg-[#162747] border-cyan-400 text-white shadow-[0_0_35px_rgba(6,182,212,0.3)] hover:scale-102'
              }`}
            >
              <div className="text-5xl sm:text-6xl mb-2">
                {state.isBufferStalled ? '⚠️' : inSurge ? '🔥' : '⚡'}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-center">
                {state.isBufferStalled
                  ? 'RAM FULL! FLUSH NOW'
                  : state.isFlushing
                  ? 'BANKING CASH...'
                  : 'MINE BYTES'}
              </h2>
              <span className="text-xs sm:text-sm text-cyan-300 font-black mt-1">
                {state.isBufferStalled
                  ? 'Hold [F] below to dump RAM into Bank!'
                  : `+${bytesPerClick} Bytes / +${heatPerClick.toFixed(1)}°C per Click`}
              </span>
              <span className="mt-3 text-[11px] font-mono bg-black/70 px-4 py-1 rounded-full border border-white/20 text-gray-200 font-bold">
                TAP [SPACE] OR CLICK
              </span>
            </button>
          </div>

          {/* Secondary Action Button: Flush Cache to Bank */}
          <div className="w-full max-w-sm">
            <button
              onMouseDown={onStartFlush}
              onMouseUp={onCancelFlush}
              onMouseLeave={onCancelFlush}
              onTouchStart={onStartFlush}
              onTouchEnd={onCancelFlush}
              disabled={state.volatileBytes === 0 || state.isBSOD}
              className={`w-full py-4 px-6 rounded-2xl border-2 font-black text-sm uppercase tracking-wider flex items-center justify-between transition-all active:scale-95 ${
                state.isFlushing
                  ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-black border-white shadow-[0_0_35px_rgba(16,185,129,0.9)] animate-pulse'
                  : state.isBufferStalled
                  ? 'bg-emerald-500 text-black border-emerald-300 animate-bounce shadow-[0_0_30px_rgba(16,185,129,0.9)] ring-4 ring-emerald-300'
                  : state.volatileBytes > 0
                  ? 'bg-emerald-950/90 hover:bg-emerald-900 border-emerald-500 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                  : 'bg-gray-900/60 border-gray-800 text-gray-600 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">💰</span>
                <span className="text-sm font-black">
                  {state.isFlushing ? 'TRANSFERRING CASH...' : 'HOLD [F] TO BANK PROFIT'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-black block">+${potentialPayout}</span>
                <span className="text-[10px] text-gray-400 font-normal">[{flushDuration.toFixed(1)}s]</span>
              </div>
            </button>
          </div>
        </div>

        {/* Right Column: Hardware Upgrade Rack */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="flex justify-between items-center pb-2 border-b border-gray-800">
            <span className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <span>HARDWARE UPGRADES</span>
            </span>
            {onToggle3DView && (
              <button
                onClick={onToggle3DView}
                className="text-[11px] px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg border border-gray-600 transition-colors font-bold"
              >
                {is3DActive ? '🖥 DESK' : '🎮 3D RIG'}
              </button>
            )}
          </div>

          {/* Upgrade Card: CPU */}
          <div
            className={`bg-[#0b1220]/95 border-2 rounded-2xl p-3 flex items-center justify-between transition-all ${
              state.bankedBytes >= cpuCost
                ? 'border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'border-gray-800'
            }`}
          >
            <div>
              <div className="text-xs font-black text-white flex items-center gap-1.5">
                <span>CPU Processor</span>
                <span className="text-[10px] text-cyan-400 font-bold">Lv.{state.hardware.cpuLevel}</span>
              </div>
              <span className="text-[11px] text-emerald-400 block mt-0.5 font-bold">
                +2 Bytes/Click (Next: Lv.{state.hardware.cpuLevel + 1})
              </span>
            </div>
            <button
              onClick={() => onPurchaseUpgrade('cpu')}
              disabled={state.bankedBytes < cpuCost}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                state.bankedBytes >= cpuCost
                  ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-black shadow-lg active:scale-90 animate-pulse'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              ${cpuCost}
            </button>
          </div>

          {/* Upgrade Card: RAM */}
          <div
            className={`bg-[#0b1220]/95 border-2 rounded-2xl p-3 flex items-center justify-between transition-all ${
              state.bankedBytes >= ramCost
                ? 'border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'border-gray-800'
            }`}
          >
            <div>
              <div className="text-xs font-black text-white flex items-center gap-1.5">
                <span>RAM Buffer</span>
                <span className="text-[10px] text-cyan-400 font-bold">Lv.{state.hardware.ramLevel}</span>
              </div>
              <span className="text-[11px] text-cyan-400 block mt-0.5 font-bold">
                +64MB Buffer (Mine Longer)
              </span>
            </div>
            <button
              onClick={() => onPurchaseUpgrade('ram')}
              disabled={state.bankedBytes < ramCost}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                state.bankedBytes >= ramCost
                  ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-black shadow-lg active:scale-90 animate-pulse'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              ${ramCost}
            </button>
          </div>

          {/* Upgrade Card: Cooling */}
          <div
            className={`bg-[#0b1220]/95 border-2 rounded-2xl p-3 flex items-center justify-between transition-all ${
              state.bankedBytes >= coolingCost
                ? 'border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'border-gray-800'
            }`}
          >
            <div>
              <div className="text-xs font-black text-white flex items-center gap-1.5">
                <span>Cooling Fans</span>
                <span className="text-[10px] text-cyan-400 font-bold">Lv.{state.hardware.coolingLevel}</span>
              </div>
              <span className="text-[11px] text-blue-400 block mt-0.5 font-bold">
                +1.8°C/s Heat Dissipation
              </span>
            </div>
            <button
              onClick={() => onPurchaseUpgrade('cooling')}
              disabled={state.bankedBytes < coolingCost}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                state.bankedBytes >= coolingCost
                  ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-black shadow-lg active:scale-90 animate-pulse'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              ${coolingCost}
            </button>
          </div>

          {/* Upgrade Card: PCIe Bus */}
          <div
            className={`bg-[#0b1220]/95 border-2 rounded-2xl p-3 flex items-center justify-between transition-all ${
              state.bankedBytes >= busCost
                ? 'border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'border-gray-800'
            }`}
          >
            <div>
              <div className="text-xs font-black text-white flex items-center gap-1.5">
                <span>PCIe Bus</span>
                <span className="text-[10px] text-cyan-400 font-bold">Lv.{state.hardware.busLevel}</span>
              </div>
              <span className="text-[11px] text-purple-400 block mt-0.5 font-bold">
                +Fast Flush Transfer
              </span>
            </div>
            <button
              onClick={() => onPurchaseUpgrade('bus')}
              disabled={state.bankedBytes < busCost}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                state.bankedBytes >= busCost
                  ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-black shadow-lg active:scale-90 animate-pulse'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              ${busCost}
            </button>
          </div>
        </div>
      </div>

      {/* Guided Coachmarks */}
      <CrazyGamesOnboardingOverlay
        currentStage={onboardingStage}
        onAdvance={handleAdvanceOnboarding}
        onSkip={handleSkipOnboarding}
      />
    </div>
  );
};
