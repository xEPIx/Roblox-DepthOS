# DepthOS: Thermal Redline Systems Simulator — Release Notes & Architecture Guide

## 1. Game Concept
**DepthOS** is an authentic 3D Roblox-style systems simulator and incremental management game where players push virtual computer hardware to the thermodynamic edge. Operating inside a high-tech terminal battlestation with real-time 3D visual feedback, players process workloads, manage thermal build-up and RAM capacity, harvest Quantum Bits (Q-Bits), and build automated daemon networks while skirting the brink of catastrophic Blue Screen of Death (BSOD) crashes.

The title bridges the high-intensity risk-reward feel of Roblox simulators with realistic systems engineering metaphors: overclocking multipliers, PCIe bus transfer speeds, phase-change thermal paste, sub-zero cryo cooling, and root-level privilege escalations.

---

## 2. Core Loop
1. **Execute Workloads**: Click the Processor Core or pulse through keyboard hotkeys to mine Volatile Bytes.
2. **Ride the Thermal Surge**: As CPU temperatures surpass 85°C (or 80°C with Surge Drift), thermal yield multipliers ramp exponentially from 3.0x up to 10.0x (or 11.5x with Overvolt faction bonuses).
3. **Manage the Redline**: Exceeding 100°C causes thermal throttling and risks triggering a full BSOD crash, dumping uncommitted volatile registers and requiring an automated memory dump sequence.
4. **Flush to Banked Bytes**: Open high-speed PCIe memory channels to commit volatile registers into permanent Banked Bytes.
5. **Reinvest in Silicon Upgrades**: Purchase multi-tier hardware upgrades (CPU Core, High-Frequency RAM, Vapor Chamber / Sub-Zero Coolers, PCIe Bus, Thermal Paste) using 1x, 5x, 10x, Next Milestone, or Max purchasing modes.
6. **Prestige & Automate**: Reboot at Level 10+ to harvest Quantum Bits (Q-Bits), unlock Root Tree privilege branches, configure background daemons (`miner_d`, `flush_d`, `governor_d`), and join corporate factions.

---

## 3. Features

### Dynamic 3D Battlestation (Three.js)
- Fully interactive 3D scene featuring an authentic CRT monitor, PCB motherboard, glowing RAM sticks with data pulse activity, realistic studio lighting, and direct 3D raycast interaction.
- **3D Animated High-Performance CPU Cooling Fan Model**: A detailed procedural cooling assembly sitting directly on the CPU, composed of a nickel-plated IHS socket lid, copper contact coldplate, 4x sintered copper heatpipes, an aluminum fin tower array, matte-black fan cowling with rubber corner anti-vibration isolation dampeners and hex mounting bolts, addressable ARGB halo ring, and a 9-blade aerodynamic swept rotor with chrome bearing hub.
- **Continuous 60FPS Thermal Load Rotation & Visual Feedback**: The fan rotor continuously accelerates in real-time as heat increases (from a gentle 4.5 rad/s idle purr to 92.0 rad/s redline surge and 95.0 rad/s cryo-flush overdrive), with dynamic high-speed motion blur disc blending, internal rotor ARGB PointLight illumination, and color temperature shifts (Emerald Cool -> Golden Amber -> Searing Crimson Strobe -> BSOD Glitch Blue).
- **Dynamic CPU Heat Dissipation Particle Plume**: Directly above the CPU cooler heatsink model on the motherboard, a convective particle dissipation system with soft thermal vapor textures streams cryogenic cyan mist, expanding thermal wave rings, and dynamic ambient illumination whenever temperature is decreasing (or during active flush/cryo-vent). The plume automatically fades when temperatures stabilize or rise.
- Realistic mechanical keyboard component with full keycap matrix, mechanical spacebar dip travel, and a multi-layered keypress visual animation overlay (expanding procedural shockwave rings, core aura ripple, cybernetic wireframe grid flash, dynamic PointLight strobe, and kinetic data sparks) triggered on every workload process.
- Adaptive color palette on keypress: crisp electric cyan during standard operation shifting dynamically to searing crimson red during Thermal Surge.
- Camera controls with perspective presets (Workstation Orbit, Overhead PCB, Close-up Core).
- Interactive raycasting allowing direct clicking on the 3D motherboard, CPU, and keyboard to trigger workloads.
- Resilient WebGL sandbox guard with automatic fallback to a high-performance 2D retro CRT battlestation visualizer if WebGL context creation fails.

