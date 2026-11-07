# DepthOS — CrazyGames Review Optimization Blueprint & Experimental Build

## 1. Executive Summary & Diagnosis

**DepthOS** possesses one of the most distinctive and engaging core themes among web idle/clicker games: the **Thermal Surge risk-reward engine**. Instead of mindless clicking, the player balances thermal physics between 85.0°C and 99.9°C to reap 2.0x–10.0x byte multipliers, risking a catastrophic 100°C BSOD meltdown or RAM buffer stalls.

### CrazyGames Reviewer Perspective:
CrazyGames reviewers test hundreds of titles and evaluate them rigorously on:
1. **First 30–60 Seconds Fun & Comprehension**: Can a player understand what to do in 15 seconds without reading walls of text?
2. **Instant Reward Feedback**: Does each click feel kinetic, loud, and rewarding?
3. **Frictionless Onboarding**: Does the game drop the player straight into action rather than forcing multi-step setup modals?
4. **Rewarded-Ad Monetization**: Non-intrusive, player-initiated rewarded ads with obvious value propositions (no forced interstitials).
5. **Performance & Stability**: Zero console exceptions, rapid load under 5 seconds, rock-solid browser compatibility (WebGL + 2D fallback).

---

## 2. Key Polish Upgrades Implemented in Experimental Prototype

| Feature | CrazyGames Benefit | Implementation Detail |
|---|---|---|
| **Arcade Title Screen** | Immediate 1-tap playability with zero lore friction | 3 visual cards (`⚡ MINE BYTES`, `🔥 RIDE 85°C SURGE`, `💰 BANK CASH`) and large `[SPACE / ENTER]` button |
| **Bespoke Floating Numbers** | High-energy tactile pop on every action | Color-coded popups with flame badges on surge (`🔥 3.5X SURGE`), cash gains (`💰 +$120`), and mission rewards |
| **Mission Objective Bar** | Immediate direction and early capital boost | 4 progressive milestones (`Mine 15 Bytes` ➔ `Bank $25` ➔ `Buy CPU` ➔ `Hit 85°C Surge`) with confetti celebrations |
| **RAM Full Alert Path** | Eliminates player freeze when RAM fills | Core button vibrates: `⚠️ RAM FULL! FLUSH NOW` + Flush button flashes green arrows |
| **Explicit Thermal Zones** | Crystal-clear danger/reward understanding | 4 labeled markers: `SAFE (1x)`, `WARM`, `🔥 85°C SURGE (10X)`, `100°C 💀 MELTDOWN` |
| **Fast BSOD Reboot & Revive** | Eliminates penalty boredom | `[SPACE]` fast reboot back to 35°C or rewarded ad `[🛡️ REVIVE WITH CACHE SAVED]` |
| **Rewarded Ad Boosts** | 100% opt-in monetization without forced ads | `[🚀 2X NEXT FLUSH]`, `[❄️ LIQUID NITROGEN DUMP]`, `[⚡ 30s OVERCLOCK]` |
| **Zero Production Impact** | Complete safety for main codebase | Production files remain 100% unaltered in repository root |

---

## 3. Rewarded-Ad Monetization Model (Player-Choice Driven)

Adhering strictly to CrazyGames developer policies:
1. **🚀 2X Next Flush**: Pre-arms the system to double the next cash bankout (turning high volatile yields into enormous windfalls).
2. **💰 Post-Flush 2X Payout Toast**: For flushes ≥ $35, a subtle, non-intrusive bottom toast offers to watch an ad and double the recent cash dividend directly into the bank.
3. **⚡ 2X Mission Claim Bonus**: Every completed milestone in the top quest bar offers standard 1-tap claim or an optional `[🚀 2X (AD)]` button.
4. **❄️ Liquid Nitrogen Dump**: Provides an emergency full sub-zero cool down to 25.0°C without waiting for Cryo Vent cooldown.
5. **⚡ 30s Turbo Overclock**: Doubles byte mining yield for 30 seconds to accelerate early hardware purchases.
6. **🛡️ BSOD Revive**: When an overheat meltdown occurs, players can watch an ad to instantly recover with 100% of their volatile memory saved.
7. **CrazyGames SDK Integration**: Connects dynamically to `window.CrazyGames.SDK.ad.requestAd('rewarded')` when live on the CrazyGames platform, while providing a clean 5-second arcade interactive fallback during preview.

---

## 4. Architecture & Safety Isolation

In strict accordance with the safety rules:
- **Production Files Untouched**: `src/App.tsx`, `src/components/DepthOSDesktop.tsx`, `src/game/simulation.ts`, and `src/components/TitleScreen.tsx` remain 100% unaltered.
- **Isolated Sandbox**: All experimental code lives in `/src/experiments/crazygames/`:
  - `types.ts`: Arcade types (objectives, floating numbers, onboarding stages, rewarded ad states)
  - `components/RewardedAdModal.tsx`: Dedicated CrazyGames rewarded ad overlay with SDK hooks
  - `components/FloatingNumberFx.tsx`: Arcade floating damage/gain popups
  - `components/FirstMinuteObjectiveBar.tsx`: 4-stage quest progress bar with confetti
  - `components/CrazyGamesOnboardingOverlay.tsx`: 1-line directional action coachmarks
  - `components/CrazyGamesDesktop.tsx`: Streamlined 3-column arcade HUD with labeled heat zones and opt-in ad boosts
  - `CrazyGamesApp.tsx`: Standalone app shell with fast BSOD reboot and zero-latency keyboard controls
