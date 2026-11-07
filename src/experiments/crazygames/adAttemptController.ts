import { audio } from '../../audio/depthosAudio';
import { ensureCrazyGamesSdkReady, isCrazyGamesAdAvailable, CrazyGamesRewardedCallbacks } from './crazyGamesSdk';

export const REQUEST_TIMEOUT_MS = 8000;

export type AdStatus = 'idle' | 'requesting' | 'playing' | 'completed' | 'error' | 'unavailable';

export interface SdkProvider {
  ensureReady: () => Promise<boolean>;
  isAdAvailable: () => boolean;
  requestAd: (type: 'rewarded' | 'midgame', callbacks: CrazyGamesRewardedCallbacks) => void;
}

export interface AudioProvider {
  getMuted: () => boolean;
  setMuted: (muted: boolean) => void;
}

export interface AdAttemptControllerCallbacks {
  onStatusChange?: (status: AdStatus, errorMessage: string) => void;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
  onAttemptActiveChange?: (isActive: boolean) => void;
  onReward?: (attemptId: string) => void;
  onConfirmedPlayback?: (attemptId: string) => void;
  onClose?: () => void;
}

export interface AdAttemptControllerOptions {
  timeoutMs?: number;
  sdkProvider?: SdkProvider;
  audioProvider?: AudioProvider;
}

const defaultSdkProvider: SdkProvider = {
  ensureReady: ensureCrazyGamesSdkReady,
  isAdAvailable: isCrazyGamesAdAvailable,
  requestAd: (type, callbacks) => {
    if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.ad?.requestAd) {
      window.CrazyGames.SDK.ad.requestAd(type, callbacks);
    } else {
      throw new Error('CrazyGames SDK ad provider is not available');
    }
  },
};

const defaultAudioProvider: AudioProvider = {
  getMuted: () => audio.getMuted(),
  setMuted: (muted) => audio.setMuted(muted),
};

/**
 * AdAttemptController
 * 
 * Shared state machine and resilience manager for CrazyGames rewarded ads.
 * Used identically in the interactive React UI and the automated test suite.
 * 
 * Guarantees:
 * 1. Watchdog covers the ENTIRE pre-playback journey including SDK initialization and readiness checks.
 * 2. Watchdog is strictly cleared on adStarted; long-running video ads run to completion.
 * 3. Token-based attempt tracking: stale, superseded, or cancelled callbacks cannot grant rewards or mutate state.
 * 4. Exactly-once reward grant per attempt ID across the session.
 * 5. Audio mute state is snapshotted upon attempt start and restored on all terminal outcomes (finish, error, timeout, cancel, unmount).
 * 6. Cooldown fairness: Cooldowns are applied only upon confirmed playback/completion.
 * 7. Duplicate callback safety: duplicate adStarted, adFinished, or adError calls cannot reset state or duplicate events.
 */
export class AdAttemptController {
  public activeAttemptId: string | null = null;
  public readonly grantedAttemptIds = new Set<string>();
  public adStatus: AdStatus = 'idle';
  public errorMessage: string = '';
  public isPlaying: boolean = false;
  public isAttemptActive: boolean = false;

  private prevMuted: boolean = false;
  private watchdogTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly timeoutMs: number;
  private readonly sdkProvider: SdkProvider;
  private readonly audioProvider: AudioProvider;
  private callbacks: AdAttemptControllerCallbacks;

  constructor(
    callbacks: AdAttemptControllerCallbacks = {},
    options: AdAttemptControllerOptions = {}
  ) {
    this.callbacks = callbacks;
    this.timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
    this.sdkProvider = options.sdkProvider ?? defaultSdkProvider;
    this.audioProvider = options.audioProvider ?? defaultAudioProvider;
  }

