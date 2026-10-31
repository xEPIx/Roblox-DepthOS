import { DepthOSState, HardwareState, RootTreeState, RareSystemEvent, CollectibleHardwareItem, DailyMissionItem } from '../types/depthos';

export const AMBIENT_TEMP = 25.0;
export const CRITICAL_TEMP = 100.0;
export const BASE_SURGE_TEMP = 85.0;
export const TICK_DELTA_TIME = 0.1;

export function getSurgeThreshold(rootTree: RootTreeState): number {
  return rootTree.surgeDriftExploiter ? 80.0 : BASE_SURGE_TEMP;
}

export function calculateThermalMultiplier(heat: number, rootTree: RootTreeState, faction: string): number {
  const surgeTemp = getSurgeThreshold(rootTree);
  let baseMult = 1.0;
  if (heat < 70.0) baseMult = 1.0;
  else if (heat < surgeTemp) baseMult = 1.25;
  else if (heat >= CRITICAL_TEMP) baseMult = 10.0;
  else {
    const normalized = (heat - surgeTemp) / (CRITICAL_TEMP - surgeTemp);
    baseMult = 3.0 + 7.0 * Math.pow(normalized, 2);
  }

  // Overvolt Faction bonus (+15% surge multiplier)
  if (faction === 'overvolt' && heat >= surgeTemp) {
    baseMult *= 1.15;
  }

  return baseMult;
}

export function calculateBytesPerProcess(state: DepthOSState): number {
  const cpuLevel = state.hardware.cpuLevel;
  const baseBytes = 1 + (cpuLevel - 1) * 2;
  let thermalMult = calculateThermalMultiplier(state.heat, state.rootTree, state.faction);
  const qbitPrestigeMult = state.rootTree.superconductorBus * 0.15;

  // Rare Event: Solar Flare (+100% bytes)
  if (state.activeEvent?.type === 'solar_flare') {
    thermalMult *= 2.0;
  }

  return Math.round(baseBytes * thermalMult * (1 + qbitPrestigeMult));
}

export function calculateHeatPerProcess(state: DepthOSState): number {
  // If Cryo Leak event is active, zero heat generation
  if (state.activeEvent?.type === 'cryo_leak') return 0;

  const hBase = 2.50;
  const cpuFactor = 1 + state.hardware.cpuLevel / 8;
  const pasteEfficiency = Math.min(0.40, state.hardware.thermalPasteLevel * 0.05);
  return hBase * cpuFactor * (1 - pasteEfficiency);
}

export function calculateRamCost(bytesGenerated: number): number {
  return 2.0 * (1 + bytesGenerated / 500);
}

export function calculateMaxRam(ramLevel: number): number {
  return 64 + (ramLevel - 1) * 64;
}

export function calculatePassiveCoolingRate(state: DepthOSState): number {
  const hardwareCooling = (state.hardware.coolingLevel - 1) * 1.8;
  const rootCooling = state.rootTree.cryogenicSubstrate * 3.0;
  let totalRate = 4.0 + hardwareCooling + rootCooling;

  // CryoDyn Faction bonus (+15% cooling)
  if (state.faction === 'cryodyn') {
    totalRate *= 1.15;
  }

  // Solar flare event penalty (-40% cooling)
  if (state.activeEvent?.type === 'solar_flare') {
    totalRate *= 0.6;
  }

  return totalRate;
}

export function calculateFlushDuration(state: DepthOSState): number {
  const ramRatio = state.ramMaxMB > 0 ? state.ramUsedMB / state.ramMaxMB : 0;
  let busSpeedReduction = Math.min(0.70, (state.hardware.busLevel - 1) * 0.07);

  // AetherBus Faction bonus (-20% channel time)
  if (state.faction === 'aetherbus') {
    busSpeedReduction = Math.min(0.85, busSpeedReduction + 0.20);
  }

  return Math.max(0.2, 1.50 * ramRatio * (1 - busSpeedReduction));
}