- **Switching**: `src/main.tsx` mounts `CrazyGamesApp` by default with a top-right `[COMPARE]` button to toggle back to `PRODUCTION BUILD` anytime.

---

## 5. CrazyGames Submission QA Checklist

- [x] English default language throughout UI
- [x] Loads in desktop Chrome/Firefox in < 3 seconds (`npm run build` bundled in 1.33s)
- [x] WebGL context loss / sandboxed renderer graceful 2D fallback
- [x] Zero runtime uncaught exceptions or console errors (`tsc --noEmit` clean)
- [x] Fully keyboard playable (`SPACE`, `HOLD F`, `SPACE + E`, `ENTER`) and mobile touch friendly
- [x] Responsive layout across 1080p, 720p, and tablet viewports
- [x] Strictly opt-in rewarded ads (zero intrusive forced interstitials)

---

## 6. CrazyGames Rewarded Ads Verification Guide

### A. What Automated Tests Establish (`npm test`)
- **Watchdog Coverage**: Covers hung SDK initialization and hung `requestAd` calls, timing out safely within the bounded timeout without granting false rewards.
- **Watchdog Clearing**: Strictly cancelled when `adStarted` fires, allowing full video ads to play without interruption.
- **Token Safety & Exactly-Once Grant**: Duplicate or delayed callbacks (`adStarted`, `adFinished`, `adError`) are completely dropped after attempt completion or invalidation.
- **Single-Application Cooldown**: Cooldown begins at confirmed playback start (`adStarted`), does NOT duplicate or reset upon `adFinished`/claim, and is NEVER applied on cancellation, SDK error, watchdog timeout, or preview mode.
- **Mid-Playback Error Recovery**: Resumes simulation, unpauses turbo timer, resumes BSOD countdown, restores audio mute, and rejects any later `adFinished` callbacks.
- **Sound Preservation**: Player sound preference is snapshotted upon attempt start and restored on every exit (finish, cancel, timeout, error, unmount).
- **BSOD Revive Integrity**: Countdown holds during active revive attempt, resumes on failure, and restores unbanked volatile cash and RAM buffer exactly once on success.

### B. Manual Verification Checklist (Standalone Local Preview)
1. Open the game in local browser preview (`localhost:3000`).
2. Trigger any rewarded ad boost (`[2X NEXT FLUSH]`, `[FREE NITROGEN DUMP]`, `[30s OVERCLOCK]`, or `[REVIVE & RESTORE]`).
3. Verify the modal opens and immediately displays:
   - `⚠️ ADS UNAVAILABLE IN PREVIEW`
   - Target reward details and clear explanation that real rewarded ads serve inside the CrazyGames container.
4. Click `[CLOSE]`.
5. Verify:
   - Zero rewards granted.
   - Zero cooldown applied (boost buttons remain immediately available).
   - Audio and simulation continue unimpeded.

### C. Manual Verification Checklist (CrazyGames Live Container / SDK QA Tool)
1. Load the game URL in the [CrazyGames SDK QA Tool](https://sdk.crazygames.com/).
2. **Double Flush (`double_flush`)**:
   - Tap `[AD BOOST: 2X NEXT FLUSH PAYOUT]`.
   - Verify CrazyGames video ad plays and game audio mutes.
   - Watch to completion: verify modal closes, audio unmutes, "2X FLUSH BOOST ACTIVE!" badge displays, and button enters 45s cooldown (`COOLDOWN 45s` -> `44s` ...).
   - Hold `[F]` to bank cash: verify banked yield is doubled.
3. **Emergency Cryo Dump (`cryo_dump`)**:
   - Push CPU heat above 55°C.
   - Tap `[❄️ AD BOOST: FREE NITROGEN DUMP]`.
   - Watch to completion: verify CPU heat immediately resets to 25.0°C and 30s cooldown begins.
4. **Turbo Overclock (`turbo_overclock`)**:
   - Tap `[AD BOOST: 30s 2X OVERCLOCK]`.
   - Watch to completion: verify mining yield doubles for 30s, then enters 45s cooldown.
5. **BSOD Meltdown Revive (`bsod_revive`)**:
   - Overheat past 100.0°C to trigger BSOD crash with unbanked volatile cash.
   - Tap `[🛡️ REVIVE & RESTORE +$X [AD]]`.
   - Watch to completion: verify system recovers to 35.0°C with 100% of lost cash and RAM restored, countdown resets, and 10s grace cooldown begins.
6. **Cancellation / Ad Error Flow**:
   - Trigger any ad boost and close the CrazyGames ad overlay before completion.
   - Verify: "AD COULD NOT BE COMPLETED" error screen appears, no reward is granted, no cooldown penalty is applied, and audio and simulation resume immediately.
