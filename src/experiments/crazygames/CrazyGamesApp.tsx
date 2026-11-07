import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
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
import { AchievementModal } from './components/AchievementModal';
import { ToastNotificationOverlay } from './components/ToastNotificationOverlay';
import { RewardedAdState, RewardedAdType, FlushEvent, ToastNotification } from './types';
import { initCrazyGamesSdk } from './crazyGamesSdk';
import { getAdCooldownRemaining, isAdOnCooldown, setAdCooldownExpiry } from './adPacing';
import {
  loadUnlockedAchievements,
  saveUnlockedAchievements,
  evaluateAchievements,
  getDecoratedAchievements,
  ACHIEVEMENTS_DEFINITIONS,
} from './achievements';
import {
  loadAcknowledgedMilestones,
  saveAcknowledgedMilestones,
  getMilestoneBuffs,
  checkNewMilestones,
  getDecoratedMilestones,
} from './milestones';
import {
  loadClaimedGoalIds,
  saveClaimedGoalIds,
  getActiveGoalInfo,
  PROGRESSION_GOALS,
} from './goals';
import {
  loadUnlockedResearch,
  saveUnlockedResearch,
  loadActiveResearch,
  saveActiveResearch,
  getResearchBonuses,
  findTechById,
  getActiveResearchProgress,
  RESEARCH_NODES,
} from './research';
import { ResearchModal } from './components/ResearchModal';
import { ActiveResearch } from './types';
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

  // Single-application guard: ensures each attempt ID applies cooldown at most once
  const appliedCooldownAttemptsRef = useRef<Set<string>>(new Set());

  // Ad Pacing & Cooldown state
  const [adCooldowns, setAdCooldowns] = useState<Record<string, number>>({});
  const adCooldownsRef = useRef<Record<string, number>>({});
  adCooldownsRef.current = adCooldowns;

  const [cooldownNow, setCooldownNow] = useState<number>(() => Date.now());

  // Dedicated 1-second interval driving countdown label updates and expiry re-renders
  useEffect(() => {
    const hasActiveCooldown = Object.values(adCooldowns).some((exp) => exp > Date.now());
    if (!hasActiveCooldown) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setCooldownNow(now);
      const stillActive = Object.values(adCooldownsRef.current).some((exp) => exp > now);
      if (!stillActive) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [adCooldowns]);

  // Safe cooldown recorder: starts cooldown once per attempt on confirmed playback
  const recordCooldownForAttempt = useCallback((attemptId: string, type: RewardedAdType) => {
    if (!attemptId || !type) return;
    if (appliedCooldownAttemptsRef.current.has(attemptId)) {
      return; // Already applied for this attempt: do not duplicate or reset
    }
    appliedCooldownAttemptsRef.current.add(attemptId);
    setAdCooldowns((prev) => setAdCooldownExpiry(type, prev));
  }, []);

  const handlePlaybackStateChange = useCallback((isPlaying: boolean) => {
    setIsAdPlaying(isPlaying);
    isAdPlayingRef.current = isPlaying;
    if (isPlaying) {
      // Cooldown fairness: start cooldown countdown immediately at confirmed playback start
      const currentAd = adModalStateRef.current;
      if (currentAd.attemptId && currentAd.type) {
        recordCooldownForAttempt(currentAd.attemptId, currentAd.type);
      }
    }
  }, [recordCooldownForAttempt]);

  const handleConfirmedPlayback = useCallback((attemptId: string) => {
    const currentAd = adModalStateRef.current;
    if (attemptId && currentAd.type) {
      recordCooldownForAttempt(attemptId, currentAd.type);
    }
  }, [recordCooldownForAttempt]);

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

  const getCooldownRemaining = useCallback((type: RewardedAdType) => {
    return getAdCooldownRemaining(type, adCooldownsRef.current, cooldownNow);
  }, [cooldownNow]);

  // ==========================================
  // Retention: Achievements, Milestones & Goals
  // ==========================================

  // Achievements State
  const [unlockedAchievements, setUnlockedAchievements] = useState<Record<string, number>>(() =>
    loadUnlockedAchievements()
  );
  const unlockedAchievementsRef = useRef(unlockedAchievements);
  unlockedAchievementsRef.current = unlockedAchievements;

  // Milestones State
  const [acknowledgedMilestones, setAcknowledgedMilestones] = useState<Record<string, number>>(() =>
    loadAcknowledgedMilestones()
  );
  const acknowledgedMilestonesRef = useRef(acknowledgedMilestones);
  acknowledgedMilestonesRef.current = acknowledgedMilestones;

  // Progression Goals State
  const [claimedGoalIds, setClaimedGoalIds] = useState<Set<string>>(() =>
    loadClaimedGoalIds()
  );
  const claimedGoalIdsRef = useRef(claimedGoalIds);
  claimedGoalIdsRef.current = claimedGoalIds;

  // Research State
  const [unlockedTechIds, setUnlockedTechIds] = useState<Set<string>>(() =>
    loadUnlockedResearch()
  );
  const unlockedTechIdsRef = useRef(unlockedTechIds);
  unlockedTechIdsRef.current = unlockedTechIds;

  const [activeResearch, setActiveResearch] = useState<ActiveResearch | null>(() =>
    loadActiveResearch()
  );
  const activeResearchRef = useRef(activeResearch);
  activeResearchRef.current = activeResearch;

  const [isResearchModalOpen, setIsResearchModalOpen] = useState<boolean>(false);

  // Dynamic permanent research bonuses
  const researchBonuses = useMemo(() => {
    return getResearchBonuses(unlockedTechIds);
  }, [unlockedTechIds]);

  // Stat tracking refs for achievement triggers
  const totalClicksRef = useRef<number>(0);
  const totalFlushesRef = useRef<number>(0);
  const totalCrashesRef = useRef<number>(0);
  const totalRevivesRef = useRef<number>(0);
  const highestHeatRef = useRef<number>(depthState.heat);
  const hitExtremeHeatRef = useRef<boolean>(false);

  // Dynamic permanent milestone buffs
  const milestoneBuffs = useMemo(() => {
    return getMilestoneBuffs(depthState.lifetimeBankedBytes);
  }, [depthState.lifetimeBankedBytes]);

  // Toast Notifications Stack
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const nextToastIdRef = useRef<number>(1);

  const addToast = useCallback((toast: Omit<ToastNotification, 'id' | 'timestamp'>) => {
    const id = `toast_${nextToastIdRef.current++}_${Date.now()}`;
    const newToast: ToastNotification = {
      ...toast,
      id,
      timestamp: Date.now(),
    };
    setToasts((prev) => [...prev.slice(-3), newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Achievement Modal State
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState<boolean>(false);
  const [achievementModalTab, setAchievementModalTab] = useState<'achievements' | 'milestones'>('achievements');

  // Achievement Evaluator Routine
  const triggerCheckAchievements = useCallback(() => {
    const s = stateRef.current;
    if (s.heat >= 90.0 && !s.isBSOD) {
      hitExtremeHeatRef.current = true;
    }
    if (s.heat > highestHeatRef.current) {
      highestHeatRef.current = s.heat;
    }

    const { newUnlocks, updatedMap } = evaluateAchievements({
      volatileBytes: s.volatileBytes,
      bankedBytes: s.bankedBytes,
      lifetimeBankedBytes: s.lifetimeBankedBytes,
      heat: s.heat,
      isBSOD: s.isBSOD,
      hardware: s.hardware,
      totalClicks: totalClicksRef.current,
      totalFlushes: totalFlushesRef.current,
      totalCrashes: totalCrashesRef.current,
      totalRevives: totalRevivesRef.current,
      hitExtremeHeatSinceSafe: hitExtremeHeatRef.current,
      unlockedMap: unlockedAchievementsRef.current,
    });

    if (newUnlocks.length > 0) {
      setUnlockedAchievements(updatedMap);
      saveUnlockedAchievements(updatedMap);

      let totalReward = 0;
      for (const ach of newUnlocks) {
        totalReward += ach.rewardCash;
        addToast({
          type: 'achievement',
          title: ach.title,
          subtitle: ach.description,
          rewardText: `+$${ach.rewardCash.toLocaleString()} CASH`,
          icon: ach.icon,
        });
      }

      audio.playUpgradeSound();
      try {
        confetti({
          particleCount: 50,
          spread: 75,
          origin: { y: 0.15 },
          colors: ['#fbbf24', '#f59e0b', '#10b981'],
        });
      } catch {}

      if (totalReward > 0) {
        setDepthState((prev) => ({
          ...prev,
          bankedBytes: prev.bankedBytes + totalReward,
          lifetimeBankedBytes: prev.lifetimeBankedBytes + totalReward,
          currentXP: prev.currentXP + totalReward,
        }));
      }
    }
  }, [addToast]);

  // Monitor Milestone progression
  useEffect(() => {
    const { newlyReached, updatedMap } = checkNewMilestones(
      depthState.lifetimeBankedBytes,
      acknowledgedMilestonesRef.current
    );
    if (newlyReached.length > 0) {
      setAcknowledgedMilestones(updatedMap);
      saveAcknowledgedMilestones(updatedMap);

      for (const ms of newlyReached) {
        addToast({
          type: 'milestone',
          title: ms.title,
          subtitle: ms.description,
          rewardText: ms.buffLabel,
          icon: ms.icon,
        });
        audio.playUpgradeSound();
        try {
          confetti({
            particleCount: 45,
            spread: 70,
            origin: { y: 0.15 },
            colors: ['#06b6d4', '#38bdf8', '#00f5ff'],
          });
        } catch {}
      }
    }
  }, [depthState.lifetimeBankedBytes, addToast]);

  // Context-aware Progression Goal Evaluator
  const activeGoalInfo = useMemo(() => {
    return getActiveGoalInfo(
      {
        totalClicks: totalClicksRef.current,
        volatileBytes: depthState.volatileBytes,
        bankedBytes: depthState.bankedBytes,
        lifetimeBankedBytes: depthState.lifetimeBankedBytes,
        heat: depthState.heat,
        hardware: depthState.hardware,
        totalFlushes: totalFlushesRef.current,
        highestHeatSeen: highestHeatRef.current,
      },
      claimedGoalIds
    );
  }, [
    depthState.volatileBytes,
    depthState.bankedBytes,
    depthState.lifetimeBankedBytes,
    depthState.heat,
    depthState.hardware,
    claimedGoalIds,
  ]);


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
        totalCrashesRef.current++;
        audio.playBSODCrash();
        lostVolatileOnCrashRef.current = prev.volatileBytes;
        lostRamOnCrashRef.current = prev.ramUsedMB;
        hitExtremeHeatRef.current = false;
        triggerCheckAchievements();
      }

      // 2. Prevent BSOD auto-reboot countdown from expiring while revive ad attempt is actively underway
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
        totalFlushesRef.current++;
        const basePayout = next.bankedBytes - prev.bankedBytes;
        const wasDoubleActive = isDoubleFlushRef.current;

        if (wasDoubleActive) {
          next.bankedBytes += basePayout;
          next.lifetimeBankedBytes += basePayout;
          next.currentXP += basePayout;
          setIsDoubleFlushActive(false);
          isDoubleFlushRef.current = false;
        }

        // Apply research storage payout bonus
        if (researchBonuses.payoutMultiplier > 1) {
          const researchBonus = Math.round(basePayout * (researchBonuses.payoutMultiplier - 1));
          next.bankedBytes += researchBonus;
          next.lifetimeBankedBytes += researchBonus;
          next.currentXP += researchBonus;
        }

        audio.playFlushChime();

        // Emit explicit flush event
        const totalPayoutCalculated =
          (wasDoubleActive ? basePayout * 2 : basePayout) +
          (researchBonuses.payoutMultiplier > 1 ? Math.round(basePayout * (researchBonuses.payoutMultiplier - 1)) : 0);

        setLastFlushEvent({
          id: nextFlushEventIdRef.current++,
          basePayout,
          totalPayout: totalPayoutCalculated,
          wasAlreadyDoubled: wasDoubleActive,
          timestamp: Date.now(),
        });

        triggerCheckAchievements();
      }

      // Automation Research: Auto Cryo-Vent at 95°C
      if (researchBonuses.autoCryoVent && next.heat >= 95.0 && !next.isBSOD) {
        next.heat = 40.0;
        audio.playCryoVent();
      }

      // Automation Research: Auto BSOD Recovery in 3s
      if (researchBonuses.autoRecovery && prev.isBSOD && next.isBSOD && !isReviveActive) {
        if (next.bsodCountdown > 3) {
          next.bsodCountdown = 3;
        }
      }

      if (sceneCtrlRef.current) {
        sceneCtrlRef.current.update(next.heat, next.isBSOD, next.isFlushing, 0.1);
      }

      const surgeTemp = getSurgeThreshold(next.rootTree);
      const inSurge = next.heat >= surgeTemp && next.heat < CRITICAL_TEMP && !next.isBSOD;
      audio.updateHeatAudio(next.heat, inSurge);

      // Periodically check thermal achievements (e.g. surge, safe cooling)
      if (Math.random() < 0.2) {
        triggerCheckAchievements();
      }

      setDepthState(next);
    }, 100);

    return () => clearInterval(interval);
  }, [triggerCheckAchievements]);

  // Keyboard shortcut listener for CrazyGames browser play
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Suppress gameplay keyboard inputs while a modal is open
      if (adModalStateRef.current.isOpen || isAchievementModalOpen || isResearchModalOpen) {
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
      // Suppress gameplay keyup while a modal is open
      if (adModalStateRef.current.isOpen || isAchievementModalOpen || isResearchModalOpen) {
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
  }, [gameState, isAchievementModalOpen, isResearchModalOpen]);

  const handleStartGame = () => {
    audio.ensureContext();
    audio.playUpgradeSound();
    setGameState('playing');
  };

  // Rewarded Ad Trigger Handler
  const handleTriggerRewardedAd = useCallback((
    type: RewardedAdType,
    title: string,
    rewardLabel: string,
    bonus?: number,
    onSuccess?: () => void
  ) => {
    // Overlapping attempt guard: reject repeated clicks while an ad modal is already open
    if (adModalStateRef.current.isOpen) {
      console.warn('[AdSafety] Blocked duplicate/overlapping ad trigger while modal is open.');
      return;
    }

    // Cooldown pacing guard
    if (isAdOnCooldown(type, adCooldownsRef.current)) {
      console.warn('[AdPacing] Ad offer is currently on cooldown:', type);
      return;
    }

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

  // Rewarded Ad Claim Handler
  const handleClaimAdReward = useCallback((attemptId: string) => {
    const currentAd = adModalStateRef.current;

    if (!currentAd.isOpen) return;
    if (!attemptId || attemptId !== currentAd.attemptId) return;

    if (grantedAttemptsRef.current.has(attemptId)) return;
    grantedAttemptsRef.current.add(attemptId);

    // Cooldown is initiated exactly once per attempt
    recordCooldownForAttempt(attemptId, currentAd.type);

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
      totalRevivesRef.current++;
      const restoredCash = lostVolatileOnCrashRef.current;
      const restoredRam = lostRamOnCrashRef.current;
      lostVolatileOnCrashRef.current = 0;
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
      triggerCheckAchievements();
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
  }, [recordCooldownForAttempt, triggerCheckAchievements]);

  const handleCloseAdModal = useCallback(() => {
    setIsAdPlaying(false);
    isAdPlayingRef.current = false;
    setIsReviveAttemptActive(false);
    isReviveAttemptActiveRef.current = false;
    setAdModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Claim Goal Bounty
  const handleClaimGoal = useCallback(() => {
    const g = activeGoalInfo.goal;
    if (!g || !activeGoalInfo.isCompleted || activeGoalInfo.isClaimed) return;

    audio.ensureContext();
    audio.playUpgradeSound();

    try {
      confetti({
        particleCount: 50,
        spread: 80,
        origin: { y: 0.15 },
        colors: ['#10b981', '#06b6d4', '#fbbf24'],
      });
    } catch {}

    const reward = g.rewardCash;
    setDepthState((prev) => ({
      ...prev,
      bankedBytes: prev.bankedBytes + reward,
      lifetimeBankedBytes: prev.lifetimeBankedBytes + reward,
      currentXP: prev.currentXP + reward,
    }));

    setClaimedGoalIds((prev) => {
      const next = new Set(prev);
      next.add(g.id);
      saveClaimedGoalIds(next);
      return next;
    });

    addToast({
      type: 'goal',
      title: `${g.title} Completed!`,
      subtitle: g.description,
      rewardText: `+$${reward.toLocaleString()} CASH`,
      icon: '🎯',
    });
  }, [activeGoalInfo, addToast]);

  // Claim Double Goal Bounty via Rewarded Ad
  const handleClaimGoalDouble = useCallback(() => {
    const g = activeGoalInfo.goal;
    if (!g || !activeGoalInfo.isCompleted || activeGoalInfo.isClaimed) return;

    handleTriggerRewardedAd(
      'milestone_double',
      'DOUBLE GOAL BOUNTY',
      `Claim 2X Cash: +$${(g.rewardCash * 2).toLocaleString()}!`,
      g.rewardCash,
      () => {
        setClaimedGoalIds((prev) => {
          const next = new Set(prev);
          next.add(g.id);
          saveClaimedGoalIds(next);
          return next;
        });

        addToast({
          type: 'goal',
          title: `${g.title} Doubled!`,
          subtitle: `Watched CrazyGames ad to claim 2X Bounty!`,
          rewardText: `+$${(g.rewardCash * 2).toLocaleString()} CASH`,
          icon: '🚀',
        });
      }
    );
  }, [activeGoalInfo, handleTriggerRewardedAd, addToast]);

  const handleClaimObjectiveReward = useCallback((rewardBytes: number) => {
    setDepthState((prev) => ({
      ...prev,
      bankedBytes: prev.bankedBytes + rewardBytes,
      lifetimeBankedBytes: prev.lifetimeBankedBytes + rewardBytes,
      currentXP: prev.currentXP + rewardBytes,
    }));
  }, []);

  // Complete a research node, grant permanent bonuses, and trigger celebratory feedback
  const completeResearchNode = useCallback((techId: string) => {
    const tech = findTechById(techId);
    if (!tech) return;

    audio.ensureContext();
    audio.playUpgradeSound();

    try {
      confetti({
        particleCount: 65,
        spread: 90,
        origin: { y: 0.2 },
        colors: ['#c084fc', '#e879f9', '#38bdf8', '#fbbf24', '#34d399'],
      });
    } catch {}

    setUnlockedTechIds((prev) => {
      const next = new Set(prev);
      next.add(tech.id);
      saveUnlockedResearch(next);
      return next;
    });

    setActiveResearch(null);
    saveActiveResearch(null);

    addToast({
      type: 'research',
      title: `${tech.title} Complete!`,
      subtitle: tech.description,
      rewardText: tech.bonusLabel,
      icon: tech.icon,
    });
  }, [addToast]);

  // Research timer: checks active research progress and completes when duration expires
  useEffect(() => {
    if (!activeResearch) return;
    const interval = setInterval(() => {
      const cur = activeResearchRef.current;
      if (!cur) return;
      const { isComplete } = getActiveResearchProgress(cur);
      if (isComplete) {
        completeResearchNode(cur.techId);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [activeResearch, completeResearchNode]);

  // Start researching a technology node
  const handleStartResearch = useCallback((techId: string) => {
    const tech = findTechById(techId);
    if (!tech) return;

    const s = stateRef.current;
    if (s.bankedBytes < tech.costBytes) return;
    if (activeResearchRef.current) return;
    if (unlockedTechIdsRef.current.has(techId)) return;

    const reqsMet = tech.prerequisites.every((req) => unlockedTechIdsRef.current.has(req));
    if (!reqsMet) return;

    setDepthState((prev) => ({
      ...prev,
      bankedBytes: Math.max(0, prev.bankedBytes - tech.costBytes),
    }));

    const newActive: ActiveResearch = {
      techId,
      startTime: Date.now(),
      durationMs: tech.durationSeconds * 1000,
    };

    setActiveResearch(newActive);
    saveActiveResearch(newActive);

    audio.ensureContext();
    audio.playUpgradeSound();
  }, []);

  // Rush currently synthesizing research with rewarded ad
  const handleRushResearchWithAd = useCallback(() => {
    const cur = activeResearchRef.current;
    if (!cur) return;
    const tech = findTechById(cur.techId);
    if (!tech) return;

    handleTriggerRewardedAd(
      'rush_research',
      'RUSH QUANTUM RESEARCH',
      `Instantly finish researching ${tech.title}!`,
      undefined,
      () => {
        completeResearchNode(cur.techId);
      }
    );
  }, [handleTriggerRewardedAd, completeResearchNode]);

  // Fast reboot from 100°C Meltdown
  const handleFastReboot = () => {
    lostVolatileOnCrashRef.current = 0;
    lostRamOnCrashRef.current = 0;
    totalRevivesRef.current++;
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
    triggerCheckAchievements();
  };

  // Primary Gameplay Actions
  const handleProcessClick = () => {
    const s = stateRef.current;
    if (s.isBufferStalled || s.isFlushing || s.isBSOD) return;

    totalClicksRef.current++;
    audio.ensureContext();

    let generated = calculateBytesPerProcess(s);
    if (isTurboActive) {
      generated *= 2;
    }
    // Apply permanent Milestone and Research Data Multipliers
    let totalDataMult = milestoneBuffs.dataMultiplier * researchBonuses.dataMultiplier;
    const surgeTemp = getSurgeThreshold(s.rootTree);
    const inSurge = s.heat >= surgeTemp && s.heat < CRITICAL_TEMP && !s.isBSOD;
    if (inSurge && researchBonuses.surgeMultiplier > 1) {
      totalDataMult *= researchBonuses.surgeMultiplier;
    }
    if (totalDataMult > 1) {
      generated = Math.round(generated * totalDataMult);
    }

    let heatAdded = calculateHeatPerProcess(s);
    if (researchBonuses.heatReduction > 0) {
      heatAdded = Math.max(0.1, heatAdded * (1 - researchBonuses.heatReduction));
    }
    const ramCost = calculateRamCost(generated);

    const isCritical = inSurge;
    audio.playProcessClick(s.soundpack, isCritical);

    if (sceneCtrlRef.current) {
      sceneCtrlRef.current.triggerPressVisual(isCritical);
    }

    const effectiveMaxRam = s.ramMaxMB + milestoneBuffs.bonusRamMB + researchBonuses.bonusRamMB;
    if (s.ramUsedMB + ramCost > effectiveMaxRam) {
      setDepthState((prev) => ({ ...prev, isBufferStalled: true }));
      triggerCheckAchievements();
      return;
    }

    setDepthState((prev) => {
      const nextHeat = Math.min(CRITICAL_TEMP, prev.heat + heatAdded);
      const nextUsedRam = Math.min(effectiveMaxRam, prev.ramUsedMB + ramCost);

      return {
        ...prev,
        volatileBytes: prev.volatileBytes + generated,
        heat: nextHeat,
        ramUsedMB: nextUsedRam,
        isBufferStalled: nextUsedRam >= effectiveMaxRam,
      };
    });

    triggerCheckAchievements();
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

    triggerCheckAchievements();
  };

  const handlePurchaseUpgrade = (type: 'cpu' | 'ram' | 'cooling' | 'bus' | 'paste') => {
    const s = stateRef.current;
    let cost = 0;

    if (type === 'cpu') cost = getCpuUpgradeCost(s.hardware.cpuLevel);
    else if (type === 'ram') cost = getRamUpgradeCost(s.hardware.ramLevel);
    else if (type === 'cooling') cost = getCoolingUpgradeCost(s.hardware.coolingLevel);
    else if (type === 'bus') cost = getBusUpgradeCost(s.hardware.busLevel);
    else if (type === 'paste') cost = getThermalPasteCost(s.hardware.thermalPasteLevel);

    const discount = researchBonuses.upgradeCostDiscount;
    if (discount > 0) {
      cost = Math.round(cost * (1 - discount));
    }

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

    setTimeout(() => {
      triggerCheckAchievements();
    }, 50);
  };

  const decoratedAchievements = useMemo(() => {
    return getDecoratedAchievements(unlockedAchievements);
  }, [unlockedAchievements]);

  const decoratedMilestones = useMemo(() => {
    return getDecoratedMilestones(depthState.lifetimeBankedBytes);
  }, [depthState.lifetimeBankedBytes]);

  const unlockedCount = useMemo(() => {
    return Object.keys(unlockedAchievements).length;
  }, [unlockedAchievements]);

  const unlockedMilestonesCount = useMemo(() => {
    return decoratedMilestones.filter((m) => m.unlocked).length;
  }, [decoratedMilestones]);

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

      {/* Celebration Toast Notifications */}
      <ToastNotificationOverlay toasts={toasts} onDismiss={dismissToast} />

      {/* Achievements & Milestones Modal */}
      <AchievementModal
        isOpen={isAchievementModalOpen}
        onClose={() => setIsAchievementModalOpen(false)}
        achievements={decoratedAchievements}
        milestones={decoratedMilestones}
        milestoneBuffs={milestoneBuffs}
        lifetimeBankedBytes={depthState.lifetimeBankedBytes}
        initialTab={achievementModalTab}
      />

      {/* R&D Quantum Research Lab Modal */}
      <ResearchModal
        isOpen={isResearchModalOpen}
        onClose={() => setIsResearchModalOpen(false)}
        bankedBytes={depthState.bankedBytes}
        unlockedTechIds={unlockedTechIds}
        activeResearch={activeResearch}
        researchBonuses={researchBonuses}
        onStartResearch={handleStartResearch}
        onRushResearchWithAd={handleRushResearchWithAd}
      />

      {/* Rewarded Ad Modal */}
      <RewardedAdModal
        adState={adModalState}
        onReward={handleClaimAdReward}
        onClose={handleCloseAdModal}
        onPlaybackStateChange={handlePlaybackStateChange}
        onAttemptActiveChange={handleAttemptActiveChange}
        onConfirmedPlayback={handleConfirmedPlayback}
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
            // Retention Additions
            goalInfo={activeGoalInfo}
            onClaimGoal={handleClaimGoal}
            onClaimGoalDouble={handleClaimGoalDouble}
            unlockedAchievementsCount={unlockedCount}
            totalAchievementsCount={ACHIEVEMENTS_DEFINITIONS.length}
            unlockedMilestonesCount={unlockedMilestonesCount}
            onOpenAchievements={() => {
              setAchievementModalTab('achievements');
              setIsAchievementModalOpen(true);
            }}
            onOpenMilestones={() => {
              setAchievementModalTab('milestones');
              setIsAchievementModalOpen(true);
            }}
            milestoneBuffs={milestoneBuffs}
            unlockedResearchCount={unlockedTechIds.size}
            totalResearchCount={RESEARCH_NODES.length}
            isResearching={Boolean(activeResearch)}
            onOpenResearch={() => setIsResearchModalOpen(true)}
            researchBonuses={researchBonuses}
            activeResearch={activeResearch}
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
              const isReviveOnCd = isAdOnCooldown('bsod_revive', adCooldowns, cooldownNow);
              const cdRemaining = getAdCooldownRemaining('bsod_revive', adCooldowns, cooldownNow);
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
