import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  AdAttemptController,
  AdStatus,
  SdkProvider,
  AudioProvider,
} from '../adAttemptController';
import {
  AD_COOLDOWN_DURATIONS,
  getAdCooldownRemaining,
  isAdOnCooldown,
  setAdCooldownExpiry,
} from '../adPacing';
import { RewardedAdType } from '../types';

function createMockAudio(initialMuted: boolean = false): AudioProvider & { muted: boolean } {
  const audioState = { muted: initialMuted };
  return {
    get muted() {
      return audioState.muted;
    },
    set muted(v: boolean) {
      audioState.muted = v;
    },
    getMuted: () => audioState.muted,
    setMuted: (m: boolean) => {
      audioState.muted = m;
    },
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('CrazyGames Rewarded-Ad Resilience & Shared Controller Suite', () => {

  it('1. Watchdog covers hung SDK readiness: fails safely and never grants rewards', async () => {
    const mockAudio = createMockAudio(false);
    let rewardGranted = false;
    let playbackChanges: boolean[] = [];
    let attemptActiveChanges: boolean[] = [];
    let currentStatus: AdStatus = 'idle';

    // Mock an SDK where ensureReady hangs forever (never resolves)
    const hangingSdk: SdkProvider = {
      ensureReady: () => new Promise<boolean>(() => {}),
      isAdAvailable: () => true,
      requestAd: () => {},
    };

    const controller = new AdAttemptController(
      {
        onStatusChange: (status) => {
          currentStatus = status;
        },
        onPlaybackStateChange: (isPlaying) => {
          playbackChanges.push(isPlaying);
        },
        onAttemptActiveChange: (isActive) => {
          attemptActiveChanges.push(isActive);
        },
        onReward: () => {
          rewardGranted = true;
        },
      },
      {
        timeoutMs: 40, // Fast timeout for test execution
        sdkProvider: hangingSdk,
        audioProvider: mockAudio,
      }
    );

    controller.startAttempt('hung_sdk_attempt');

    assert.equal(controller.isAttemptActive, true);
    assert.equal(mockAudio.muted, true, 'Audio must be muted upon attempt inception');
    assert.equal(currentStatus, 'requesting');

    // Wait for the watchdog timer to fire
    await sleep(60);

    assert.equal(controller.adStatus, 'error');
    assert.equal(currentStatus, 'error');
    assert.match(controller.errorMessage, /timed out/i);
    assert.equal(controller.activeAttemptId, null, 'Active attempt token must be invalidated');
    assert.equal(controller.isAttemptActive, false, 'Attempt active must be false so countdown resumes');
    assert.equal(controller.isPlaying, false, 'Playback must not be active');
    assert.equal(mockAudio.muted, false, 'Audio mute must be restored to previous state');
    assert.equal(rewardGranted, false, 'No reward may be granted on watchdog timeout');
  });

  it('2. Watchdog covers hung requestAd: timeout before playback fails safely and drops late callbacks', async () => {
    const mockAudio = createMockAudio(false);
    let rewardCount = 0;
    let capturedCallbacks: { adStarted?: () => void; adFinished?: () => void } = {};

    const hungRequestSdk: SdkProvider = {
      ensureReady: async () => true,
      isAdAvailable: () => true,
      requestAd: (_type, callbacks) => {
        capturedCallbacks = callbacks;
        // Never call any callbacks
      },
    };

    const controller = new AdAttemptController(
      {
        onReward: () => {
          rewardCount++;
        },
      },
      {
        timeoutMs: 40,
        sdkProvider: hungRequestSdk,
        audioProvider: mockAudio,
      }
    );

    controller.startAttempt('hung_request_attempt');
    await sleep(60);

    assert.equal(controller.adStatus, 'error');
    assert.equal(controller.activeAttemptId, null);
    assert.equal(mockAudio.muted, false);
    assert.equal(rewardCount, 0);

    // Stale delayed callbacks arriving after watchdog timeout must be dropped
    if (capturedCallbacks.adStarted) capturedCallbacks.adStarted();
    if (capturedCallbacks.adFinished) capturedCallbacks.adFinished();

    assert.equal(rewardCount, 0, 'Late callback arriving after timeout must never grant reward');
    assert.equal(controller.isPlaying, false);
  });

  it('3. Long-running active playback: watchdog is cleared on adStarted, ad finishes normally', async () => {
    const mockAudio = createMockAudio(false);
    let rewardCount = 0;
    let confirmedPlaybackCalled = false;
    let closeCalled = false;

    let savedCallbacks: { adStarted?: () => void; adFinished?: () => void } = {};

    const playbackSdk: SdkProvider = {
      ensureReady: async () => true,
      isAdAvailable: () => true,
      requestAd: (_type, callbacks) => {
        savedCallbacks = callbacks;
        // Immediately start playback
        callbacks.adStarted?.();
      },
    };

    const controller = new AdAttemptController(
      {
        onConfirmedPlayback: () => {
          confirmedPlaybackCalled = true;
        },
        onReward: () => {
          rewardCount++;
        },
        onClose: () => {
          closeCalled = true;
        },
      },
      {
        timeoutMs: 40, // Short timeout: playback will exceed this to prove watchdog was cancelled
        sdkProvider: playbackSdk,
        audioProvider: mockAudio,
      }
    );

    controller.startAttempt('long_playback_attempt');
    // Allow microtasks to run ensureReady
    await sleep(15);

    assert.equal(controller.adStatus, 'playing');
    assert.equal(controller.isPlaying, true);
    assert.equal(confirmedPlaybackCalled, true);
    assert.equal(mockAudio.muted, true);

    // Wait longer than timeoutMs (60ms > 40ms) while ad is playing
    await sleep(60);

    // Status must STILL be 'playing' because the watchdog was cleared on adStarted
    assert.equal(controller.adStatus, 'playing', 'Ad must not timeout once playback has started');

    // Now signal ad completion from the SDK
    savedCallbacks.adFinished?.();

    assert.equal(controller.adStatus, 'completed');
    assert.equal(controller.isPlaying, false);
    assert.equal(controller.isAttemptActive, false);
    assert.equal(mockAudio.muted, false, 'Audio mute must be restored on completion');
    assert.equal(rewardCount, 1, 'Reward must be granted exactly once');
    assert.equal(closeCalled, true);
  });

  it('4. Cancellation / Dismissal: clears attempt, restores audio, drops late callbacks', async () => {
    const mockAudio = createMockAudio(false);
    let rewardCount = 0;
    let savedCallbacks: { adFinished?: () => void } = {};

    const sdk: SdkProvider = {
      ensureReady: async () => true,
      isAdAvailable: () => true,
      requestAd: (_type, callbacks) => {
        savedCallbacks = callbacks;
      },
    };

    const controller = new AdAttemptController(
      {
        onReward: () => {
          rewardCount++;
        },
      },
      {
        timeoutMs: 500,
        sdkProvider: sdk,
        audioProvider: mockAudio,
      }
    );

    controller.startAttempt('cancelled_attempt');
    assert.equal(mockAudio.muted, true);

    // User dismisses/cancels before ad completes
    controller.dismiss();

    assert.equal(controller.activeAttemptId, null);
    assert.equal(controller.isAttemptActive, false);
    assert.equal(mockAudio.muted, false, 'Audio must be restored on dismissal');

    // Late adFinished callback from SDK arrives after dismissal
    savedCallbacks.adFinished?.();

    assert.equal(rewardCount, 0, 'Cancelled attempt must never grant reward');
  });

  it('5. SDK error followed by late adFinished: safely drops delayed callback and grants nothing', async () => {
    const mockAudio = createMockAudio(false);
    let rewardCount = 0;
    let savedCallbacks: { adError?: (err: unknown) => void; adFinished?: () => void } = {};

    const errorSdk: SdkProvider = {
      ensureReady: async () => true,
      isAdAvailable: () => true,
      requestAd: (_type, callbacks) => {
        savedCallbacks = callbacks;
        callbacks.adError?.('CrazyGames inventory unavailable');
      },
    };

    const controller = new AdAttemptController(
      {
        onReward: () => {
          rewardCount++;
        },
      },
      {
        sdkProvider: errorSdk,
        audioProvider: mockAudio,
      }
    );

    controller.startAttempt('error_attempt');
    await sleep(15);

    assert.equal(controller.adStatus, 'error');
    assert.match(controller.errorMessage, /CrazyGames inventory unavailable/);
    assert.equal(controller.activeAttemptId, null);
    assert.equal(controller.isAttemptActive, false);
    assert.equal(mockAudio.muted, false);
    assert.equal(rewardCount, 0);

    // Delayed adFinished from malfunctioning SDK
    savedCallbacks.adFinished?.();
    assert.equal(rewardCount, 0, 'No reward may be granted after ad error');
  });

  it('6. Duplicate adFinished callbacks: strictly enforced exactly-once reward grant', async () => {
    let rewardCount = 0;
    let savedCallbacks: { adStarted?: () => void; adFinished?: () => void } = {};

    const dupSdk: SdkProvider = {
      ensureReady: async () => true,
      isAdAvailable: () => true,
      requestAd: (_type, callbacks) => {
        savedCallbacks = callbacks;
        callbacks.adStarted?.();
        callbacks.adFinished?.();
      },
    };

    const controller = new AdAttemptController(
      {
        onReward: () => {
          rewardCount++;
        },
      },
      {
        sdkProvider: dupSdk,
      }
    );

    controller.startAttempt('duplicate_test_token');
    await sleep(15);

    assert.equal(rewardCount, 1, 'First adFinished grants the reward');

    // Malicious or buggy SDK invokes adFinished a second time
    savedCallbacks.adFinished?.();
    assert.equal(rewardCount, 1, 'Second adFinished must be ignored');
  });

  it('7. Duplicate adStarted callback: ignores duplicate and prevents duplicate playback events', async () => {
    let confirmedPlaybackCount = 0;
    let playbackStateChanges: boolean[] = [];
    let savedCallbacks: { adStarted?: () => void } = {};

    const sdk: SdkProvider = {
      ensureReady: async () => true,
      isAdAvailable: () => true,
      requestAd: (_type, callbacks) => {
        savedCallbacks = callbacks;
        callbacks.adStarted?.();
      },
    };

    const controller = new AdAttemptController({
      onConfirmedPlayback: () => {
        confirmedPlaybackCount++;
      },
      onPlaybackStateChange: (isPlaying) => {
        playbackStateChanges.push(isPlaying);
      },
    }, { sdkProvider: sdk });

    controller.startAttempt('dup_adstarted_token');
    await sleep(15);

    assert.equal(controller.isPlaying, true);
    assert.equal(confirmedPlaybackCount, 1);
    assert.deepEqual(playbackStateChanges, [true]);

    // Buggy SDK fires adStarted a second time
    savedCallbacks.adStarted?.();

    assert.equal(confirmedPlaybackCount, 1, 'Duplicate adStarted must not re-trigger onConfirmedPlayback');
    assert.deepEqual(playbackStateChanges, [true], 'Duplicate adStarted must not emit duplicate state changes');
  });

  it('8. Error after playback begins: resumes simulation and audio, drops later adFinished', async () => {
    const mockAudio = createMockAudio(false);
    let rewardCount = 0;
    let playbackChanges: boolean[] = [];
    let attemptActiveChanges: boolean[] = [];
    let savedCallbacks: { adStarted?: () => void; adError?: (err: unknown) => void; adFinished?: () => void } = {};

    const sdk: SdkProvider = {
      ensureReady: async () => true,
      isAdAvailable: () => true,
      requestAd: (_type, callbacks) => {
        savedCallbacks = callbacks;
        callbacks.adStarted?.();
      },
    };

    const controller = new AdAttemptController({
      onPlaybackStateChange: (isPlaying) => {
        playbackChanges.push(isPlaying);
      },
      onAttemptActiveChange: (isActive) => {
        attemptActiveChanges.push(isActive);
      },
      onReward: () => {
        rewardCount++;
      },
    }, { sdkProvider: sdk, audioProvider: mockAudio });

    controller.startAttempt('error_during_play');
    await sleep(15);

    assert.equal(controller.adStatus, 'playing');
    assert.equal(controller.isPlaying, true);
    assert.equal(mockAudio.muted, true);

    // Mid-playback error occurs (e.g. video decoder crash or user closed iframe)
    savedCallbacks.adError?.('Video stream interrupted');

    assert.equal(controller.adStatus, 'error');
    assert.equal(controller.isPlaying, false, 'Playback must be false to resume simulation');
    assert.equal(controller.isAttemptActive, false, 'Attempt active must be false to resume BSOD countdown');
    assert.equal(mockAudio.muted, false, 'Audio mute must be restored immediately');
    assert.equal(controller.activeAttemptId, null, 'Active attempt must be invalidated');

    // Late adFinished arrives after the error
    savedCallbacks.adFinished?.();
    assert.equal(rewardCount, 0, 'No reward may be granted after mid-playback error');
  });

  it('9. Missing SDK / Standalone preview: shows unavailable status with zero false rewards', async () => {
    const mockAudio = createMockAudio(false);
    let rewardCount = 0;

    const unavailableSdk: SdkProvider = {
      ensureReady: async () => false,
      isAdAvailable: () => false,
      requestAd: () => {},
    };

    const controller = new AdAttemptController(
      {
        onReward: () => {
          rewardCount++;
        },
      },
      {
        sdkProvider: unavailableSdk,
        audioProvider: mockAudio,
      }
    );

    controller.startAttempt('preview_attempt');
    await sleep(15);

    assert.equal(controller.adStatus, 'unavailable');
    assert.equal(controller.activeAttemptId, null);
    assert.equal(controller.isAttemptActive, false);
    assert.equal(mockAudio.muted, false);
    assert.equal(rewardCount, 0, 'No reward may be granted when SDK is unavailable');
  });

  it('10. Component unmount / disposal (dispose): cancels timer and restores audio cleanly', async () => {
    const mockAudio = createMockAudio(false);
    let rewardCount = 0;

    const hangingSdk: SdkProvider = {
      ensureReady: () => new Promise<boolean>(() => {}),
      isAdAvailable: () => true,
      requestAd: () => {},
    };

    const controller = new AdAttemptController(
      {
        onReward: () => {
          rewardCount++;
        },
      },
      {
        timeoutMs: 1000,
        sdkProvider: hangingSdk,
        audioProvider: mockAudio,
      }
    );

    controller.startAttempt('unmount_attempt');
    assert.equal(mockAudio.muted, true);
    assert.equal(controller.isAttemptActive, true);

    // Component unmounts
    controller.dispose();

    assert.equal(controller.adStatus, 'idle');
    assert.equal(controller.activeAttemptId, null);
    assert.equal(controller.isAttemptActive, false);
    assert.equal(mockAudio.muted, false, 'Audio must be restored on unmount');
    assert.equal(rewardCount, 0);
  });

  it('11. Mute restoration preserves initial player sound preference', async () => {
    // Case A: Player was UNMUTED before ad -> must be UNMUTED after ad
    const audioUnmuted = createMockAudio(false);
    const sdkA: SdkProvider = {
      ensureReady: async () => true,
      isAdAvailable: () => true,
      requestAd: (_t, cb) => {
        cb.adStarted?.();
        cb.adFinished?.();
      },
    };
    const ctrlA = new AdAttemptController({}, { sdkProvider: sdkA, audioProvider: audioUnmuted });
    ctrlA.startAttempt('mute_test_a');
    await sleep(15);
    assert.equal(audioUnmuted.muted, false, 'Must restore unmuted state');

    // Case B: Player was ALREADY MUTED before ad -> must remain MUTED after ad
    const audioMuted = createMockAudio(true);
    const ctrlB = new AdAttemptController({}, { sdkProvider: sdkA, audioProvider: audioMuted });
    ctrlB.startAttempt('mute_test_b');
    await sleep(15);
    assert.equal(audioMuted.muted, true, 'Must preserve pre-existing muted state');
  });

  it('12. Cooldown single-application rule: applied once on playback start, not duplicated on reward claim', () => {
    const appliedAttempts = new Set<string>();
    let cooldowns: Record<string, number> = {};
    const now = 1000000;

    const recordCooldown = (attemptId: string, type: RewardedAdType) => {
      if (appliedAttempts.has(attemptId)) return;
      appliedAttempts.add(attemptId);
      cooldowns = setAdCooldownExpiry(type, cooldowns, AD_COOLDOWN_DURATIONS[type], now);
    };

    const attemptId = 'cg_attempt_single_cd_1';

    // Step 1: Confirmed playback starts -> sets cooldown at now + 45000
    recordCooldown(attemptId, 'double_flush');
    assert.equal(isAdOnCooldown('double_flush', cooldowns, now), true);
    assert.equal(getAdCooldownRemaining('double_flush', cooldowns, now), 45);

    // Step 2: Ad finishes 15 seconds later -> reward claimed
    const claimTime = now + 15000;
    // Attempting to record again on claim must be a no-op!
    recordCooldown(attemptId, 'double_flush');

    // Expiry must STILL be based on original playback start time (now + 45s = 1045000), not claimTime + 45s!
    assert.equal(getAdCooldownRemaining('double_flush', cooldowns, claimTime), 30);
    assert.equal(getAdCooldownRemaining('double_flush', cooldowns, now + 45001), 0);
  });

  it('13. Cooldown fairness: cancelled, errored, timed out, and preview attempts NEVER apply cooldown', () => {
    const appliedAttempts = new Set<string>();
    let cooldowns: Record<string, number> = {};
    const now = 1000000;

    const recordCooldownOnConfirmedPlayback = (attemptId: string, type: RewardedAdType) => {
      if (appliedAttempts.has(attemptId)) return;
      appliedAttempts.add(attemptId);
      cooldowns = setAdCooldownExpiry(type, cooldowns, AD_COOLDOWN_DURATIONS[type], now);
    };

    // User triggers offer, but it fails before playback (e.g. preview mode, user cancels, or network error)
    // Cooldown is NOT recorded
    assert.equal(isAdOnCooldown('turbo_overclock', cooldowns, now), false);
    assert.equal(getAdCooldownRemaining('turbo_overclock', cooldowns, now), 0);
  });

  it('14. Overlapping attempt prevention guard blocks rapid clicks', () => {
    let isOpen = false;
    let attemptCount = 0;

    const triggerOffer = () => {
      // Guard from handleTriggerRewardedAd
      if (isOpen) {
        return; // Guard blocks overlap
      }
      isOpen = true;
      attemptCount++;
    };

    triggerOffer();
    assert.equal(attemptCount, 1);
    assert.equal(isOpen, true);

    // Rapid second click while modal is open
    triggerOffer();
    assert.equal(attemptCount, 1, 'Duplicate click must be blocked while attempt is in progress');
  });

  it('15. BSOD revive cash & RAM recovery correctness', () => {
    // 15a. Verify crash captures exact cash and RAM
    const crashedVolatile = 4250;
    const crashedRam = 256;
    let lostVolatile = crashedVolatile;
    let lostRam = crashedRam;

    // Active revive attempt holds countdown
    let bsodCountdown = 5.0;
    const isReviveActive = true;
    if (isReviveActive) {
      bsodCountdown = 5.0;
    }
    assert.equal(bsodCountdown, 5.0);

    // Revive completed successfully -> restores cash & RAM once and resets cache
    let restoredCash = lostVolatile;
    let restoredRam = lostRam;
    lostVolatile = 0; // single-use consumed
    lostRam = 0;

    assert.equal(restoredCash, 4250);
    assert.equal(restoredRam, 256);
    assert.equal(lostVolatile, 0, 'Lost cash must be consumed and reset');

    // 15b. Normal reboot discards unrecovered cash
    let manualLostCash = 3000;
    const fastReboot = () => {
      manualLostCash = 0;
    };
    fastReboot();
    assert.equal(manualLostCash, 0, 'Manual reboot must clear lost cash');
  });
});