export function calculateFlushPayout(state: DepthOSState): number {
  let busBonus = (state.hardware.busLevel - 1) * 0.05;

  // Bull Run event bonus (+100% dividend)
  if (state.activeEvent?.type === 'bull_run') {
    busBonus += 1.0;
  }

  return Math.round(state.volatileBytes * (1 + busBonus));
}

export function calculateRequiredXP(level: number): number {
  return Math.round(50 * Math.pow(level, 2.65));
}

export function calculatePrestigeQBits(lifetimeBankedBytes: number): number {
  return Math.floor(10 * Math.sqrt(lifetimeBankedBytes / 25000));
}

// Upgrade Cost Formulas
export function getCpuUpgradeCost(level: number): number {
  return Math.round(15 * Math.pow(1.58, level - 1));
}

export function getRamUpgradeCost(level: number): number {
  return Math.round(20 * Math.pow(1.45, level - 1));
}

export function getCoolingUpgradeCost(level: number): number {
  return Math.round(25 * Math.pow(1.52, level - 1));
}

export function getBusUpgradeCost(level: number): number {
  return Math.round(50 * Math.pow(1.72, level - 1));
}

export function getThermalPasteCost(level: number): number {
  return Math.round(100 * Math.pow(2.10, level));
}

export const INITIAL_COLLECTIBLES: CollectibleHardwareItem[] = [
  {
    id: 'quantum_core_v9',
    name: 'Quantum Core v9 Prototype',
    category: 'core',
    rarity: 'mythic',
    description: 'Experimental sub-atomic processor die extracted from the Singularity Lab.',
    effectLabel: '+10% Base Byte Yield',
    unlocked: false,
    equipped: false,
  },
  {
    id: 'gold_heatpipe',
    name: '24K Gold Sintered Heatpipe',
    category: 'cooling',
    rarity: 'legendary',
    description: 'Ultra-conductive vapor chamber crafted with electroplated 24K gold.',
    effectLabel: '+2.5°C/s Passive Cooling',
    unlocked: false,
    equipped: false,
  },
  {
    id: 'floppy_drive',
    name: 'Vintage 3.5" Floppy Relic',
    category: 'relic',
    rarity: 'rare',
    description: 'Preserved 1.44MB magnetic storage disk containing ancestral OS source.',
    effectLabel: '+50 Starting Banked Bytes on Reboot',
    unlocked: true,
    equipped: true,
  },
  {
    id: 'rgb_braided',
    name: 'Chroma Braided Cable Harness',
    category: 'chassis',
    rarity: 'epic',
    description: 'High-density woven power cables pulsing with prismatic spectrum LEDs.',
    effectLabel: 'Cosmetic Battlestation Glow',
    unlocked: false,
    equipped: false,
  },
  {
    id: 'neon_coolant',
    name: 'Cryogenic Liquid Neon Coolant',
    category: 'cooling',
    rarity: 'epic',
    description: 'Phosphorescent sub-zero fluid glowing with electric blue luminescence.',
    effectLabel: '+5s Emergency Cryo Vent Cooldown Reduction',
    unlocked: false,
    equipped: false,
  },
];

