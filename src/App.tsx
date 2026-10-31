import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { DepthOSState, DaemonId, OSTheme, KeyboardSoundpack, FactionId } from './types/depthos';
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
  calculatePrestigeQBits,
  calculateMissionRewardBytes,
  calculateMissionRewardQBits,
  calculateAllClearBonus,
  getSurgeThreshold,
  AMBIENT_TEMP,
  CRITICAL_TEMP,
} from './game/simulation';
import { audio } from './audio/depthosAudio';
import { createDepthOSThreeScene, SceneController } from './game/threeScene';
import { TitleScreen } from './components/TitleScreen';
import { DepthOSDesktop } from './components/DepthOSDesktop';
import { BSODOverlay } from './components/BSODOverlay';
import { PrestigeModal } from './components/PrestigeModal';
import { DaemonsModal } from './components/DaemonsModal';
import { BountiesAndAchievementsModal } from './components/BountiesAndAchievementsModal';
import { RobloxExporterModal } from './components/RobloxExporterModal';
import { SettingsAndThemesModal } from './components/SettingsAndThemesModal';
import { AriaAssistant } from './components/AriaAssistant';
import { FactionsModal } from './components/FactionsModal';
import { HardwareVaultModal } from './components/HardwareVaultModal';
import { SeasonPassModal } from './components/SeasonPassModal';
import { EventNotificationBanner } from './components/EventNotificationBanner';
import { ViralClutchModal } from './components/ViralClutchModal';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { SingularityProjectModal } from './components/SingularityProjectModal';
import { SelectionModal } from './components/SelectionModal';
import { TutorialModal } from './components/TutorialModal';
import { ThermalGrainOverlay } from './components/ThermalGrainOverlay';
import { ThermalWarningOverlay } from './components/ThermalWarningOverlay';

