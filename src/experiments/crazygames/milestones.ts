import { Milestone, MilestoneBuffs } from './types';

export const MILESTONES_STORAGE_KEY = 'depthos_cg_milestones_claimed_v1';

export const MILESTONE_DEFINITIONS: Omit<Milestone, 'unlocked'>[] = [
  {
    id: 'ms_1k',
    targetBytes: 1000,
    title: 'Silicon Bootloader',
    description: 'Surpassed 1,000 Bytes in lifetime capital. Algorithmic efficiency improved.',
    icon: '⚡',
    buffLabel: '+5% Data Production',
    dataMultiplier: 1.05,
  },
  {
    id: 'ms_10k',
    targetBytes: 10000,
    title: 'Expanded Architecture',
    description: 'Surpassed 10,000 Bytes in lifetime capital. Memory bus expanded.',
    icon: '🧠',
    buffLabel: '+64MB RAM Buffer',
    bonusRamMB: 64,
  },
  {
    id: 'ms_100k',
    targetBytes: 100000,
    title: 'Vapor Chamber Cooling',
    description: 'Surpassed 100,000 Bytes in lifetime capital. Heat dissipation optimized.',
    icon: '❄️',
    buffLabel: '+10% Cooling Efficiency',
    coolingMultiplier: 1.10,
  },
  {
    id: 'ms_500k',
    targetBytes: 500000,
    title: 'Surge Capacitors',
    description: 'Surpassed 500,000 Bytes in lifetime capital. Overvolt resilience boosted.',
    icon: '🔥',
    buffLabel: '+15% Surge Multiplier',
    surgeMultiplier: 1.15,
  },
  {
    id: 'ms_1m',
    targetBytes: 1000000,
    title: 'Megabyte Quantum Core',
    description: 'Surpassed 1,000,000 Bytes in lifetime capital. High-speed bus synchronization.',
    icon: '🌐',
    buffLabel: '+20% Data & +50% Flush Speed',
    dataMultiplier: 1.20,
    flushSpeedMultiplier: 1.50,
  },
];

/**
 * Calculates current cumulative milestone buffs from lifetime banked bytes.
 */
export function getMilestoneBuffs(lifetimeBankedBytes: number): MilestoneBuffs {
  let dataMultiplier = 1.0;
  let bonusRamMB = 0;
  let coolingMultiplier = 1.0;
  let surgeMultiplier = 1.0;
  let flushSpeedMultiplier = 1.0;

  for (const ms of MILESTONE_DEFINITIONS) {
    if (lifetimeBankedBytes >= ms.targetBytes) {
      if (ms.dataMultiplier) dataMultiplier *= ms.dataMultiplier;
      if (ms.bonusRamMB) bonusRamMB += ms.bonusRamMB;
      if (ms.coolingMultiplier) coolingMultiplier *= ms.coolingMultiplier;
      if (ms.surgeMultiplier) surgeMultiplier *= ms.surgeMultiplier;
      if (ms.flushSpeedMultiplier) flushSpeedMultiplier *= ms.flushSpeedMultiplier;
    }
  }

  return {
    dataMultiplier,
    bonusRamMB,
    coolingMultiplier,
    surgeMultiplier,
    flushSpeedMultiplier,
  };
}

/**
 * Loads acknowledged milestone notification map from localStorage.
 */
export function loadAcknowledgedMilestones(): Record<string, number> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(MILESTONES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('[Milestones] Error reading from localStorage:', err);
  }
  return {};
}

/**
 * Saves acknowledged milestone notification map to localStorage.
 */
export function saveAcknowledgedMilestones(map: Record<string, number>): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(MILESTONES_STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('[Milestones] Error writing to localStorage:', err);
  }
}

/**
 * Checks if the player has newly unlocked any milestone that has not yet been notified.
 */
export function checkNewMilestones(
  lifetimeBankedBytes: number,
  acknowledgedMap: Record<string, number>
): {
  newlyReached: Milestone[];
  updatedMap: Record<string, number>;
} {
  const newlyReached: Milestone[] = [];
  const updatedMap = { ...acknowledgedMap };
  const now = Date.now();

  for (const def of MILESTONE_DEFINITIONS) {
    const unlocked = lifetimeBankedBytes >= def.targetBytes;
    if (unlocked && !updatedMap[def.id]) {
      updatedMap[def.id] = now;
      newlyReached.push({
        ...def,
        unlocked: true,
      });
    }
  }

  return { newlyReached, updatedMap };
}

/**
 * Returns decorated list of all milestones with their unlocked status.
 */
export function getDecoratedMilestones(lifetimeBankedBytes: number): Milestone[] {
  return MILESTONE_DEFINITIONS.map((def) => ({
    ...def,
    unlocked: lifetimeBankedBytes >= def.targetBytes,
  }));
}
