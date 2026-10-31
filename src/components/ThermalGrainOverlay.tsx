import React, { useEffect, useRef } from 'react';

interface ThermalGrainOverlayProps {
  heat: number;
  isBSOD?: boolean;
}

/**
 * ThermalGrainOverlay
 * Procedural high-frequency grain noise overlay that dynamically scales in opacity
 * and electrical static frequency as CPU temperature rises, delivering an authentic
 * 'overworked silicon' / thermal redline aesthetic.
 */
export const ThermalGrainOverlay: React.FC<ThermalGrainOverlayProps> = ({ heat, isBSOD = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let frameCounter = 0;

    // Pattern dimensions for high-frequency micro-grain
    const patternSize = 160;
    const numFrames = 6;
    const noisePatterns: CanvasPattern[] = [];

    // Pre-generate procedural high-frequency noise frames
    for (let f = 0; f < numFrames; f++) {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = patternSize;
      offCanvas.height = patternSize;
      const offCtx = offCanvas.getContext('2d')!;
      const imgData = offCtx.createImageData(patternSize, patternSize);
      const buf = new Uint32Array(imgData.data.buffer);
      const len = buf.length;

      for (let i = 0; i < len; i++) {
        // High-frequency luminance noise
        const rand = Math.random();
        const lum = (rand * 255) | 0;

        // Occasional chromatic silicon micro-specks (sub-pixel hot electron static)
        let r = lum;
        let g = lum;
        let b = lum;

        if (rand > 0.96) {
          // Hot electron amber/red speck
          r = Math.min(255, lum + 60);
          g = (lum * 0.7) | 0;
          b = (lum * 0.4) | 0;
        } else if (rand < 0.04) {
          // Cyan quantum jitter speck
          r = (lum * 0.4) | 0;
          g = Math.min(255, lum + 40);
          b = Math.min(255, lum + 60);
        }

        // Alpha channel variation for realistic grain depth
        const alpha = (140 + Math.random() * 115) | 0;
        buf[i] = (alpha << 24) | (b << 16) | (g << 8) | r;
      }

      offCtx.putImageData(imgData, 0, 0);
      const pat = ctx.createPattern(offCanvas, 'repeat');
      if (pat) noisePatterns.push(pat);
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      frameCounter++;
      // Cycle noise patterns at ~24fps for authentic analog film/silicon shimmer
      if (frameCounter % 2 === 0 && noisePatterns.length > 0) {
        const patternIdx = (frameCounter / 2) % noisePatterns.length;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = noisePatterns[patternIdx];
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Calculate grain noise intensity based on CPU temperature
  // Below 30°C: ~0.005 (imperceptible/clean)
  // 50°C: ~0.035 (gentle electrical texture)
  // 70°C: ~0.085 (noticeable semiconductor warmth)
  // 85°C (Thermal Surge): ~0.17 (high-frequency electric jitter)
  // 98°C-100°C (Redline Overwork): ~0.28 (intense sizzling grain noise)
  // BSOD: ~0.38 (severe digital static disruption)
  const normalizedHeat = Math.max(0, Math.min(1.0, (heat - 28) / 72));
  const grainOpacity = isBSOD ? 0.38 : Math.pow(normalizedHeat, 1.55) * 0.28;

  // Add subtle high-frequency scanline / silicon trace interference at extreme heat
  const isExtremeOverwork = heat >= 85.0 && !isBSOD;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-20 overflow-hidden"
      style={{
        opacity: Math.max(0.005, grainOpacity),
        transition: 'opacity 0.25s ease-out',
        mixBlendMode: 'screen',
      }}
    >
      {/* High-frequency procedural noise canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Extreme Overwork Silicon Heat Jitter Lines */}
      {isExtremeOverwork && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(255, 60, 0, 0.15) 0px, transparent 1px, transparent 3px)',
            backgroundSize: '100% 3px',
          }}
        />
      )}
    </div>
  );
};
