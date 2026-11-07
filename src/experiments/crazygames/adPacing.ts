import { RewardedAdType } from './types';

/**
 * Standard Cooldowns (in seconds) for each rewarded ad placement.
 * Ensures player-friendly pacing:
 * - Prevents rapid-fire ad spam
 * - Keeps gameplay voluntary and unobtrusive
 * - Normal gameplay continues completely unimpeded
 */
export const AD_COOLDOWN_DURATIONS: Record<RewardedAdType, number> = {
  double_flush: 45,       // 45s between 2x flush boost requests
  turbo_overclock: 45,    // 45s cooldown after 30s turbo boost
  cryo_dump: 30,          // 30s between liquid nitrogen emergency dumps
  post_flush_double: 60,  // 60s cooldown on post-flush double offers
  bsod_revive: 10,        // 10s grace interval between revive attempts
  milestone_double: 0,    // Governed strictly by objective milestone completion
  rush_research: 30,      // 30s cooldown on research rush requests
};

/**
 * Returns seconds remaining on cooldown for a given ad type (0 if available).
 */
export function getAdCooldownRemaining(
  type: RewardedAdType,
  cooldowns: Record<string, number>,
  now: number = Date.now()
): number {
  const expiry = cooldowns[type] || 0;
  if (expiry <= now) return 0;
  return Math.ceil((expiry - now) / 1000);
}

/**
 * Checks whether a given ad type is currently on cooldown.
 */
export function isAdOnCooldown(
  type: RewardedAdType,
  cooldowns: Record<string, number>,
  now: number = Date.now()
): boolean {
  return getAdCooldownRemaining(type, cooldowns, now) > 0;
}

/**
 * Sets or updates the cooldown for an ad type, returning an updated cooldowns object.
 */
export function setAdCooldownExpiry(
  type: RewardedAdType,
  cooldowns: Record<string, number>,
  durationSec?: number,
  now: number = Date.now()
): Record<string, number> {
  const duration = durationSec ?? AD_COOLDOWN_DURATIONS[type] ?? 30;
  if (duration <= 0) return cooldowns;
  return {
    ...cooldowns,
    [type]: now + duration * 1000,
  };
}
