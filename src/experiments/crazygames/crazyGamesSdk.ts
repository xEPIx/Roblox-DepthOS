/**
 * Official CrazyGames SDK v2 Integration Helper
 * Documentation: https://docs.crazygames.com/sdk/html5-v2/
 * 
 * Complies with CrazyGames submission guidelines:
 * - Initializes the SDK once via window.CrazyGames.SDK.init()
 * - Requests rewarded ads via window.CrazyGames.SDK.ad.requestAd('rewarded', callbacks)
 * - Ad callbacks: adStarted, adFinished, adError
 * - No fake or simulated production ad completions
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

let isInitInProgress = false;
let isInitDone = false;

/**
 * Initializes the official CrazyGames SDK v2.
 * If the SDK script is not present on window, dynamically injects the official script tag.
 */
export async function initCrazyGamesSdk(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (isInitDone) return true;
  if (isInitInProgress) return false;

  isInitInProgress = true;
  try {
    // 1. If SDK is already attached to window (e.g., loaded by CrazyGames wrapper)
    if (window.CrazyGames?.SDK) {
      if (typeof window.CrazyGames.SDK.init === 'function') {
        const res = window.CrazyGames.SDK.init();
        if (res && typeof (res as Promise<void>).catch === 'function') {
          await (res as Promise<void>).catch(() => {});
        }
      }
      isInitDone = true;
      isInitInProgress = false;
      return true;
    }

    // 2. Dynamically inject the official CrazyGames SDK v2 script
    const SCRIPT_ID = 'crazygames-sdk-v2-script';
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://sdk.crazygames.com/crazygames-sdk-v2.js';
      script.async = true;
      document.head.appendChild(script);
    }

    await new Promise<void>((resolve) => {
      if (!script) return resolve();
      if (window.CrazyGames?.SDK) return resolve();
      script.addEventListener('load', () => resolve(), { once: true });
      script.addEventListener('error', () => resolve(), { once: true });
      // Non-blocking fallback timeout (2.5 seconds)
      setTimeout(() => resolve(), 2500);
    });

    if (window.CrazyGames?.SDK && typeof window.CrazyGames.SDK.init === 'function') {
      const res = window.CrazyGames.SDK.init();
      if (res && typeof (res as Promise<void>).catch === 'function') {
        await (res as Promise<void>).catch(() => {});
      }
      isInitDone = true;
    }
  } catch (err) {
    console.warn('[CrazyGames SDK] Initialization encountered notice:', err);
  } finally {
    isInitInProgress = false;
  }

  return isInitDone;
}

/**
 * Checks if the official CrazyGames SDK v2 ad provider is available.
 */
export function isCrazyGamesAdAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.CrazyGames?.SDK?.ad?.requestAd === 'function'
  );
}
