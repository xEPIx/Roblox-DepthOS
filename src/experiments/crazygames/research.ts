import {
  ResearchBranch,
  ResearchNode,
  ResearchBonuses,
  ActiveResearch,
} from './types';

export const RESEARCH_STORAGE_UNLOCKED_KEY = 'depthos_cg_research_unlocked_v1';
export const RESEARCH_STORAGE_ACTIVE_KEY = 'depthos_cg_research_active_v1';

export interface BranchMetadata {
  id: ResearchBranch;
  name: string;
  tagline: string;
  icon: string;
  color: string;
  accentBg: string;
  borderColor: string;
}

export const RESEARCH_BRANCHES: Record<ResearchBranch, BranchMetadata> = {
  computing: {
    id: 'computing',
    name: 'Computing',
    tagline: 'Processor throughput & quantum clock scaling',
    icon: '⚡',
    color: '#38bdf8',
    accentBg: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  memory: {
    id: 'memory',
    name: 'Memory',
    tagline: 'Buffer expansion, compression & cache speed',
    icon: '🧠',
    color: '#fbbf24',
    accentBg: 'rgba(251, 191, 36, 0.1)',
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  cooling: {
    id: 'cooling',
    name: 'Cooling',
    tagline: 'Thermal dissipation & cryogenic heat ceilings',
    icon: '❄️',
    color: '#06b6d4',
    accentBg: 'rgba(6, 182, 212, 0.1)',
    borderColor: 'rgba(6, 182, 212, 0.4)',
  },
  storage: {
    id: 'storage',
    name: 'Storage',
    tagline: 'Permanent data storage & bank flush multipliers',
    icon: '💾',
    color: '#10b981',
    accentBg: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  automation: {
    id: 'automation',
    name: 'Automation',
    tagline: 'Autonomous daemons, auto-reboot & smart allocation',
    icon: '🤖',
    color: '#c084fc',
    accentBg: 'rgba(192, 132, 252, 0.1)',
    borderColor: 'rgba(192, 132, 252, 0.4)',
  },
};

export const RESEARCH_NODES: ResearchNode[] = [
  // -------------------------------------------------------------
  // 1. COMPUTING BRANCH
  // -------------------------------------------------------------
  {
    id: 'comp_cpus',
    branch: 'computing',
    tier: 1,
    title: 'Faster CPUs',
    description: 'Overclocked pipeline branch prediction optimizes compute cycles.',
    icon: '⚡',
    costBytes: 400,
    durationSeconds: 10,
    prerequisites: [],
    bonusLabel: '+15% Data Production',
    bonuses: { dataMultiplier: 1.15 },
  },
  {
    id: 'comp_parallel',
    branch: 'computing',
    tier: 2,
    title: 'Parallel Processing',
    description: 'Distributes thread execution across secondary vector units.',
    icon: '🔀',
    costBytes: 2000,
    durationSeconds: 25,
    prerequisites: ['comp_cpus'],
    bonusLabel: '+30% Data Production',
    bonuses: { dataMultiplier: 1.30 },
  },
  {
    id: 'comp_quantum',
    branch: 'computing',
    tier: 3,
    title: 'Quantum Threads',
    description: 'Subatomic qubits simulate billions of simultaneous logic paths.',
    icon: '⚛️',
    costBytes: 15000,
    durationSeconds: 60,
    prerequisites: ['comp_parallel'],
    bonusLabel: '+50% Data & +25% Surge Multiplier',
    bonuses: { dataMultiplier: 1.50, surgeMultiplier: 1.25 },
  },

  // -------------------------------------------------------------
  // 2. MEMORY BRANCH
  // -------------------------------------------------------------
  {
    id: 'mem_compression',
    branch: 'memory',
    tier: 1,
    title: 'Byte Compression',
    description: 'Real-time LZ-stream compression squeezes more data into buffer.',
    icon: '🗜️',
    costBytes: 350,
    durationSeconds: 8,
    prerequisites: [],
    bonusLabel: '+32MB RAM Buffer',
    bonuses: { bonusRamMB: 32 },
  },
  {
    id: 'mem_efficiency',
    branch: 'memory',
    tier: 2,
    title: 'RAM Efficiency',
    description: 'Zero-copy DMA controller clears memory pathways with minimal latency.',
    icon: '🧠',
    costBytes: 1800,
    durationSeconds: 20,
    prerequisites: ['mem_compression'],
    bonusLabel: '+64MB RAM & +25% Flush Speed',
    bonuses: { bonusRamMB: 64, flushSpeedMultiplier: 1.25 },
  },
  {
    id: 'mem_cache',
    branch: 'memory',
    tier: 3,
    title: 'Cache Systems',
    description: 'Multi-layer L3 SRAM cache maintains near-instant bus throughput.',
    icon: '⚡',
    costBytes: 12000,
    durationSeconds: 55,
    prerequisites: ['mem_efficiency'],
    bonusLabel: '+128MB RAM & +50% Flush Speed',
    bonuses: { bonusRamMB: 128, flushSpeedMultiplier: 1.50 },
  },

  // -------------------------------------------------------------
  // 3. COOLING BRANCH
  // -------------------------------------------------------------
  {
    id: 'cool_fans',
    branch: 'cooling',
    tier: 1,
    title: 'Better Fans',
    description: 'Aerodynamic swept-blade impellers maximize static pressure dissipation.',
    icon: '🌀',
    costBytes: 450,
    durationSeconds: 10,
    prerequisites: [],
    bonusLabel: '+15% Cooling Efficiency',
    bonuses: { coolingMultiplier: 1.15 },
  },
  {
    id: 'cool_liquid',
    branch: 'cooling',
    tier: 2,
    title: 'Liquid Cooling',
    description: 'Closed-loop micro-channel liquid coolant block absorbs core thermal spikes.',
    icon: '💧',
    costBytes: 2200,
    durationSeconds: 25,
    prerequisites: ['cool_fans'],
    bonusLabel: '+25% Cooling & -10% Heat Gen',
    bonuses: { coolingMultiplier: 1.25, heatReduction: 0.10 },
  },
  {
    id: 'cool_cryo',
    branch: 'cooling',
    tier: 3,
    title: 'Cryogenic Cooling',
    description: 'Sub-zero liquid nitrogen bath keeps redline surge temperature manageable.',
    icon: '❄️',
    costBytes: 16000,
    durationSeconds: 65,
    prerequisites: ['cool_liquid'],
    bonusLabel: '+50% Cooling Efficiency',
    bonuses: { coolingMultiplier: 1.50 },
  },

  // -------------------------------------------------------------
  // 4. STORAGE BRANCH
  // -------------------------------------------------------------
  {
    id: 'stor_ssd',
    branch: 'storage',
    tier: 1,
    title: 'SSD Optimization',
    description: 'Custom block TRIM routines increase banked flash conversion ratios.',
    icon: '💾',
    costBytes: 500,
    durationSeconds: 12,
    prerequisites: [],
    bonusLabel: '+15% Banked Payout',
    bonuses: { payoutMultiplier: 1.15 },
  },
  {
    id: 'stor_nvme',
    branch: 'storage',
    tier: 2,
    title: 'NVMe Infrastructure',
    description: 'PCIe Gen5 x16 interconnect pipelines flush cash with zero bottleneck.',
    icon: '⚡',
    costBytes: 2600,
    durationSeconds: 30,
    prerequisites: ['stor_ssd'],
    bonusLabel: '+30% Banked Payout',
    bonuses: { payoutMultiplier: 1.30 },
  },
  {
    id: 'stor_warehouse',
    branch: 'storage',
    tier: 3,
    title: 'Data Warehousing',
    description: 'High-availability RAID arrays store enterprise-grade permanent capital.',
    icon: '🏢',
    costBytes: 18000,
    durationSeconds: 75,
    prerequisites: ['stor_nvme'],
    bonusLabel: '+50% Banked Payout',
    bonuses: { payoutMultiplier: 1.50 },
  },

  // -------------------------------------------------------------
  // 5. AUTOMATION BRANCH
  // -------------------------------------------------------------
  {
    id: 'auto_recovery',
    branch: 'automation',
    tier: 1,
    title: 'Auto Recovery',
    description: 'Emergency watchdog daemon automatically boots from kernel panic in 3s.',
    icon: '🔄',
    costBytes: 750,
    durationSeconds: 15,
    prerequisites: [],
    bonusLabel: 'Auto BSOD Reboot (3s)',
    bonuses: { autoRecovery: true },
  },
  {
    id: 'auto_maintenance',
    branch: 'automation',
    tier: 2,
    title: 'Auto Maintenance',
    description: 'Autonomous thermal governor automatically triggers cryo vent at 95°C.',
    icon: '🛡️',
    costBytes: 3200,
    durationSeconds: 35,
    prerequisites: ['auto_recovery'],
    bonusLabel: 'Auto Cryo-Vent at 95°C',
    bonuses: { autoCryoVent: true },
  },
  {
    id: 'auto_allocation',
    branch: 'automation',
    tier: 3,
    title: 'Smart Allocation',
    description: 'Predictive neural arbiter discounts datacenter hardware supply costs.',
    icon: '🤖',
    costBytes: 20000,
    durationSeconds: 90,
    prerequisites: ['auto_maintenance'],
    bonusLabel: '-25% Hardware Costs',
    bonuses: { upgradeCostDiscount: 0.25 },
  },
];

export const DEFAULT_RESEARCH_BONUSES: ResearchBonuses = {
  dataMultiplier: 1.0,
  surgeMultiplier: 1.0,
  bonusRamMB: 0,
  flushSpeedMultiplier: 1.0,
  coolingMultiplier: 1.0,
  heatReduction: 0.0,
  payoutMultiplier: 1.0,
  autoRecovery: false,
  autoCryoVent: false,
  upgradeCostDiscount: 0.0,
};

/**
 * Calculates current cumulative research bonuses from unlocked technology IDs.
 */
export function getResearchBonuses(unlockedIds: Set<string>): ResearchBonuses {
  const result: ResearchBonuses = { ...DEFAULT_RESEARCH_BONUSES };

  for (const node of RESEARCH_NODES) {
    if (!unlockedIds.has(node.id)) continue;
    const b = node.bonuses;

    if (b.dataMultiplier) result.dataMultiplier *= b.dataMultiplier;
    if (b.surgeMultiplier) result.surgeMultiplier *= b.surgeMultiplier;
    if (b.bonusRamMB) result.bonusRamMB += b.bonusRamMB;
    if (b.flushSpeedMultiplier) result.flushSpeedMultiplier *= b.flushSpeedMultiplier;
    if (b.coolingMultiplier) result.coolingMultiplier *= b.coolingMultiplier;
    if (b.heatReduction) result.heatReduction = Math.min(0.5, result.heatReduction + b.heatReduction);
    if (b.payoutMultiplier) result.payoutMultiplier *= b.payoutMultiplier;
    if (b.autoRecovery) result.autoRecovery = true;
    if (b.autoCryoVent) result.autoCryoVent = true;
    if (b.upgradeCostDiscount) result.upgradeCostDiscount = Math.min(0.5, result.upgradeCostDiscount + b.upgradeCostDiscount);
  }

  return result;
}

/**
 * Checks whether a technology node is unlocked or can be researched.
 */
export function isTechAvailable(node: ResearchNode, unlockedIds: Set<string>): boolean {
  if (unlockedIds.has(node.id)) return false;
  return node.prerequisites.every((req) => unlockedIds.has(req));
}

/**
 * Helper to get a tech definition by ID.
 */
export function findTechById(id: string): ResearchNode | undefined {
  return RESEARCH_NODES.find((n) => n.id === id);
}

/**
 * Calculates real-time progress for an active research item.
 */
export function getActiveResearchProgress(
  active: ActiveResearch | null,
  now: number = Date.now()
): { progress: number; remainingMs: number; isComplete: boolean } {
  if (!active) {
    return { progress: 0, remainingMs: 0, isComplete: false };
  }

  const elapsed = Math.max(0, now - active.startTime);
  const remainingMs = Math.max(0, active.durationMs - elapsed);
  const progress = Math.min(100, Math.round((elapsed / active.durationMs) * 100));
  const isComplete = elapsed >= active.durationMs;

  return { progress, remainingMs, isComplete };
}

/**
 * Loads unlocked technology IDs from persistent storage.
 */
export function loadUnlockedResearch(): Set<string> {
  if (typeof localStorage === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(RESEARCH_STORAGE_UNLOCKED_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (err) {
    console.warn('[Research] Error reading unlocked research:', err);
  }
  return new Set();
}

/**
 * Saves unlocked technology IDs to persistent storage.
 */
export function saveUnlockedResearch(unlocked: Set<string>): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(RESEARCH_STORAGE_UNLOCKED_KEY, JSON.stringify(Array.from(unlocked)));
  } catch (err) {
    console.warn('[Research] Error saving unlocked research:', err);
  }
}

/**
 * Loads active research state from persistent storage.
 */
export function loadActiveResearch(): ActiveResearch | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(RESEARCH_STORAGE_ACTIVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.techId === 'string' && typeof parsed.startTime === 'number' && typeof parsed.durationMs === 'number') {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Research] Error reading active research:', err);
  }
  return null;
}

/**
 * Saves active research state to persistent storage.
 */
export function saveActiveResearch(active: ActiveResearch | null): void {
  if (typeof localStorage === 'undefined') return;
  try {
    if (!active) {
      localStorage.removeItem(RESEARCH_STORAGE_ACTIVE_KEY);
    } else {
      localStorage.setItem(RESEARCH_STORAGE_ACTIVE_KEY, JSON.stringify(active));
    }
  } catch (err) {
    console.warn('[Research] Error saving active research:', err);
  }
}
