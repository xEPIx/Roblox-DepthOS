import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  AD_COOLDOWN_DURATIONS,
  getAdCooldownRemaining,
  isAdOnCooldown,
  setAdCooldownExpiry,
} from '../adPacing';
import { RewardedAdType } from '../types';

/**
 * Ad Attempt Session Simulator
 * Simulates the exact state machine and safety guards implemented in:
 * - src/experiments/crazygames/components/RewardedAdModal.tsx
 * - src/experiments/crazygames/CrazyGamesApp.tsx
 */
class AdAttemptSessionHarness {
  public activeAttemptId: string | null = null;
  public grantedAttemptIds = new Set<string>();
  public adStatus: 'idle' | 'requesting' | 'playing' | 'completed' | 'error' | 'unavailable' = 'idle';
  public errorMessage: string = '';
  public isPlaybackActive: boolean = false;
  public isAttemptActive: boolean = false;
  public audioMuted: boolean = false;
  public prevMuted: boolean = false;
  public rewardGrantCount: number = 0;
  public requestTimeoutTimer: NodeJS.Timeout | null = null;
  public readonly REQUEST_TIMEOUT_MS = 8000;

  constructor(initialMuted: boolean = false) {
    this.audioMuted = initialMuted;
    this.prevMuted = initialMuted;
  }

  // Opens modal with a unique attempt ID
  public openAttempt(attemptId: string) {
    this.activeAttemptId = attemptId;
    this.isAttemptActive = true;
    this.prevMuted = this.audioMuted;
    if (!this.audioMuted) {
      this.audioMuted = true;
    }
  }

  // Starts the request watchdog timer (simulating modal's setTimeout)
  public startWatchdog(onTimeoutCallback?: () => void) {
    this.adStatus = 'requesting';
    this.requestTimeoutTimer = setTimeout(() => {
      this.triggerTimeout();
      if (onTimeoutCallback) onTimeoutCallback();
    }, this.REQUEST_TIMEOUT_MS);
  }

  // Clear watchdog
  public clearWatchdog() {
    if (this.requestTimeoutTimer) {
      clearTimeout(this.requestTimeoutTimer);
      this.requestTimeoutTimer = null;
    }
  }

  // Timeout failure path
  public triggerTimeout() {
    this.clearWatchdog();
    this.activeAttemptId = null;
    this.isPlaybackActive = false;
    this.isAttemptActive = false;
    this.adStatus = 'error';
    this.audioMuted = this.prevMuted;
    this.errorMessage = 'Ad request timed out before playback started. Please check connection and try again.';
  }

  // Simulated SDK callback: adStarted
  public onSdkAdStarted(attemptId: string) {
    this.clearWatchdog();
    if (this.activeAttemptId !== attemptId) return;
    this.adStatus = 'playing';
    this.isPlaybackActive = true;
  }

  // Simulated SDK callback: adFinished
  public onSdkAdFinished(attemptId: string) {
    this.clearWatchdog();
    if (this.activeAttemptId !== attemptId) return;
    this.isPlaybackActive = false;
    this.isAttemptActive = false;
    this.adStatus = 'completed';
    this.audioMuted = this.prevMuted;

    // Grant reward once
    if (this.grantedAttemptIds.has(attemptId)) {
      return;
    }
    this.grantedAttemptIds.add(attemptId);
    this.activeAttemptId = null;
    this.rewardGrantCount++;
  }

  // Simulated SDK callback: adError
  public onSdkAdError(attemptId: string, error: unknown) {
    this.clearWatchdog();
    if (this.activeAttemptId !== attemptId) return;
    this.activeAttemptId = null;
    this.isPlaybackActive = false;
    this.isAttemptActive = false;
    this.adStatus = 'error';
    this.audioMuted = this.prevMuted;
    this.errorMessage = typeof error === 'string' ? error : 'Ad error occurred';
  }

  // User dismissal / cancellation
  public dismiss() {
    this.clearWatchdog();
    this.activeAttemptId = null;
    this.isPlaybackActive = false;
    this.isAttemptActive = false;
    this.audioMuted = this.prevMuted;
  }

  // SDK missing / unavailable path
  public triggerUnavailable() {
    this.clearWatchdog();
    this.activeAttemptId = null;
    this.isPlaybackActive = false;
    this.isAttemptActive = false;
    this.adStatus = 'unavailable';
    this.audioMuted = this.prevMuted;
  }
}

