import { useState, useEffect, useRef, useCallback } from 'react';
import { DepthOSState } from '../../types/depthos';
import {
  createInitialDepthOSState,
  stepSimulation,
  calculateBytesPerProcess,
  calculateHeatPerProcess,
  calculateRamCost,
  getCpuUpgradeCost,
  getRamUpgradeCost,
  getCoolingUpgradeCost,
  getBusUpgradeCost,
  getThermalPasteCost,
  getSurgeThreshold,
  CRITICAL_TEMP,
} from '../../game/simulation';
import { audio } from '../../audio/depthosAudio';
import { createDepthOSThreeScene, SceneController } from '../../game/threeScene';
import { CrazyGamesDesktop } from './components/CrazyGamesDesktop';
import { RewardedAdModal } from './components/RewardedAdModal';
import { RewardedAdState, RewardedAdType, FlushEvent } from './types';
import { initCrazyGamesSdk } from './crazyGamesSdk';
import { getAdCooldownRemaining, isAdOnCooldown, setAdCooldownExpiry } from './adPacing';
import { BSODOverlay } from '../../components/BSODOverlay';
import { ThermalGrainOverlay } from '../../components/ThermalGrainOverlay';
import { ThermalWarningOverlay } from '../../components/ThermalWarningOverlay';