  public updateCallbacks(callbacks: AdAttemptControllerCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public clearWatchdog() {
    if (this.watchdogTimer !== null) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  private setStatus(status: AdStatus, errorMessage: string = '') {
    this.adStatus = status;
    this.errorMessage = errorMessage;
    this.callbacks.onStatusChange?.(status, errorMessage);
  }

  private notifyPlaybackState(isPlaying: boolean) {
    this.isPlaying = isPlaying;
    this.callbacks.onPlaybackStateChange?.(isPlaying);
  }

  private notifyAttemptActive(isActive: boolean) {
    this.isAttemptActive = isActive;
    this.callbacks.onAttemptActiveChange?.(isActive);
  }

  /**
   * Starts a rewarded ad attempt with the given attemptId.
   * Starts the watchdog timer IMMEDIATELY to cover SDK readiness as well as ad request.
   */
  public startAttempt(attemptId: string) {
    if (!attemptId) return;

    this.clearWatchdog();
    this.activeAttemptId = attemptId;
    this.errorMessage = '';

    // Snapshot player's exact audio preference and mute during ad
    this.prevMuted = this.audioProvider.getMuted();
    if (!this.prevMuted) {
      this.audioProvider.setMuted(true);
    }

    this.notifyAttemptActive(true);
    this.setStatus('requesting');

    // Start request watchdog timer immediately.
    // If ensureReady() hangs indefinitely, or requestAd never calls back,
    // this timer fires and fails gracefully without stalling gameplay or granting false rewards.
    this.watchdogTimer = setTimeout(() => {
      if (this.activeAttemptId !== attemptId) return;
      this.handleRequestTimeout(attemptId);
    }, this.timeoutMs);

    (async () => {
      try {
        const isReady = await this.sdkProvider.ensureReady();

        // Dropped if cancelled or superseded during await
        if (this.activeAttemptId !== attemptId) {
          return;
        }

        if (!isReady || !this.sdkProvider.isAdAvailable()) {
          this.clearWatchdog();
          this.activeAttemptId = null;
          this.notifyPlaybackState(false);
          this.notifyAttemptActive(false);
          this.audioProvider.setMuted(this.prevMuted);
          this.setStatus('unavailable');
          return;
        }

        this.sdkProvider.requestAd('rewarded', {
          adStarted: () => {
            // Ad playback confirmed: clear watchdog so full-length ads finish naturally
            this.clearWatchdog();
            if (this.activeAttemptId !== attemptId) {
              return;
            }
            if (this.isPlaying) {
              // Duplicate adStarted callback protection
              return;
            }
            this.setStatus('playing');
            this.notifyPlaybackState(true);
            this.callbacks.onConfirmedPlayback?.(attemptId);
          },
          adFinished: () => {
            this.clearWatchdog();
            if (this.activeAttemptId !== attemptId) {
              return;
            }
            this.notifyPlaybackState(false);
            this.notifyAttemptActive(false);
            this.audioProvider.setMuted(this.prevMuted);
            this.setStatus('completed');
            this.grantRewardOnce(attemptId);
            this.callbacks.onClose?.();
          },
          adError: (err) => {
            this.clearWatchdog();
            if (this.activeAttemptId !== attemptId) {
              return;
            }
            // Invalidate active attempt immediately so subsequent callbacks are dropped
            this.activeAttemptId = null;
            this.notifyPlaybackState(false);
            this.notifyAttemptActive(false);
            this.audioProvider.setMuted(this.prevMuted);
            const errStr =
              typeof err === 'string'
                ? err
                : err && typeof err === 'object' && 'message' in err
                ? String((err as { message: unknown }).message)
                : 'No rewarded ad available or ad was cancelled.';
            this.setStatus('error', errStr);
          },
        });
      } catch (err) {
        this.clearWatchdog();
        if (this.activeAttemptId !== attemptId) {
          return;
        }
        this.activeAttemptId = null;
        this.notifyPlaybackState(false);
        this.notifyAttemptActive(false);
        this.audioProvider.setMuted(this.prevMuted);
        this.setStatus('error', 'Failed to communicate with CrazyGames SDK.');
      }
    })();
  }

  /**
   * Watchdog timeout: triggers safe failure if playback has not started within timeoutMs.
   */
  public handleRequestTimeout(attemptId: string) {
    this.clearWatchdog();
    if (this.activeAttemptId !== attemptId) return;

    this.activeAttemptId = null;
    this.notifyPlaybackState(false);
    this.notifyAttemptActive(false);
    this.audioProvider.setMuted(this.prevMuted);
    this.setStatus(
      'error',
      'Ad request timed out before playback started. Please check connection and try again.'
    );
  }

  /**
   * Exactly-once reward grant with attempt verification.
   */
  public grantRewardOnce(attemptId: string) {
    if (!attemptId) return;
    if (this.activeAttemptId !== attemptId) {
      console.warn('[AdAttemptController] Reward dropped: token mismatch or superseded:', attemptId);
      return;
    }
    if (this.grantedAttemptIds.has(attemptId)) {
      console.warn('[AdAttemptController] Reward dropped: token already granted:', attemptId);
      return;
    }

    this.grantedAttemptIds.add(attemptId);
    this.activeAttemptId = null;
    this.callbacks.onReward?.(attemptId);
  }

  /**
   * Player dismisses / cancels the ad modal.
   */
  public dismiss() {
    this.clearWatchdog();
    const hadActive = this.activeAttemptId !== null || this.isAttemptActive;
    const wasPlaying = this.isPlaying;

    this.activeAttemptId = null;
    this.audioProvider.setMuted(this.prevMuted);

    if (wasPlaying) {
      this.notifyPlaybackState(false);
    }
    if (hadActive) {
      this.notifyAttemptActive(false);
    }
  }

  /**
   * Clean up timer, audio, and active state on unmount.
   */
  public dispose() {
    this.dismiss();
    this.setStatus('idle');
  }
}
