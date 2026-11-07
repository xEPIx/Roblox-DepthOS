import { ProgressionGoal } from './types';

export const GOALS_STORAGE_KEY = 'depthos_cg_goals_claimed_v1';

export interface GoalContext {
  totalClicks: number;
  volatileBytes: number;
  bankedBytes: number;
  lifetimeBankedBytes: number;
  heat: number;
  hardware: {
    cpuLevel: number;
    ramLevel: number;
    coolingLevel: number;
    busLevel: number;
    thermalPasteLevel: number;
  };
  totalFlushes: number;
  highestHeatSeen: number;
}

export interface GoalDefinition extends ProgressionGoal {
  getCurrent: (ctx: GoalContext) => number;
}

export const PROGRESSION_GOALS: GoalDefinition[] = [
  {
    id: 'goal_mine_10',
    title: '1. Mine Volatile Bytes',
    description: 'Click the processor core or tap [SPACE] 10 times to generate data.',
    actionHint: 'TAP [SPACE] OR CLICK CORE',
    target: 10,
    rewardCash: 50,
    category: 'mining',
    getCurrent: (ctx) => ctx.totalClicks,
  },
  {
    id: 'goal_first_flush',
    title: '2. Bank Your Cash',
    description: 'Hold [F] or click Flush to bank at least $25 into protected capital.',
    actionHint: 'HOLD [F] TO BANK PROFIT',
    target: 25,
    rewardCash: 100,
    category: 'flush',
    getCurrent: (ctx) => Math.min(25, ctx.bankedBytes),
  },
  {
    id: 'goal_cpu_2',
    title: '3. Upgrade CPU Clock',
    description: 'Purchase your first CPU Clock upgrade in the hardware rack.',
    actionHint: 'BUY CPU UPGRADE IN SHOP',
    target: 2,
    rewardCash: 150,
    category: 'hardware',
    getCurrent: (ctx) => ctx.hardware.cpuLevel,
  },
  {
    id: 'goal_ram_2',
    title: '4. Expand RAM Buffer',
    description: 'Upgrade RAM buffer to Level 2 for longer mining headspace.',
    actionHint: 'UPGRADE RAM BUFFER',
    target: 2,
    rewardCash: 200,
    category: 'hardware',
    getCurrent: (ctx) => ctx.hardware.ramLevel,
  },
  {
    id: 'goal_surge_85',
    title: '5. Ride 85°C Thermal Surge',
    description: 'Mine aggressively until CPU core temperature reaches 85.0°C.',
    actionHint: 'MINE UNTIL HEAT HITS 85°C',
    target: 85,
    rewardCash: 350,
    category: 'thermal',
    getCurrent: (ctx) => Math.round(Math.min(85, Math.max(ctx.heat, ctx.highestHeatSeen))),
  },
  {
    id: 'goal_cooling_2',
    title: '6. Install High-RPM Cooling',
    description: 'Upgrade Cooling Fans to Level 2 to dissipate heat faster.',
    actionHint: 'UPGRADE COOLING FANS',
    target: 2,
    rewardCash: 300,
    category: 'hardware',
    getCurrent: (ctx) => ctx.hardware.coolingLevel,
  },
  {
    id: 'goal_bank_500',
    title: '7. Build Capital ($500)',
    description: 'Amass at least $500 in total Banked Cash.',
    actionHint: 'BANK $500 IN CAPITAL',
    target: 500,
    rewardCash: 400,
    category: 'economy',
    getCurrent: (ctx) => Math.min(500, ctx.bankedBytes),
  },
  {
    id: 'goal_bus_2',
    title: '8. Accelerate PCIe Bus',
    description: 'Upgrade PCIe Bus to Level 2 for lightning-fast memory flushing.',
    actionHint: 'UPGRADE PCIE BUS IN SHOP',
    target: 2,
    rewardCash: 350,
    category: 'hardware',
    getCurrent: (ctx) => ctx.hardware.busLevel,
  },
  {
    id: 'goal_paste_1',
    title: '9. Apply Liquid Metal Paste',
    description: 'Purchase Thermal Paste to permanently cut heat generation per click.',
    actionHint: 'BUY THERMAL PASTE IN SHOP',
    target: 1,
    rewardCash: 500,
    category: 'hardware',
    getCurrent: (ctx) => ctx.hardware.thermalPasteLevel,
  },
  {
    id: 'goal_ram_3',
    title: '10. Datacenter Memory (RAM Lv.3)',
    description: 'Expand RAM buffer architecture to Level 3 (192MB capacity).',
    actionHint: 'UPGRADE RAM TO LV.3',
    target: 3,
    rewardCash: 600,
    category: 'hardware',
    getCurrent: (ctx) => ctx.hardware.ramLevel,
  },
  {
    id: 'goal_bank_2500',
    title: '11. Financial Security ($2,500)',
    description: 'Reach $2,500 in secure Banked Capital.',
    actionHint: 'EXPAND BANK TO $2,500',
    target: 2500,
    rewardCash: 800,
    category: 'economy',
    getCurrent: (ctx) => Math.min(2500, ctx.bankedBytes),
  },
  {
    id: 'goal_cpu_4',
    title: '12. High-Frequency Computing',
    description: 'Upgrade CPU Processor to Level 4 for immense data throughput.',
    actionHint: 'UPGRADE CPU TO LV.4',
    target: 4,
    rewardCash: 1200,
    category: 'hardware',
    getCurrent: (ctx) => ctx.hardware.cpuLevel,
  },
  {
    id: 'goal_surge_95',
    title: '13. Redline Master (95°C)',
    description: 'Ride the edge of danger up to 95.0°C and bank profit without a BSOD crash.',
    actionHint: 'HIT 95°C & HOLD [F] TO FLUSH',
    target: 95,
    rewardCash: 2000,
    category: 'thermal',
    getCurrent: (ctx) => Math.round(Math.min(95, Math.max(ctx.heat, ctx.highestHeatSeen))),
  },
  {
    id: 'goal_bank_10000',
    title: '14. Datacenter Empire ($10,000)',
    description: 'Achieve $10,000 in permanent Banked Capital.',
    actionHint: 'REACH $10,000 IN CAPITAL',
    target: 10000,
    rewardCash: 3500,
    category: 'economy',
    getCurrent: (ctx) => Math.min(10000, ctx.bankedBytes),
  },
  {
    id: 'goal_mastery',
    title: '15. Hardware Supremacy',
    description: 'Reach Level 5 in CPU, RAM, and Cooling simultaneously.',
    actionHint: 'LEVEL 5 CPU, RAM & COOLING',
    target: 15,
    rewardCash: 10000,
    category: 'hardware',
    getCurrent: (ctx) =>
      ctx.hardware.cpuLevel + ctx.hardware.ramLevel + ctx.hardware.coolingLevel,
  },
];

