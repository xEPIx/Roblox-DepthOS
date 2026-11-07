import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  RESEARCH_BRANCHES,
  RESEARCH_NODES,
  getResearchBonuses,
  isTechAvailable,
  findTechById,
  getActiveResearchProgress,
  loadUnlockedResearch,
  saveUnlockedResearch,
  loadActiveResearch,
  saveActiveResearch,
} from '../research';
import { ActiveResearch } from '../types';

// Mock localStorage for test environment
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

describe('CrazyGames Research Tree & Long-Term Progression Suite', () => {

  beforeEach(() => {
    localStorage.clear();
  });

  // =========================================================================
  // 1. BRANCHES & ARCHITECTURE
  // =========================================================================
  describe('1. 5 Research Branches & 15 Technology Nodes', () => {
    it('defines exactly 5 distinct research branches', () => {
      const branches = Object.keys(RESEARCH_BRANCHES);
      assert.strictEqual(branches.length, 5);
      assert.ok(branches.includes('computing'));
      assert.ok(branches.includes('memory'));
      assert.ok(branches.includes('cooling'));
      assert.ok(branches.includes('storage'));
      assert.ok(branches.includes('automation'));
    });

    it('contains exactly 15 technology nodes, with 3 sequential tiers per branch', () => {
      assert.strictEqual(RESEARCH_NODES.length, 15);

      for (const branch of Object.keys(RESEARCH_BRANCHES) as Array<keyof typeof RESEARCH_BRANCHES>) {
        const nodesInBranch = RESEARCH_NODES.filter((n) => n.branch === branch);
        assert.strictEqual(nodesInBranch.length, 3, `Branch ${branch} must have 3 tiers`);

        const tiers = nodesInBranch.map((n) => n.tier).sort((a, b) => a - b);
        assert.deepStrictEqual(tiers, [1, 2, 3], `Branch ${branch} must have tiers 1, 2, 3`);
      }
    });

    it('enforces that every node has byte cost and positive unlock duration', () => {
      for (const node of RESEARCH_NODES) {
        assert.ok(node.costBytes > 0, `Node ${node.id} must have positive costBytes`);
        assert.ok(node.durationSeconds > 0, `Node ${node.id} must have positive durationSeconds`);
        assert.ok(node.title.length > 0, `Node ${node.id} must have title`);
        assert.ok(node.bonusLabel.length > 0, `Node ${node.id} must have bonusLabel`);
      }
    });

    it('finds technology by ID accurately', () => {
      const liquidCooling = findTechById('cool_liquid');
      assert.ok(liquidCooling);
      assert.strictEqual(liquidCooling.title, 'Liquid Cooling');
      assert.strictEqual(liquidCooling.branch, 'cooling');

      const nonExistent = findTechById('fake_tech_id');
      assert.strictEqual(nonExistent, undefined);
    });
  });

  // =========================================================================
  // 2. PREREQUISITES & AVAILABILITY
  // =========================================================================
  describe('2. Prerequisites & Node Availability', () => {
    it('allows Tier 1 nodes to be researched immediately with empty unlocked set', () => {
      const unlocked = new Set<string>();
      const comp1 = findTechById('comp_cpus')!;
      const mem1 = findTechById('mem_compression')!;
      const cool1 = findTechById('cool_fans')!;
      const stor1 = findTechById('stor_ssd')!;
      const auto1 = findTechById('auto_recovery')!;

      assert.strictEqual(isTechAvailable(comp1, unlocked), true);
      assert.strictEqual(isTechAvailable(mem1, unlocked), true);
      assert.strictEqual(isTechAvailable(cool1, unlocked), true);
      assert.strictEqual(isTechAvailable(stor1, unlocked), true);
      assert.strictEqual(isTechAvailable(auto1, unlocked), true);
    });

    it('blocks Tier 2 and Tier 3 nodes when prerequisites are not met', () => {
      const unlocked = new Set<string>();
      const comp2 = findTechById('comp_parallel')!;
      const comp3 = findTechById('comp_quantum')!;

      assert.strictEqual(isTechAvailable(comp2, unlocked), false);
      assert.strictEqual(isTechAvailable(comp3, unlocked), false);
    });

    it('unlocks Tier 2 once Tier 1 is researched, but keeps Tier 3 locked', () => {
      const unlocked = new Set<string>(['comp_cpus']);
      const comp2 = findTechById('comp_parallel')!;
      const comp3 = findTechById('comp_quantum')!;

      assert.strictEqual(isTechAvailable(comp2, unlocked), true);
      assert.strictEqual(isTechAvailable(comp3, unlocked), false);
    });

    it('unlocks Tier 3 once Tier 1 and Tier 2 are researched', () => {
      const unlocked = new Set<string>(['comp_cpus', 'comp_parallel']);
      const comp3 = findTechById('comp_quantum')!;

      assert.strictEqual(isTechAvailable(comp3, unlocked), true);
    });

    it('prevents researching already unlocked technologies', () => {
      const unlocked = new Set<string>(['comp_cpus']);
      const comp1 = findTechById('comp_cpus')!;

      assert.strictEqual(isTechAvailable(comp1, unlocked), false);
    });
  });

  // =========================================================================
  // 3. RESEARCH TIMER PROGRESSION
  // =========================================================================
  describe('3. Unlock Over Time & Timer Progress', () => {
    it('returns zero progress for null active research', () => {
      const p = getActiveResearchProgress(null);
      assert.strictEqual(p.progress, 0);
      assert.strictEqual(p.remainingMs, 0);
      assert.strictEqual(p.isComplete, false);
    });

    it('calculates progress percentage and remaining time accurately', () => {
      const startTime = 1000000;
      const durationMs = 10000; // 10s
      const active: ActiveResearch = {
        techId: 'comp_cpus',
        startTime,
        durationMs,
      };

      // At start
      const pStart = getActiveResearchProgress(active, startTime);
      assert.strictEqual(pStart.progress, 0);
      assert.strictEqual(pStart.remainingMs, 10000);
      assert.strictEqual(pStart.isComplete, false);

      // Halfway (5s in)
      const pHalf = getActiveResearchProgress(active, startTime + 5000);
      assert.strictEqual(pHalf.progress, 50);
      assert.strictEqual(pHalf.remainingMs, 5000);
      assert.strictEqual(pHalf.isComplete, false);

      // Finished (10s in)
      const pDone = getActiveResearchProgress(active, startTime + 10000);
      assert.strictEqual(pDone.progress, 100);
      assert.strictEqual(pDone.remainingMs, 0);
      assert.strictEqual(pDone.isComplete, true);

      // Beyond duration
      const pOver = getActiveResearchProgress(active, startTime + 15000);
      assert.strictEqual(pOver.progress, 100);
      assert.strictEqual(pOver.remainingMs, 0);
      assert.strictEqual(pOver.isComplete, true);
    });
  });

  // =========================================================================
  // 4. CUMULATIVE RESEARCH BONUSES
  // =========================================================================
  describe('4. Cumulative Permanent Research Bonuses', () => {
    it('returns default multipliers and zero bonuses with no technologies researched', () => {
      const b = getResearchBonuses(new Set());
      assert.strictEqual(b.dataMultiplier, 1.0);
      assert.strictEqual(b.surgeMultiplier, 1.0);
      assert.strictEqual(b.bonusRamMB, 0);
      assert.strictEqual(b.flushSpeedMultiplier, 1.0);
      assert.strictEqual(b.coolingMultiplier, 1.0);
      assert.strictEqual(b.heatReduction, 0.0);
      assert.strictEqual(b.payoutMultiplier, 1.0);
      assert.strictEqual(b.autoRecovery, false);
      assert.strictEqual(b.autoCryoVent, false);
      assert.strictEqual(b.upgradeCostDiscount, 0.0);
    });

    it('compounds data multipliers across Computing branch technologies', () => {
      // Tier 1: +15% Data (1.15)
      const b1 = getResearchBonuses(new Set(['comp_cpus']));
      assert.strictEqual(b1.dataMultiplier, 1.15);

      // Tier 1 + 2: 1.15 * 1.30 = 1.495
      const b2 = getResearchBonuses(new Set(['comp_cpus', 'comp_parallel']));
      assert.ok(Math.abs(b2.dataMultiplier - 1.495) < 0.0001);

      // Full Computing Branch (Tier 1 + 2 + 3): 1.495 * 1.50 = 2.2425 + 1.25 Surge
      const b3 = getResearchBonuses(new Set(['comp_cpus', 'comp_parallel', 'comp_quantum']));
      assert.ok(Math.abs(b3.dataMultiplier - 2.2425) < 0.0001);
      assert.strictEqual(b3.surgeMultiplier, 1.25);
    });

    it('expands RAM Buffer capacity and flush speed across Memory branch', () => {
      // Tier 1: +32MB
      const b1 = getResearchBonuses(new Set(['mem_compression']));
      assert.strictEqual(b1.bonusRamMB, 32);

      // Tier 1 + 2: +32 + 64 = 96MB, 1.25x flush speed
      const b2 = getResearchBonuses(new Set(['mem_compression', 'mem_efficiency']));
      assert.strictEqual(b2.bonusRamMB, 96);
      assert.strictEqual(b2.flushSpeedMultiplier, 1.25);

      // Full Memory Branch: 96 + 128 = 224MB, 1.25 * 1.50 = 1.875x flush speed
      const b3 = getResearchBonuses(new Set(['mem_compression', 'mem_efficiency', 'mem_cache']));
      assert.strictEqual(b3.bonusRamMB, 224);
      assert.strictEqual(b3.flushSpeedMultiplier, 1.875);
    });

    it('boosts Cooling efficiency and reduces heat generation across Cooling branch', () => {
      // Tier 1: 1.15x cooling
      const b1 = getResearchBonuses(new Set(['cool_fans']));
      assert.strictEqual(b1.coolingMultiplier, 1.15);

      // Tier 1 + 2: 1.15 * 1.25 = 1.4375x cooling, 10% heat reduction
      const b2 = getResearchBonuses(new Set(['cool_fans', 'cool_liquid']));
      assert.ok(Math.abs(b2.coolingMultiplier - 1.4375) < 0.0001);
      assert.strictEqual(b2.heatReduction, 0.10);

      // Full Cooling Branch: 1.4375 * 1.50 = 2.15625x cooling
      const b3 = getResearchBonuses(new Set(['cool_fans', 'cool_liquid', 'cool_cryo']));
      assert.ok(Math.abs(b3.coolingMultiplier - 2.15625) < 0.0001);
      assert.strictEqual(b3.heatReduction, 0.10);
    });

    it('compounds bank flush payouts across Storage branch', () => {
      // Tier 1: 1.15x
      const b1 = getResearchBonuses(new Set(['stor_ssd']));
      assert.strictEqual(b1.payoutMultiplier, 1.15);

      // Tier 1 + 2: 1.15 * 1.30 = 1.495x
      const b2 = getResearchBonuses(new Set(['stor_ssd', 'stor_nvme']));
      assert.ok(Math.abs(b2.payoutMultiplier - 1.495) < 0.0001);

      // Full Storage Branch: 1.495 * 1.50 = 2.2425x payout
      const b3 = getResearchBonuses(new Set(['stor_ssd', 'stor_nvme', 'stor_warehouse']));
      assert.ok(Math.abs(b3.payoutMultiplier - 2.2425) < 0.0001);
    });

    it('activates autonomous automation daemons and hardware cost discount', () => {
      // Tier 1: Auto Recovery
      const b1 = getResearchBonuses(new Set(['auto_recovery']));
      assert.strictEqual(b1.autoRecovery, true);
      assert.strictEqual(b1.autoCryoVent, false);

      // Tier 2: Auto Cryo-Vent
      const b2 = getResearchBonuses(new Set(['auto_recovery', 'auto_maintenance']));
      assert.strictEqual(b2.autoRecovery, true);
      assert.strictEqual(b2.autoCryoVent, true);

      // Tier 3: 25% Hardware Discount
      const b3 = getResearchBonuses(new Set(['auto_recovery', 'auto_maintenance', 'auto_allocation']));
      assert.strictEqual(b3.autoRecovery, true);
      assert.strictEqual(b3.autoCryoVent, true);
      assert.strictEqual(b3.upgradeCostDiscount, 0.25);
    });
  });

  // =========================================================================
  // 5. LOCALSTORAGE PERSISTENCE
  // =========================================================================
  describe('5. Storage Persistence (Save & Load)', () => {
    it('persists and retrieves unlocked technology IDs', () => {
      const unlocked = new Set<string>(['comp_cpus', 'mem_compression', 'cool_fans']);
      saveUnlockedResearch(unlocked);
      const loaded = loadUnlockedResearch();
      assert.deepStrictEqual(Array.from(loaded).sort(), Array.from(unlocked).sort());
    });

    it('persists and retrieves active research in progress', () => {
      const active: ActiveResearch = {
        techId: 'stor_ssd',
        startTime: 1234567890,
        durationMs: 12000,
      };
      saveActiveResearch(active);
      const loaded = loadActiveResearch();
      assert.deepStrictEqual(loaded, active);

      // Clearing active research
      saveActiveResearch(null);
      const cleared = loadActiveResearch();
      assert.strictEqual(cleared, null);
    });
  });
});