export function CrazyGamesApp() {
  const [gameState, setGameState] = useState<'intro' | 'playing'>('intro');
  const [depthState, setDepthState] = useState<DepthOSState>(() => createInitialDepthOSState());
  const [is3DActive, setIs3DActive] = useState<boolean>(false);

  // Rewarded Ad Monetization State
  const [adModalState, setAdModalState] = useState<RewardedAdState>({
    isOpen: false,
    type: 'double_flush',
    title: '',
    rewardLabel: '',
    attemptId: '',
  });
  const adModalStateRef = useRef<RewardedAdState>(adModalState);
  adModalStateRef.current = adModalState;

  // Active playback state: pauses simulation and turbo countdown strictly during video playback
  const [isAdPlaying, setIsAdPlaying] = useState<boolean>(false);
  const isAdPlayingRef = useRef<boolean>(false);
  isAdPlayingRef.current = isAdPlaying;

  const handlePlaybackStateChange = useCallback((isPlaying: boolean) => {
    setIsAdPlaying(isPlaying);
    isAdPlayingRef.current = isPlaying;
  }, []);

  // Tracks whether a BSOD revive ad attempt is actively underway
  const [isReviveAttemptActive, setIsReviveAttemptActive] = useState<boolean>(false);
  const isReviveAttemptActiveRef = useRef<boolean>(false);
  isReviveAttemptActiveRef.current = isReviveAttemptActive;

  const handleAttemptActiveChange = useCallback((isActive: boolean) => {
    setIsReviveAttemptActive(isActive);
    isReviveAttemptActiveRef.current = isActive;
  }, []);

  const [isDoubleFlushActive, setIsDoubleFlushActive] = useState<boolean>(false);
  const [isTurboActive, setIsTurboActive] = useState<boolean>(false);
  const [turboTimeRemaining, setTurboTimeRemaining] = useState<number>(0);

  // Ad Pacing & Cooldown state
  const [adCooldowns, setAdCooldowns] = useState<Record<string, number>>({});
  const adCooldownsRef = useRef<Record<string, number>>({});
  adCooldownsRef.current = adCooldowns;

  const getCooldownRemaining = useCallback((type: RewardedAdType) => {
    return getAdCooldownRemaining(type, adCooldownsRef.current);
  }, []);

  // Payout lineage & BSOD crash cash and RAM recovery refs
  const [lastFlushEvent, setLastFlushEvent] = useState<FlushEvent | null>(null);
  const nextFlushEventIdRef = useRef<number>(1);
  const nextAttemptIndexRef = useRef<number>(1);
  const grantedAttemptsRef = useRef<Set<string>>(new Set());
  const lostVolatileOnCrashRef = useRef<number>(0);
  const lostRamOnCrashRef = useRef<number>(0);

  const stateRef = useRef<DepthOSState>(depthState);
  stateRef.current = depthState;

  const isDoubleFlushRef = useRef<boolean>(isDoubleFlushActive);
  isDoubleFlushRef.current = isDoubleFlushActive;

  const threeMountRef = useRef<HTMLDivElement | null>(null);
  const sceneCtrlRef = useRef<SceneController | null>(null);

  // Initialize CrazyGames SDK defensively on mount
  useEffect(() => {
    initCrazyGamesSdk();
  }, []);

  // 1-second countdown timer for active Turbo Overclock boost (paused during video ad playback)
  useEffect(() => {
    if (!isTurboActive) return;
    const t = setInterval(() => {
      if (isAdPlayingRef.current) return;
      setTurboTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsTurboActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isTurboActive]);

  // Mount Three.js 3D battlestation (runs in background or visible when toggled)
  useEffect(() => {
    if (!threeMountRef.current) return;
    try {
      const sceneCtrl = createDepthOSThreeScene(threeMountRef.current, (part) => {
        if (part === 'keyboard') {
          handleProcessClick();
        } else if (part === 'cpu') {
          handlePurchaseUpgrade('cpu');
        } else if (part === 'ram') {
          handlePurchaseUpgrade('ram');
        } else if (part === 'cooling') {
          handlePurchaseUpgrade('cooling');
        }
      });
      sceneCtrlRef.current = sceneCtrl;
    } catch (e) {
      console.warn('Three.js initialization caught in CrazyGames preview:', e);
    }

    return () => {
      if (sceneCtrlRef.current) {
        sceneCtrlRef.current.dispose();
        sceneCtrlRef.current = null;
      }
    };
  }, []);

  // 10Hz Simulation Engine Loop
  useEffect(() => {
    const interval = setInterval(() => {
      // Pause entire simulation engine while a rewarded video ad is actively playing
      // Prevents heat dissipation, RAM mutations, volatile changes, or crashes while video is shown
      if (isAdPlayingRef.current) {
        return;
      }

      const prev = stateRef.current;
      const isReviveActive =
        adModalStateRef.current.isOpen &&
        adModalStateRef.current.type === 'bsod_revive' &&
        isReviveAttemptActiveRef.current;

      const next = stepSimulation(prev, 0.1);

      // 1. Crash detection: accurately capture unbanked volatile bytes and exact RAM used at meltdown
      if (!prev.isBSOD && next.isBSOD) {
        audio.playBSODCrash();
        lostVolatileOnCrashRef.current = prev.volatileBytes;
        lostRamOnCrashRef.current = prev.ramUsedMB;
      }

      // 2. Prevent BSOD auto-reboot countdown from expiring while revive ad attempt is actively underway
      // Resumes promptly if ad fails, errors, is unavailable, or is cancelled
      if (prev.isBSOD && isReviveActive) {
        next.isBSOD = true;
        next.bsodCountdown = prev.bsodCountdown;
      }

      // 3. Clear unrecovered lost cash and RAM on normal reboot
      if (prev.isBSOD && !next.isBSOD) {
        lostVolatileOnCrashRef.current = 0;
        lostRamOnCrashRef.current = 0;
      }

      // 4. Real Simulation Flush Completion: Explicit Payout Lineage
      if (prev.isFlushing && !next.isFlushing && next.bankedBytes > prev.bankedBytes) {
        const basePayout = next.bankedBytes - prev.bankedBytes;
        const wasDoubleActive = isDoubleFlushRef.current;

        if (wasDoubleActive) {
          next.bankedBytes += basePayout;
          next.lifetimeBankedBytes += basePayout;
          next.currentXP += basePayout;
          setIsDoubleFlushActive(false);
          isDoubleFlushRef.current = false;
        }

        audio.playFlushChime();

        // Emit explicit flush event
        setLastFlushEvent({
          id: nextFlushEventIdRef.current++,
          basePayout,
          totalPayout: wasDoubleActive ? basePayout * 2 : basePayout,
          wasAlreadyDoubled: wasDoubleActive,
          timestamp: Date.now(),
        });
      }

      if (sceneCtrlRef.current) {
        sceneCtrlRef.current.update(next.heat, next.isBSOD, next.isFlushing, 0.1);
      }

      const surgeTemp = getSurgeThreshold(next.rootTree);
      const inSurge = next.heat >= surgeTemp && next.heat < CRITICAL_TEMP && !next.isBSOD;
      audio.updateHeatAudio(next.heat, inSurge);

      setDepthState(next);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut listener for CrazyGames browser play
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Suppress gameplay keyboard inputs while a rewarded ad is open
      if (adModalStateRef.current.isOpen) {
        return;
      }

      if (stateRef.current.isBSOD) {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          handleFastReboot();
          return;
        }
      }

      if (gameState === 'intro') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          handleStartGame();
        }
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleProcessClick();
      } else if (e.code === 'KeyF') {
        if (!e.repeat) {
          handleStartFlush();
        }
      } else if (e.code === 'KeyE') {
        handleEmergencyVent();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Suppress gameplay keyup while ad modal is open
      if (adModalStateRef.current.isOpen) {
        return;
      }

      if (e.code === 'KeyF') {
        handleCancelFlush();
      }
    };

    const handleFirstGesture = () => {
      audio.ensureContext();
      window.removeEventListener('pointerdown', handleFirstGesture);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('pointerdown', handleFirstGesture);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('pointerdown', handleFirstGesture);
    };
  }, [gameState]);

  const handleStartGame = () => {
    audio.ensureContext();
    audio.playUpgradeSound();
    setGameState('playing');
  };

  // Rewarded Ad Trigger Handler - Issues a unique attempt token per ad request and enforces cooldown pacing
  const handleTriggerRewardedAd = useCallback((
    type: RewardedAdType,
    title: string,
    rewardLabel: string,
    bonus?: number,
    onSuccess?: () => void
  ) => {
    // Cooldown pacing guard
    if (isAdOnCooldown(type, adCooldownsRef.current)) {
      console.warn('[AdPacing] Ad offer is currently on cooldown:', type);
      return;
    }

    // Enforce cooldown timestamp
    setAdCooldowns((prev) => setAdCooldownExpiry(type, prev));

    const attemptId = `cg_ad_${Date.now()}_${nextAttemptIndexRef.current++}_${Math.random().toString(36).slice(2, 8)}`;
    setAdModalState({
      isOpen: true,
      type,
      title,
      rewardLabel,
      payoutBonus: bonus,
      onSuccess,
      attemptId,
    });
  }, []);

  // Rewarded Ad Claim Handler - Guaranteed single-grant execution upon real ad completion
  const handleClaimAdReward = useCallback((attemptId: string) => {
    const currentAd = adModalStateRef.current;

    // Safety guard 1: Modal must be open
    if (!currentAd.isOpen) {
      console.warn('[AdSafety] Attempted claim on closed modal for attempt:', attemptId);
      return;
    }

    // Safety guard 2: Attempt token must match currently active ad attempt
    if (!attemptId || attemptId !== currentAd.attemptId) {
      console.warn('[AdSafety] Attempt token mismatch/superseded:', attemptId, 'expected:', currentAd.attemptId);
      return;
    }

    // Safety guard 3: Exactly-once grant guard across session
    if (grantedAttemptsRef.current.has(attemptId)) {
      console.warn('[AdSafety] Duplicate reward claim prevented for attempt:', attemptId);
      return;
    }
    grantedAttemptsRef.current.add(attemptId);

    audio.ensureContext();
    audio.playUpgradeSound();

    if (currentAd.type === 'double_flush') {
      setIsDoubleFlushActive(true);
    } else if (currentAd.type === 'cryo_dump') {
      audio.playCryoVent();
      setDepthState((prev) => ({
        ...prev,
        heat: 25.0,
      }));
    } else if (currentAd.type === 'turbo_overclock') {
      setIsTurboActive(true);
      setTurboTimeRemaining(30);
    } else if (currentAd.type === 'bsod_revive') {
      const restoredCash = lostVolatileOnCrashRef.current;
      const restoredRam = lostRamOnCrashRef.current;
      lostVolatileOnCrashRef.current = 0; // single-use consumed
      lostRamOnCrashRef.current = 0;
      setDepthState((prev) => ({
        ...prev,
        isBSOD: false,
        heat: 35.0,
        bsodCountdown: 0,
        isBufferStalled: restoredRam >= prev.ramMaxMB,
        volatileBytes: restoredCash,
        ramUsedMB: Math.min(prev.ramMaxMB, restoredRam),
      }));
    } else if (currentAd.type === 'milestone_double') {
      const bonus = (currentAd.payoutBonus || 50) * 2;
      setDepthState((prev) => ({
        ...prev,
        bankedBytes: prev.bankedBytes + bonus,
        lifetimeBankedBytes: prev.lifetimeBankedBytes + bonus,
        currentXP: prev.currentXP + bonus,
      }));
    } else if (currentAd.type === 'post_flush_double') {
      const bonus = currentAd.payoutBonus || 0;
      setDepthState((prev) => ({
        ...prev,
        bankedBytes: prev.bankedBytes + bonus,
        lifetimeBankedBytes: prev.lifetimeBankedBytes + bonus,
        currentXP: prev.currentXP + bonus,
      }));
    }

    if (currentAd.onSuccess) {
      currentAd.onSuccess();
    }
  }, []);

  const handleCloseAdModal = useCallback(() => {
    setIsAdPlaying(false);
    isAdPlayingRef.current = false;
    setIsReviveAttemptActive(false);
    isReviveAttemptActiveRef.current = false;
    setAdModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleClaimObjectiveReward = useCallback((rewardBytes: number) => {
    setDepthState((prev) => ({
      ...prev,
      bankedBytes: prev.bankedBytes + rewardBytes,
      lifetimeBankedBytes: prev.lifetimeBankedBytes + rewardBytes,
      currentXP: prev.currentXP + rewardBytes,
    }));
  }, []);

  // Fast reboot from 100°C Meltdown
  const handleFastReboot = () => {
    lostVolatileOnCrashRef.current = 0; // Discard unrecovered cash and RAM on manual reboot
    lostRamOnCrashRef.current = 0;
    audio.ensureContext();
    audio.playUpgradeSound();
    setDepthState((prev) => ({
      ...prev,
      isBSOD: false,
      heat: 35,
      volatileBytes: 0,
      ramUsedMB: 0,
      isBufferStalled: false,
      isFlushing: false,
      bsodCountdown: 0,
    }));
  };

  // Primary Gameplay Actions
  const handleProcessClick = () => {
    const s = stateRef.current;
    if (s.isBufferStalled || s.isFlushing || s.isBSOD) return;

    audio.ensureContext();
    let generated = calculateBytesPerProcess(s);
    if (isTurboActive) {
      generated *= 2;
    }

    const heatAdded = calculateHeatPerProcess(s);
    const ramCost = calculateRamCost(generated);

    const surgeTemp = getSurgeThreshold(s.rootTree);
    const isCritical = s.heat >= surgeTemp;
    audio.playProcessClick(s.soundpack, isCritical);

    if (sceneCtrlRef.current) {
      sceneCtrlRef.current.triggerPressVisual(isCritical);
    }

    if (s.ramUsedMB + ramCost > s.ramMaxMB) {
      setDepthState((prev) => ({ ...prev, isBufferStalled: true }));
      return;
    }

    setDepthState((prev) => {
      const nextHeat = Math.min(CRITICAL_TEMP, prev.heat + heatAdded);
      const nextUsedRam = Math.min(prev.ramMaxMB, prev.ramUsedMB + ramCost);

      return {
        ...prev,
        volatileBytes: prev.volatileBytes + generated,
        heat: nextHeat,
        ramUsedMB: nextUsedRam,
        isBufferStalled: nextUsedRam >= prev.ramMaxMB,
      };
    });
  };

  const handleStartFlush = () => {
    const s = stateRef.current;
    if (s.isFlushing || s.isBSOD || s.volatileBytes === 0) return;

    audio.ensureContext();
    setDepthState((prev) => ({
      ...prev,
      isFlushing: true,
      flushProgress: 0,
    }));
  };

  const handleCancelFlush = () => {
    setDepthState((prev) => {
      if (!prev.isFlushing) return prev;
      return {
        ...prev,
        isFlushing: false,
        flushProgress: 0,
      };
    });
  };

  const handleEmergencyVent = () => {
    const s = stateRef.current;
    if (s.isBSOD || s.heat <= 45) return;

    audio.ensureContext();
    audio.playCryoVent();

    setDepthState((prev) => ({
      ...prev,
      heat: Math.max(40, prev.heat - 15),
    }));
  };

  const handlePurchaseUpgrade = (type: 'cpu' | 'ram' | 'cooling' | 'bus' | 'paste') => {
    const s = stateRef.current;
    let cost = 0;

    if (type === 'cpu') cost = getCpuUpgradeCost(s.hardware.cpuLevel);
    else if (type === 'ram') cost = getRamUpgradeCost(s.hardware.ramLevel);
    else if (type === 'cooling') cost = getCoolingUpgradeCost(s.hardware.coolingLevel);
    else if (type === 'bus') cost = getBusUpgradeCost(s.hardware.busLevel);
    else if (type === 'paste') cost = getThermalPasteCost(s.hardware.thermalPasteLevel);

    if (s.bankedBytes < cost) return;

    audio.playUpgradeSound();

    setDepthState((prev) => {
      const nextHw = { ...prev.hardware };
      let nextMaxRam = prev.ramMaxMB;

      if (type === 'cpu') nextHw.cpuLevel += 1;
      else if (type === 'ram') {
        nextHw.ramLevel += 1;
        nextMaxRam += 64;
      } else if (type === 'cooling') nextHw.coolingLevel += 1;
      else if (type === 'bus') nextHw.busLevel += 1;
      else if (type === 'paste') nextHw.thermalPasteLevel += 1;

      return {
        ...prev,
        bankedBytes: prev.bankedBytes - cost,
        hardware: nextHw,
        ramMaxMB: nextMaxRam,
      };
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-mono">
      {/* 3D Battlestation View Layer */}
      <div
        ref={threeMountRef}
        className={`absolute inset-0 transition-opacity duration-500 ${
          is3DActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-20 z-0 pointer-events-none'
        }`}
      />

      {/* Cyberpunk Visual Overlays */}
      <ThermalGrainOverlay heat={depthState.heat} isBSOD={depthState.isBSOD} />
      <ThermalWarningOverlay heat={depthState.heat} isBSOD={depthState.isBSOD} />

      {/* Rewarded Ad Modal */}
      <RewardedAdModal
        adState={adModalState}
        onReward={handleClaimAdReward}
        onClose={handleCloseAdModal}
        onPlaybackStateChange={handlePlaybackStateChange}
        onAttemptActiveChange={handleAttemptActiveChange}
      />

      {/* High-Impact Arcade Title Screen or Active Arcade Desktop */}
      {gameState === 'intro' ? (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-black/90 via-[#070e1c]/95 to-black/95 backdrop-blur-xl font-mono text-center">
          <div className="max-w-lg p-8 sm:p-10 border-2 border-cyan-400 rounded-3xl bg-[#08101e]/95 shadow-[0_0_60px_rgba(6,182,212,0.4)] ring-2 ring-cyan-500/30">
            {/* Pulsing Core Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/80 border border-cyan-400 rounded-full text-xs font-black text-cyan-300 uppercase tracking-widest mb-4 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>CRAZYGAMES ARCADE EDITION</span>
            </div>

            {/* Neon Title */}
            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight flex items-center justify-center gap-1">
              <span>DEPTH</span>
              <span className="text-cyan-400">OS</span>
            </h1>
            <p className="text-amber-400 text-xs sm:text-sm font-black uppercase tracking-widest mt-1">
              Thermal Redline Mining Simulator
            </p>

            {/* 3 Visual Action Cards */}
            <div className="my-6 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left text-xs">
              <div className="p-3 bg-black/60 border border-cyan-500/40 rounded-xl">
                <div className="text-xl mb-1">⚡</div>
                <div className="text-cyan-300 font-black">1. MINE BYTES</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Click or tap [SPACE]</div>
              </div>
              <div className="p-3 bg-black/60 border border-amber-500/40 rounded-xl">
                <div className="text-xl mb-1">🔥</div>
                <div className="text-amber-300 font-black">2. RIDE SURGE</div>
                <div className="text-[11px] text-gray-400 mt-0.5">85°C = 10X Cash</div>
              </div>
              <div className="p-3 bg-black/60 border border-emerald-500/40 rounded-xl">
                <div className="text-xl mb-1">💰</div>
                <div className="text-emerald-300 font-black">3. BANK CASH</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Hold [F] before 100°C</div>
              </div>
            </div>

            {/* Big Primary Start CTA Button */}
            <button
              onClick={handleStartGame}
              className="w-full py-4 sm:py-5 bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 hover:from-emerald-300 hover:to-cyan-300 text-black font-black text-base uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.8)] transition-all transform hover:scale-102 active:scale-95 flex items-center justify-center gap-3 ring-4 ring-emerald-400/30"
            >
              <span>INSERT COIN / PLAY NOW</span>
              <span className="text-xs bg-black/30 text-black px-2 py-0.5 rounded font-bold font-mono">
                [SPACE / ENTER]
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 z-20 pointer-events-auto">
          <CrazyGamesDesktop
            state={depthState}
            onProcessClick={handleProcessClick}
            onStartFlush={handleStartFlush}
            onCancelFlush={handleCancelFlush}
            onEmergencyVent={handleEmergencyVent}
            onPurchaseUpgrade={handlePurchaseUpgrade}
            onToggle3DView={() => setIs3DActive((prev) => !prev)}
            is3DActive={is3DActive}
            onTriggerRewardedAd={handleTriggerRewardedAd}
            onClaimObjectiveReward={handleClaimObjectiveReward}
            isTurboActive={isTurboActive}
            turboTimeRemaining={turboTimeRemaining}
            isDoubleFlushActive={isDoubleFlushActive}
            lastFlushEvent={lastFlushEvent}
            adCooldowns={adCooldowns}
            getCooldownRemaining={getCooldownRemaining}
          />
        </div>
      )}

      {/* BSOD Crash Screen with Fast Reboot + Rewarded Revive */}
      {depthState.isBSOD && (
        <div className="absolute inset-0 z-50 pointer-events-auto">
          <BSODOverlay countdown={depthState.bsodCountdown} />
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleFastReboot}
              className="px-6 py-3.5 bg-white hover:bg-cyan-200 text-blue-900 font-mono font-black text-xs sm:text-sm uppercase tracking-widest rounded-xl shadow-2xl transition-all active:scale-95 border-2 border-white"
            >
              ⚡ FAST REBOOT [SPACE]
            </button>
            {(() => {
              const isReviveOnCd = isAdOnCooldown('bsod_revive', adCooldowns);
              const cdRemaining = getAdCooldownRemaining('bsod_revive', adCooldowns);
              return (
                <button
                  disabled={isReviveOnCd}
                  onClick={() => {
                    if (isReviveOnCd) return;
                    const lost = lostVolatileOnCrashRef.current;
                    const rewardDesc =
                      lost > 0
                        ? `Revive with +$${lost.toLocaleString()} unbanked cash restored, buffer recovered & 35.0°C cool core`
                        : 'Instant Reboot with 35.0°C Sub-Zero cool core';
                    handleTriggerRewardedAd(
                      'bsod_revive',
                      'EMERGENCY RECOVERY PROTOCOL',
                      rewardDesc,
                      lost
                    );
                  }}
                  className={`px-6 py-3.5 font-mono font-black text-xs sm:text-sm uppercase tracking-widest rounded-xl transition-all active:scale-95 border-2 flex items-center gap-2 ${
                    isReviveOnCd
                      ? 'bg-gray-800 border-gray-600 text-gray-400 cursor-not-allowed opacity-60'
                      : 'bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-black shadow-[0_0_25px_rgba(251,191,36,0.9)] border-yellow-200'
                  }`}
                >
                  <span>
                    {isReviveOnCd
                      ? `🛡️ REVIVE ON COOLDOWN (${cdRemaining}s)`
                      : lostVolatileOnCrashRef.current > 0
                      ? `🛡️ REVIVE & RESTORE +$${lostVolatileOnCrashRef.current.toLocaleString()} [AD]`
                      : '🛡️ INSTANT REVIVE & COOL [AD]'}
                  </span>
                </button>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export default CrazyGamesApp;