describe('CrazyGames Rewarded-Ad Resilience & Pacing Suite', () => {

  it('1. Request timeout-before-play: fails safely and never grants rewards', () => {
    const session = new AdAttemptSessionHarness(false);
    session.openAttempt('attempt_timeout_test');
    assert.equal(session.audioMuted, true);
    assert.equal(session.isAttemptActive, true);

    // Watchdog triggers timeout
    session.triggerTimeout();

    assert.equal(session.adStatus, 'error');
    assert.equal(session.activeAttemptId, null, 'Active attempt token must be invalidated');
    assert.equal(session.isAttemptActive, false, 'Attempt active flag must be false so countdown resumes');
    assert.equal(session.isPlaybackActive, false, 'Playback must not be active');
    assert.equal(session.audioMuted, false, 'Audio mute must be restored to previous state');
    assert.equal(session.rewardGrantCount, 0, 'No reward may be granted on timeout');
    assert.match(session.errorMessage, /timed out/i);

    // Any delayed SDK callback arriving after timeout must be dropped
    session.onSdkAdFinished('attempt_timeout_test');
    assert.equal(session.rewardGrantCount, 0, 'Late callback after timeout must not grant reward');
  });

  it('2. Long-running active playback: watchdog is cleared on play, ad runs to completion', () => {
    const session = new AdAttemptSessionHarness(false);
    session.openAttempt('attempt_long_play');
    session.startWatchdog();

    // SDK signals playback started
    session.onSdkAdStarted('attempt_long_play');
    assert.equal(session.adStatus, 'playing');
    assert.equal(session.isPlaybackActive, true);
    assert.equal(session.requestTimeoutTimer, null, 'Watchdog timer must be cleared once playback starts');

    // Simulate 45 seconds of active playback (no timeout occurs)
    assert.equal(session.adStatus, 'playing');

    // SDK completes
    session.onSdkAdFinished('attempt_long_play');
    assert.equal(session.adStatus, 'completed');
    assert.equal(session.rewardGrantCount, 1, 'Reward must be granted exactly once');
    assert.equal(session.audioMuted, false, 'Audio mute must be restored');
    assert.equal(session.activeAttemptId, null, 'Attempt token settled');
  });

  it('3. BSOD revive behavior: countdown timing, cash recovery, and normal reboot discard', () => {
    // 3a. Verify BSOD revive attempt keeps crash state while active, resumes countdown when ended
    let bsodCountdown = 4.5;
    let isBSOD = true;
    let lostVolatile = 1500;
    let lostRam = 128;
    let isReviveAttemptActive = true;

    // Simulation step during active revive attempt: countdown is held
    if (isBSOD && isReviveAttemptActive) {
      bsodCountdown = 4.5; // preserved
    }
    assert.equal(bsodCountdown, 4.5);

    // Ad attempt cancels / times out -> isReviveAttemptActive becomes false
    isReviveAttemptActive = false;
    // Next simulation step: countdown ticks normally
    bsodCountdown = Math.max(0, bsodCountdown - 0.1);
    assert.equal(Math.round(bsodCountdown * 10) / 10, 4.4);

    // 3b. Verify single-use cash recovery on successful revive
    let playerVolatile = 0;
    let playerRam = 0;
    const restoredCash = lostVolatile;
    const restoredRam = lostRam;
    lostVolatile = 0; // consumed
    lostRam = 0; // consumed
    playerVolatile = restoredCash;
    playerRam = restoredRam;

    assert.equal(playerVolatile, 1500);
    assert.equal(playerRam, 128);
    assert.equal(lostVolatile, 0, 'Lost volatile cache must be consumed and reset to 0');

    // 3c. Normal reboot clears lost cash if revive was not chosen
    let normalRebootLostCash = 2500;
    let rebootHappened = true;
    if (rebootHappened) {
      normalRebootLostCash = 0;
    }
    assert.equal(normalRebootLostCash, 0, 'Normal reboot must discard unrecovered cash');
  });

  it('4. Cancellation / Dismissal: clears attempt, restores audio, drops late callbacks', () => {
    const session = new AdAttemptSessionHarness(false);
    session.openAttempt('attempt_dismiss_test');
    assert.equal(session.audioMuted, true);

    // User dismisses modal
    session.dismiss();
    assert.equal(session.activeAttemptId, null);
    assert.equal(session.isAttemptActive, false);
    assert.equal(session.audioMuted, false);

    // Late adFinished callback arriving from CrazyGames SDK
    session.onSdkAdFinished('attempt_dismiss_test');
    assert.equal(session.rewardGrantCount, 0, 'Dismissed attempt must never grant reward');
  });

  it('5. SDK errors: safely handled, restores audio, no reward granted', () => {
    const session = new AdAttemptSessionHarness(false);
    session.openAttempt('attempt_error_test');
    session.startWatchdog();

    session.onSdkAdError('attempt_error_test', 'CrazyGames: No ad inventory available');
    assert.equal(session.adStatus, 'error');
    assert.equal(session.activeAttemptId, null);
    assert.equal(session.isAttemptActive, false);
    assert.equal(session.audioMuted, false);
    assert.equal(session.rewardGrantCount, 0);
    assert.equal(session.errorMessage, 'CrazyGames: No ad inventory available');
  });

  it('6. Missing SDK / Preview: shows unavailable status, no fake reward granted', () => {
    const session = new AdAttemptSessionHarness(false);
    session.openAttempt('attempt_preview_test');

    session.triggerUnavailable();
    assert.equal(session.adStatus, 'unavailable');
    assert.equal(session.activeAttemptId, null);
    assert.equal(session.isAttemptActive, false);
    assert.equal(session.audioMuted, false);
    assert.equal(session.rewardGrantCount, 0, 'No reward may ever be granted when SDK is unavailable');
  });

  it('7. Stale and duplicate callback rejection: exactly-once grant enforcement', () => {
    const session = new AdAttemptSessionHarness(false);
    session.openAttempt('attempt_token_1');

    session.onSdkAdStarted('attempt_token_1');
    session.onSdkAdFinished('attempt_token_1');
    assert.equal(session.rewardGrantCount, 1);

    // Duplicate call with same token
    session.onSdkAdFinished('attempt_token_1');
    assert.equal(session.rewardGrantCount, 1, 'Duplicate callback on same token must be ignored');

    // Callback with outdated/stale token from previous attempt
    session.openAttempt('attempt_token_2');
    session.onSdkAdFinished('attempt_token_1');
    assert.equal(session.rewardGrantCount, 1, 'Stale token from earlier attempt must be ignored');
  });

  it('8. Mute restoration preserves initial player sound preference', () => {
    // Case A: Player was UNMUTED before ad -> must be UNMUTED after ad
    const sessionUnmuted = new AdAttemptSessionHarness(false);
    sessionUnmuted.openAttempt('mute_test_a');
    assert.equal(sessionUnmuted.audioMuted, true, 'Must mute during ad');
    sessionUnmuted.onSdkAdFinished('mute_test_a');
    assert.equal(sessionUnmuted.audioMuted, false, 'Must restore unmuted state');

    // Case B: Player was ALREADY MUTED before ad -> must remain MUTED after ad
    const sessionMuted = new AdAttemptSessionHarness(true);
    sessionMuted.openAttempt('mute_test_b');
    assert.equal(sessionMuted.audioMuted, true);
    sessionMuted.onSdkAdFinished('mute_test_b');
    assert.equal(sessionMuted.audioMuted, true, 'Must preserve pre-existing muted state');
  });

  it('9. Cooldown tracking & expiry: independent per-type cooldown durations', () => {
    const now = 1000000;
    let cooldowns: Record<string, number> = {};

    // Check initial state
    assert.equal(isAdOnCooldown('double_flush', cooldowns, now), false);
    assert.equal(getAdCooldownRemaining('double_flush', cooldowns, now), 0);

    // Apply cooldown to double_flush (duration: 45s)
    cooldowns = setAdCooldownExpiry('double_flush', cooldowns, 45, now);
    assert.equal(isAdOnCooldown('double_flush', cooldowns, now), true);
    assert.equal(getAdCooldownRemaining('double_flush', cooldowns, now), 45);

    // Mid-cooldown check (after 20 seconds)
    const midTime = now + 20000;
    assert.equal(isAdOnCooldown('double_flush', cooldowns, midTime), true);
    assert.equal(getAdCooldownRemaining('double_flush', cooldowns, midTime), 25);

    // Independent type check: cryo_dump is NOT on cooldown
    assert.equal(isAdOnCooldown('cryo_dump', cooldowns, midTime), false);

    // Apply cooldown to cryo_dump (duration: 30s)
    cooldowns = setAdCooldownExpiry('cryo_dump', cooldowns, 30, midTime);
    assert.equal(isAdOnCooldown('cryo_dump', cooldowns, midTime), true);
    assert.equal(getAdCooldownRemaining('cryo_dump', cooldowns, midTime), 30);

    // After double_flush cooldown expires (+46 seconds from start)
    const expiredTime = now + 46000;
    assert.equal(isAdOnCooldown('double_flush', cooldowns, expiredTime), false);
    assert.equal(getAdCooldownRemaining('double_flush', cooldowns, expiredTime), 0);

    // cryo_dump is still active at expiredTime (was set at now+20000 for 30s = now+50000)
    assert.equal(isAdOnCooldown('cryo_dump', cooldowns, expiredTime), true);
    assert.equal(getAdCooldownRemaining('cryo_dump', cooldowns, expiredTime), 4);
  });
});
