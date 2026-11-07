import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  ACHIEVEMENTS_DEFINITIONS,
  evaluateAchievements,
  getDecoratedAchievements,
  loadUnlockedAchievements,
  saveUnlockedAchievements,
  AchievementEvaluationContext,
} from '../achievements';
import {
  MILESTONE_DEFINITIONS,
  getMilestoneBuffs,
  checkNewMilestones,
  getDecoratedMilestones,
  loadAcknowledgedMilestones,
  saveAcknowledgedMilestones,
} from '../milestones';
import {
  PROGRESSION_GOALS,
  getActiveGoalInfo,
  loadClaimedGoalIds,
  saveClaimedGoalIds,
  GoalContext,
} from '../goals';

// Setup mock localStorage for Node.js test environment
class MockLocalStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

if (!globalThis.localStorage) {
  // @ts-expect-error Mocking localStorage for Node.js test runner
  globalThis.localStorage = new MockLocalStorage();
}

const createBaseContext = (overrides?: Partial<AchievementEvaluationContext>): AchievementEvaluationContext => ({
  volatileBytes: 0,
  bankedBytes: 0,
  lifetimeBankedBytes: 0,
  heat: 25.0,
  isBSOD: false,
  hardware: {
    cpuLevel: 1,
    ramLevel: 1,
    coolingLevel: 1,
    busLevel: 1,
    thermalPasteLevel: 0,
  },
  totalClicks: 0,
  totalFlushes: 0,
  totalCrashes: 0,
  totalRevives: 0,
  hitExtremeHeatSinceSafe: false,
  unlockedMap: {},
  ...overrides,
});

const createBaseGoalContext = (overrides?: Partial<GoalContext>): GoalContext => ({
  totalClicks: 0,
  volatileBytes: 0,
  bankedBytes: 0,
  lifetimeBankedBytes: 0,
  heat: 25.0,
  hardware: {
    cpuLevel: 1,
    ramLevel: 1,
    coolingLevel: 1,
    busLevel: 1,
    thermalPasteLevel: 0,
  },
  totalFlushes: 0,
  highestHeatSeen: 25.0,
  ...overrides,
});

