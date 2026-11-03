/**
 * Official CrazyGames SDK v2 Integration Helper
 * Documentation: https://docs.crazygames.com/sdk/html5-v2/
 * 
 * Standardized for CrazyGames submission:
 * - Uses the official static SDK script tag loaded in index.html
 * - Single initialization flow via window.CrazyGames.SDK.init()
 * - Requests rewarded ads via window.CrazyGames.SDK.ad.requestAd('rewarded', callbacks)
 * - Callbacks handled: adStarted, adFinished, adError
 * - No simulated production ad rewards
 */

export interface CrazyGamesRewardedCallbacks {
  adStarted?: () => void;
  adFinished?: () => void;
  adError?: (error: unknown) => void;
}

export interface CrazyGamesSDKV2 {
  init?: () => Promise<void> | void;
  ad?: {
    requestAd: (type: 'rewarded' | 'midgame', callbacks: CrazyGamesRewardedCallbacks) => void;
  };
}

declare global {
  interface Window {
    CrazyGames?: {
      SDK?: CrazyGamesSDKV2;
    };
  }
}

let initPromise: Promise<boolean> | null = null;

/**
 * Initializes the official CrazyGames SDK v2 once.
 * Re-uses the existing initialization promise if already in flight or complete.
 */
export async function initCrazyGamesSdk(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      if (window.CrazyGames?.SDK && typeof window.CrazyGames.SDK.init === 'function') {
        const res = window.CrazyGames.SDK.init();
        if (res && typeof (res as Promise<void>).catch === 'function') {
          await (res as Promise<void>).catch(() => {});
        }
        return true;
      }
    } catch (err) {
      console.warn('[CrazyGames SDK] Initialization caught:', err);
    }
    return false;
  })();

  return initPromise;
}

/**
 * Checks if the official CrazyGames SDK v2 ad provider is available and ready.
 */
export function isCrazyGamesAdAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.CrazyGames?.SDK?.ad?.requestAd === 'function'
  );
}

/**
 * Ensures the SDK initialization has completed before an ad request is initiated.
 */
export async function ensureCrazyGamesSdkReady(): Promise<boolean> {
  if (isCrazyGamesAdAvailable()) {
    await initCrazyGamesSdk();
    return isCrazyGamesAdAvailable();
  }
  return false;
}