export function generateDailyMissions(osLevel: number): DailyMissionItem[] {
  const scaledByteTarget = Math.max(2000, Math.round(3000 * Math.pow(Math.max(1, osLevel), 0.9)));
  return [
    {
      id: 'daily_surge_rider',
      name: 'Thermal Redline Sustained',
      description: 'Remain within Thermal Surge (85°C–99.9°C) for cumulative seconds without crashing',
      type: 'surge_time',
      difficulty: 'medium',
      progress: 0,
      target: 45,
      unit: 's',
      baseRewardBytes: 600,
      baseRewardQBits: 5,
      completed: false,
      claimed: false,
    },
    {
      id: 'daily_cache_titan',
      name: 'High-Volume Cashout',
      description: `Bank a cumulative total of ${scaledByteTarget.toLocaleString()} Bytes from cache flushes`,
      type: 'bank_bytes',
      difficulty: 'easy',
      progress: 0,
      target: scaledByteTarget,
      unit: 'B',
      baseRewardBytes: 800,
      baseRewardQBits: 0,
      completed: false,
      claimed: false,
    },
    {
      id: 'daily_precision_exhaust',
      name: 'Redline Flush Protocol',
      description: 'Execute 4 successful cache flushes strictly at 95.0°C or higher',
      type: 'high_temp_flush',
      difficulty: 'hard',
      progress: 0,
      target: 4,
      unit: 'flushes',
      baseRewardBytes: 1400,
      baseRewardQBits: 10,
      completed: false,
      claimed: false,
    },
    {
      id: 'daily_silicon_hammer',
      name: 'High-Frequency Clocking',
      description: 'Execute 60 manual process workload cycles',
      type: 'manual_clicks',
      difficulty: 'easy',
      progress: 0,
      target: 60,
      unit: 'cycles',
      baseRewardBytes: 450,
      baseRewardQBits: 2,
      completed: false,
      claimed: false,
    },
  ];
}

export function calculateMissionRewardBytes(baseBytes: number, osLevel: number): number {
  return Math.round(baseBytes * (1 + osLevel * 0.85));
}

export function calculateMissionRewardQBits(baseQBits: number, osLevel: number): number {
  if (baseQBits <= 0) return 0;
  return Math.round(baseQBits + Math.floor(osLevel / 2));
}

export function calculateAllClearBonus(osLevel: number): { bytes: number; qbits: number } {
  return {
    bytes: 3500 * Math.max(1, osLevel),
    qbits: Math.max(12, Math.round(osLevel * 2)),
  };
}

