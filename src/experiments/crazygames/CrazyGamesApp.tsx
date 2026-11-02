import { useState, useEffect, useRef } from 'react';
import { DepthOSState } from '../../types/depthos';
import {
  createInitialDepthOSState,
  stepSimulation,
  calculateBytesPerProcess,
  calculateHeatPerProcess,
  calculateRamCost,
  getCpuUpgradeCost,
  getRamUpgradeCost,
  getCoolingUpgradeCost,
  getBusUpgradeCost,
  getThermalPasteCost,
  getSurgeThreshold,
  CRITICAL_TEMP,
} from '../../game/simulation';
import { audio } from '../../audio/depthosAudio';
import { createDepthOSThreeScene, SceneController } from '../../game/threeScene';
import { CrazyGamesDesktop } from './components/CrazyGamesDesktop';
import { BSODOverlay } from '../../components/BSODOverlay';
import { ThermalGrainOverlay } from '../../components/ThermalGrainOverlay';
import { ThermalWarningOverlay } from '../../components/ThermalWarningOverlay';

export function CrazyGamesApp() {
  const [gameState, setGameState] = useState<'intro' | 'playing'>('intro');
  const [depthState, setDepthState] = useState<DepthOSState>(() => createInitialDepthOSState());
  const [is3DActive, setIs3DActive] = useState<boolean>(false);

  const stateRef = useRef<DepthOSState>(depthState);
  stateRef.current = depthState;

  const threeMountRef = useRef<HTMLDivElement | null>(null);
  const sceneCtrlRef = useRef<SceneController | null>(null);

  // Mount Three.js 3D battlestation (runs in background or visible when toggled)
  useEffect(() => {
    if (!threeMountRef.current) return;
    try {
      const sceneCtrl = createDepthOSThreeScene(threeMountRef.current, (part) => {
        if (part === 'keyboard') {
          handleProcessClick();
        } else if (part === 'cpu') {
          handlePurchaseUpgrade('cpu');
        } else if (part === 'ram') {
          handlePurchaseUpgrade('ram');
        } else if (part === 'cooling') {
          handlePurchaseUpgrade('cooling');
        }
      });
      sceneCtrlRef.current = sceneCtrl;
    } catch (e) {
      console.warn('Three.js initialization caught in CrazyGames preview:', e);
    }

    return () => {
      if (sceneCtrlRef.current) {
        sceneCtrlRef.current.dispose();
        sceneCtrlRef.current = null;
      }
    };
  }, []);

  // 10Hz Simulation Engine Loop
  useEffect(() => {
    const interval = setInterval(() => {
      const prev = stateRef.current;
      const next = stepSimulation(prev, 0.1);

      if (!prev.isBSOD && next.isBSOD) {
        audio.playBSODCrash();
      }

      if (prev.isFlushing && !next.isFlushing && next.bankedBytes > prev.bankedBytes) {
        audio.playFlushChime();
      }

      if (sceneCtrlRef.current) {
        sceneCtrlRef.current.update(next.heat, next.isBSOD, next.isFlushing, 0.1);
      }

      const surgeTemp = getSurgeThreshold(next.rootTree);
      const inSurge = next.heat >= surgeTemp && next.heat < CRITICAL_TEMP && !next.isBSOD;
      audio.updateHeatAudio(next.heat, inSurge);

      setDepthState(next);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut listener for CrazyGames browser play
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'intro') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          audio.ensureContext();
          setGameState('playing');
        }
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleProcessClick();
      } else if (e.code === 'KeyF') {
        if (!e.repeat) {
          handleStartFlush();
        }
      } else if (e.code === 'KeyE') {
        handleEmergencyVent();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyF') {
        handleCancelFlush();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Primary Gameplay Actions
  const handleProcessClick = () => {
    const s = stateRef.current;
    if (s.isBufferStalled || s.isFlushing || s.isBSOD) return;

    audio.ensureContext();
    const generated = calculateBytesPerProcess(s);
    const heatAdded = calculateHeatPerProcess(s);
    const ramCost = calculateRamCost(generated);

    const surgeTemp = getSurgeThreshold(s.rootTree);
    const isCritical = s.heat >= surgeTemp;
    audio.playProcessClick(s.soundpack, isCritical);

    if (sceneCtrlRef.current) {
      sceneCtrlRef.current.triggerPressVisual(isCritical);
    }

    if (s.ramUsedMB + ramCost > s.ramMaxMB) {
      setDepthState((prev) => ({ ...prev, isBufferStalled: true }));
      return;
    }

    setDepthState((prev) => {
      const nextHeat = Math.min(CRITICAL_TEMP, prev.heat + heatAdded);
      const nextUsedRam = Math.min(prev.ramMaxMB, prev.ramUsedMB + ramCost);

      return {
        ...prev,
        volatileBytes: prev.volatileBytes + generated,
        heat: nextHeat,
        ramUsedMB: nextUsedRam,
        isBufferStalled: nextUsedRam >= prev.ramMaxMB,
      };
    });
  };

  const handleStartFlush = () => {
    const s = stateRef.current;
    if (s.isFlushing || s.isBSOD || s.volatileBytes === 0) return;

    audio.ensureContext();
    setDepthState((prev) => ({
      ...prev,
      isFlushing: true,
      flushProgress: 0,
    }));
  };

  const handleCancelFlush = () => {
    setDepthState((prev) => {
      if (!prev.isFlushing) return prev;
      return {
        ...prev,
        isFlushing: false,
        flushProgress: 0,
      };
    });
  };

  const handleEmergencyVent = () => {
    const s = stateRef.current;
    if (s.isBSOD || s.heat <= 45) return;

    audio.ensureContext();
    audio.playCryoVent();

    setDepthState((prev) => ({
      ...prev,
      heat: Math.max(40, prev.heat - 15),
    }));
  };

  const handlePurchaseUpgrade = (type: 'cpu' | 'ram' | 'cooling' | 'bus' | 'paste') => {
    const s = stateRef.current;
    let cost = 0;

    if (type === 'cpu') cost = getCpuUpgradeCost(s.hardware.cpuLevel);
    else if (type === 'ram') cost = getRamUpgradeCost(s.hardware.ramLevel);
    else if (type === 'cooling') cost = getCoolingUpgradeCost(s.hardware.coolingLevel);
    else if (type === 'bus') cost = getBusUpgradeCost(s.hardware.busLevel);
    else if (type === 'paste') cost = getThermalPasteCost(s.hardware.thermalPasteLevel);

    if (s.bankedBytes < cost) return;

    audio.playUpgradeSound();

    setDepthState((prev) => {
      const nextHw = { ...prev.hardware };
      let nextMaxRam = prev.ramMaxMB;

      if (type === 'cpu') nextHw.cpuLevel += 1;
      else if (type === 'ram') {
        nextHw.ramLevel += 1;
        nextMaxRam += 64;
      } else if (type === 'cooling') nextHw.coolingLevel += 1;
      else if (type === 'bus') nextHw.busLevel += 1;
      else if (type === 'paste') nextHw.thermalPasteLevel += 1;

      return {
        ...prev,
        bankedBytes: prev.bankedBytes - cost,
        hardware: nextHw,
        ramMaxMB: nextMaxRam,
      };
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 3D Battlestation View Layer */}
      <div
        ref={threeMountRef}
        className={`absolute inset-0 transition-opacity duration-500 ${
          is3DActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-20 z-0 pointer-events-none'
        }`}
      />

      {/* Cyberpunk Visual Overlays */}
      <ThermalGrainOverlay heat={depthState.heat} isBSOD={depthState.isBSOD} />
      <ThermalWarningOverlay heat={depthState.heat} isBSOD={depthState.isBSOD} />

      {/* Intro Modal or Active Arcade Desktop */}
      {gameState === 'intro' ? (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black/85 backdrop-blur-md font-mono text-center">
          <div className="max-w-md p-8 border-2 border-cyan-500 rounded-2xl bg-[#09111e] shadow-[0_0_50px_rgba(6,182,212,0.4)]">
            <div className="text-5xl mb-4 animate-bounce">⚡</div>
            <h1 className="text-3xl font-black text-white tracking-wider">
              DEPTH<span className="text-cyan-400">OS</span>
            </h1>
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mt-1">
              CrazyGames Arcade Edition
            </p>

            <div className="my-6 p-4 bg-black/50 border border-gray-800 rounded-xl text-left space-y-2 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-bold">1. CLICK:</span>
                <span>Mine volatile bytes [SPACE]</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">2. SURGE:</span>
                <span>Push heat to 85°C for 10x payouts</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">3. FLUSH:</span>
                <span>Hold [F] to bank cash before 100°C</span>
              </div>
            </div>

            <button
              onClick={() => {
                audio.ensureContext();
                setGameState('playing');
              }}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-black font-black text-sm uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all active:scale-95"
            >
              PLAY NOW [ENTER]
            </button>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 z-20 pointer-events-auto">
          <CrazyGamesDesktop
            state={depthState}
            onProcessClick={handleProcessClick}
            onStartFlush={handleStartFlush}
            onCancelFlush={handleCancelFlush}
            onEmergencyVent={handleEmergencyVent}
            onPurchaseUpgrade={handlePurchaseUpgrade}
            onToggle3DView={() => setIs3DActive((prev) => !prev)}
            is3DActive={is3DActive}
          />
        </div>
      )}

      {/* BSOD Crash Screen */}
      {depthState.isBSOD && <BSODOverlay countdown={depthState.bsodCountdown} />}
    </div>
  );
}
