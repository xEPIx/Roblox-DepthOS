/**
 * DepthOS Type Definitions
 * Exact implementation of Production Game Design Document & Technical Blueprint
 * Enhanced with Roblox-style meta layer, A.R.I.A., Factions, Seasons, & Rarity
 */

export type CosmeticRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type FactionId = 'unaligned' | 'cryodyn' | 'overvolt' | 'aetherbus';

export interface CollectibleHardwareItem {
  id: string;
  name: string;
  category: 'core' | 'cooling' | 'memory' | 'chassis' | 'relic';
  rarity: CosmeticRarity;
  description: string;
  effectLabel: string;
  unlocked: boolean;
  equipped: boolean;
}

export interface SeasonTier {
  tier: number;
  requiredXP: number;
  rewardName: string;
  rewardType: 'bytes' | 'qbits' | 'theme' | 'title' | 'hardware';
  rarity: CosmeticRarity;
}

export interface RareSystemEvent {
  id: string;
  title: string;
  description: string;
  type: 'solar_flare' | 'cryo_leak' | 'bull_run';
  durationSeconds: number;
  timeRemaining: number;
}

export interface AriaState {
  mood: 'calm' | 'warning' | 'surge_hype' | 'panic' | 'crashed' | 'proud';
  message: string;
  affinityLevel: number;
  affinityXP: number;
}

export interface HardwareState {
  cpuLevel: number;        // CPU Clock (1 - 25 per tier)
  ramLevel: number;        // RAM Sticks (1 - 25 per tier)
  coolingLevel: number;    // Chassis Cooling (1 - 25 per tier)
  busLevel: number;        // Bus Buffer (1 - 10 per tier)
  thermalPasteLevel: number; // Thermal Compound (0 - 5 per tier)
}

export interface RootTreeState {
  superconductorBus: number;    // 0 - 5 ranks (+15% bytes per rank)
  cryogenicSubstrate: number;   // 0 - 5 ranks (+3.0°C/s cooling per rank)
  nonVolatileRegisters: number; // 0 - 3 ranks (retains 5% banked bytes per rank)
  surgeDriftExploiter: boolean; // Expands surge window to 80°C - 99.9°C
}

export type DaemonId = 'miner_d' | 'flush_d' | 'governor_d' | 'none';

export type MissionDifficulty = 'easy' | 'medium' | 'hard' | 'extreme';
export type MissionType =
  | 'surge_time'
  | 'bank_bytes'
  | 'high_temp_flush'
  | 'manual_clicks'
  | 'cryo_vent'
  | 'fill_ram';

export interface DailyMissionItem {
  id: string;
  name: string;
  description: string;
  type: MissionType;
  difficulty: MissionDifficulty;
  progress: number;
  target: number;
  unit: string;
  baseRewardBytes: number;
  baseRewardQBits: number;
  completed: boolean;
  claimed: boolean;
}

export interface DailyMissionsState {
  missions: DailyMissionItem[];
  lastResetTimestamp: number;
  allClearClaimed: boolean;
}

export interface BountyItem {
  id: string;
  name: string;
  description: string;
  progress: number;
  target: number;
  unit: string;
  rewardType: 'bytes' | 'qbits' | 'xp_boost';
  rewardAmount: number;
  completed: boolean;
  claimed: boolean;
}

export interface AchievementItem {
  id: string;
  codename: string;
  condition: string;
  reward: string;
  unlocked: boolean;
  progress?: number;
  target?: number;
}

export type OSTheme =
  | 'cyber_green'
  | 'amber_phosphor'
  | 'midnight_matrix'
  | 'holographic_aurora'
  | 'cryodyn_ice'
  | 'overvolt_gold'
  | 'synthwave_1984';

export type KeyboardSoundpack = 'cherry_blue' | 'ibm_model_m' | 'retro_bubble' | 'laser_synth';

export interface DepthOSState {
  // Financial Registers
  volatileBytes: number;
  bankedBytes: number;
  lifetimeBankedBytes: number;
  quantumBits: number;

  // System Vitals
  heat: number;          // 25.0°C to 100.0°C
  ramUsedMB: number;
  ramMaxMB: number;

  // Progression
  osLevel: number;
  currentXP: number;
  requiredXP: number;
  prestigeCount: number;

  // Hardware Upgrades
  hardware: HardwareState;

  // Automation Daemons
  daemons: [DaemonId, DaemonId, DaemonId, DaemonId];

  // Root Tree (Prestige)
  rootTree: RootTreeState;

  // State Flags
  isBufferStalled: boolean;
  isFlushing: boolean;
  flushProgress: number;
  isBSOD: boolean;
  bsodCountdown: number;
  emergencyVentCooldown: number;

  // AI Assistant A.R.I.A.
  aria: AriaState;

  // Faction / MegaCorp
  faction: FactionId;
  factionReputation: number;
  factionRank: number;

  // Player Identity
  operatorTag: string;
  activeTitle: string;
  unlockedTitles: string[];

  // Collectibles & Cosmetics
  collectibles: CollectibleHardwareItem[];
  unlockedThemes: OSTheme[];
  activeTheme: OSTheme;
  soundpack: KeyboardSoundpack;

  // Season Pass
  seasonLevel: number;
  seasonXP: number;
  claimedSeasonTiers: number[];

  // Dynamic Rare System Events
  activeEvent: RareSystemEvent | null;
  eventCooldownTimer: number;

  // Viral Clutch Moments
  lastClutchAlert: {
    temp: number;
    payout: number;
    timestamp: number;
  } | null;

  // Long-Term Endgame Goal: The Singularity Core Project
  singularityContributedQBits: number;
  singularityUnlocked: boolean;

  // Audio & Settings
  isMuted: boolean;
  sfxVolume: number;
  musicVolume: number;

  // Analytics
  totalCrashes: number;
  successfulFlushes: number;
  maxSurgeDuration: number;
  currentSurgeTimer: number;

  // Quests, Daily Missions & Achievements
  bounties: BountyItem[];
  dailyMissions: DailyMissionsState;
  achievements: AchievementItem[];
}