/**
 * Loads claimed goal IDs from localStorage.
 */
export function loadClaimedGoalIds(): Set<string> {
  if (typeof localStorage === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(GOALS_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (err) {
    console.warn('[Goals] Error reading from localStorage:', err);
  }
  return new Set();
}

/**
 * Saves claimed goal IDs to localStorage.
 */
export function saveClaimedGoalIds(ids: Set<string>): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch (err) {
    console.warn('[Goals] Error writing to localStorage:', err);
  }
}

export interface ActiveGoalInfo {
  goal: GoalDefinition | null;
  current: number;
  target: number;
  percent: number;
  isCompleted: boolean;
  isClaimed: boolean;
  stepIndex: number;
  totalGoals: number;
}

/**
 * Determines the current active progression goal based on state and claimed status.
 */
export function getActiveGoalInfo(
  ctx: GoalContext,
  claimedIds: Set<string>
): ActiveGoalInfo {
  const totalGoals = PROGRESSION_GOALS.length;

  for (let i = 0; i < totalGoals; i++) {
    const g = PROGRESSION_GOALS[i];
    if (!claimedIds.has(g.id)) {
      const current = Math.min(g.target, g.getCurrent(ctx));
      const isCompleted = current >= g.target;
      const percent = Math.min(100, Math.round((current / g.target) * 100));

      return {
        goal: g,
        current,
        target: g.target,
        percent,
        isCompleted,
        isClaimed: false,
        stepIndex: i,
        totalGoals,
      };
    }
  }

  // All goals completed
  const last = PROGRESSION_GOALS[totalGoals - 1];
  return {
    goal: last,
    current: last.target,
    target: last.target,
    percent: 100,
    isCompleted: true,
    isClaimed: true,
    stepIndex: totalGoals,
    totalGoals,
  };
}
