import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export type SelectablePart = 'cpu' | 'ram' | 'cooling' | 'monitor' | 'keyboard';

export interface SceneController {
  update: (heat: number, isBSOD: boolean, isFlushing: boolean, dt: number) => void;
  setCameraPreset: (preset: 'monitor' | 'desk' | 'motherboard') => void;
  triggerPressVisual: () => void;
  triggerVentVisual: () => void;
  dispose: () => void;
}

export function createDepthOSThreeScene(
  container: HTMLDivElement,
  onSelectPart?: (part: SelectablePart) => void
): SceneController {
  // 1. Software WebGL Guard
  const isSoftwareGl = (() => {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  })();

  // 2. Renderer Setup
  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
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

  let currentPreset: 'monitor' | 'desk' | 'motherboard' = 'desk';
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

  // CRT Monitor Housing (Composite 5 parts)
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

  // CPU Cooler Heat Sink Block
  const coolerBlockGeo = new THREE.BoxGeometry(0.2, 0.28, 0.28);
  const coolerMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.85,
    roughness: 0.2,
  });
  const coolerBlock = new THREE.Mesh(coolerBlockGeo, coolerMat);
  coolerBlock.position.set(0.24, 0.65, 0);
  coolerBlock.userData = { part: 'cpu' };
  pcGroup.add(coolerBlock);

  // CPU Fan Hub & Blades
  const fanGroup = new THREE.Group();
  fanGroup.position.set(0.13, 0.65, 0);

  const fanHubGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 16);
  const fanBladeMat = new THREE.MeshStandardMaterial({
    color: 0x00ff88,
    emissive: 0x00ff88,
    emissiveIntensity: 0.6,
    roughness: 0.3,
  });
  const fanHub = new THREE.Mesh(fanHubGeo, fanBladeMat);
  fanHub.rotation.z = Math.PI / 2;
  fanHub.userData = { part: 'cooling' };
  fanGroup.add(fanHub);

  // 7 Fan Blades
  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2;
    const bladeGeo = new THREE.BoxGeometry(0.01, 0.08, 0.025);
    const blade = new THREE.Mesh(bladeGeo, fanBladeMat);
    blade.position.set(0, Math.cos(angle) * 0.07, Math.sin(angle) * 0.07);
    blade.rotation.x = angle + 0.35;
    blade.userData = { part: 'cooling' };
    fanGroup.add(blade);
  }
  pcGroup.add(fanGroup);

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

  scene.add(pcGroup);

  // 8. Mechanical Keyboard on desk in front of monitor
  const kbGroup = new THREE.Group();
  kbGroup.position.set(-0.3, 0.77, 0.45);

  const kbBaseGeo = new THREE.BoxGeometry(1.1, 0.04, 0.38);
  const kbBaseMat = new THREE.MeshStandardMaterial({ color: 0x1f2228, roughness: 0.5, metalness: 0.5 });
  const kbBase = new THREE.Mesh(kbBaseGeo, kbBaseMat);
  kbBase.userData = { part: 'keyboard' };
  kbGroup.add(kbBase);

  // Spacebar (Interactive trigger)
  const spacebarGeo = new THREE.BoxGeometry(0.28, 0.025, 0.05);
  const keyMat = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: 0x00e5ff,
    emissiveIntensity: 0.4,
  });
  const spacebar = new THREE.Mesh(spacebarGeo, keyMat);
  spacebar.position.set(0, 0.03, 0.12);
  spacebar.userData = { part: 'keyboard' };
  kbGroup.add(spacebar);

  scene.add(kbGroup);

  // 9. Particle System for Heat Steam & Overheat Sparks
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

  // 10. Animation & Render Loop
  let frameId = 0;
  let keyPressDip = 0;

  function afterDraw(cb: () => void) {
    const gl = renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        frameId = window.setTimeout(poll, 5);
      } else {
        gl.deleteSync(sync);
        frameId = window.setTimeout(cb, 80);
      }
    };
    frameId = window.setTimeout(poll, 5);
  }

  function renderTick() {
    // Camera smooth damping
    camera.position.lerp(targetCamPos, 0.06);
    currentLookAt.lerp(targetLookAt, 0.06);
    camera.lookAt(currentLookAt);

    // Spacebar bounce return
    if (keyPressDip > 0) {
      keyPressDip = Math.max(0, keyPressDip - 0.005);
      spacebar.position.y = 0.03 - keyPressDip;
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
      // Fan spin speed accelerates with heat
      const spinSpeed = 4 + ((heat - 25) / 75) * 45;
      fanGroup.rotation.x += spinSpeed * dt;

      // Color temperature calculation: Cool Green/Cyan -> Warm Amber -> Intense Crimson
      let ledColorHex = 0x00ff88;
      let emissiveIntensity = 0.6;

      if (isBSOD) {
        ledColorHex = 0x0022cc; // BSOD electric blue
        emissiveIntensity = Math.sin(Date.now() * 0.01) > 0 ? 1.0 : 0.2;
      } else if (heat >= 85.0) {
        ledColorHex = 0xff0044; // Thermal surge red
        emissiveIntensity = 1.2 + Math.sin(Date.now() * 0.02) * 0.6; // Pulsing surge glow
      } else if (heat >= 70.0) {
        ledColorHex = 0xff9900; // Warning amber
        emissiveIntensity = 0.8;
      }

      fanBladeMat.color.setHex(ledColorHex);
      fanBladeMat.emissive.setHex(ledColorHex);
      fanBladeMat.emissiveIntensity = emissiveIntensity;

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
      currentPreset = preset;
      targetCamPos.copy(cameraPresets[preset].pos);
      targetLookAt.copy(cameraPresets[preset].target);
    },

    triggerPressVisual: () => {
      keyPressDip = 0.018;
    },

    triggerVentVisual: () => {
      // Big blast of cool particles
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
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    },
  };
}