export default function App() {
  const [gameState, setGameState] = useState<'title' | 'playing'>('title');
  const [depthState, setDepthState] = useState<DepthOSState>(() => {
    try {
      const saved = localStorage.getItem('depthos_save_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...createInitialDepthOSState(), ...parsed, isFlushing: false, isBSOD: false, activeEvent: null };
      }
    } catch {
      // Fallback
    }
    return createInitialDepthOSState();
  });

  const [activeModal, setActiveModal] = useState<
    'none' | 'prestige' | 'daemons' | 'bounties' | 'roblox' | 'settings' | 'factions' | 'vault' | 'season' | 'profile' | 'singularity' | 'selection' | 'tutorial'
  >('none');
  const [cameraPreset, setCameraPreset] = useState<'desk' | 'monitor' | 'motherboard'>('desk');
  const [is3DFullscreen, setIs3DFullscreen] = useState<boolean>(false);

  // References for Three.js and loop
  const threeMountRef = useRef<HTMLDivElement | null>(null);
  const sceneCtrlRef = useRef<SceneController | null>(null);
  const stateRef = useRef<DepthOSState>(depthState);
  stateRef.current = depthState;

  // Mount Three.js 3D battlestation once with 3D raycast selection & resilient fallback
  useEffect(() => {
    if (!threeMountRef.current) return;
    try {
      const sceneCtrl = createDepthOSThreeScene(threeMountRef.current, (part) => {
        if (part === 'keyboard') {
          handleProcessClick();
        } else if (part === 'monitor') {
          handleSelectCameraPreset('monitor');
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
      console.warn('Scene controller initialization fallback caught:', e);
    }

    return () => {
      if (sceneCtrlRef.current) {
        sceneCtrlRef.current.dispose();
        sceneCtrlRef.current = null;
      }
    };
  }, []);

  // 10Hz Simulation Engine Loop (dt = 0.1s)
  useEffect(() => {
    const interval = setInterval(() => {
      const prev = stateRef.current;
      const next = stepSimulation(prev, 0.1);

      // Check if BSOD was just triggered
      if (!prev.isBSOD && next.isBSOD) {
        audio.playBSODCrash();
      }

      // Check if flush completed
      if (prev.isFlushing && !next.isFlushing && next.bankedBytes > prev.bankedBytes) {
        audio.playFlushChime();
      }

      // Update 3D scene elements
      if (sceneCtrlRef.current) {
        sceneCtrlRef.current.update(next.heat, next.isBSOD, next.isFlushing, 0.1);
      }

      // Update audio fan hum & surge alarm
      const surgeTemp = getSurgeThreshold(next.rootTree);
      const inSurge = next.heat >= surgeTemp && next.heat < CRITICAL_TEMP && !next.isBSOD;
      audio.updateHeatAudio(next.heat, inSurge);

      setDepthState(next);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Auto-Save every 5 seconds to localStorage
  useEffect(() => {
    const saveInterval = setInterval(() => {
      try {
        const s = stateRef.current;
        localStorage.setItem(
          'depthos_save_v2',
          JSON.stringify({
            bankedBytes: s.bankedBytes,
            lifetimeBankedBytes: s.lifetimeBankedBytes,
            quantumBits: s.quantumBits,
            osLevel: s.osLevel,
            currentXP: s.currentXP,
            prestigeCount: s.prestigeCount,
            hardware: s.hardware,
            daemons: s.daemons,
            rootTree: s.rootTree,
            activeTheme: s.activeTheme,
            soundpack: s.soundpack,
            totalCrashes: s.totalCrashes,
            successfulFlushes: s.successfulFlushes,
            maxSurgeDuration: s.maxSurgeDuration,
            achievements: s.achievements,
            bounties: s.bounties,
            faction: s.faction,
            factionReputation: s.factionReputation,
            factionRank: s.factionRank,
            operatorTag: s.operatorTag,
            activeTitle: s.activeTitle,
            unlockedTitles: s.unlockedTitles,
            collectibles: s.collectibles,
            seasonLevel: s.seasonLevel,
            seasonXP: s.seasonXP,
            claimedSeasonTiers: s.claimedSeasonTiers,
            singularityContributedQBits: s.singularityContributedQBits,
            singularityUnlocked: s.singularityUnlocked,
            aria: s.aria,
            dailyMissions: s.dailyMissions,
          })
        );
      } catch {
        // storage quota fallback
      }
    }, 5000);

    return () => clearInterval(saveInterval);
  }, []);

  // Primary Gameplay Actions
  const handleProcessClick = () => {
    const s = stateRef.current;
    if (s.isBufferStalled || s.isFlushing || s.isBSOD) return;

    audio.ensureContext();
    const generated = calculateBytesPerProcess(s);
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
      const nextVolatile = prev.volatileBytes + generated;
      const nextRam = Math.min(prev.ramMaxMB, prev.ramUsedMB + ramCost);
      const nextHeat = prev.heat + heatAdded;

      let nextMissions = prev.dailyMissions?.missions;
      if (nextMissions) {
        nextMissions = nextMissions.map((m) => {
          if (m.type === 'manual_clicks' && !m.completed) {
            const nextProg = Math.min(m.target, m.progress + 1);
            return {
              ...m,
              progress: nextProg,
              completed: nextProg >= m.target,
            };
          }
          return m;
        });
      }

      return {
        ...prev,
        volatileBytes: nextVolatile,
        ramUsedMB: nextRam,
        heat: nextHeat,
        dailyMissions: prev.dailyMissions ? { ...prev.dailyMissions, missions: nextMissions } : prev.dailyMissions,
      };
    });
  };

  const handleStartFlush = () => {
    const s = stateRef.current;
    if (s.volatileBytes <= 0 || s.isFlushing || s.isBSOD) return;
    audio.ensureContext();
    setDepthState((prev) => ({
      ...prev,
      isFlushing: true,
      flushProgress: 0,
    }));
  };

  const handleCancelFlush = () => {
    // Channel release
  };

  const handleEmergencyVent = () => {
    const s = stateRef.current;
    if (s.emergencyVentCooldown > 0 || s.isBSOD) return;
    audio.playCryoVent();
    if (sceneCtrlRef.current) {
      sceneCtrlRef.current.triggerVentVisual();
    }

    if (s.heat >= 95.0) {
      const ach = s.achievements.find((x) => x.id === 'sub_zero_maestro');
      if (ach) ach.unlocked = true;
    }

    setDepthState((prev) => ({
      ...prev,
      heat: AMBIENT_TEMP,
      emergencyVentCooldown: 60.0,
      aria: {
        ...prev.aria,
        mood: 'calm',
        message: "Cryogenic nitrogen dump engaged! Core temperature normalized to 25.0°C.",
      },
    }));
  };

  const handlePurchaseUpgrade = (type: 'cpu' | 'ram' | 'cooling' | 'bus' | 'paste', count = 1) => {
    const s = stateRef.current;
    if (count <= 0) return;

    const getSingleCost = (lvl: number) => {
      switch (type) {
        case 'cpu':
          return getCpuUpgradeCost(lvl);
        case 'ram':
          return getRamUpgradeCost(lvl);
        case 'cooling':
          return getCoolingUpgradeCost(lvl);
        case 'bus':
          return getBusUpgradeCost(lvl);
        case 'paste':
          return lvl < 5 ? getThermalPasteCost(lvl) : Infinity;
      }
    };

    const curLevel =
      type === 'paste'
        ? s.hardware.thermalPasteLevel
        : type === 'cpu'
        ? s.hardware.cpuLevel
        : type === 'ram'
        ? s.hardware.ramLevel
        : type === 'cooling'
        ? s.hardware.coolingLevel
        : s.hardware.busLevel;

    const maxLevel = type === 'paste' ? 5 : 999;
    const actualCount = Math.min(count, maxLevel - curLevel);
    if (actualCount <= 0) return;

    let totalCost = 0;
    for (let i = 0; i < actualCount; i++) {
      totalCost += getSingleCost(curLevel + i);
    }

    if (s.bankedBytes < totalCost) return;

    audio.playUpgradeSound();

    setDepthState((prev) => {
      const nextHw = { ...prev.hardware };
      let nextMaxRam = prev.ramMaxMB;

      if (type === 'cpu') nextHw.cpuLevel += actualCount;
      else if (type === 'ram') {
        nextHw.ramLevel += actualCount;
        nextMaxRam += 64 * actualCount;
      } else if (type === 'cooling') nextHw.coolingLevel += actualCount;
      else if (type === 'bus') nextHw.busLevel += actualCount;
      else if (type === 'paste') nextHw.thermalPasteLevel += actualCount;

      return {
        ...prev,
        bankedBytes: prev.bankedBytes - totalCost,
        hardware: nextHw,
        ramMaxMB: nextMaxRam,
      };
    });
  };

  const handleInitiateReset = () => {
    const s = stateRef.current;
    const qbits = calculatePrestigeQBits(s.lifetimeBankedBytes);
    if (s.osLevel < 10 || qbits <= 0) return;

    audio.playUpgradeSound();

    const ach = s.achievements.find((x) => x.id === 'deep_kernel_walk');
    if (ach) ach.unlocked = true;

    const retentionPct = s.rootTree.nonVolatileRegisters * 0.05;
    const retainedBanked = Math.round(s.bankedBytes * retentionPct);

    setDepthState((prev) => ({
      ...prev,
      volatileBytes: 0,
      bankedBytes: retainedBanked,
      quantumBits: prev.quantumBits + qbits,
      heat: AMBIENT_TEMP,
      ramUsedMB: 0,
      ramMaxMB: 64,
      isBufferStalled: false,
      isFlushing: false,
      prestigeCount: prev.prestigeCount + 1,
      hardware: {
        cpuLevel: 1,
        ramLevel: 1,
        coolingLevel: 1,
        busLevel: 1,
        thermalPasteLevel: 0,
      },
      daemons: ['none', 'none', 'none', 'none'],
      aria: {
        ...prev.aria,
        mood: 'proud',
        message: `Kernel Reboot successful! Harvested +${qbits} Quantum Bits. Silicon baseline reset.`,
      },
    }));

    setActiveModal('none');
  };

  const handleUpgradeRootNode = (
    nodeKey: 'superconductorBus' | 'cryogenicSubstrate' | 'nonVolatileRegisters' | 'surgeDriftExploiter',
    cost: number
  ) => {
    const s = stateRef.current;
    if (s.quantumBits < cost) return;

    audio.playUpgradeSound();

    setDepthState((prev) => {
      const nextTree = { ...prev.rootTree };
      if (nodeKey === 'surgeDriftExploiter') {
        nextTree.surgeDriftExploiter = true;
      } else {
        nextTree[nodeKey] = (nextTree[nodeKey] as number) + 1;
      }

      return {
        ...prev,
        quantumBits: prev.quantumBits - cost,
        rootTree: nextTree,
      };
    });
  };

  const handleToggleDaemon = (slotIndex: number, daemonId: DaemonId) => {
    audio.playUpgradeSound();
    setDepthState((prev) => {
      const nextDaemons = [...prev.daemons] as [DaemonId, DaemonId, DaemonId, DaemonId];
      nextDaemons[slotIndex] = daemonId;
      return { ...prev, daemons: nextDaemons };
    });
  };

  const handleClaimBounty = (bountyId: string) => {
    const s = stateRef.current;
    const b = s.bounties.find((x) => x.id === bountyId);
    if (!b || !b.completed || b.claimed) return;

    audio.playUpgradeSound();

    setDepthState((prev) => {
      const nextBounties = prev.bounties.map((item) =>
        item.id === bountyId ? { ...item, claimed: true } : item
      );

      let nextBanked = prev.bankedBytes;
      let nextQbits = prev.quantumBits;

      if (b.rewardType === 'bytes') {
        const amount = b.rewardAmount * (b.id === 'bounty_surge' ? prev.osLevel : 1);
        nextBanked += amount;
      } else if (b.rewardType === 'qbits') {
        nextQbits += b.rewardAmount;
      }

      return {
        ...prev,
        bankedBytes: nextBanked,
        quantumBits: nextQbits,
        bounties: nextBounties,
      };
    });
  };

  const handleClaimDailyMission = (missionId: string) => {
    const s = stateRef.current;
    const mission = s.dailyMissions?.missions.find((m) => m.id === missionId);
    if (!mission || !mission.completed || mission.claimed) return;

    audio.playUpgradeSound();
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch {}

    const rewardBytes = calculateMissionRewardBytes(mission.baseRewardBytes, s.osLevel);
    const rewardQBits = calculateMissionRewardQBits(mission.baseRewardQBits, s.osLevel);

    setDepthState((prev) => ({
      ...prev,
      bankedBytes: prev.bankedBytes + rewardBytes,
      quantumBits: prev.quantumBits + rewardQBits,
      dailyMissions: {
        ...prev.dailyMissions,
        missions: prev.dailyMissions.missions.map((m) =>
          m.id === missionId ? { ...m, claimed: true } : m
        ),
      },
      aria: {
        ...prev.aria,
        mood: 'proud',
        message: `Daily mission "${mission.name}" claimed! +${rewardBytes.toLocaleString()} Bytes credited.`,
      },
    }));
  };

  const handleClaimDailyAllClear = () => {
    const s = stateRef.current;
    if (!s.dailyMissions || s.dailyMissions.allClearClaimed) return;
    const allDone = s.dailyMissions.missions.every((m) => m.completed);
    if (!allDone) return;

    audio.playUpgradeSound();
    try {
      confetti({ particleCount: 100, spread: 100, origin: { y: 0.6 } });
    } catch {}

    const bonus = calculateAllClearBonus(s.osLevel);

    setDepthState((prev) => ({
      ...prev,
      bankedBytes: prev.bankedBytes + bonus.bytes,
      quantumBits: prev.quantumBits + bonus.qbits,
      dailyMissions: {
        ...prev.dailyMissions,
        allClearClaimed: true,
      },
      aria: {
        ...prev.aria,
        mood: 'proud',
        message: `DAILY ALL-CLEAR PROTOCOL COMPLETE! Massive dividend of +${bonus.bytes.toLocaleString()} Bytes & +${bonus.qbits} Q-Bits secured!`,
      },
    }));
  };

  // Meta Layer Actions
  const handlePledgeFaction = (factionId: FactionId) => {
    audio.playUpgradeSound();
    setDepthState((prev) => ({
      ...prev,
      faction: factionId,
      aria: {
        ...prev.aria,
        mood: 'proud',
        message: `Corporate allegiance pledged to ${factionId.toUpperCase()}! Corporate perks active.`,
      },
    }));
  };

  const handleToggleEquipHardware = (id: string) => {
    audio.playUpgradeSound();
    setDepthState((prev) => ({
      ...prev,
      collectibles: prev.collectibles.map((c) =>
        c.id === id ? { ...c, equipped: !c.equipped } : c
      ),
    }));
  };

  const handleClaimSeasonTier = (tier: number) => {
    audio.playUpgradeSound();
    setDepthState((prev) => {
      let nextBanked = prev.bankedBytes;
      let nextQbits = prev.quantumBits;
      const nextUnlockedThemes = [...prev.unlockedThemes];
      const nextUnlockedTitles = [...prev.unlockedTitles];

      if (tier === 1) nextBanked += 2500;
      else if (tier === 2) nextUnlockedTitles.push('Phosphor Enthusiast');
      else if (tier === 3) nextBanked += 10000;
      else if (tier === 4) nextQbits += 15;
      else if (tier === 6) nextUnlockedTitles.push('Thermal Vanguard');
      else if (tier === 7) nextBanked += 50000;
      else if (tier === 8) nextQbits += 35;
      else if (tier === 10) nextUnlockedThemes.push('holographic_aurora');

      return {
        ...prev,
        bankedBytes: nextBanked,
        quantumBits: nextQbits,
        unlockedThemes: nextUnlockedThemes,
        unlockedTitles: nextUnlockedTitles,
        claimedSeasonTiers: [...prev.claimedSeasonTiers, tier],
      };
    });
  };

  const handleConfirmSelection = (faction: FactionId, relicId: string, bonus: number) => {
    audio.playUpgradeSound();
    setDepthState((prev) => ({
      ...prev,
      faction,
      bankedBytes: prev.bankedBytes + bonus,
      collectibles: prev.collectibles.map((c) => ({
        ...c,
        unlocked: c.id === relicId ? true : c.unlocked,
        equipped: c.id === relicId ? true : c.equipped,
      })),
      aria: {
        ...prev.aria,
        mood: 'proud',
        message: `Welcome to ${faction.toUpperCase()}! Loadout verified. +${bonus.toLocaleString()} bonus bytes credited.`,
      },
    }));
    setGameState('playing');
    audio.ensureContext();
    try {
      if (localStorage.getItem('depthos_tutorial_completed') !== 'true') {
        setActiveModal('tutorial');
      } else {
        setActiveModal('none');
      }
    } catch {
      setActiveModal('none');
    }
  };

  const handleUpdateOperatorTag = (tag: string) => {
    audio.playUpgradeSound();
    setDepthState((prev) => ({ ...prev, operatorTag: tag }));
  };

  const handleEquipTitle = (title: string) => {
    audio.playUpgradeSound();
    setDepthState((prev) => ({ ...prev, activeTitle: title }));
  };

  const handleContributeQBits = (amt: number) => {
    const s = stateRef.current;
    if (s.quantumBits < amt) return;
    audio.playUpgradeSound();
    setDepthState((prev) => {
      const nextContributed = prev.singularityContributedQBits + amt;
      const unlocked = nextContributed >= 1000;
      const nextTitles = [...prev.unlockedTitles];
      if (unlocked && !nextTitles.includes('Singularity Architect')) {
        nextTitles.push('Singularity Architect');
      }

      return {
        ...prev,
        quantumBits: prev.quantumBits - amt,
        singularityContributedQBits: nextContributed,
        singularityUnlocked: unlocked,
        unlockedTitles: nextTitles,
        aria: {
          ...prev.aria,
          mood: 'proud',
          message: `Channeled ${amt} Q-Bits into the Singularity Core! Progress: ${Math.min(100, (nextContributed / 1000) * 100).toFixed(1)}%.`,
        },
      };
    });
  };

  const handleAriaInteract = () => {
    audio.ensureContext();
    audio.playUpgradeSound();
    const responses = [
      "I'm keeping our clock cycles synchronized. You're doing great, Operator!",
      "Fun fact: at 99.0°C, our silicon is literally singing at 10.0x throughput!",
      "Remember to watch RAM buffer limits. A buffer stall is worse than losing pace.",
      "CryoDyn or Overvolt? Either way, you look sharp managing this terminal.",
      "Thanks for checking in on me! +10 A.R.I.A. Affinity XP!",
    ];
    const msg = responses[Math.floor(Math.random() * responses.length)];
    setDepthState((prev) => ({
      ...prev,
      aria: {
        ...prev.aria,
        message: msg,
        affinityXP: prev.aria.affinityXP + 10,
      },
    }));
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat && e.code !== 'Space') return;

      if (gameState === 'title') {
        if (e.code === 'Enter' || e.code === 'Space') {
          setGameState('playing');
          audio.ensureContext();
        }
        return;
      }

      if (e.code === 'Escape') {
        setActiveModal((prev) => (prev !== 'none' ? 'none' : 'settings'));
        return;
      }

      if (activeModal !== 'none') return;

      if (e.code === 'KeyE') {
        handleEmergencyVent();
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleProcessClick();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        handleStartFlush();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyF') {
        handleCancelFlush();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, activeModal]);

  const handleSelectCameraPreset = (preset: 'desk' | 'monitor' | 'motherboard') => {
    setCameraPreset(preset);
    if (sceneCtrlRef.current) {
      sceneCtrlRef.current.setCameraPreset(preset);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white select-none">
      {/* 3D WebGL Canvas Mount Container */}
      <div ref={threeMountRef} className="absolute inset-0 z-0" />

      {/* Procedural High-Frequency Thermal Grain Overlay (Scales with CPU Temp) */}
      <ThermalGrainOverlay heat={depthState.heat} isBSOD={depthState.isBSOD} />

      {/* High-Contrast THERMAL WARNING Overlay (Flashes above 85% with increasing frequency) */}
      <ThermalWarningOverlay heat={depthState.heat} isBSOD={depthState.isBSOD} />

      {/* Rare System Event Notification Banner */}
      {depthState.activeEvent && <EventNotificationBanner event={depthState.activeEvent} />}

      {/* Title Screen Game Shell */}
      {gameState === 'title' && (
        <TitleScreen
          onStartGame={() => {
            if (depthState.faction === 'unaligned') {
              setActiveModal('selection');
            } else {
              setGameState('playing');
              audio.ensureContext();
              try {
                if (localStorage.getItem('depthos_tutorial_completed') !== 'true') {
                  setActiveModal('tutorial');
                }
              } catch {}
            }
          }}
          onOpenRobloxExport={() => setActiveModal('roblox')}
          onOpenSelection={() => setActiveModal('selection')}
        />
      )}

      {/* Main Playing Interface (Direct Diegetic Terminal Over 3D Scene) */}
      {gameState === 'playing' && (
        <>
          <DepthOSDesktop
            state={depthState}
            onProcessClick={handleProcessClick}
            onStartFlush={handleStartFlush}
            onCancelFlush={handleCancelFlush}
            onEmergencyVent={handleEmergencyVent}
            onPurchaseUpgrade={handlePurchaseUpgrade}
            onOpenPrestige={() => setActiveModal('prestige')}
            onOpenDaemons={() => setActiveModal('daemons')}
            onOpenBounties={() => setActiveModal('bounties')}
            onOpenRobloxExport={() => setActiveModal('roblox')}
            onOpenSettings={() => setActiveModal('settings')}
            onOpenFactions={() => setActiveModal('factions')}
            onOpenVault={() => setActiveModal('vault')}
            onOpenSeasonPass={() => setActiveModal('season')}
            onOpenProfile={() => setActiveModal('profile')}
            onOpenSingularity={() => setActiveModal('singularity')}
            onToggle3DView={() => setIs3DFullscreen(!is3DFullscreen)}
            is3DFullscreen={is3DFullscreen}
          />

          {/* A.R.I.A. AI Companion Assistant */}
          <AriaAssistant
            aria={depthState.aria}
            heat={depthState.heat}
            isBSOD={depthState.isBSOD}
            onInteract={handleAriaInteract}
          />
        </>
      )}

      {/* Viral Clutch Moment Modal */}
      {depthState.lastClutchAlert && (
        <ViralClutchModal
          temp={depthState.lastClutchAlert.temp}
          payout={depthState.lastClutchAlert.payout}
          onClose={() => setDepthState((prev) => ({ ...prev, lastClutchAlert: null }))}
        />
      )}

      {/* BSOD Overheat Crash Overlay */}
      {depthState.isBSOD && <BSODOverlay countdown={depthState.bsodCountdown} />}

      {/* Modals */}
      {activeModal === 'prestige' && (
        <PrestigeModal
          state={depthState}
          onClose={() => setActiveModal('none')}
          onInitiateReset={handleInitiateReset}
          onUpgradeNode={handleUpgradeRootNode}
        />
      )}

      {activeModal === 'daemons' && (
        <DaemonsModal
          state={depthState}
          onClose={() => setActiveModal('none')}
          onToggleDaemon={handleToggleDaemon}
        />
      )}

      {activeModal === 'bounties' && (
        <BountiesAndAchievementsModal
          state={depthState}
          onClose={() => setActiveModal('none')}
          onClaimBounty={handleClaimBounty}
          onClaimDailyMission={handleClaimDailyMission}
          onClaimAllClear={handleClaimDailyAllClear}
        />
      )}

      {activeModal === 'roblox' && (
        <RobloxExporterModal onClose={() => setActiveModal('none')} />
      )}

      {activeModal === 'factions' && (
        <FactionsModal
          state={depthState}
          onPledgeFaction={handlePledgeFaction}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'vault' && (
        <HardwareVaultModal
          collectibles={depthState.collectibles}
          onToggleEquip={handleToggleEquipHardware}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'season' && (
        <SeasonPassModal
          state={depthState}
          onClaimTier={handleClaimSeasonTier}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'profile' && (
        <PlayerProfileModal
          state={depthState}
          onUpdateOperatorTag={handleUpdateOperatorTag}
          onEquipTitle={handleEquipTitle}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'singularity' && (
        <SingularityProjectModal
          state={depthState}
          onContributeQBits={handleContributeQBits}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'selection' && (
        <SelectionModal
          state={depthState}
          onConfirmSelection={handleConfirmSelection}
          onClose={() => {
            setActiveModal('none');
            if (gameState === 'title') {
              setGameState('playing');
              audio.ensureContext();
            }
          }}
        />
      )}

      {activeModal === 'settings' && (
        <SettingsAndThemesModal
          currentTheme={depthState.activeTheme}
          currentSoundpack={depthState.soundpack}
          isMuted={depthState.isMuted}
          sfxVolume={depthState.sfxVolume}
          musicVolume={depthState.musicVolume}
          cameraPreset={cameraPreset}
          onSelectTheme={(theme: OSTheme) =>
            setDepthState((prev) => ({ ...prev, activeTheme: theme }))
          }
          onSelectSoundpack={(soundpack: KeyboardSoundpack) =>
            setDepthState((prev) => ({ ...prev, soundpack }))
          }
          onToggleMute={() => {
            const muted = audio.toggleMute();
            setDepthState((prev) => ({ ...prev, isMuted: muted }));
          }}
          onChangeVolume={(sfx, music) => {
            audio.setVolume(sfx, music);
            setDepthState((prev) => ({ ...prev, sfxVolume: sfx, musicVolume: music }));
          }}
          onSelectCameraPreset={handleSelectCameraPreset}
          onRestartTutorial={() => setActiveModal('tutorial')}
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* Operator Academy Quick Tutorial Modal */}
      {activeModal === 'tutorial' && (
        <TutorialModal
          onClose={() => setActiveModal('none')}
          onComplete={() => setActiveModal('none')}
        />
      )}
    </div>
  );
}