export function createInitialDepthOSState(): DepthOSState {
  return {
    volatileBytes: 0,
    bankedBytes: 0,
    lifetimeBankedBytes: 0,
    quantumBits: 0,

    heat: AMBIENT_TEMP,
    ramUsedMB: 0,
    ramMaxMB: 64,

    osLevel: 1,
    currentXP: 0,
    requiredXP: calculateRequiredXP(1),
    prestigeCount: 0,

    hardware: {
      cpuLevel: 1,
      ramLevel: 1,
      coolingLevel: 1,
      busLevel: 1,
      thermalPasteLevel: 0,
    },

    daemons: ['none', 'none', 'none', 'none'],

    rootTree: {
      superconductorBus: 0,
      cryogenicSubstrate: 0,
      nonVolatileRegisters: 0,
      surgeDriftExploiter: false,
    },

    isBufferStalled: false,
    isFlushing: false,
    flushProgress: 0,
    isBSOD: false,
    bsodCountdown: 0,
    emergencyVentCooldown: 0,

    // A.R.I.A. Companion
    aria: {
      mood: 'calm',
      message: "A.R.I.A. online. Core temperature nominal at 25.0°C. Let's process some bytes, Operator.",
      affinityLevel: 1,
      affinityXP: 0,
    },

    // Factions
    faction: 'unaligned',
    factionReputation: 0,
    factionRank: 1,

    // Identity
    operatorTag: 'Operator_Echo',
    activeTitle: 'Silicon Novice',
    unlockedTitles: ['Silicon Novice', 'Faulty Capacitor'],

    // Collectibles & Themes
    collectibles: INITIAL_COLLECTIBLES,
    unlockedThemes: ['cyber_green', 'amber_phosphor', 'midnight_matrix'],
    activeTheme: 'cyber_green',
    soundpack: 'cherry_blue',

    // Season Progression
    seasonLevel: 1,
    seasonXP: 0,
    claimedSeasonTiers: [],

    // Rare Events
    activeEvent: null,
    eventCooldownTimer: 35.0,

    // Viral Clutch
    lastClutchAlert: null,

    // Singularity Project
    singularityContributedQBits: 0,
    singularityUnlocked: false,

    isMuted: false,
    sfxVolume: 0.7,
    musicVolume: 0.4,

    totalCrashes: 0,
    successfulFlushes: 0,
    maxSurgeDuration: 0,
    currentSurgeTimer: 0,

    bounties: [
      {
        id: 'bounty_surge',
        name: 'Riding the Lightning',
        description: 'Remain within Thermal Surge (85°C–99.9°C) for 120s without crashing',
        progress: 0,
        target: 120,
        unit: 's',
        rewardType: 'bytes',
        rewardAmount: 500,
        completed: false,
        claimed: false,
      },
      {
        id: 'bounty_flush_danger',
        name: 'Precision Exhaust',
        description: 'Execute 15 successful Flushes strictly above 95.0°C',
        progress: 0,
        target: 15,
        unit: 'flushes',
        rewardType: 'qbits',
        rewardAmount: 25,
        completed: false,
        claimed: false,
      },
      {
        id: 'bounty_stress_test',
        name: 'Stress Test Complete',
        description: 'Trigger 3 BSODs, pushing the limits of the silicon',
        progress: 0,
        target: 3,
        unit: 'crashes',
        rewardType: 'bytes',
        rewardAmount: 2000,
        completed: false,
        claimed: false,
      },
    ],

    dailyMissions: {
      missions: generateDailyMissions(1),
      lastResetTimestamp: Date.now(),
      allClearClaimed: false,
    },

    achievements: [
      {
        id: 'first_smoke',
        codename: 'First Smoke',
        condition: 'Trigger your first 100.0°C BSOD',
        reward: 'Title: "Faulty Capacitor"',
        unlocked: false,
      },
      {
        id: 'living_on_edge',
        codename: 'Living on Edge',
        condition: 'Flush Cache successfully at 99.0°C or higher',
        reward: '+1.0% Global Thermal Multiplier',
        unlocked: false,
      },
      {
        id: 'clean_register',
        codename: 'Clean Register',
        condition: 'Bank 10,000 Bytes in a single Flush',
        reward: '+5% Bus Payout Dividend',
        unlocked: false,
      },
      {
        id: 'sub_zero_maestro',
        codename: 'Sub-Zero Maestro',
        condition: 'Use Emergency Cryo Vent at 95°C+',
        reward: '+2.0°C/sec Base Passive Cooling',
        unlocked: false,
      },
      {
        id: 'deep_kernel_walk',
        codename: 'Deep Kernel Walk',
        condition: 'Execute your first Kernel Reset (Level 10+)',
        reward: 'Shell: "Midnight Matrix Dark"',
        unlocked: false,
      },
      {
        id: 'silicon_god',
        codename: 'Silicon God',
        condition: 'Reach OS Level 25',
        reward: 'Shell: "Holographic Aurora OS"',
        unlocked: false,
      },
    ],
  };
}

const RARE_EVENTS_POOL: Array<Omit<RareSystemEvent, 'timeRemaining'>> = [
  {
    id: 'solar_flare',
    title: 'SOLAR FLARE INTERFERENCE',
    description: 'Radiation storm detected! Cooling halved, but byte yields are DOUBLED (2.0x)!',
    type: 'solar_flare',
    durationSeconds: 25.0,
  },
  {
    id: 'cryo_leak',
    title: 'SUB-ZERO CRYO CASCADE',
    description: 'Coolant line breach! Core frozen at 25.0°C — UNLIMITED zero-heat processing!',
    type: 'cryo_leak',
    durationSeconds: 15.0,
  },
  {
    id: 'bull_run',
    title: 'CRYPTO MEMORY BULL RUN',
    description: 'High-frequency trading spike! Next cache flushes award +100% BANKED DIVIDENDS!',
    type: 'bull_run',
    durationSeconds: 30.0,
  },
];