describe('CrazyGames Retention Engine: Achievements, Milestones & Progression Goals', () => {

  beforeEach(() => {
    localStorage.clear();
  });

  // =========================================================================
  // SECTION 1: ACHIEVEMENT SYSTEM
  // =========================================================================
  describe('1. Achievement Evaluation & Idempotency', () => {

    it('defines exactly 11 distinct retention achievements', () => {
      assert.strictEqual(ACHIEVEMENTS_DEFINITIONS.length, 11);
      const ids = new Set(ACHIEVEMENTS_DEFINITIONS.map((a) => a.id));
      assert.strictEqual(ids.size, 11);
      assert.ok(ids.has('first_byte'));
      assert.ok(ids.has('first_kb'));
      assert.ok(ids.has('first_mb'));
      assert.ok(ids.has('first_upgrade'));
      assert.ok(ids.has('ram_upgrader'));
      assert.ok(ids.has('first_surge'));
      assert.ok(ids.has('heat_survivor'));
      assert.ok(ids.has('first_crash'));
      assert.ok(ids.has('first_recovery'));
      assert.ok(ids.has('data_hoarder'));
      assert.ok(ids.has('early_tycoon'));
    });

    it('unlocks "first_byte" upon first core click or unbanked data generation', () => {
      const ctx = createBaseContext({ totalClicks: 1 });
      const { newUnlocks, updatedMap } = evaluateAchievements(ctx);
      const unlockedIds = newUnlocks.map((u) => u.id);
      assert.ok(unlockedIds.includes('first_byte'));
      assert.ok(updatedMap['first_byte'] > 0);
    });

    it('unlocks "first_kb" when banked capital exceeds 1,024 Bytes ($1,024)', () => {
      const ctx = createBaseContext({ bankedBytes: 1024 });
      const { newUnlocks } = evaluateAchievements(ctx);
      assert.ok(newUnlocks.some((u) => u.id === 'first_kb'));
    });

    it('unlocks "first_mb" when lifetime banked data hits 1,000,000 Bytes', () => {
      const ctx = createBaseContext({ lifetimeBankedBytes: 1000000 });
      const { newUnlocks } = evaluateAchievements(ctx);
      assert.ok(newUnlocks.some((u) => u.id === 'first_mb'));
    });

    it('unlocks "first_upgrade" when any hardware rack component is upgraded', () => {
      const ctx = createBaseContext({
        hardware: {
          cpuLevel: 2,
          ramLevel: 1,
          coolingLevel: 1,
          busLevel: 1,
          thermalPasteLevel: 0,
        },
      });
      const { newUnlocks } = evaluateAchievements(ctx);
      assert.ok(newUnlocks.some((u) => u.id === 'first_upgrade'));
    });

    it('unlocks "ram_upgrader" when RAM buffer reaches Level 3', () => {
      const ctx = createBaseContext({
        hardware: {
          cpuLevel: 1,
          ramLevel: 3,
          coolingLevel: 1,
          busLevel: 1,
          thermalPasteLevel: 0,
        },
      });
      const { newUnlocks } = evaluateAchievements(ctx);
      assert.ok(newUnlocks.some((u) => u.id === 'ram_upgrader'));
    });

    it('unlocks "first_surge" when CPU temperature hits 85.0°C without crashing', () => {
      const ctx = createBaseContext({ heat: 85.0, isBSOD: false });
      const { newUnlocks } = evaluateAchievements(ctx);
      assert.ok(newUnlocks.some((u) => u.id === 'first_surge'));
    });

    it('does not unlock "first_surge" if in BSOD state', () => {
      const ctx = createBaseContext({ heat: 85.0, isBSOD: true });
      const { newUnlocks } = evaluateAchievements(ctx);
      assert.ok(!newUnlocks.some((u) => u.id === 'first_surge'));
    });

    it('unlocks "heat_survivor" when player survives >90°C and cools back <=60°C without crash', () => {
      const ctx = createBaseContext({
        hitExtremeHeatSinceSafe: true,
        heat: 58.5,
        isBSOD: false,
      });
      const { newUnlocks } = evaluateAchievements(ctx);
      assert.ok(newUnlocks.some((u) => u.id === 'heat_survivor'));
    });

    it('unlocks "first_crash" on thermal meltdown and "first_recovery" upon reboot', () => {
      // First crash
      const crashCtx = createBaseContext({ totalCrashes: 1, isBSOD: true });
      const { newUnlocks: crashUnlocks, updatedMap } = evaluateAchievements(crashCtx);
      assert.ok(crashUnlocks.some((u) => u.id === 'first_crash'));

      // Recovery
      const recoveryCtx = createBaseContext({
        unlockedMap: updatedMap,
        totalRevives: 1,
        isBSOD: false,
        heat: 35,
      });
      const { newUnlocks: recoveryUnlocks } = evaluateAchievements(recoveryCtx);
      assert.ok(recoveryUnlocks.some((u) => u.id === 'first_recovery'));
      // Crash should not unlock again
      assert.ok(!recoveryUnlocks.some((u) => u.id === 'first_crash'));
    });

    it('unlocks "data_hoarder" at $5,000 volatile cash in RAM and "early_tycoon" at $10,000 banked', () => {
      const ctx = createBaseContext({ volatileBytes: 5000, bankedBytes: 10000 });
      const { newUnlocks } = evaluateAchievements(ctx);
      assert.ok(newUnlocks.some((u) => u.id === 'data_hoarder'));
      assert.ok(newUnlocks.some((u) => u.id === 'early_tycoon'));
    });

    it('enforces strict idempotency: previously unlocked achievements are never re-triggered', () => {
      const initialCtx = createBaseContext({ totalClicks: 1 });
      const { newUnlocks: firstRun, updatedMap } = evaluateAchievements(initialCtx);
      assert.strictEqual(firstRun.length, 1);
      assert.strictEqual(firstRun[0].id, 'first_byte');

      // Second evaluation with identical state
      const secondRun = evaluateAchievements({ ...initialCtx, unlockedMap: updatedMap });
      assert.strictEqual(secondRun.newUnlocks.length, 0);
    });

    it('correctly decorates achievements with unlockedAt timestamps', () => {
      const now = Date.now();
      const map: Record<string, number> = { first_byte: now };
      const decorated = getDecoratedAchievements(map);
      const firstByte = decorated.find((a) => a.id === 'first_byte');
      assert.strictEqual(firstByte?.unlockedAt, now);
      const firstMb = decorated.find((a) => a.id === 'first_mb');
      assert.strictEqual(firstMb?.unlockedAt, undefined);
    });

    it('persists and loads unlocked achievements to/from localStorage', () => {
      const map = { first_byte: 12345678, first_upgrade: 12345999 };
      saveUnlockedAchievements(map);
      const loaded = loadUnlockedAchievements();
      assert.deepStrictEqual(loaded, map);
    });
  });

  // =========================================================================
  // SECTION 2: MILESTONE PERMANENT BUFFS
  // =========================================================================
  describe('2. Milestone Buffs & Unlock Progression', () => {

    it('defines 5 tiers of lifetime milestone rewards', () => {
      assert.strictEqual(MILESTONE_DEFINITIONS.length, 5);
      assert.deepStrictEqual(
        MILESTONE_DEFINITIONS.map((m) => m.targetBytes),
        [1000, 10000, 100000, 500000, 1000000]
      );
    });

    it('returns default 1.0x multipliers and 0 bonus RAM when below first milestone (1,000 bytes)', () => {
      const buffs = getMilestoneBuffs(500);
      assert.strictEqual(buffs.dataMultiplier, 1.0);
      assert.strictEqual(buffs.bonusRamMB, 0);
      assert.strictEqual(buffs.coolingMultiplier, 1.0);
      assert.strictEqual(buffs.surgeMultiplier, 1.0);
      assert.strictEqual(buffs.flushSpeedMultiplier, 1.0);
    });

    it('applies cumulative passive buffs as milestones are achieved', () => {
      // 1K: +5% Data
      const b1k = getMilestoneBuffs(1000);
      assert.strictEqual(b1k.dataMultiplier, 1.05);

      // 10K: +64MB RAM
      const b10k = getMilestoneBuffs(10000);
      assert.strictEqual(b10k.dataMultiplier, 1.05);
      assert.strictEqual(b10k.bonusRamMB, 64);

      // 100K: +10% Cooling
      const b100k = getMilestoneBuffs(100000);
      assert.strictEqual(b100k.coolingMultiplier, 1.10);

      // 500K: +15% Surge
      const b500k = getMilestoneBuffs(500000);
      assert.strictEqual(b500k.surgeMultiplier, 1.15);

      // 1M: +20% Data and +50% Flush Speed (Cumulative data = 1.05 * 1.20 = 1.26)
      const b1m = getMilestoneBuffs(1000000);
      assert.ok(Math.abs(b1m.dataMultiplier - 1.26) < 0.0001);
      assert.strictEqual(b1m.bonusRamMB, 64);
      assert.strictEqual(b1m.coolingMultiplier, 1.10);
      assert.strictEqual(b1m.surgeMultiplier, 1.15);
      assert.strictEqual(b1m.flushSpeedMultiplier, 1.50);
    });

    it('detects newly reached milestones and records acknowledgements', () => {
      const ackMap: Record<string, number> = {};
      const { newlyReached, updatedMap } = checkNewMilestones(15000, ackMap);

      assert.strictEqual(newlyReached.length, 2);
      assert.strictEqual(newlyReached[0].id, 'ms_1k');
      assert.strictEqual(newlyReached[1].id, 'ms_10k');
      assert.ok(updatedMap['ms_1k'] > 0);
      assert.ok(updatedMap['ms_10k'] > 0);

      // Re-check with updated map
      const secondCheck = checkNewMilestones(15000, updatedMap);
      assert.strictEqual(secondCheck.newlyReached.length, 0);
    });

    it('decorates milestones with unlocked boolean based on lifetime banked bytes', () => {
      const list = getDecoratedMilestones(50000);
      assert.strictEqual(list[0].unlocked, true); // 1k
      assert.strictEqual(list[1].unlocked, true); // 10k
      assert.strictEqual(list[2].unlocked, false); // 100k
    });

    it('persists and loads acknowledged milestones to/from localStorage', () => {
      const map = { ms_1k: Date.now() };
      saveAcknowledgedMilestones(map);
      const loaded = loadAcknowledgedMilestones();
      assert.deepStrictEqual(loaded, map);
    });
  });

  // =========================================================================
  // SECTION 3: PROGRESSION GOALS & ONBOARDING LADDER
  // =========================================================================
  describe('3. Progression Goal Ladder (15 Guided Steps)', () => {

    it('defines 15 progressive context-aware goals guiding player from mining to mastery', () => {
      assert.strictEqual(PROGRESSION_GOALS.length, 15);
      const ids = PROGRESSION_GOALS.map((g) => g.id);
      assert.strictEqual(new Set(ids).size, 15);
      assert.strictEqual(ids[0], 'goal_mine_10');
      assert.strictEqual(ids[1], 'goal_first_flush');
      assert.strictEqual(ids[14], 'goal_mastery');
    });

    it('returns Goal 1 as active when no goals are claimed', () => {
      const ctx = createBaseGoalContext({ totalClicks: 0 });
      const claimed = new Set<string>();
      const info = getActiveGoalInfo(ctx, claimed);

      assert.strictEqual(info.goal?.id, 'goal_mine_10');
      assert.strictEqual(info.current, 0);
      assert.strictEqual(info.target, 10);
      assert.strictEqual(info.percent, 0);
      assert.strictEqual(info.isCompleted, false);
      assert.strictEqual(info.isClaimed, false);
      assert.strictEqual(info.stepIndex, 0);
    });

    it('calculates completion accurately on reaching target requirement', () => {
      const ctx = createBaseGoalContext({ totalClicks: 10 });
      const claimed = new Set<string>();
      const info = getActiveGoalInfo(ctx, claimed);

      assert.strictEqual(info.goal?.id, 'goal_mine_10');
      assert.strictEqual(info.current, 10);
      assert.strictEqual(info.percent, 100);
      assert.strictEqual(info.isCompleted, true);
      assert.strictEqual(info.isClaimed, false);
    });

    it('advances seamlessly to Goal 2 after Goal 1 is claimed', () => {
      const ctx = createBaseGoalContext({ totalClicks: 15, bankedBytes: 0 });
      const claimed = new Set<string>(['goal_mine_10']);
      const info = getActiveGoalInfo(ctx, claimed);

      assert.strictEqual(info.goal?.id, 'goal_first_flush');
      assert.strictEqual(info.target, 25);
      assert.strictEqual(info.current, 0);
      assert.strictEqual(info.isCompleted, false);
      assert.strictEqual(info.stepIndex, 1);
    });

    it('evaluates hardware upgrade progression goals properly', () => {
      // Goal 3 is CPU Level 2
      const claimed = new Set<string>(['goal_mine_10', 'goal_first_flush']);
      const ctx = createBaseGoalContext({
        hardware: {
          cpuLevel: 2,
          ramLevel: 1,
          coolingLevel: 1,
          busLevel: 1,
          thermalPasteLevel: 0,
        },
      });
      const info = getActiveGoalInfo(ctx, claimed);
      assert.strictEqual(info.goal?.id, 'goal_cpu_2');
      assert.strictEqual(info.isCompleted, true);
    });

    it('evaluates thermal surge goal (85°C)', () => {
      const claimed = new Set<string>([
        'goal_mine_10',
        'goal_first_flush',
        'goal_cpu_2',
        'goal_ram_2',
      ]);
      const ctx = createBaseGoalContext({ highestHeatSeen: 87.2 });
      const info = getActiveGoalInfo(ctx, claimed);
      assert.strictEqual(info.goal?.id, 'goal_surge_85');
      assert.strictEqual(info.isCompleted, true);
      assert.strictEqual(info.current, 85);
    });

    it('returns completed state with isClaimed=true when all 15 goals are completed', () => {
      const claimed = new Set<string>(PROGRESSION_GOALS.map((g) => g.id));
      const ctx = createBaseGoalContext();
      const info = getActiveGoalInfo(ctx, claimed);

      assert.strictEqual(info.isClaimed, true);
      assert.strictEqual(info.isCompleted, true);
      assert.strictEqual(info.percent, 100);
      assert.strictEqual(info.stepIndex, 15);
    });

    it('persists and loads claimed goal IDs correctly to/from localStorage', () => {
      const set = new Set<string>(['goal_mine_10', 'goal_first_flush']);
      saveClaimedGoalIds(set);
      const loaded = loadClaimedGoalIds();
      assert.deepStrictEqual(Array.from(loaded).sort(), Array.from(set).sort());
    });
  });
});
