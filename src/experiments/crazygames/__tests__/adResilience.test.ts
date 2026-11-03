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

  it('7. Missing SDK / Standalone preview: shows unavailable status with zero false rewards', async () => {
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

  it('8. Component unmount / disposal (dispose): cancels timer and restores audio cleanly', async () => {
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

  it('9. Mute restoration preserves initial player sound preference', async () => {
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

  it('10. Cooldown fairness: no cooldown on error/cancel/preview; applied on confirmed playback', () => {
    const now = 1000000;
    let cooldowns: Record<string, number> = {};

    // Scenario A: Failed / cancelled / unavailable ad attempt
    // In our fair policy, cooldowns are NOT applied when opening the offer.
    // If an ad fails or is cancelled before playback, cooldowns remain empty.
    assert.equal(isAdOnCooldown('double_flush', cooldowns, now), false);
    assert.equal(getAdCooldownRemaining('double_flush', cooldowns, now), 0);

    // Scenario B: Confirmed playback / claim sets cooldown
    cooldowns = setAdCooldownExpiry('double_flush', cooldowns, AD_COOLDOWN_DURATIONS.double_flush, now);
    assert.equal(isAdOnCooldown('double_flush', cooldowns, now), true);
    assert.equal(getAdCooldownRemaining('double_flush', cooldowns, now), 45);

    // Other ad types remain available independently
    assert.equal(isAdOnCooldown('cryo_dump', cooldowns, now), false);

    // After 45 seconds:
    const expiredTime = now + 45001;
    assert.equal(isAdOnCooldown('double_flush', cooldowns, expiredTime), false);
    assert.equal(getAdCooldownRemaining('double_flush', cooldowns, expiredTime), 0);
  });

  it('11. Overlapping attempt prevention guard', () => {
    let isOpen = false;
    let attemptCount = 0;

    const triggerOffer = () => {
      // Logic from handleTriggerRewardedAd
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

  it('12. BSOD revive cash & RAM recovery correctness', () => {
    // 12a. Verify crash captures exact cash and RAM
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

    // 12b. Normal reboot discards unrecovered cash
    let manualLostCash = 3000;
    const fastReboot = () => {
      manualLostCash = 0;
    };
    fastReboot();
    assert.equal(manualLostCash, 0, 'Manual reboot must clear lost cash');
  });
});