### Real-Time Thermal Efficiency Graph (Recharts)
- High-fidelity live telemetry chart embedded directly inside the DepthOS Desktop System Vitals panel.
- Computes real-time **Heat-to-Clock Speed ratios** (Efficiency Index in MHz per °C), active clock boost frequencies (GHz), and core temperature curves across a rolling historical window.
- Interactive view filters (`ALL`, `CLOCK`, `RATIO`), dynamic reference lines for the 85°C Thermal Surge threshold, and custom cybernetic glassmorphic tooltips with instant delta reporting.
- Status badges dynamically reflecting operating regime: `OPTIMAL`, `OVERCLOCKED`, `THROTTLED`, or `CRASHED`.

### Multi-Buy Shop Engine
- Flexible purchase increments: **1x**, **5x**, **10x**, **NEXT** (rounds up to the nearest 10th milestone level for tier bonuses), and **MAX** (computes geometric cost progression to buy all affordable levels in one click).
- Real-time affordability indicators, level milestone progress badges, and stat delta previews.

### High-Stakes Thermal Surge & Vignette System
- Dynamic HUD screen-shake and pulsing red vignette that engage the moment the system breaches the surge threshold.
- **High-Contrast THERMAL WARNING Overlay**: Heavy-duty industrial warning overlay that automatically flashes across the screen when CPU temperature crosses the 85% / 85°C threshold. Features hazard warning tape borders, tactical corner brackets, and bold yellow/crimson alert typography with real-time core telemetry.
- **Dynamic Blink Frequency Scaling**: Blink speed accelerates smoothly from a steady ~1.3 Hz warning pulse at 85°C to a rapid ~4.0 Hz alert at 95°C, culminating in an urgent ~7.7 Hz emergency strobe flash as temperatures approach the 100°C critical BSOD redline.
- **Procedural High-Frequency Grain Noise Overlay**: Dynamic 'overworked silicon' micro-grain static generated via hardware-accelerated typed array noise patterns cycling at ~24fps with sub-pixel hot electron chromatic specks. The grain opacity and electrical interference scale smoothly from imperceptible at cool idle (<30°C) to intense thermal jitter and horizontal trace lines during surge (85°C+) and critical redline (98°C-100°C), plus full digital static snow during BSOD.
- Diegetic Silicon Noise readout telemetry displayed in the system thermal gauge as temperatures exceed 55°C.
- Audio pitch-shifting and warning sirens as temperatures approach 98°C.
- Quick Cryo-Vent mechanic to vent heat instantly at the cost of volatile yield.

### Automation Daemons (`/etc/daemons`)
- **`miner_d`**: Automated thread cycle generating passive volatile bytes.
- **`flush_d`**: Automated buffer watchdog that initiates flushes when RAM capacity exceeds configured thresholds.
- **`governor_d`**: Thermal watchdog preventing BSOD by auto-throttling or triggering emergency cryo-vents.

### Progression, Factions & Vault
- **Factions**: Overvolt Dynamics (+15% Surge yield), CryoDyn Logistics (+15% passive cooling), and AetherBus Systems (-20% flush duration).
- **Root Tree (Prestige)**: Multi-branch quantum skill tree providing thermal capacitance, automated pipelines, and critical yield boosts.
- **Hardware Relic Vault**: Collectible, equipable artifacts (Gold Heatpipe, Quantum Nanotube Paste, Cryo Coldplate, ECC Buffer Stick) found via high-tier flushes and singularity research.
- **Season Pass (Battle Pass)**: 20-tier progression path unlocking cosmetic themes, titles, and currency bundles.
- **Singularity Project**: Multi-stage end-game particle/sub-atomic computing mega-project.

### Zero-Asset Procedural Web Audio Engine
- 100% synthesized through the Web Audio API—no external MP3/WAV assets required.
- Dynamic fan speed oscillation pitch-matching system temperature.
- Mechanical keyboard click soundpacks (Blue Switch, Brown Switch, Thocky Cream, Cyberpunk Laser).
- Procedural chimes, alarms, cryo-vents, cash registers, and retro BSOD crash tones.

