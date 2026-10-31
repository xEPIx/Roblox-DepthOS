import React, { useState, useEffect, useRef } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';

interface ThermalEfficiencyGraphProps {
  heat: number;
  cpuLevel: number;
  isBSOD?: boolean;
  isFlushing?: boolean;
  surgeThreshold?: number;
  inSurge?: boolean;
}

interface TelemetryPoint {
  time: string;
  heat: number;
  clockSpeed: number;
  efficiencyRatio: number; // MHz per °C
  surge: boolean;
}

/**
 * Custom cybernetic tooltip for real-time telemetry metrics.
 */
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data: TelemetryPoint = payload[0].payload;
    return (
      <div className="bg-[#0b0e14]/95 border border-[#334155] p-2 rounded-lg shadow-xl text-[10px] font-mono select-none backdrop-blur-md">
        <div className="text-gray-400 font-bold border-b border-white/10 pb-1 mb-1 flex justify-between gap-3">
          <span>TICK // {data.time}</span>
          {data.surge && <span className="text-red-400 font-black animate-pulse">SURGE</span>}
        </div>
        <div className="flex justify-between gap-4 text-cyan-300 font-bold">
          <span>CLOCK:</span>
          <span>{data.clockSpeed.toFixed(2)} GHz</span>
        </div>
        <div className="flex justify-between gap-4 text-rose-400 font-bold">
          <span>TEMP:</span>
          <span>{data.heat.toFixed(1)}°C</span>
        </div>
        <div className="flex justify-between gap-4 text-emerald-400 font-bold border-t border-white/5 pt-1 mt-1">
          <span>RATIO:</span>
          <span>{data.efficiencyRatio.toFixed(1)} MHz/°C</span>
        </div>
      </div>
    );
  }
  return null;
};

