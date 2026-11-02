/**
 * Types specifically tailored for the CrazyGames Onboarding & Arcade Experience.
 * Keeps production types in /src/types/depthos.ts completely untouched.
 */

export interface FloatingRewardItem {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  scale?: number;
  isSurge?: boolean;
}

export interface ArcadeObjective {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  rewardBytes: number;
  completed: boolean;
  claimed: boolean;
}

export type OnboardingStage =
  | 'click_to_mine'    // Step 1: Click the processor core to generate unbanked bytes
  | 'watch_heat'       // Step 2: Notice heat rising towards 85°C surge zone
  | 'flush_cash'       // Step 3: Bank your cash before reaching 100°C meltdown
  | 'buy_upgrade'      // Step 4: Buy your first hardware upgrade
  | 'completed';       // Free play

export type RewardedAdType =
  | 'double_flush'        // 2x Next Flush Payout
  | 'cryo_dump'           // Instant Full Liquid Nitrogen Cool to 25°C
  | 'turbo_overclock'     // 30s Double Mining Yield
  | 'bsod_revive'         // Instant Meltdown Revive with Zero Data Loss
  | 'milestone_double'    // 2x Mission Reward Claim
  | 'post_flush_double';  // Double Previous Flush Payout

export interface RewardedAdState {
  isOpen: boolean;
  type: RewardedAdType;
  title: string;
  rewardLabel: string;
  payoutBonus?: number;
}