### Roblox Studio Luau Export Engine
- Complete, export-ready Luau scripts:
  - `ServerScriptService/DepthOS_Server.lua` (10Hz tick simulation, DataStore2/ProfileStore architecture, validation).
  - `StarterPlayerScripts/DepthOS_Client.lua` (Input handling, screen effects, interpolation).
  - Data schema documentation and deployment step-by-step guides.

---

## 4. Architecture

### Technology Stack
- **Framework**: React 19 SPA powered by Vite 8 with TypeScript.
- **Styling**: Tailwind CSS v4 with custom GPU-accelerated CSS animations (`surgeShake`, `surgeVignettePulse`, `robloxPulse`, `affordableGlow`).
- **3D Engine**: Three.js (r187) with custom canvas-drawn procedural PCB and stud textures.
- **Audio**: Web Audio API dual synthesis engines (`DepthOSAudioEngine` & `SoundSystem`).
- **State Architecture**: 
  - Centralized state in `DepthOSState` with pure functional tick updates in `simulation.ts` running at a fixed 10Hz physics loop (`requestAnimationFrame` decoupled).
  - Multi-buy analytical cost calculations via closed-form geometric progression formulas ($S_n = a \frac{r^n - 1}{r - 1}$).
  - Robust auto-save pipeline writing to `localStorage` key `depthos_save_v2` with versioned migrations and crash recovery.

---

## 5. Controls

| Action | Mouse / Touch | Keyboard Shortcut |
| :--- | :--- | :--- |
| **Process Workload** | Click Processor Core / 3D CPU | `Space` / `Enter` |
| **Flush Cache** | Click "Flush Cache" Button | `F` |
| **Quick Cryo-Vent** | Click "Quick Vent" | `V` |
| **Toggle Sound Mute** | Click Speaker Icon in HUD | `M` |
| **Camera Reset** | Double click 3D Canvas | `C` |
| **Multi-Buy Toggle** | Click 1x / 5x / 10x / Next / Max | Number keys `1`–`5` |
| **Close Active Modal** | Click Close "X" / Backdrop | `Escape` |

---

## 6. Progression Strategy & Tiers

| Tier / Phase | Milestones | Primary Unlock |
| :--- | :--- | :--- |
| **Tier 1: Silicon Genesis** | Levels 1–5 | Manual workload processing, 1MB RAM buffer, passive fan cooling. |
| **Tier 2: Dual Core & Thermal Grease** | Levels 6–10 | High-performance thermal paste, PCIe Gen 2 bus speeds, first memory flush channels. |
| **Tier 3: The First Reboot** | Level 10+ (1,000+ Lifetime Bytes) | Root Tree unlocks, first Quantum Bits (Q-Bits) harvest, Faction alignment. |
| **Tier 4: Daemon Automation** | Levels 11–20 | `miner_d`, `flush_d`, and `governor_d` deployment; hands-free idle loop. |
| **Tier 5: Relic Engineering** | Levels 21–35 | Hardware Vault equipping, Season Pass rewards, high-speed thermal surge riding. |
| **Tier 6: Quantum Singularity** | Level 40+ | Sub-zero cryogenics, Singularity Project containment stages, infinite prestige scaling. |

---

## 7. Known Issues & Operational Considerations
- **Audio Context Autoplay Policy**: Modern browsers restrict audio context activation until the first user click. The game includes an explicit title screen and interaction gate to safely initialize procedural sound nodes.
- **WebGL Context Fallback**: On extremely resource-constrained or mobile embedded WebViews lacking WebGL 2.0 acceleration, Three.js falls back to a neutral 2D canvas backdrop while maintaining full simulation fidelity.
- **HMR WebSocket Warnings**: In isolated sandbox environments, Vite's hot-module reload WebSocket may report disconnection; this does not affect simulation execution or state persistence.

---

## 8. Future Plans
- **Roblox Open Cloud Live Sync**: Direct HTTP service synchronization between the Web preview and active Roblox game instances.
- **Multiplayer Server Leaderboards**: Global distributed ranking for peak thermal efficiency and lifetime Q-Bits.
- **Custom PCB Modding Studio**: In-game node graph editor for custom motherboard circuit routing and LED addressable strip programming.
- **Additional Factions & Raid Events**: Corporate intrusion cyber-defense mini-games and collaborative raid boss server flushes.