export const ThermalEfficiencyGraph: React.FC<ThermalEfficiencyGraphProps> = ({
  heat,
  cpuLevel,
  isBSOD = false,
  isFlushing = false,
  surgeThreshold = 85.0,
  inSurge = false,
}) => {
  const [history, setHistory] = useState<TelemetryPoint[]>(() => {
    // Seed initial 12 data points so chart renders gracefully on first frame
    const baseClock = 3.2 + (cpuLevel - 1) * 0.35;
    const initialPoints: TelemetryPoint[] = [];
    const now = Date.now();
    for (let i = 11; i >= 0; i--) {
      const pastTime = new Date(now - i * 800).toTimeString().split(' ')[0];
      const simHeat = Math.max(25, heat - i * 0.8);
      const simClock = isBSOD ? 0.0 : baseClock;
      const simRatio = (simClock * 1000) / Math.max(25, simHeat);
      initialPoints.push({
        time: pastTime,
        heat: parseFloat(simHeat.toFixed(1)),
        clockSpeed: parseFloat(simClock.toFixed(2)),
        efficiencyRatio: parseFloat(simRatio.toFixed(1)),
        surge: simHeat >= surgeThreshold,
      });
    }
    return initialPoints;
  });

  const [activeMetric, setActiveMetric] = useState<'both' | 'clock' | 'ratio'>('both');

  // Compute live clock speed
  const baseClock = 3.2 + (cpuLevel - 1) * 0.35;
  let liveClock = baseClock;
  if (isBSOD) {
    liveClock = 0.0;
  } else if (heat >= 98.0) {
    // Thermal throttling at critical redline
    liveClock = Math.max(1.2, baseClock * 0.65);
  } else if (inSurge) {
    // Overclock surge frequency scaling
    const surgeFactor = 1.0 + ((heat - surgeThreshold) / (100.0 - surgeThreshold)) * 0.42;
    liveClock = baseClock * surgeFactor;
  } else if (isFlushing) {
    // Boosted PCIe buffer flush clock
    liveClock = baseClock * 1.15;
  }

  const liveRatio = liveClock > 0 ? (liveClock * 1000) / Math.max(25, heat) : 0;

  // Real-time telemetry sampling interval (every 800ms)
  useEffect(() => {
    const timer = setInterval(() => {
      const nowStr = new Date().toTimeString().split(' ')[0];
      const newPoint: TelemetryPoint = {
        time: nowStr,
        heat: parseFloat(heat.toFixed(1)),
        clockSpeed: parseFloat(liveClock.toFixed(2)),
        efficiencyRatio: parseFloat(liveRatio.toFixed(1)),
        surge: inSurge,
      };

      setHistory((prev) => {
        const next = [...prev, newPoint];
        if (next.length > 18) next.shift(); // Keep rolling window of 18 points
        return next;
      });
    }, 800);

    return () => clearInterval(timer);
  }, [heat, liveClock, liveRatio, inSurge]);

  // Efficiency status determination
  const statusLabel = isBSOD
    ? 'CRASHED'
    : heat >= 98.0
    ? 'THROTTLED'
    : inSurge
    ? 'OVERCLOCKED'
    : liveRatio > 80
    ? 'OPTIMAL'
    : 'NOMINAL';

  const statusColor = isBSOD
    ? 'text-blue-400 bg-blue-950/60 border-blue-600'
    : heat >= 98.0
    ? 'text-red-400 bg-red-950/60 border-red-600 animate-pulse'
    : inSurge
    ? 'text-yellow-300 bg-amber-950/60 border-amber-500 animate-pulse'
    : 'text-emerald-400 bg-emerald-950/60 border-emerald-700';

  return (
    <div className="p-3 rounded-xl bg-[#141620] border border-[#262c3d] space-y-2 select-none shadow-sm">
      {/* Telemetry Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs text-gray-300 font-black tracking-wider uppercase">
            THERMAL EFFICIENCY
          </span>
        </div>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      {/* Live Metrics Row */}
      <div className="grid grid-cols-3 gap-1.5 py-1 px-2 rounded-lg bg-[#0c0e14] border border-[#1e2330] text-center font-mono">
        <div>
          <div className="text-[9px] text-gray-400 font-bold">CLOCK</div>
          <div className="text-xs font-black text-cyan-400">{liveClock.toFixed(2)} GHz</div>
        </div>
        <div>
          <div className="text-[9px] text-gray-400 font-bold">CORE HEAT</div>
          <div
            className={`text-xs font-black ${
              inSurge ? 'text-red-400 animate-pulse' : 'text-amber-400'
            }`}
          >
            {heat.toFixed(1)}°C
          </div>
        </div>
        <div>
          <div className="text-[9px] text-gray-400 font-bold">RATIO</div>
          <div className="text-xs font-black text-emerald-400">{liveRatio.toFixed(0)} MHz/°</div>
        </div>
      </div>

      {/* Metric Filter Tabs */}
      <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 border-b border-white/5 pb-1">
        <span className="text-[9px] tracking-wider text-gray-500 uppercase">TELEMETRY GRAPH</span>
        <div className="flex gap-1">
          <button
            onClick={() => setActiveMetric('both')}
            className={`px-1.5 py-0.5 rounded text-[9px] transition-all ${
              activeMetric === 'both' ? 'bg-[#2b3347] text-white font-black' : 'hover:text-gray-200'
            }`}
          >
            ALL
          </button>
          <button
            onClick={() => setActiveMetric('clock')}
            className={`px-1.5 py-0.5 rounded text-[9px] transition-all ${
              activeMetric === 'clock' ? 'bg-cyan-950 text-cyan-300 font-black' : 'hover:text-gray-200'
            }`}
          >
            CLOCK
          </button>
          <button
            onClick={() => setActiveMetric('ratio')}
            className={`px-1.5 py-0.5 rounded text-[9px] transition-all ${
              activeMetric === 'ratio' ? 'bg-emerald-950 text-emerald-300 font-black' : 'hover:text-gray-200'
            }`}
          >
            RATIO
          </button>
        </div>
      </div>

      {/* Recharts Area Container */}
      <div className="w-full h-[120px] pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history} margin={{ top: 5, right: 2, left: -24, bottom: 0 }}>
            <defs>
              {/* Cyan gradient for Clock Speed */}
              <linearGradient id="clockGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#00e5ff" stopOpacity={0.0} />
              </linearGradient>

              {/* Red/Amber gradient for Temperature */}
              <linearGradient id="heatGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff1144" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#ff1144" stopOpacity={0.0} />
              </linearGradient>

              {/* Emerald gradient for Efficiency Ratio */}
              <linearGradient id="ratioGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="2 4" stroke="#1f2430" vertical={false} />

            <XAxis dataKey="time" hide={true} />

            {/* Left YAxis: Clock Frequency (GHz) / Efficiency Ratio */}
            <YAxis
              yAxisId="clock"
              orientation="left"
              domain={[0, 'dataMax + 2']}
              tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v.toFixed(0)}G`}
            />

            {/* Right YAxis: Temperature (°C) */}
            <YAxis
              yAxisId="heat"
              orientation="right"
              domain={[20, 105]}
              hide={activeMetric === 'clock' || activeMetric === 'ratio'}
              tick={{ fill: '#ef4444', fontSize: 8, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v.toFixed(0)}°`}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Surge Threshold Reference Line at 85°C */}
            <ReferenceLine
              yAxisId="heat"
              y={surgeThreshold}
              stroke="#ef4444"
              strokeDasharray="3 3"
              strokeOpacity={0.6}
            />

            {/* Clock Speed Area Curve */}
            {(activeMetric === 'both' || activeMetric === 'clock') && (
              <Area
                yAxisId="clock"
                type="monotone"
                dataKey="clockSpeed"
                name="Clock Speed"
                stroke="#00e5ff"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#clockGrad)"
                isAnimationActive={false}
              />
            )}

            {/* Efficiency Ratio Area Curve */}
            {activeMetric === 'ratio' && (
              <Area
                yAxisId="clock"
                type="monotone"
                dataKey="efficiencyRatio"
                name="Ratio"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#ratioGrad)"
                isAnimationActive={false}
              />
            )}

            {/* Core Heat Trace Line */}
            {activeMetric === 'both' && (
              <Line
                yAxisId="heat"
                type="monotone"
                dataKey="heat"
                name="Core Temp"
                stroke="#ff3366"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend / Status Subtitle */}
      <div className="flex justify-between items-center text-[9px] font-mono text-gray-500 pt-0.5">
        <span className="flex items-center gap-1 text-cyan-400">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          CLOCK (GHz)
        </span>
        <span className="flex items-center gap-1 text-rose-400">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          HEAT (°C)
        </span>
        <span className="flex items-center gap-1 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          RATIO (MHz/°)
        </span>
      </div>
    </div>
  );
};
