import { Achievement } from './types';

export const ACHIEVEMENTS_STORAGE_KEY = 'depthos_cg_achievements_v1';

export const ACHIEVEMENTS_DEFINITIONS: Achievement[] = [
  {
    id: 'first_byte',
    title: 'First Byte',
    description: 'Mine your first byte of volatile data into the RAM buffer.',
    icon: '⚡',
    category: 'mining',
    rewardCash: 25,
  },
  {
    id: 'first_kb',
    title: 'First Kilobyte',
    description: 'Securely bank at least 1,024 Bytes ($1,024) into permanent capital.',
    icon: '💾',
    category: 'economy',
    rewardCash: 100,
  },
  {
    id: 'first_mb',
    title: 'First Megabyte',
    description: 'Generate 1,000,000 Lifetime Bytes across your computing cluster.',
    icon: '🌐',
    category: 'economy',
    rewardCash: 10000,
  },
  {
    id: 'first_upgrade',
    title: 'First Upgrade',
    description: 'Purchase your first hardware upgrade in the datacenter rack.',
    icon: '🔧',
    category: 'hardware',
    rewardCash: 50,
  },
  {
    id: 'ram_upgrader',
    title: 'RAM Upgrader',
    description: 'Expand your RAM buffer architecture to Level 3 or higher.',
    icon: '🧠',
    category: 'hardware',
    rewardCash: 250,
  },
  {
    id: 'first_surge',
    title: 'First Thermal Surge',
    description: 'Push CPU core temperature to 85.0°C to activate high-voltage Surge multipliers.',
    icon: '🔥',
    category: 'thermal',
    rewardCash: 150,
  },
  {
    id: 'heat_survivor',
    title: 'Heat Survivor',
    description: 'Survive extreme danger above 90.0°C and vent heat safely back below 60.0°C without crashing.',
    icon: '🛡️',
    category: 'thermal',
    rewardCash: 500,
  },
  {
    id: 'first_crash',
    title: 'First Meltdown',
    description: 'Redline the CPU to 100.0°C and trigger an emergency BSOD kernel panic.',
    icon: '💀',
    category: 'thermal',
    rewardCash: 50,
  },
  {
    id: 'first_recovery',
    title: 'First Recovery',
    description: 'Successfully reboot or revive system operations following a thermal crash.',
    icon: '⚡',
    category: 'thermal',
    rewardCash: 100,
  },
  {
    id: 'data_hoarder',
    title: 'Data Hoarder',
    description: 'Accumulate over $5,000 in unbanked volatile cash in RAM at one time.',
    icon: '📦',
    category: 'mining',
    rewardCash: 1000,
  },
  {
    id: 'early_tycoon',
    title: 'Early Tycoon',
    description: 'Amass at least $10,000 in secure, protected Banked Capital.',
    icon: '👑',
    category: 'economy',
    rewardCash: 2500,
  },
];

export interface AchievementEvaluationContext {
  volatileBytes: number;
  bankedBytes: number;
  lifetimeBankedBytes: number;
  heat: number;
  isBSOD: boolean;
  hardware: {
    cpuLevel: number;
    ramLevel: number;
    coolingLevel: number;
    busLevel: number;
    thermalPasteLevel: number;
  };
  totalClicks: number;
  totalFlushes: number;
  totalCrashes: number;
  totalRevives: number;
  hitExtremeHeatSinceSafe: boolean; // heat >= 90 without crash
  unlockedMap: Record<string, number>;
}

/**
 * Loads unlocked achievements map from persistent storage.
 * Map structure: { [achievementId: string]: unlockedTimestampMs }
 */
export function loadUnlockedAchievements(): Record<string, number> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[Achievements] Error reading from localStorage:', err);
  }
  return {};
}

/**
 * Saves unlocked achievements map to persistent storage.
 */
export function saveUnlockedAchievements(map: Record<string, number>): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('[Achievements] Error writing to localStorage:', err);
  }
}

/**
 * Evaluates game context against all defined achievements.
 * Returns any newly unlocked achievements along with the updated unlocked map.
 */
export function evaluateAchievements(ctx: AchievementEvaluationContext): {
  newUnlocks: Achievement[];
  updatedMap: Record<string, number>;
} {
  const newUnlocks: Achievement[] = [];
  const updatedMap = { ...ctx.unlockedMap };
  const now = Date.now();

  const isUnlocked = (id: string) => Boolean(updatedMap[id]);

  for (const ach of ACHIEVEMENTS_DEFINITIONS) {
    if (isUnlocked(ach.id)) continue;

    let qualifies = false;

    switch (ach.id) {
      case 'first_byte':
        qualifies = ctx.totalClicks >= 1 || ctx.volatileBytes > 0 || ctx.bankedBytes > 0;
        break;
      case 'first_kb':
        qualifies = ctx.bankedBytes >= 1024 || ctx.lifetimeBankedBytes >= 1024;
        break;
      case 'first_mb':
        qualifies = ctx.lifetimeBankedBytes >= 1000000;
        break;
      case 'first_upgrade': {
        const h = ctx.hardware;
        const totalUpgrades =
          (h.cpuLevel - 1) +
          (h.ramLevel - 1) +
          (h.coolingLevel - 1) +
          (h.busLevel - 1) +
          h.thermalPasteLevel;
        qualifies = totalUpgrades >= 1;
        break;
      }
      case 'ram_upgrader':
        qualifies = ctx.hardware.ramLevel >= 3;
        break;
      case 'first_surge':
        qualifies = ctx.heat >= 85.0 && !ctx.isBSOD;
        break;
      case 'heat_survivor':
        qualifies = ctx.hitExtremeHeatSinceSafe && ctx.heat <= 60.0 && !ctx.isBSOD;
        break;
      case 'first_crash':
        qualifies = ctx.totalCrashes >= 1 || ctx.isBSOD;
        break;
      case 'first_recovery':
        qualifies = ctx.totalRevives >= 1;
        break;
      case 'data_hoarder':
        qualifies = ctx.volatileBytes >= 5000;
        break;
      case 'early_tycoon':
        qualifies = ctx.bankedBytes >= 10000;
        break;
    }

    if (qualifies) {
      updatedMap[ach.id] = now;
      newUnlocks.push({
        ...ach,
        unlockedAt: now,
      });
    }
  }

  return { newUnlocks, updatedMap };
}

/**
 * Returns all achievements merged with their unlock timestamps.
 */
export function getDecoratedAchievements(unlockedMap: Record<string, number>): Achievement[] {
  return ACHIEVEMENTS_DEFINITIONS.map((def) => ({
    ...def,
    unlockedAt: unlockedMap[def.id],
  }));
}
