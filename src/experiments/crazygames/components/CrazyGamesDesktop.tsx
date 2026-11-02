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

  // Arcade Objectives for first 60 seconds
  const [objectives, setObjectives] = useState<ArcadeObjective[]>([
    {
      id: 'obj_mine',
      title: '1. Mine Raw Bytes',
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
      description: 'Hold [F] or click Flush to bank at least 25 bytes',
      current: 0,
      target: 25,
      rewardBytes: 150,
      completed: false,
      claimed: false,
    },
    {
      id: 'obj_upgrade',
      title: '3. Upgrade Hardware',
      description: 'Purchase your first CPU Core upgrade in the shop',
      current: state.hardware.cpuLevel - 1,
      target: 1,
      rewardBytes: 300,
      completed: state.hardware.cpuLevel > 1,
      claimed: false,
    },
    {
      id: 'obj_surge',
      title: '4. Ride Thermal Surge',
      description: 'Reach 85°C to activate the 3x-10x multiplier zone',
      current: Math.round(state.heat),
      target: 85,
      rewardBytes: 1000,
      completed: state.heat >= 85,
      claimed: false,
    },
  ]);

  const [currentObjIndex, setCurrentObjIndex] = useState<number>(0);

  // Guided Onboarding Stage
  const [onboardingStage, setOnboardingStage] = useState<OnboardingStage>(() => {
    try {
      if (localStorage.getItem('depthos_cg_onboarding_v1') === 'done') {
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

  // Costs
  const cpuCost = getCpuUpgradeCost(state.hardware.cpuLevel);
  const ramCost = getRamUpgradeCost(state.hardware.ramLevel);
  const coolingCost = getCoolingUpgradeCost(state.hardware.coolingLevel);
  const busCost = getBusUpgradeCost(state.hardware.busLevel);
  const pasteCost = getThermalPasteCost(state.hardware.thermalPasteLevel);

  // Trigger floating reward numbers on action
  const handleProcess = (e?: React.MouseEvent) => {
    if (state.isBufferStalled || state.isFlushing || state.isBSOD) return;
    onProcessClick();
    setIsProcessActive(true);
    setTimeout(() => setIsProcessActive(false), 80);

    // Increment click objective
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

    // Onboarding advance
    if (onboardingStage === 'click_to_mine') {
      setOnboardingStage('watch_heat');
    }

    // Spawn floating number
    const x = e ? e.clientX : window.innerWidth / 2;
    const y = e ? e.clientY - 20 : window.innerHeight / 2 - 40;
    const id = nextIdRef.current++;
    const newItem: FloatingRewardItem = {
      id,
      x: x + (Math.random() * 40 - 20),
      y: y + (Math.random() * 20 - 10),
      text: inSurge ? `+${bytesPerClick} (${thermalMult.toFixed(1)}x)` : `+${bytesPerClick}`,
      color: inSurge ? '#fbbf24' : '#22d3ee',
      scale: inSurge ? 1.3 : 1.0,
      isSurge: inSurge,
    };

    setFloatingItems((prev) => [...prev.slice(-8), newItem]);
    setTimeout(() => {
      setFloatingItems((prev) => prev.filter((item) => item.id !== id));
    }, 800);
  };

  const handleClaimActiveObjective = () => {
    const cur = objectives[currentObjIndex];
    if (!cur || !cur.completed || cur.claimed) return;

    audio.ensureContext();
    audio.playUpgradeSound();
    try {
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.15 },
        colors: ['#00ff88', '#00e5ff', '#ffdd00'],
      });
    } catch {}

    setObjectives((prev) =>
      prev.map((obj, i) => (i === currentObjIndex ? { ...obj, claimed: true } : obj))
    );

    // Give bonus bytes
    state.bankedBytes += cur.rewardBytes;

    // Spawn reward notification popup
    const id = nextIdRef.current++;
    setFloatingItems((prev) => [
      ...prev.slice(-6),
      {
        id,
        x: window.innerWidth / 2,
        y: 100,
        text: `★ +${cur.rewardBytes} BONUS BYTES CLAIMED!`,
        color: '#10b981',
        scale: 1.4,
        isSurge: true,
      },
    ]);
    setTimeout(() => {
      setFloatingItems((prev) => prev.filter((item) => item.id !== id));
    }, 1200);

    // Advance to next objective
    if (currentObjIndex < objectives.length - 1) {
      setCurrentObjIndex((prev) => prev + 1);
    }
  };

  const handleSkipOnboarding = () => {
    setOnboardingStage('completed');
    try {
      localStorage.setItem('depthos_cg_onboarding_v1', 'done');
    } catch {}
  };

  const handleAdvanceOnboarding = () => {
    if (onboardingStage === 'click_to_mine') setOnboardingStage('watch_heat');
    else if (onboardingStage === 'watch_heat') setOnboardingStage('flush_cash');
    else if (onboardingStage === 'flush_cash') setOnboardingStage('buy_upgrade');
    else handleSkipOnboarding();
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between font-mono select-none overflow-hidden bg-[#070b12] text-gray-200">
      {/* Floating Damage / Reward Numbers Layer */}
      <FloatingNumberFx items={floatingItems} />

      {/* Top Arcade Objective Banner */}
      <FirstMinuteObjectiveBar
        objective={objectives[currentObjIndex] || null}
        stepIndex={currentObjIndex}
        totalSteps={objectives.length}
        onClaim={handleClaimActiveObjective}
      />

      {/* Main Arcade HUD Matrix */}
      <div className="flex-1 p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 overflow-y-auto">
        {/* Left Column: Core Resources & Thermal Redline Gauge */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Banked & Volatile Cash Cards */}
          <div className="bg-[#0e1626]/90 border border-cyan-500/30 rounded-xl p-4 shadow-lg backdrop-blur-md">
            <div className="flex justify-between items-center text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
              <span>Banked Capital</span>
              <span className="text-emerald-400">SECURE</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight flex items-baseline gap-2">
              <span>${state.bankedBytes.toLocaleString()}</span>
              <span className="text-xs text-emerald-300 font-normal">BYTES</span>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-800 flex justify-between items-center">
              <div>
                <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block">
                  Volatile Bytes (At Risk)
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-300">
                  {state.volatileBytes.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 uppercase block">RAM Capacity</span>
                <span className="text-xs font-bold text-gray-200">
                  {Math.round(state.ramUsedMB)} / {state.ramMaxMB} MB
                </span>
              </div>
            </div>
          </div>

          {/* Thermal Meter with Surge Callout */}
          <div
            className={`border rounded-xl p-4 transition-all duration-300 backdrop-blur-md ${
              inSurge
                ? 'bg-red-950/40 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.4)]'
                : 'bg-[#0e1626]/90 border-cyan-500/30'
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    inSurge ? 'bg-red-500 animate-ping' : 'bg-cyan-400'
                  }`}
                />
                <span>CPU Temperature</span>
              </span>
              <span
                className={`text-2xl font-black ${
                  inSurge ? 'text-red-400 animate-pulse' : 'text-cyan-300'
                }`}
              >
                {state.heat.toFixed(1)}°C
              </span>
            </div>

            {/* Segmented Heat Bar */}
            <div className="w-full bg-gray-900 border border-gray-700 h-4 rounded-lg overflow-hidden relative">
              <div
                className={`h-full transition-all duration-100 ${
                  inSurge
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500'
                    : state.heat > 60
                    ? 'bg-gradient-to-r from-cyan-400 to-amber-400'
                    : 'bg-cyan-500'
                }`}
                style={{ width: `${Math.min(100, (state.heat / CRITICAL_TEMP) * 100)}%` }}
              />
              {/* Surge Threshold Marker */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-10"
                style={{ left: `${(surgeThreshold / CRITICAL_TEMP) * 100}%` }}
                title="85°C Surge Threshold"
              />
            </div>

            {/* Surge Multiplier Banner */}
            <div className="mt-3 flex justify-between items-center text-xs font-bold">
              <span className="text-gray-400">85°C SURGE ZONE:</span>
              <span
                className={`px-2 py-0.5 rounded ${
                  inSurge
                    ? 'bg-amber-400 text-black font-black animate-bounce'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                {thermalMult.toFixed(1)}X MULTIPLIER
              </span>
            </div>

            {/* Emergency Vent Button */}
            <button
              onClick={onEmergencyVent}
              className="w-full mt-3 py-2 bg-blue-950/80 hover:bg-blue-900 border border-blue-500 text-blue-200 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>❄ CRYO VENT HEAT (-15°C)</span>
              <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded text-gray-300 font-mono">
                [SPACE + E]
              </span>
            </button>
          </div>
        </div>

        {/* Center Column: Big Tactile Action Core (Click & Flush) */}
        <div className="lg:col-span-5 flex flex-col justify-center items-center gap-5">
          {/* Primary Action Button: Mine Processor */}
          <div className="w-full flex flex-col items-center">
            <button
              onClick={handleProcess}
              disabled={state.isBufferStalled || state.isFlushing || state.isBSOD}
              className={`w-full max-w-sm aspect-square sm:aspect-[4/3] rounded-2xl flex flex-col items-center justify-center p-6 border-4 transition-all duration-100 transform active:scale-95 ${
                state.isBufferStalled
                  ? 'bg-red-950/50 border-red-700 text-red-300 cursor-not-allowed opacity-80'
                  : state.isFlushing
                  ? 'bg-cyan-950/30 border-cyan-700 text-cyan-300 cursor-wait'
                  : inSurge
                  ? 'bg-gradient-to-br from-amber-600/30 via-red-900/40 to-black border-amber-400 text-amber-200 shadow-[0_0_50px_rgba(251,191,36,0.5)] hover:scale-102'
                  : isProcessActive
                  ? 'bg-cyan-500/30 border-cyan-300 text-white scale-98 shadow-[0_0_30px_rgba(6,182,212,0.6)]'
                  : 'bg-[#101b30] hover:bg-[#152542] border-cyan-500 text-white shadow-[0_0_30px_rgba(6,182,212,0.25)] hover:scale-102'
              }`}
            >
              <div className="text-4xl sm:text-5xl mb-2 animate-pulse">
                {state.isBufferStalled ? '⚠️' : inSurge ? '🔥' : '⚡'}
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-center">
                {state.isBufferStalled
                  ? 'RAM BUFFER FULL'
                  : state.isFlushing
                  ? 'FLUSHING DATA...'
                  : 'PROCESS BYTES'}
              </h2>
              <span className="text-xs sm:text-sm text-cyan-300 font-bold mt-1">
                +{bytesPerClick} Bytes / +{heatPerClick.toFixed(1)}°C per Click
              </span>
              <span className="mt-3 text-[11px] font-mono bg-black/60 px-3 py-1 rounded-full border border-white/10 text-gray-300">
                CLICK OR TAP [SPACE]
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
              className={`w-full py-4 px-6 rounded-xl border-2 font-black text-sm uppercase tracking-wider flex items-center justify-between transition-all active:scale-98 ${
                state.isFlushing
                  ? 'bg-emerald-500 text-black border-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.7)] animate-pulse'
                  : state.volatileBytes > 0
                  ? 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-500 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                  : 'bg-gray-900/60 border-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>💰</span>
                <span>{state.isFlushing ? 'BANKING CASH...' : 'HOLD TO FLUSH CASH'}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold block">+${potentialPayout}</span>
                <span className="text-[10px] text-gray-400 font-normal">[{flushDuration.toFixed(1)}s]</span>
              </div>
            </button>
          </div>
        </div>

        {/* Right Column: Instant Hardware Upgrade Rack */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="flex justify-between items-center pb-2 border-b border-gray-800">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Hardware Upgrades
            </span>
            {onToggle3DView && (
              <button
                onClick={onToggle3DView}
                className="text-[11px] px-2 py-0.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-600 transition-colors"
              >
                {is3DActive ? '🖥 DESK' : '🎮 3D RIG'}
              </button>
            )}
          </div>

          {/* Upgrade Card: CPU */}
          <div className="bg-[#0e1626]/90 border border-gray-800 hover:border-cyan-500/50 rounded-xl p-3 flex items-center justify-between transition-all">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>CPU Processor</span>
                <span className="text-[10px] text-cyan-400">Lv.{state.hardware.cpuLevel}</span>
              </div>
              <span className="text-[10px] text-gray-400 block mt-0.5">Increases byte yield</span>
            </div>
            <button
              onClick={() => onPurchaseUpgrade('cpu')}
              disabled={state.bankedBytes < cpuCost}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                state.bankedBytes >= cpuCost
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-md active:scale-95'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              ${cpuCost}
            </button>
          </div>

          {/* Upgrade Card: RAM */}
          <div className="bg-[#0e1626]/90 border border-gray-800 hover:border-cyan-500/50 rounded-xl p-3 flex items-center justify-between transition-all">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>RAM Buffer</span>
                <span className="text-[10px] text-cyan-400">Lv.{state.hardware.ramLevel}</span>
              </div>
              <span className="text-[10px] text-gray-400 block mt-0.5">Prevents buffer stall</span>
            </div>
            <button
              onClick={() => onPurchaseUpgrade('ram')}
              disabled={state.bankedBytes < ramCost}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                state.bankedBytes >= ramCost
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-md active:scale-95'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              ${ramCost}
            </button>
          </div>

          {/* Upgrade Card: Cooling */}
          <div className="bg-[#0e1626]/90 border border-gray-800 hover:border-cyan-500/50 rounded-xl p-3 flex items-center justify-between transition-all">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Cooling Fans</span>
                <span className="text-[10px] text-cyan-400">Lv.{state.hardware.coolingLevel}</span>
              </div>
              <span className="text-[10px] text-gray-400 block mt-0.5">Faster heat dissipation</span>
            </div>
            <button
              onClick={() => onPurchaseUpgrade('cooling')}
              disabled={state.bankedBytes < coolingCost}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                state.bankedBytes >= coolingCost
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-md active:scale-95'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              ${coolingCost}
            </button>
          </div>

          {/* Upgrade Card: PCIe Bus */}
          <div className="bg-[#0e1626]/90 border border-gray-800 hover:border-cyan-500/50 rounded-xl p-3 flex items-center justify-between transition-all">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>PCIe Bus</span>
                <span className="text-[10px] text-cyan-400">Lv.{state.hardware.busLevel}</span>
              </div>
              <span className="text-[10px] text-gray-400 block mt-0.5">Faster cache flushes</span>
            </div>
            <button
              onClick={() => onPurchaseUpgrade('bus')}
              disabled={state.bankedBytes < busCost}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                state.bankedBytes >= busCost
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-md active:scale-95'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              ${busCost}
            </button>
          </div>
        </div>
      </div>

      {/* Guided Coachmark Non-Modal Overlay */}
      <CrazyGamesOnboardingOverlay
        currentStage={onboardingStage}
        onAdvance={handleAdvanceOnboarding}
        onSkip={handleSkipOnboarding}
      />
    </div>
  );
};