export function stepSimulation(state: DepthOSState, dt: number = TICK_DELTA_TIME): DepthOSState {
  const next = { ...state };

  // Emergency vent cooldown
  if (next.emergencyVentCooldown > 0) {
    next.emergencyVentCooldown = Math.max(0, next.emergencyVentCooldown - dt);
  }

  // Rare Event Timer & Triggering
  if (next.activeEvent) {
    next.activeEvent.timeRemaining -= dt;
    if (next.activeEvent.timeRemaining <= 0) {
      next.activeEvent = null;
      next.eventCooldownTimer = 45.0 + Math.random() * 45.0; // Next event in 45-90s
    }
  } else {
    next.eventCooldownTimer -= dt;
    if (next.eventCooldownTimer <= 0) {
      // Pick random event
      const picked = RARE_EVENTS_POOL[Math.floor(Math.random() * RARE_EVENTS_POOL.length)];
      next.activeEvent = {
        ...picked,
        timeRemaining: picked.durationSeconds,
      };
      next.aria.mood = 'surge_hype';
      next.aria.message = `ALERT: ${picked.title}! ${picked.description}`;
    }
  }

  // BSOD Lockout
  if (next.isBSOD) {
    next.bsodCountdown -= dt;
    next.aria.mood = 'crashed';
    next.aria.message = "...Ouch. System thermal limit breached. Don't worry, Operator, 5-second reboot sequence is running.";
    if (next.bsodCountdown <= 0) {
      next.isBSOD = false;
      next.bsodCountdown = 0;
      next.heat = AMBIENT_TEMP;
      next.ramUsedMB = 0;
      next.isBufferStalled = false;
      next.aria.mood = 'calm';
      next.aria.message = "System normalized. Ready for another cycle. Pace your flushes this time!";
    }
    return next;
  }

  // Flushing handling
  if (next.isFlushing) {
    const requiredDuration = calculateFlushDuration(next);
    next.flushProgress += dt / requiredDuration;

    // Passive cooling continues during flush
    const rCool = calculatePassiveCoolingRate(next);
    const heatDifferential = (next.heat - AMBIENT_TEMP) / (CRITICAL_TEMP - AMBIENT_TEMP);
    const newtonMultiplier = 1 + 0.5 * Math.max(0, heatDifferential);
    next.heat = Math.max(AMBIENT_TEMP, next.heat - rCool * newtonMultiplier * dt);

    if (next.flushProgress >= 1.0) {
      // Flush completes successfully
      const payout = calculateFlushPayout(next);
      next.bankedBytes += payout;
      next.lifetimeBankedBytes += payout;
      next.currentXP += payout;

      // Faction XP & Season XP
      if (next.faction !== 'unaligned') {
        next.factionReputation += Math.round(payout / 10);
        if (next.factionReputation >= next.factionRank * 500) {
          next.factionRank += 1;
        }
      }

      // Season XP
      next.seasonXP += Math.round(payout / 20);
      while (next.seasonXP >= next.seasonLevel * 200 && next.seasonLevel < 30) {
        next.seasonXP -= next.seasonLevel * 200;
        next.seasonLevel += 1;
      }

      // Check level ups
      while (next.currentXP >= next.requiredXP && next.osLevel < 100) {
        next.currentXP -= next.requiredXP;
        next.osLevel += 1;
        next.requiredXP = calculateRequiredXP(next.osLevel);
      }

      // Viral Clutch Moment Detection (Flushed above 97.0°C)
      if (next.heat >= 97.0) {
        next.lastClutchAlert = {
          temp: next.heat,
          payout,
          timestamp: Date.now(),
        };
        next.aria.mood = 'proud';
        next.aria.message = `LEGENDARY CLUTCH! Flushed at ${next.heat.toFixed(1)}°C for +${payout.toLocaleString()} Bytes! My circuits are screaming!`;
        next.aria.affinityXP += 50;
      } else {
        next.aria.mood = 'proud';
        next.aria.message = `Cache secured! Banked +${payout.toLocaleString()} Bytes safely into permanent storage.`;
        next.aria.affinityXP += 10;
      }

      // A.R.I.A. affinity level up
      if (next.aria.affinityXP >= next.aria.affinityLevel * 100) {
        next.aria.affinityXP -= next.aria.affinityLevel * 100;
        next.aria.affinityLevel += 1;
      }

      // Bounties & achievements
      if (next.heat >= 95.0) {
        const b = next.bounties.find((x) => x.id === 'bounty_flush_danger');
        if (b && !b.completed) {
          b.progress += 1;
          if (b.progress >= b.target) b.completed = true;
        }
      }

      if (next.heat >= 99.0) {
        const ach = next.achievements.find((x) => x.id === 'living_on_edge');
        if (ach) ach.unlocked = true;
      }

      if (payout >= 10000) {
        const ach = next.achievements.find((x) => x.id === 'clean_register');
        if (ach) ach.unlocked = true;
      }

      // Daily Missions Progress on Flush
      if (next.dailyMissions && next.dailyMissions.missions) {
        next.dailyMissions.missions.forEach((m) => {
          if (m.type === 'bank_bytes' && !m.completed) {
            m.progress = Math.min(m.target, m.progress + payout);
            if (m.progress >= m.target) m.completed = true;
          } else if (m.type === 'high_temp_flush' && next.heat >= 95.0 && !m.completed) {
            m.progress = Math.min(m.target, m.progress + 1);
            if (m.progress >= m.target) m.completed = true;
          }
        });
      }

      next.successfulFlushes += 1;
      next.volatileBytes = 0;
      next.ramUsedMB = 0;
      next.isBufferStalled = false;
      next.isFlushing = false;
      next.flushProgress = 0;
    }
    return next;
  }

  // Passive Cooling Dissipation via Newton's Law of Cooling
  const rCool = calculatePassiveCoolingRate(next);
  const heatDifferential = (next.heat - AMBIENT_TEMP) / (CRITICAL_TEMP - AMBIENT_TEMP);
  const newtonMultiplier = 1 + 0.5 * Math.max(0, heatDifferential);
  next.heat = Math.max(AMBIENT_TEMP, next.heat - rCool * newtonMultiplier * dt);

  // Thermal Surge tracking & A.R.I.A. reactions
  const surgeTemp = getSurgeThreshold(next.rootTree);
  if (next.heat >= surgeTemp && next.heat < CRITICAL_TEMP) {
    next.currentSurgeTimer += dt;
    if (next.currentSurgeTimer > next.maxSurgeDuration) {
      next.maxSurgeDuration = next.currentSurgeTimer;
    }

    if (next.heat >= 98.0) {
      next.aria.mood = 'panic';
      next.aria.message = "WARNING! 98°C+ EXTREME CRITICAL! FLUSH NOW OR FACE BSOD MELTDOWN!";
    } else {
      next.aria.mood = 'surge_hype';
      next.aria.message = "THERMAL SURGE ENGAGED! Payout multipliers are spiking! Ride the wave!";
    }

    const b = next.bounties.find((x) => x.id === 'bounty_surge');
    if (b && !b.completed) {
      b.progress = Math.min(b.target, b.progress + dt);
      if (b.progress >= b.target) b.completed = true;
    }

    if (next.dailyMissions && next.dailyMissions.missions) {
      next.dailyMissions.missions.forEach((m) => {
        if (m.type === 'surge_time' && !m.completed) {
          m.progress = Math.min(m.target, m.progress + dt);
          if (m.progress >= m.target) m.completed = true;
        }
      });
    }
  } else if (next.heat >= 70.0) {
    next.aria.mood = 'warning';
    next.aria.message = "Chassis fans spinning up. Heat approaching 70°C. Prepare for Surge band.";
    next.currentSurgeTimer = 0;
  } else {
    if (next.aria.mood !== 'proud' && next.aria.mood !== 'calm') {
      next.aria.mood = 'calm';
      next.aria.message = "Core temperature nominal. Systems operating at peak efficiency.";
    }
    next.currentSurgeTimer = 0;
  }

  // Daemons Automation logic
  const hasMiner = next.daemons.includes('miner_d') && next.osLevel >= 5;
  const hasFlushDaemon = next.daemons.includes('flush_d') && next.osLevel >= 20;
  const hasGovernor = next.daemons.includes('governor_d') && next.osLevel >= 40;

  if (hasMiner && !next.isBufferStalled) {
    let shouldMine = true;
    if (hasGovernor && next.heat > 97.0) {
      shouldMine = false;
    }

    if (shouldMine) {
      const generated = Math.round(calculateBytesPerProcess(next) * 0.2);
      const heatAdded = calculateHeatPerProcess(next) * 0.2;
      const ramCost = calculateRamCost(generated) * 0.2;

      if (next.ramUsedMB + ramCost > next.ramMaxMB) {
        next.isBufferStalled = true;
      } else {
        next.volatileBytes += generated;
        next.ramUsedMB = Math.min(next.ramMaxMB, next.ramUsedMB + ramCost);
        next.heat += heatAdded;
      }
    }
  }

  if (hasFlushDaemon && !next.isFlushing && next.volatileBytes > 0) {
    const ramRatio = next.ramUsedMB / next.ramMaxMB;
    if (ramRatio >= 0.90 || next.heat >= 96.0) {
      next.isFlushing = true;
      next.flushProgress = 0;
    }
  }

  // Check Overheat Crash: 100°C reached!
  if (next.heat >= CRITICAL_TEMP) {
    next.isBSOD = true;
    next.bsodCountdown = 5.0;
    next.volatileBytes = 0;
    next.ramUsedMB = 0;
    next.isBufferStalled = false;
    next.isFlushing = false;
    next.flushProgress = 0;
    next.totalCrashes += 1;
    next.currentSurgeTimer = 0;

    const ach = next.achievements.find((x) => x.id === 'first_smoke');
    if (ach) ach.unlocked = true;

    const b = next.bounties.find((x) => x.id === 'bounty_stress_test');
    if (b && !b.completed) {
      b.progress += 1;
      if (b.progress >= b.target) b.completed = true;
    }
  }

  return next;
}

