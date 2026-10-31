import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createKeypressShockwaveTexture, createHeatVaporTexture } from '../utils/proceduralTextures';

export type SelectablePart = 'cpu' | 'ram' | 'cooling' | 'monitor' | 'keyboard';

export interface SceneController {
  update: (heat: number, isBSOD: boolean, isFlushing: boolean, dt: number) => void;
  setCameraPreset: (preset: 'monitor' | 'desk' | 'motherboard') => void;
  triggerPressVisual: (isSurge?: boolean) => void;
  triggerVentVisual: () => void;
  dispose: () => void;
}

/**
 * Entry point for DepthOS 3D Battlestation Scene.
 * Uses WebGL2 Three.js renderer if available, and gracefully falls back to a
 * high-performance 2D retro CRT battlestation visualizer if WebGL context creation fails
 * or is blocked by sandbox constraints.
 */
export function createDepthOSThreeScene(
  container: HTMLDivElement,
  onSelectPart?: (part: SelectablePart) => void
): SceneController {
  try {
    return initThreeWebGLScene(container, onSelectPart);
  } catch (err) {
    console.warn('WebGL initialization unavailable in current environment; switching to fallback Battlestation visualizer.', err);
    return createFallback2DScene(container, onSelectPart);
  }
}

function initThreeWebGLScene(
  container: HTMLDivElement,
  onSelectPart?: (part: SelectablePart) => void
): SceneController {
  // 1. Software WebGL Guard (read from GPU renderer string, safe try-catch)
  const isSoftwareGl = (() => {
    try {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      return true;
    }
  })();

  // 2. Renderer Setup
  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
    alpha: false,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  // 3. Scene & Camera Setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0c10);
  scene.fog = new THREE.FogExp2(0x0a0c10, 0.04);

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 1.8, 4.2);

  // Camera presets
  const cameraPresets = {
    monitor: { pos: new THREE.Vector3(0, 1.45, 2.7), target: new THREE.Vector3(0, 1.45, 0) },
    desk: { pos: new THREE.Vector3(1.8, 2.3, 3.6), target: new THREE.Vector3(-0.2, 1.2, 0) },
    motherboard: { pos: new THREE.Vector3(1.4, 1.35, 1.5), target: new THREE.Vector3(1.2, 1.15, 0.4) },
  };

  const targetCamPos = cameraPresets.desk.pos.clone();
  const targetLookAt = cameraPresets.desk.target.clone();
  const currentLookAt = cameraPresets.desk.target.clone();

  // 4. Room Environment
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  pmremGenerator.dispose();

  // 5. Lighting Rig
  const hemiLight = new THREE.HemisphereLight(0x406080, 0x101520, 0.6);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfff5e6, 1.4);
  keyLight.position.set(2, 4, 3);
  keyLight.castShadow = !isSoftwareGl;
  if (keyLight.castShadow) {
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
  }
  scene.add(keyLight);

  // Dynamic LED Accent Light inside PC Chassis
  const chassisLedLight = new THREE.PointLight(0x00ff88, 2.5, 4);
  chassisLedLight.position.set(1.2, 1.3, 0.4);
  scene.add(chassisLedLight);

  // 6. Build Procedural Scene Models
  // Desk Surface
  const deskGeo = new THREE.BoxGeometry(4.5, 0.1, 2.2);
  const deskMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a20,
    roughness: 0.7,
    metalness: 0.2,
  });
  const desk = new THREE.Mesh(deskGeo, deskMat);
  desk.position.set(0, 0.7, 0);
  desk.receiveShadow = !isSoftwareGl;
  scene.add(desk);

  // Giant Mouse Mat
  const padGeo = new THREE.BoxGeometry(3.6, 0.01, 1.4);
  const padMat = new THREE.MeshStandardMaterial({
    color: 0x111317,
    roughness: 0.9,
    metalness: 0.05,
  });
  const pad = new THREE.Mesh(padGeo, padMat);
  pad.position.set(0, 0.755, 0.1);
  scene.add(pad);

  // CRT Monitor Housing (Composite parts)
  const monitorGroup = new THREE.Group();
  monitorGroup.position.set(-0.3, 0.76, -0.3);

  // Stand Base
  const standBaseGeo = new THREE.CylinderGeometry(0.35, 0.38, 0.04, 24);
  const plasticMat = new THREE.MeshStandardMaterial({ color: 0x242830, roughness: 0.5, metalness: 0.3 });
  const standBase = new THREE.Mesh(standBaseGeo, plasticMat);
  standBase.position.set(0, 0.02, 0);
  monitorGroup.add(standBase);

  // Stand Neck
  const standNeckGeo = new THREE.BoxGeometry(0.12, 0.5, 0.12);
  const standNeck = new THREE.Mesh(standNeckGeo, plasticMat);
  standNeck.position.set(0, 0.27, -0.05);
  monitorGroup.add(standNeck);

  // Screen Outer Casing
  const casingGeo = new THREE.BoxGeometry(2.0, 1.25, 0.35);
  const casing = new THREE.Mesh(casingGeo, plasticMat);
  casing.position.set(0, 0.8, 0);
  casing.userData = { part: 'monitor' };
  monitorGroup.add(casing);

  // Screen Bezel Inner & Curved Glass Display
  const screenGeo = new THREE.PlaneGeometry(1.82, 1.08);
  const screenMat = new THREE.MeshBasicMaterial({
    color: 0x051a10,
  });
  const screenMesh = new THREE.Mesh(screenGeo, screenMat);
  screenMesh.position.set(0, 0.8, 0.176);
  screenMesh.userData = { part: 'monitor' };
  monitorGroup.add(screenMesh);

  // CRT Power LED
  const ledGeo = new THREE.SphereGeometry(0.016, 12, 12);
  const ledMat = new THREE.MeshBasicMaterial({ color: 0x00ff66 });
  const powerLed = new THREE.Mesh(ledGeo, ledMat);
  powerLed.position.set(0.85, 0.23, 0.18);
  monitorGroup.add(powerLed);

  scene.add(monitorGroup);

  // 7. High-End Open/Tempered Glass Cyber PC Chassis (Right side of desk)
  const pcGroup = new THREE.Group();
  pcGroup.position.set(1.2, 0.76, 0.2);

  // PC Frame
  const pcFrameGeo = new THREE.BoxGeometry(0.8, 1.1, 1.2);
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x0f1115,
    roughness: 0.4,
    metalness: 0.8,
  });
  const pcFrame = new THREE.Mesh(pcFrameGeo, frameMat);
  pcFrame.position.set(0, 0.55, 0);
  pcGroup.add(pcFrame);

  // Glass Side Panel
  const glassGeo = new THREE.PlaneGeometry(1.15, 1.05);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.4,
    roughness: 0.1,
    metalness: 0.1,
    transmission: isSoftwareGl ? 0 : 0.8,
    ior: 1.5,
  });
  const glassPanel = new THREE.Mesh(glassGeo, glassMat);
  glassPanel.position.set(-0.405, 0.55, 0);
  glassPanel.rotation.y = -Math.PI / 2;
  pcGroup.add(glassPanel);

  // Motherboard PCB
  const moboGeo = new THREE.BoxGeometry(0.02, 0.9, 0.95);
  const moboMat = new THREE.MeshStandardMaterial({ color: 0x102018, roughness: 0.8, metalness: 0.1 });
  const mobo = new THREE.Mesh(moboGeo, moboMat);
  mobo.position.set(0.35, 0.55, 0);
  pcGroup.add(mobo);

  // -------------------------------------------------------------
  // CPU SOCKET, HEATSINK TOWER & 3D ANIMATED COOLING FAN MODEL
  // -------------------------------------------------------------
  // 1. CPU Nickel-Plated Integrated Heat Spreader (IHS) & Socket
  const cpuIHSGeo = new THREE.BoxGeometry(0.015, 0.22, 0.22);
  const cpuIHSMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    metalness: 0.95,
    roughness: 0.15,
  });
  const cpuIHS = new THREE.Mesh(cpuIHSGeo, cpuIHSMat);
  cpuIHS.position.set(0.338, 0.65, 0);
  cpuIHS.userData = { part: 'cpu' };
  pcGroup.add(cpuIHS);

  // 2. CPU Mirror-Finish Copper Coldplate Base
  const coldplateGeo = new THREE.BoxGeometry(0.02, 0.24, 0.24);
  const coldplateMat = new THREE.MeshStandardMaterial({
    color: 0xcc6f3a,
    metalness: 0.9,
    roughness: 0.25,
  });
  const coldplate = new THREE.Mesh(coldplateGeo, coldplateMat);
  coldplate.position.set(0.32, 0.65, 0);
  coldplate.userData = { part: 'cpu' };
  pcGroup.add(coldplate);

  // 3. 4x Sintered Copper Heatpipes
  const heatpipeGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.28, 12);
  const heatpipeMat = new THREE.MeshStandardMaterial({
    color: 0xd97736,
    metalness: 0.88,
    roughness: 0.2,
  });
  [-0.07, 0.07].forEach((zOff) => {
    const pipe1 = new THREE.Mesh(heatpipeGeo, heatpipeMat);
    pipe1.position.set(0.24, 0.65, zOff);
    pcGroup.add(pipe1);
    const pipe2 = new THREE.Mesh(heatpipeGeo, heatpipeMat);
    pipe2.position.set(0.28, 0.65, zOff);
    pcGroup.add(pipe2);
  });

  // 4. Aluminum Heatsink Fin Array Block
  const coolerBlockGeo = new THREE.BoxGeometry(0.16, 0.28, 0.28);
  const coolerMat = new THREE.MeshStandardMaterial({
    color: 0x484f58,
    metalness: 0.85,
    roughness: 0.2,
  });
  const coolerBlock = new THREE.Mesh(coolerBlockGeo, coolerMat);
  coolerBlock.position.set(0.23, 0.65, 0);
  coolerBlock.userData = { part: 'cpu' };
  pcGroup.add(coolerBlock);

  // 5. 3D High-Performance Cooling Fan Unit mounted directly on CPU cooler
  const cpuFanUnitGroup = new THREE.Group();
  cpuFanUnitGroup.position.set(0.13, 0.65, 0);

  // Fan Shroud Outer Bezel Frame
  const shroudFrameGeo = new THREE.BoxGeometry(0.035, 0.28, 0.28);
  const shroudMat = new THREE.MeshStandardMaterial({
    color: 0x14161a,
    roughness: 0.6,
    metalness: 0.4,
  });
  const shroudFrame = new THREE.Mesh(shroudFrameGeo, shroudMat);
  shroudFrame.userData = { part: 'cooling' };
  cpuFanUnitGroup.add(shroudFrame);

  // Inner Cylindrical Airflow Cowling Bore
  const innerBoreGeo = new THREE.CylinderGeometry(0.125, 0.125, 0.036, 32, 1, true);
  const innerBoreMat = new THREE.MeshStandardMaterial({
    color: 0x0c0e12,
    roughness: 0.7,
    metalness: 0.2,
    side: THREE.BackSide,
  });
  const innerBore = new THREE.Mesh(innerBoreGeo, innerBoreMat);
  innerBore.rotation.z = Math.PI / 2;
  innerBore.userData = { part: 'cooling' };
  cpuFanUnitGroup.add(innerBore);

  // Corner Rubber Anti-Vibration Dampeners & Chrome Hex Screws
  const damperGeo = new THREE.BoxGeometry(0.038, 0.045, 0.045);
  const damperMat = new THREE.MeshStandardMaterial({
    color: 0x222630,
    roughness: 0.9,
    metalness: 0.1,
  });
  const screwGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.04, 12);
  const screwMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    metalness: 0.95,
    roughness: 0.15,
  });

  [-0.115, 0.115].forEach((dy) => {
    [-0.115, 0.115].forEach((dz) => {
      const damper = new THREE.Mesh(damperGeo, damperMat);
      damper.position.set(0, dy, dz);
      damper.userData = { part: 'cooling' };
      cpuFanUnitGroup.add(damper);

      const screw = new THREE.Mesh(screwGeo, screwMat);
      screw.rotation.z = Math.PI / 2;
      screw.position.set(0.002, dy, dz);
      screw.userData = { part: 'cooling' };
      cpuFanUnitGroup.add(screw);
    });
  });

  // Stator Support Guide Struts (connecting outer frame to rear bearing)
  const strutGeo = new THREE.BoxGeometry(0.01, 0.115, 0.008);
  const strutMat = new THREE.MeshStandardMaterial({ color: 0x181c22, roughness: 0.7 });
  for (let s = 0; s < 4; s++) {
    const sAngle = (s / 4) * Math.PI * 2 + Math.PI / 4;
    const strut = new THREE.Mesh(strutGeo, strutMat);
    strut.position.set(0.012, Math.cos(sAngle) * 0.065, Math.sin(sAngle) * 0.065);
    strut.rotation.x = sAngle;
    strut.userData = { part: 'cooling' };
    cpuFanUnitGroup.add(strut);
  }

  // Addressable RGB Halo Ring around perimeter
  const fanRingGeo = new THREE.TorusGeometry(0.118, 0.007, 16, 48);
  const fanRingMat = new THREE.MeshStandardMaterial({
    color: 0x00ff88,
    emissive: 0x00ff88,
    emissiveIntensity: 0.9,
    roughness: 0.2,
    metalness: 0.1,
  });
  const fanHaloRing = new THREE.Mesh(fanRingGeo, fanRingMat);
  fanHaloRing.rotation.y = Math.PI / 2;
  fanHaloRing.position.set(-0.018, 0, 0);
  fanHaloRing.userData = { part: 'cooling' };
  cpuFanUnitGroup.add(fanHaloRing);

  // 6. Dynamic Rotating Rotor Assembly (Fan Hub + 9 Swept Aerodynamic Blades)
  const fanRotorGroup = new THREE.Group();
  fanRotorGroup.position.set(-0.005, 0, 0);

  // Aerodynamic Center Hub
  const fanHubGeo = new THREE.CylinderGeometry(0.046, 0.046, 0.032, 24);
  const fanBladeMat = new THREE.MeshStandardMaterial({
    color: 0x00ff88,
    emissive: 0x00ff88,
    emissiveIntensity: 0.65,
    roughness: 0.25,
    metalness: 0.1,
  });
  const fanHub = new THREE.Mesh(fanHubGeo, fanBladeMat);
  fanHub.rotation.z = Math.PI / 2;
  fanHub.userData = { part: 'cooling' };
  fanRotorGroup.add(fanHub);

  // Chrome Center Bearing Cap
  const hubCapGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.006, 24);
  const hubCapMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.95,
    roughness: 0.1,
  });
  const hubCap = new THREE.Mesh(hubCapGeo, hubCapMat);
  hubCap.rotation.z = Math.PI / 2;
  hubCap.position.set(-0.015, 0, 0);
  hubCap.userData = { part: 'cooling' };
  fanRotorGroup.add(hubCap);

  // 9 Swept Curved Aerodynamic Fan Blades
  const bladeCount = 9;
  const bladeGeo = new THREE.BoxGeometry(0.008, 0.076, 0.032);
  for (let b = 0; b < bladeCount; b++) {
    const angle = (b / bladeCount) * Math.PI * 2;
    const blade = new THREE.Mesh(bladeGeo, fanBladeMat);
    const radius = 0.076;
    blade.position.set(0, Math.cos(angle) * radius, Math.sin(angle) * radius);
    blade.rotation.x = angle + 0.38; // Aerodynamic pitch angle
    blade.rotation.y = 0.22;
    blade.userData = { part: 'cooling' };
    fanRotorGroup.add(blade);
  }

  // High-RPM Motion Blur Overlay Disc (fades in as RPM increases)
  const fanBlurGeo = new THREE.RingGeometry(0.046, 0.118, 36);
  const fanBlurMat = new THREE.MeshBasicMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const fanMotionBlurDisc = new THREE.Mesh(fanBlurGeo, fanBlurMat);
  fanMotionBlurDisc.rotation.y = Math.PI / 2;
  fanMotionBlurDisc.position.set(-0.016, 0, 0);
  fanRotorGroup.add(fanMotionBlurDisc);

  cpuFanUnitGroup.add(fanRotorGroup);

  // Dedicated Fan Hub ARGB Light (Illuminates fan blades, heatsink, and chassis)
  const fanInternalLight = new THREE.PointLight(0x00ff88, 1.8, 1.3);
  fanInternalLight.position.set(-0.01, 0, 0);
  cpuFanUnitGroup.add(fanInternalLight);

  pcGroup.add(cpuFanUnitGroup);

  // RAM Sticks (2x with glowing RGB tops)
  const ramMats: THREE.MeshStandardMaterial[] = [];
  for (let r = 0; r < 2; r++) {
    const ramGeo = new THREE.BoxGeometry(0.04, 0.18, 0.02);
    const ramMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.8,
    });
    ramMats.push(ramMat);
    const ramStick = new THREE.Mesh(ramGeo, ramMat);
    ramStick.position.set(0.24, 0.65, 0.22 + r * 0.05);
    ramStick.userData = { part: 'ram' };
    pcGroup.add(ramStick);
  }

  // Liquid Cooling Tubes (Glowing curve)
  const tubeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.24, 0.65, -0.08),
    new THREE.Vector3(0.1, 0.8, -0.2),
    new THREE.Vector3(0.0, 0.95, -0.35),
    new THREE.Vector3(0.2, 0.95, -0.45),
  ]);
  const tubeGeo = new THREE.TubeGeometry(tubeCurve, 20, 0.018, 8, false);
  const coolantMat = new THREE.MeshStandardMaterial({
    color: 0x00ff88,
    emissive: 0x00ff88,
    emissiveIntensity: 0.5,
    roughness: 0.2,
    metalness: 0.1,
  });
  const coolantTube = new THREE.Mesh(tubeGeo, coolantMat);
  coolantTube.userData = { part: 'cooling' };
  pcGroup.add(coolantTube);

  // -------------------------------------------------------------
  // DYNAMIC HEAT DISSIPATION SYSTEM DIRECTLY ABOVE CPU MODEL
  // -------------------------------------------------------------
  // Top of CPU cooler block is at y = 0.65 + 0.14 = 0.79 in pcGroup coordinates.
  const cpuDissipationGroup = new THREE.Group();
  cpuDissipationGroup.position.set(0.24, 0.79, 0.0);
  pcGroup.add(cpuDissipationGroup);

  const heatVaporTex = createHeatVaporTexture();

  // 1. Convective Thermal Dissipation Wave Ring at CPU Top
  const ringGeo = new THREE.RingGeometry(0.03, 0.13, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const cpuDissipationRing = new THREE.Mesh(ringGeo, ringMat);
  cpuDissipationRing.position.set(0, 0.015, 0);
  cpuDissipationRing.rotation.x = -Math.PI / 2;
  cpuDissipationGroup.add(cpuDissipationRing);

  // 2. CPU Dissipation PointLight
  const cpuDissipationLight = new THREE.PointLight(0x00f0ff, 0, 1.4);
  cpuDissipationLight.position.set(0, 0.12, 0);
  cpuDissipationGroup.add(cpuDissipationLight);

  // 3. Dynamic Heat Dissipation Particles System
  const cpuParticleCount = 64;
  const cpuParticleGeo = new THREE.BufferGeometry();
  const cpuPositions = new Float32Array(cpuParticleCount * 3);
  const cpuColors = new Float32Array(cpuParticleCount * 3);

  interface DissipationParticleState {
    initialX: number;
    initialZ: number;
    vx: number;
    vy: number;
    vz: number;
    life: number;
    maxLife: number;
    swirlAngle: number;
    swirlSpeed: number;
    swirlRadius: number;
  }

  const cpuParticleStates: DissipationParticleState[] = [];

  for (let i = 0; i < cpuParticleCount; i++) {
    const pX = (Math.random() - 0.5) * 0.16;
    const pZ = (Math.random() - 0.5) * 0.16;
    const pY = -10; // start hidden off-screen until temperature decreases
    cpuPositions[i * 3 + 0] = pX;
    cpuPositions[i * 3 + 1] = pY;
    cpuPositions[i * 3 + 2] = pZ;

    // Soft frosty cyan vapor base
    cpuColors[i * 3 + 0] = 0.2;
    cpuColors[i * 3 + 1] = 0.9;
    cpuColors[i * 3 + 2] = 1.0;

    cpuParticleStates.push({
      initialX: pX,
      initialZ: pZ,
      vx: (Math.random() - 0.5) * 0.04 - 0.03, // drafting toward chassis exhaust
      vy: 0.22 + Math.random() * 0.32,
      vz: (Math.random() - 0.5) * 0.04,
      life: Math.random(), // staggered initial phase
      maxLife: 1.0 + Math.random() * 1.2,
      swirlAngle: Math.random() * Math.PI * 2,
      swirlSpeed: (Math.random() - 0.5) * 4.0,
      swirlRadius: 0.015 + Math.random() * 0.025,
    });
  }

  cpuParticleGeo.setAttribute('position', new THREE.BufferAttribute(cpuPositions, 3));
  cpuParticleGeo.setAttribute('color', new THREE.BufferAttribute(cpuColors, 3));

  const cpuParticleMat = new THREE.PointsMaterial({
    size: 0.08,
    map: heatVaporTex,
    vertexColors: true,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const cpuParticlePoints = new THREE.Points(cpuParticleGeo, cpuParticleMat);
  cpuDissipationGroup.add(cpuParticlePoints);

  scene.add(pcGroup);

  // 8. Mechanical Keyboard on desk in front of monitor
  const kbGroup = new THREE.Group();
  kbGroup.position.set(-0.3, 0.77, 0.45);

  // Keyboard Chassis Body
  const kbBaseGeo = new THREE.BoxGeometry(1.15, 0.04, 0.38);
  const kbBaseMat = new THREE.MeshStandardMaterial({
    color: 0x16181e,
    roughness: 0.5,
    metalness: 0.6,
  });
  const kbBase = new THREE.Mesh(kbBaseGeo, kbBaseMat);
  kbBase.userData = { part: 'keyboard' };
  kbGroup.add(kbBase);

  // Angled Wrist-Rest Bevel
  const bevelGeo = new THREE.BoxGeometry(1.13, 0.015, 0.05);
  const bevelMesh = new THREE.Mesh(bevelGeo, kbBaseMat);
  bevelMesh.position.set(0, -0.012, 0.205);
  bevelMesh.userData = { part: 'keyboard' };
  kbGroup.add(bevelMesh);

  // Keyboard RGB Underglow Rim
  const underglowGeo = new THREE.BoxGeometry(1.14, 0.006, 0.37);
  const underglowMat = new THREE.MeshBasicMaterial({
    color: 0x00e5ff,
    transparent: true,
    opacity: 0.7,
  });
  const underglowRim = new THREE.Mesh(underglowGeo, underglowMat);
  underglowRim.position.set(0, -0.018, 0);
  kbGroup.add(underglowRim);

  // Keycap Matrix Materials
  const keycapMat = new THREE.MeshStandardMaterial({
    color: 0x222630,
    roughness: 0.35,
    metalness: 0.4,
    emissive: 0x00e5ff,
    emissiveIntensity: 0.2,
  });

  const spacebarMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    roughness: 0.25,
    metalness: 0.4,
    emissive: 0x00f0ff,
    emissiveIntensity: 0.6,
  });

  // Keycaps Layout (4 rows: Function, QWERTY, ASDF, ZXCV)
  const keyRows = [
    { z: -0.12, count: 12, startX: -0.44, stepX: 0.08, width: 0.065 },
    { z: -0.06, count: 12, startX: -0.44, stepX: 0.08, width: 0.065 },
    { z: 0.00, count: 11, startX: -0.40, stepX: 0.08, width: 0.065 },
    { z: 0.06, count: 10, startX: -0.36, stepX: 0.08, width: 0.065 },
  ];

  const keycapGeo = new THREE.BoxGeometry(0.065, 0.02, 0.045);
  keyRows.forEach((row) => {
    for (let k = 0; k < row.count; k++) {
      const keyMesh = new THREE.Mesh(keycapGeo, keycapMat);
      keyMesh.position.set(row.startX + k * row.stepX, 0.028, row.z);
      keyMesh.userData = { part: 'keyboard' };
      kbGroup.add(keyMesh);
    }
  });

  // Modifier Keys on bottom row
  const modKeyGeo = new THREE.BoxGeometry(0.09, 0.02, 0.048);
  [-0.34, -0.22, 0.22, 0.34].forEach((xPos) => {
    const modKey = new THREE.Mesh(modKeyGeo, keycapMat);
    modKey.position.set(xPos, 0.028, 0.12);
    modKey.userData = { part: 'keyboard' };
    kbGroup.add(modKey);
  });

  // Spacebar (Interactive Keypress Focus)
  const spacebarGeo = new THREE.BoxGeometry(0.32, 0.024, 0.05);
  const spacebar = new THREE.Mesh(spacebarGeo, spacebarMat);
  spacebar.position.set(0, 0.028, 0.12);
  spacebar.userData = { part: 'keyboard' };
  kbGroup.add(spacebar);

  // VISUAL ANIMATION OVERLAYS ON KEYBOARD
  const shockwaveTex = createKeypressShockwaveTexture();
  const shockwaveGeo = new THREE.PlaneGeometry(0.85, 0.85);
  const shockwaveMat = new THREE.MeshBasicMaterial({
    map: shockwaveTex,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const overlayRingMesh = new THREE.Mesh(shockwaveGeo, shockwaveMat);
  overlayRingMesh.position.set(0, 0.044, 0.08);
  overlayRingMesh.rotation.x = -Math.PI / 2;
  kbGroup.add(overlayRingMesh);

  const auraGeo = new THREE.RingGeometry(0.03, 0.14, 32);
  const auraMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const overlayPulseAura = new THREE.Mesh(auraGeo, auraMat);
  overlayPulseAura.position.set(0, 0.046, 0.12);
  overlayPulseAura.rotation.x = -Math.PI / 2;
  kbGroup.add(overlayPulseAura);

  const gridOverlayGeo = new THREE.PlaneGeometry(1.08, 0.35, 12, 4);
  const gridOverlayMat = new THREE.MeshBasicMaterial({
    color: 0x00e5ff,
    wireframe: true,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const overlayGridMesh = new THREE.Mesh(gridOverlayGeo, gridOverlayMat);
  overlayGridMesh.position.set(0, 0.042, 0.01);
  overlayGridMesh.rotation.x = -Math.PI / 2;
  kbGroup.add(overlayGridMesh);

  const keyboardLight = new THREE.PointLight(0x00f0ff, 0, 1.35);
  keyboardLight.position.set(0, 0.16, 0.08);
  kbGroup.add(keyboardLight);

  const sparkCount = 16;
  const sparkGeo = new THREE.BufferGeometry();
  const sparkPositions = new Float32Array(sparkCount * 3);
  const sparkVels: THREE.Vector3[] = [];
  for (let s = 0; s < sparkCount; s++) {
    sparkPositions[s * 3 + 0] = 0;
    sparkPositions[s * 3 + 1] = 0.04;
    sparkPositions[s * 3 + 2] = 0.12;
    sparkVels.push(new THREE.Vector3(0, 0, 0));
  }
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
  const sparkMat = new THREE.PointsMaterial({
    color: 0x00ffff,
    size: 0.032,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
  });
  const sparksMesh = new THREE.Points(sparkGeo, sparkMat);
  kbGroup.add(sparksMesh);

  scene.add(kbGroup);

  // 9. Particle System for Heat Steam & Overheat Sparks (Active during extreme heat)
  const particleCount = 45;
  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleVels: THREE.Vector3[] = [];

  for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3 + 0] = 1.2 + (Math.random() - 0.5) * 0.4;
    particlePositions[i * 3 + 1] = 1.35 + Math.random() * 0.2;
    particlePositions[i * 3 + 2] = 0.2 + (Math.random() - 0.5) * 0.4;
    particleVels.push(new THREE.Vector3((Math.random() - 0.5) * 0.2, 0.4 + Math.random() * 0.6, (Math.random() - 0.5) * 0.2));
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  const particleMat = new THREE.PointsMaterial({
    color: 0xff3300,
    size: 0.05,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
  });
  const particleSystem = new THREE.Points(particleGeo, particleMat);
  scene.add(particleSystem);

  // 10. Animation & Render Loop State
  let frameId = 0;
  let keyPressDip = 0;
  let keypressAnimProgress = 1.0;
  let sparkLife = 0;

  // Dynamic 3D CPU cooling fan rotation state
  let currentFanSpinSpeed = 4.5;
  let targetFanSpinSpeed = 4.5;

  // Temperature dissipation tracking
  let prevHeat = -1;
  let isTempDecreasing = false;
  let dissipationIntensity = 0.0;
  let heatDecreaseRate = 0.0;
  let currentHeatVal = 25.0;
  let currentIsFlushing = false;

  function afterDraw(cb: () => void) {
    const gl = renderer.getContext() as WebGL2RenderingContext;
    const sync = gl?.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl?.flush?.();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        frameId = window.setTimeout(cb, 80);
      }
    };
    frameId = window.setTimeout(poll, 5);
  }

  function renderTick() {
    const dt = 0.016;

    // Camera smooth damping
    camera.position.lerp(targetCamPos, 0.06);
    currentLookAt.lerp(targetLookAt, 0.06);
    camera.lookAt(currentLookAt);

    // -------------------------------------------------------------
    // DYNAMIC CPU COOLING FAN ANIMATED ROTATION & SPEED FEEDBACK
    // -------------------------------------------------------------
    // Rotates continuously every frame at 60fps, accelerating as heat increases:
    // 25°C: 4.5 rad/s (gentle quiet glide)
    // 50°C: ~18.5 rad/s (active cooling)
    // 70°C: ~42.0 rad/s (heavy workload)
    // 85°C+: ~74.0 - 92.0 rad/s (blistering thermal surge redline)
    // Flushing/Vent: ~95.0 rad/s (screaming maximum overdrive purge)
    currentFanSpinSpeed = THREE.MathUtils.damp(currentFanSpinSpeed, targetFanSpinSpeed, 3.8, dt);
    fanRotorGroup.rotation.x += currentFanSpinSpeed * dt;

    // High-speed motion blur disc overlay scales with rotation velocity
    fanBlurMat.opacity = Math.max(0, (currentFanSpinSpeed - 18) / 72) * 0.45;

    // Spacebar bounce return
    if (keyPressDip > 0) {
      keyPressDip = Math.max(0, keyPressDip - 0.0035);
      spacebar.position.y = 0.028 - keyPressDip;
    }

    // Keyboard dynamic light decay
    if (keyboardLight.intensity > 0.01) {
      keyboardLight.intensity = THREE.MathUtils.lerp(keyboardLight.intensity, 0, 0.12);
    } else {
      keyboardLight.intensity = 0;
    }

    // Emissive back to idle
    spacebarMat.emissiveIntensity = THREE.MathUtils.lerp(spacebarMat.emissiveIntensity, 0.6, 0.08);
    keycapMat.emissiveIntensity = THREE.MathUtils.lerp(keycapMat.emissiveIntensity, 0.2, 0.08);

    // Keyboard keypress visual animation overlay progression
    if (keypressAnimProgress < 1.0) {
      keypressAnimProgress += 0.045;
      const p = Math.min(1.0, keypressAnimProgress);
      const easeOut = Math.sin(p * Math.PI * 0.5);

      // Expanding Shockwave Ring
      const ringScale = 0.15 + easeOut * 1.65;
      overlayRingMesh.scale.set(ringScale, ringScale, 1);
      shockwaveMat.opacity = Math.max(0, (1.0 - p) * 0.95);

      // Expanding Core Aura
      const auraScale = 0.2 + easeOut * 1.85;
      overlayPulseAura.scale.set(auraScale, auraScale, 1);
      auraMat.opacity = Math.max(0, (1.0 - p) * 0.85);

      // Grid Wireframe Flash
      gridOverlayMat.opacity = Math.max(0, (1.0 - p * 1.4) * 0.45);
    } else {
      shockwaveMat.opacity = 0;
      auraMat.opacity = 0;
      gridOverlayMat.opacity = 0;
    }

    // Kinetic tactile spark particles
    if (sparkLife > 0) {
      sparkLife = Math.max(0, sparkLife - 0.045);
      sparkMat.opacity = sparkLife * 0.9;
      const sPosAttr = sparkGeo.attributes.position as THREE.BufferAttribute;
      const sPosArr = sPosAttr.array as Float32Array;
      for (let s = 0; s < sparkCount; s++) {
        sPosArr[s * 3 + 0] += sparkVels[s].x * 0.016;
        sPosArr[s * 3 + 1] += sparkVels[s].y * 0.016;
        sPosArr[s * 3 + 2] += sparkVels[s].z * 0.016;
      }
      sPosAttr.needsUpdate = true;
    } else {
      sparkMat.opacity = 0;
    }

    // -------------------------------------------------------------
    // DYNAMIC CPU HEAT DISSIPATION ANIMATION WHEN TEMP DECREASING
    // -------------------------------------------------------------
    if (isTempDecreasing) {
      const targetIntensity = currentIsFlushing ? 1.0 : Math.max(0.4, Math.min(1.0, 0.35 + heatDecreaseRate * 0.5));
      dissipationIntensity = THREE.MathUtils.damp(dissipationIntensity, targetIntensity, 5.0, dt);
    } else {
      dissipationIntensity = THREE.MathUtils.damp(dissipationIntensity, 0.0, 3.2, dt);
    }

    if (dissipationIntensity > 0.005) {
      cpuParticleMat.opacity = dissipationIntensity * 0.95;

      const posAttr = cpuParticleGeo.attributes.position as THREE.BufferAttribute;
      const colAttr = cpuParticleGeo.attributes.color as THREE.BufferAttribute;
      const pArr = posAttr.array as Float32Array;
      const cArr = colAttr.array as Float32Array;

      const isHighHeat = currentHeatVal > 70;

      for (let i = 0; i < cpuParticleCount; i++) {
        const p = cpuParticleStates[i];
        p.life += dt / p.maxLife;

        if (p.life >= 1.0) {
          if (isTempDecreasing || dissipationIntensity > 0.08) {
            p.life = 0;
            p.initialX = (Math.random() - 0.5) * 0.15;
            p.initialZ = (Math.random() - 0.5) * 0.15;
            p.vy = 0.24 + Math.random() * 0.34 * (currentIsFlushing ? 1.75 : 1.0);
            p.vx = (Math.random() - 0.5) * 0.04 - 0.035; // drift toward exhaust
            p.vz = (Math.random() - 0.5) * 0.04;
            p.maxLife = 1.0 + Math.random() * 1.1;
            p.swirlAngle = Math.random() * Math.PI * 2;
            p.swirlSpeed = (Math.random() - 0.5) * 3.8;
            p.swirlRadius = 0.012 + Math.random() * 0.024;
          } else {
            // Dormant off-screen
            pArr[i * 3 + 1] = -10;
            continue;
          }
        }

        // Upward buoyant thermal convection path
        p.swirlAngle += p.swirlSpeed * dt;
        const currentY = p.life * (p.vy * p.maxLife);
        const radiusExp = p.swirlRadius + p.life * 0.04;
        const currentX = p.initialX + p.vx * (p.life * p.maxLife) + Math.cos(p.swirlAngle) * radiusExp;
        const currentZ = p.initialZ + p.vz * (p.life * p.maxLife) + Math.sin(p.swirlAngle) * radiusExp;

        pArr[i * 3 + 0] = currentX;
        pArr[i * 3 + 1] = currentY;
        pArr[i * 3 + 2] = currentZ;

        // Dynamic thermal color dissipation shift:
        // Core begins warm amber/pure white and fades into frosty electric cyan / cryogenic azure
        const progress = p.life;
        const alpha = Math.sin(progress * Math.PI) * dissipationIntensity;

        if (isHighHeat) {
          // Shedding heavy heat: amber/white core -> bright cyan -> deep blue
          cArr[i * 3 + 0] = THREE.MathUtils.lerp(1.0, 0.0, progress) * alpha;
          cArr[i * 3 + 1] = THREE.MathUtils.lerp(0.85, 0.9, progress) * alpha;
          cArr[i * 3 + 2] = THREE.MathUtils.lerp(0.5, 1.0, progress) * alpha;
        } else {
          // Standard cool dissipation: pure frosty cyan mist
          cArr[i * 3 + 0] = THREE.MathUtils.lerp(0.4, 0.0, progress) * alpha;
          cArr[i * 3 + 1] = THREE.MathUtils.lerp(1.0, 0.95, progress) * alpha;
          cArr[i * 3 + 2] = THREE.MathUtils.lerp(1.0, 1.0, progress) * alpha;
        }
      }

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;

      // Radiant thermal dissipation wave ring directly above CPU socket
      const ringCycle = (Date.now() * 0.0028) % 1.0;
      cpuDissipationRing.scale.set(0.7 + ringCycle * 1.6, 0.7 + ringCycle * 1.6, 1);
      ringMat.opacity = dissipationIntensity * (1.0 - ringCycle) * 0.65;

      // Soft thermal dissipation light above CPU
      cpuDissipationLight.intensity = dissipationIntensity * 2.5;
      cpuDissipationLight.color.setHex(currentIsFlushing ? 0x66ffff : 0x00f0ff);
    } else {
      cpuParticleMat.opacity = 0;
      ringMat.opacity = 0;
      cpuDissipationLight.intensity = 0;
    }

    renderer.render(scene, camera);

    if (isSoftwareGl) {
      afterDraw(renderTick);
    } else {
      frameId = requestAnimationFrame(renderTick);
    }
  }

  renderTick();

  // Resize Handler
  const handleResize = () => {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', handleResize);

  // 3D Raycasting Interactive Selection
  const raycaster = new THREE.Raycaster();
  const pointerPos = new THREE.Vector2();

  const handlePointerDown = (e: MouseEvent) => {
    if (!onSelectPart) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointerPos.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointerPos.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointerPos, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    for (const hit of intersects) {
      if (hit.object.userData?.part) {
        onSelectPart(hit.object.userData.part as SelectablePart);
        break;
      }
    }
  };
  renderer.domElement.addEventListener('pointerdown', handlePointerDown);

  return {
    update: (heat: number, isBSOD: boolean, isFlushing: boolean, dt: number) => {
      currentHeatVal = heat;
      currentIsFlushing = isFlushing;

      // Detect whether temperature is decreasing
      if (prevHeat >= 0) {
        const dHeat = prevHeat - heat;
        if (dHeat > 0.015 || isFlushing) {
          isTempDecreasing = true;
          heatDecreaseRate = isFlushing ? 2.5 : Math.min(2.0, dHeat * 15.0);
        } else if (dHeat < -0.01) {
          isTempDecreasing = false;
          heatDecreaseRate = 0;
        }
      }
      prevHeat = heat;

      // Dynamic fan spin speed target calculation based on thermal load
      if (isBSOD) {
        // System crashed: erratic stutter / stall
        targetFanSpinSpeed = Math.sin(Date.now() * 0.015) > 0.4 ? 1.5 : 0.0;
      } else if (isFlushing) {
        // Active thermal flush / cryo purge: screaming 95 rad/s
        targetFanSpinSpeed = 95.0;
      } else {
        const heatRatio = Math.max(0, Math.min(1.0, (heat - 25) / 75));
        targetFanSpinSpeed = 4.5 + Math.pow(heatRatio, 1.5) * 87.5;
      }

      // Color temperature calculation: Cool Green/Cyan -> Warm Amber -> Intense Crimson
      let ledColorHex = 0x00ff88;
      let emissiveIntensity = 0.65;

      if (isBSOD) {
        ledColorHex = 0x0022cc; // BSOD electric blue
        emissiveIntensity = Math.sin(Date.now() * 0.01) > 0 ? 1.2 : 0.2;
      } else if (heat >= 85.0) {
        ledColorHex = 0xff0044; // Thermal surge red
        emissiveIntensity = 1.4 + Math.sin(Date.now() * 0.025) * 0.6; // High-frequency pulsing surge glow
      } else if (heat >= 70.0) {
        ledColorHex = 0xff6600; // Warning amber-orange
        emissiveIntensity = 0.95;
      } else if (heat >= 50.0) {
        ledColorHex = 0x00e5ff; // Active cyan
        emissiveIntensity = 0.75;
      }

      fanBladeMat.color.setHex(ledColorHex);
      fanBladeMat.emissive.setHex(ledColorHex);
      fanBladeMat.emissiveIntensity = emissiveIntensity;

      fanRingMat.color.setHex(ledColorHex);
      fanRingMat.emissive.setHex(ledColorHex);
      fanRingMat.emissiveIntensity = emissiveIntensity * 1.2;

      fanBlurMat.color.setHex(ledColorHex);

      fanInternalLight.color.setHex(ledColorHex);
      fanInternalLight.intensity = isBSOD ? 0.8 : 1.2 + (heat / 100) * 3.2;

      coolantMat.color.setHex(ledColorHex);
      coolantMat.emissive.setHex(ledColorHex);
      coolantMat.emissiveIntensity = emissiveIntensity;

      chassisLedLight.color.setHex(ledColorHex);
      chassisLedLight.intensity = isBSOD ? 1.0 : 1.5 + ((heat - 25) / 75) * 3.5;

      // RAM sticks LED dance
      ramMats.forEach((mat, idx) => {
        const blink = Math.sin(Date.now() * 0.015 + idx * 1.5) > 0.1;
        mat.emissiveIntensity = blink ? 0.9 : 0.2;
      });

      // CRT screen mesh color
      if (isBSOD) {
        screenMat.color.setHex(0x001199);
      } else if (heat >= 85.0) {
        screenMat.color.setHex(0x1a0505);
      } else {
        screenMat.color.setHex(0x04180d);
      }

      // Particles emission if heat > 80°C or BSOD
      if (heat > 80.0 || isBSOD) {
        particleMat.opacity = isBSOD ? 0.9 : Math.min(0.8, (heat - 80) / 20);
        particleMat.color.setHex(isBSOD ? 0x0088ff : 0xff3300);

        const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
        const posArr = posAttr.array as Float32Array;

        for (let i = 0; i < particleCount; i++) {
          posArr[i * 3 + 1] += particleVels[i].y * dt;
          posArr[i * 3 + 0] += particleVels[i].x * dt;
          posArr[i * 3 + 2] += particleVels[i].z * dt;

          if (posArr[i * 3 + 1] > 2.2) {
            posArr[i * 3 + 1] = 1.35;
            posArr[i * 3 + 0] = 1.2 + (Math.random() - 0.5) * 0.3;
            posArr[i * 3 + 2] = 0.2 + (Math.random() - 0.5) * 0.3;
          }
        }
        posAttr.needsUpdate = true;
      } else {
        particleMat.opacity = 0;
      }
    },

    setCameraPreset: (preset: 'monitor' | 'desk' | 'motherboard') => {
      targetCamPos.copy(cameraPresets[preset].pos);
      targetLookAt.copy(cameraPresets[preset].target);
    },

    triggerPressVisual: (isSurge?: boolean) => {
      keyPressDip = 0.022;
      keypressAnimProgress = 0;
      sparkLife = 1.0;

      // Reset and propel kinetic spark particles
      const posAttr = sparkGeo.attributes.position as THREE.BufferAttribute;
      const posArr = posAttr.array as Float32Array;
      for (let s = 0; s < sparkCount; s++) {
        posArr[s * 3 + 0] = (Math.random() - 0.5) * 0.28;
        posArr[s * 3 + 1] = 0.035;
        posArr[s * 3 + 2] = 0.12 + (Math.random() - 0.5) * 0.04;
        sparkVels[s].set(
          (Math.random() - 0.5) * 0.24,
          0.38 + Math.random() * 0.45,
          (Math.random() - 0.5) * 0.22
        );
      }
      posAttr.needsUpdate = true;

      // Distinct visual palette when in Thermal Surge vs Normal operation
      if (isSurge) {
        keyboardLight.color.setHex(0xff1144);
        keyboardLight.intensity = 4.2;
        shockwaveMat.color.setHex(0xff3366);
        auraMat.color.setHex(0xff5577);
        gridOverlayMat.color.setHex(0xff1144);
        sparkMat.color.setHex(0xffaa00);
        spacebarMat.emissive.setHex(0xff1144);
        spacebarMat.emissiveIntensity = 2.8;
        keycapMat.emissiveIntensity = 1.6;
      } else {
        keyboardLight.color.setHex(0x00f0ff);
        keyboardLight.intensity = 2.8;
        shockwaveMat.color.setHex(0x00ffff);
        auraMat.color.setHex(0x00e5ff);
        gridOverlayMat.color.setHex(0x00e5ff);
        sparkMat.color.setHex(0x00ffff);
        spacebarMat.emissive.setHex(0x00f0ff);
        spacebarMat.emissiveIntensity = 2.2;
        keycapMat.emissiveIntensity = 1.2;
      }
    },

    triggerVentVisual: () => {
      // Immediate high-velocity cryogenic thermal dissipation blast directly above CPU
      isTempDecreasing = true;
      dissipationIntensity = 1.0;
      heatDecreaseRate = 3.0;
      targetFanSpinSpeed = 95.0;
      currentFanSpinSpeed = 95.0;

      for (let i = 0; i < cpuParticleCount; i++) {
        const p = cpuParticleStates[i];
        p.life = Math.random() * 0.2;
        p.vy = 0.45 + Math.random() * 0.45;
      }

      particleMat.color.setHex(0x66ffff);
      particleMat.opacity = 1.0;
    },

    dispose: () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      if (frameId) {
        cancelAnimationFrame(frameId);
        clearTimeout(frameId);
      }
      cpuIHSGeo.dispose();
      cpuIHSMat.dispose();
      coldplateGeo.dispose();
      coldplateMat.dispose();
      heatpipeGeo.dispose();
      heatpipeMat.dispose();
      coolerBlockGeo.dispose();
      coolerMat.dispose();
      shroudFrameGeo.dispose();
      shroudMat.dispose();
      innerBoreGeo.dispose();
      innerBoreMat.dispose();
      damperGeo.dispose();
      damperMat.dispose();
      screwGeo.dispose();
      screwMat.dispose();
      strutGeo.dispose();
      strutMat.dispose();
      fanRingGeo.dispose();
      fanRingMat.dispose();
      fanHubGeo.dispose();
      fanBladeMat.dispose();
      hubCapGeo.dispose();
      hubCapMat.dispose();
      bladeGeo.dispose();
      fanBlurGeo.dispose();
      fanBlurMat.dispose();
      heatVaporTex.dispose();
      cpuParticleGeo.dispose();
      cpuParticleMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      shockwaveTex.dispose();
      shockwaveGeo.dispose();
      shockwaveMat.dispose();
      auraGeo.dispose();
      auraMat.dispose();
      gridOverlayGeo.dispose();
      gridOverlayMat.dispose();
      sparkGeo.dispose();
      sparkMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    },
  };
}

/**
 * Fallback 2D Canvas Battlestation Visualizer.
 * Renders an interactive retro cyber terminal with animated motherboard schematic,
 * dynamic CPU heat dissipation particles, active cooling fluid/fan, and tactile keyboard.
 */
function createFallback2DScene(
  container: HTMLDivElement,
  onSelectPart?: (part: SelectablePart) => void
): SceneController {
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d')!;
  let animId = 0;

  let currentHeat = 25.0;
  let prevHeat = 25.0;
  let isBSOD = false;
  let isFlushing = false;
  let isTempDecreasing = false;
  let dissipationIntensity = 0.0;
  let cameraPreset: 'monitor' | 'desk' | 'motherboard' = 'desk';
  let spacebarDip = 0;
  let shockwaveScale = 0;
  let shockwaveAlpha = 0;
  let fanAngle2D = 0;

  // 2D CPU Heat Dissipation Particles
  interface Particle2D {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    life: number;
    maxLife: number;
    swirl: number;
  }
  const cpuParticles2D: Particle2D[] = [];
  const maxCpuParticles = 48;

  function resizeCanvas() {
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = (rect.width || window.innerWidth) * dpr;
    canvas.height = (rect.height || window.innerHeight) * dpr;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function draw() {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Cyber background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#0a0d14');
    bgGrad.addColorStop(1, '#05070a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle Grid
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = Math.max(30, Math.floor(w / 40));
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Battlestation Layout Dimensions
    const centerX = w * 0.5;
    const centerY = h * 0.45;

    // 1. Motherboard Chassis Section (Right side in desk view)
    const moboX = centerX + w * 0.08;
    const moboY = centerY - h * 0.22;
    const moboW = w * 0.36;
    const moboH = h * 0.46;

    ctx.fillStyle = '#0f1715';
    ctx.strokeStyle = isBSOD ? '#0033cc' : currentHeat > 85 ? '#ff2244' : '#00e5ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(moboX, moboY, moboW, moboH, 8);
    ctx.fill();
    ctx.stroke();

    // Motherboard Header
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('BATTLESTATION PCB // ARCH_V2', moboX + 16, moboY + 24);

    // CPU Socket & Cooler Block
    const cpuX = moboX + moboW * 0.32;
    const cpuY = moboY + moboH * 0.42;
    const cpuSize = Math.min(moboW * 0.35, moboH * 0.35);

    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = isBSOD ? '#0088ff' : currentHeat > 85 ? '#ff1144' : '#00ff88';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(cpuX - cpuSize * 0.5, cpuY - cpuSize * 0.5, cpuSize, cpuSize, 6);
    ctx.fill();
    ctx.stroke();

    // -------------------------------------------------------------
    // 2D ANIMATED COOLING FAN MODEL ON TOP OF CPU
    // -------------------------------------------------------------
    const heatRatio2D = Math.max(0, Math.min(1.0, (currentHeat - 25) / 75));
    const fanSpeed2D = isBSOD
      ? Math.sin(Date.now() * 0.01) > 0 ? 1.0 : 0.0
      : isFlushing ? 32.0 : 3.5 + Math.pow(heatRatio2D, 1.5) * 28.0;
    fanAngle2D += fanSpeed2D * 0.016;

    const fanColor2D = isBSOD
      ? '#0044ff'
      : currentHeat > 85
      ? '#ff1144'
      : currentHeat > 70
      ? '#ff6600'
      : currentHeat > 50
      ? '#00e5ff'
      : '#00ff88';

    // Circular Fan Bezel / ARGB Halo Ring
    const fanRadius = cpuSize * 0.44;
    ctx.strokeStyle = fanColor2D;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cpuX, cpuY, fanRadius, 0, Math.PI * 2);
    ctx.stroke();

    // High-speed motion blur arc lines
    if (fanSpeed2D > 12) {
      const blurAlpha = Math.min(0.4, (fanSpeed2D - 12) / 25);
      ctx.strokeStyle = fanColor2D;
      ctx.globalAlpha = blurAlpha;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cpuX, cpuY, fanRadius * 0.88, fanAngle2D * 1.5, fanAngle2D * 1.5 + Math.PI);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    // 8 Rotating Curved Fan Blades
    ctx.save();
    ctx.translate(cpuX, cpuY);
    ctx.rotate(fanAngle2D);
    ctx.fillStyle = fanColor2D;
    for (let b = 0; b < 8; b++) {
      ctx.rotate(Math.PI / 4);
      ctx.beginPath();
      ctx.moveTo(fanRadius * 0.18, -3);
      ctx.bezierCurveTo(fanRadius * 0.5, -8, fanRadius * 0.8, -11, fanRadius * 0.94, -2);
      ctx.bezierCurveTo(fanRadius * 0.72, 4, fanRadius * 0.42, 6, fanRadius * 0.18, 3);
      ctx.closePath();
      ctx.globalAlpha = 0.65;
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Center Bearing Hub
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, fanRadius * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = fanColor2D;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // CPU Semi-translucent Overlay Badge & Live Temperature
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    ctx.roundRect(cpuX - cpuSize * 0.42, cpuY - 14, cpuSize * 0.84, 28, 4);
    ctx.fill();
    ctx.strokeStyle = fanColor2D;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(10, Math.floor(cpuSize * 0.12))}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('CPU FAN', cpuX, cpuY - 3);
    ctx.fillStyle = currentHeat > 85 ? '#ff3366' : currentHeat > 70 ? '#ffaa00' : '#00ff88';
    ctx.font = `bold ${Math.max(12, Math.floor(cpuSize * 0.16))}px monospace`;
    ctx.fillText(`${currentHeat.toFixed(1)}°C`, cpuX, cpuY + 10);

    // -------------------------------------------------------------
    // DYNAMIC HEAT DISSIPATION PARTICLES DIRECTLY ABOVE CPU MODEL
    // -------------------------------------------------------------
    if (isTempDecreasing) {
      dissipationIntensity = Math.min(1.0, dissipationIntensity + 0.08);
      // Spawn new 2D dissipation vapor particles
      if (cpuParticles2D.length < maxCpuParticles) {
        cpuParticles2D.push({
          x: cpuX + (Math.random() - 0.5) * (cpuSize * 0.7),
          y: cpuY - cpuSize * 0.5, // Directly at top of CPU heatsink
          vx: (Math.random() - 0.5) * 1.5 - 0.5, // gentle drift toward exhaust
          vy: -(1.8 + Math.random() * 2.2 * (isFlushing ? 1.8 : 1.0)),
          radius: 4 + Math.random() * 8,
          life: 0,
          maxLife: 40 + Math.random() * 30,
          swirl: (Math.random() - 0.5) * 0.08,
        });
      }
    } else {
      dissipationIntensity = Math.max(0, dissipationIntensity - 0.03);
    }

    // Render & Update CPU Dissipation Particles
    for (let pIdx = cpuParticles2D.length - 1; pIdx >= 0; pIdx--) {
      const p = cpuParticles2D[pIdx];
      p.life++;
      p.x += p.vx + Math.sin(p.life * p.swirl) * 0.8;
      p.y += p.vy;
      p.radius += 0.12;

      const progress = p.life / p.maxLife;
      const alpha = Math.sin(progress * Math.PI) * dissipationIntensity * 0.75;

      if (progress >= 1.0) {
        cpuParticles2D.splice(pIdx, 1);
        continue;
      }

      const grad = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, p.radius);
      grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      grad.addColorStop(0.35, `rgba(0, 240, 255, ${alpha * 0.8})`);
      grad.addColorStop(1, 'rgba(0, 160, 255, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Convective Dissipation Wave Rings directly above CPU
    if (dissipationIntensity > 0.05) {
      const wavePhase = (Date.now() * 0.003) % 1.0;
      const ringRadius = cpuSize * 0.35 + wavePhase * cpuSize * 0.45;
      const ringY = cpuY - cpuSize * 0.5 - wavePhase * 24;
      ctx.strokeStyle = `rgba(0, 240, 255, ${(1.0 - wavePhase) * dissipationIntensity * 0.8})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cpuX, ringY, ringRadius, ringRadius * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = `rgba(0, 240, 255, ${dissipationIntensity * 0.8})`;
      ctx.font = 'bold 11px monospace';
      ctx.fillText('▲ COOLING PLUME ACTIVE ▲', cpuX, cpuY - cpuSize * 0.5 - 32);
    }

    // RAM Slots
    const ramX = cpuX + cpuSize * 0.75;
    const ramY = cpuY - cpuSize * 0.4;
    const ramW = 12;
    const ramH = cpuSize * 0.85;
    for (let r = 0; r < 2; r++) {
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(ramX + r * 18, ramY, ramW, ramH);
      ctx.fillStyle = Math.sin(Date.now() * 0.01 + r) > 0 ? '#00f0ff' : '#0284c7';
      ctx.fillRect(ramX + r * 18, ramY, ramW, 6);
    }

    // Cooling Pump & Fluid Flow
    const pumpX = moboX + moboW * 0.78;
    const pumpY = moboY + moboH * 0.72;
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(pumpX, pumpY, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#00ff88';
    ctx.font = '9px monospace';
    ctx.fillText('PUMP', pumpX, pumpY + 3);

    // 2. Monitor Housing (Left side)
    const monX = centerX - w * 0.44;
    const monY = centerY - h * 0.22;
    const monW = w * 0.48;
    const monH = h * 0.46;

    ctx.fillStyle = '#111827';
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(monX, monY, monW, monH, 8);
    ctx.fill();
    ctx.stroke();

    // Screen Glass
    ctx.fillStyle = isBSOD ? '#001a88' : '#021810';
    ctx.beginPath();
    ctx.roundRect(monX + 16, monY + 16, monW - 32, monH - 32, 6);
    ctx.fill();

    // Terminal Text on Screen
    ctx.textAlign = 'left';
    ctx.fillStyle = isBSOD ? '#ffffff' : '#00ff88';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(isBSOD ? 'CRITICAL SYSTEM HALT [BSOD]' : 'DEPTH_OS // KERNEL RUNNING', monX + 32, monY + 48);

    ctx.fillStyle = isBSOD ? '#a5b4fc' : '#38bdf8';
    ctx.font = '12px monospace';
    ctx.fillText(`PRESET: ${cameraPreset.toUpperCase()}`, monX + 32, monY + 76);
    ctx.fillText(`CORE TEMP: ${currentHeat.toFixed(1)}°C`, monX + 32, monY + 98);
    ctx.fillText(isFlushing ? 'THERMAL FLUSH IN PROGRESS...' : isTempDecreasing ? 'HEAT DISSIPATION CONVECTION ACTIVE' : 'SYSTEM NOMINAL', monX + 32, monY + 120);

    // 3. Mechanical Cyber Keyboard at bottom
    const kbX = centerX - w * 0.32;
    const kbY = h * 0.76;
    const kbW = w * 0.64;
    const kbH = h * 0.18;

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(kbX, kbY, kbW, kbH, 8);
    ctx.fill();
    ctx.stroke();

    // Spacebar
    const sbW = kbW * 0.36;
    const sbH = 26;
    const sbX = kbX + (kbW - sbW) * 0.5;
    const sbY = kbY + kbH * 0.55 + spacebarDip;

    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.roundRect(sbX, sbY, sbW, sbH, 4);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#090d16';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('SPACE // PROCESS CLICK', sbX + sbW * 0.5, sbY + 17);

    // Spacebar bounce decay
    if (spacebarDip > 0) {
      spacebarDip = Math.max(0, spacebarDip - 1.2);
    }

    // Shockwave pulse
    if (shockwaveAlpha > 0.01) {
      shockwaveScale += 3.5;
      shockwaveAlpha = Math.max(0, shockwaveAlpha - 0.04);
      ctx.strokeStyle = `rgba(0, 240, 255, ${shockwaveAlpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(sbX + sbW * 0.5, sbY + sbH * 0.5, shockwaveScale, shockwaveScale * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    animId = requestAnimationFrame(draw);
  }

  animId = requestAnimationFrame(draw);

  // Click Raycast Equivalent on 2D Canvas
  const handlePointerDown = (e: MouseEvent) => {
    if (!onSelectPart) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const w = canvas.width;
    const h = canvas.height;
    const centerX = w * 0.5;
    const centerY = h * 0.45;

    // Check Keyboard
    if (y > h * 0.7) {
      onSelectPart('keyboard');
      return;
    }

    // Check Motherboard Components
    const moboX = centerX + w * 0.08;
    const moboY = centerY - h * 0.22;
    const moboW = w * 0.36;
    const moboH = h * 0.46;

    if (x >= moboX && x <= moboX + moboW && y >= moboY && y <= moboY + moboH) {
      const cpuX = moboX + moboW * 0.32;
      const cpuY = moboY + moboH * 0.42;
      const cpuSize = Math.min(moboW * 0.35, moboH * 0.35);

      if (Math.abs(x - cpuX) < cpuSize && Math.abs(y - cpuY) < cpuSize) {
        onSelectPart('cpu');
        return;
      }
      if (x > cpuX + cpuSize * 0.5) {
        onSelectPart('ram');
        return;
      }
      onSelectPart('cooling');
      return;
    }

    // Check Monitor
    const monX = centerX - w * 0.44;
    const monY = centerY - h * 0.22;
    const monW = w * 0.48;
    const monH = h * 0.46;
    if (x >= monX && x <= monX + monW && y >= monY && y <= monY + monH) {
      onSelectPart('monitor');
    }
  };

  canvas.addEventListener('pointerdown', handlePointerDown);

  return {
    update: (heat: number, bsod: boolean, flushing: boolean) => {
      currentHeat = heat;
      isBSOD = bsod;
      isFlushing = flushing;

      const dHeat = prevHeat - heat;
      if (dHeat > 0.015 || flushing) {
        isTempDecreasing = true;
      } else if (dHeat < -0.01) {
        isTempDecreasing = false;
      }
      prevHeat = heat;
    },
    setCameraPreset: (preset: 'monitor' | 'desk' | 'motherboard') => {
      cameraPreset = preset;
    },
    triggerPressVisual: () => {
      spacebarDip = 6;
      shockwaveScale = 20;
      shockwaveAlpha = 1.0;
    },
    triggerVentVisual: () => {
      isTempDecreasing = true;
      dissipationIntensity = 1.0;
    },
    dispose: () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      if (animId) cancelAnimationFrame(animId);
      if (canvas.parentElement) {
        canvas.parentElement.removeChild(canvas);
      }
    },
  };
}