export type BuyMultiplier = 1 | 5 | 10 | 'next_milestone' | 'max';

export interface MultiBuyResult {
  levels: number;
  totalCost: number;
  affordable: boolean;
  targetLevel: number;
}

export function calculateMultiUpgrade(
  type: 'cpu' | 'ram' | 'cooling' | 'bus' | 'paste',
  currentLevel: number,
  bankedBytes: number,
  multiplier: BuyMultiplier
): MultiBuyResult {
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

  const maxLevel = type === 'paste' ? 5 : 999;
  if (currentLevel >= maxLevel) {
    return { levels: 0, totalCost: 0, affordable: false, targetLevel: currentLevel };
  }

  let desiredCount = 1;
  if (multiplier === 5) {
    desiredCount = 5;
  } else if (multiplier === 10) {
    desiredCount = 10;
  } else if (multiplier === 'next_milestone') {
    const nextMilestone = Math.ceil((currentLevel + 1) / 5) * 5;
    desiredCount = Math.max(1, nextMilestone - currentLevel);
  } else if (multiplier === 'max') {
    let tempCost = 0;
    let count = 0;
    let testLvl = currentLevel;
    while (testLvl < maxLevel) {
      const nextCost = getSingleCost(testLvl);
      if (tempCost + nextCost <= bankedBytes) {
        tempCost += nextCost;
        count++;
        testLvl++;
      } else {
        break;
      }
    }
    if (count === 0) {
      const singleCost = getSingleCost(currentLevel);
      return {
        levels: 1,
        totalCost: singleCost,
        affordable: bankedBytes >= singleCost,
        targetLevel: currentLevel + 1,
      };
    }
    return {
      levels: count,
      totalCost: tempCost,
      affordable: true,
      targetLevel: currentLevel + count,
    };
  }

  desiredCount = Math.min(desiredCount, maxLevel - currentLevel);
  if (desiredCount <= 0) {
    return { levels: 0, totalCost: 0, affordable: false, targetLevel: currentLevel };
  }

  let totalCost = 0;
  for (let i = 0; i < desiredCount; i++) {
    totalCost += getSingleCost(currentLevel + i);
  }

  return {
    levels: desiredCount,
    totalCost,
    affordable: bankedBytes >= totalCost,
    targetLevel: currentLevel + desiredCount,
  };
}

