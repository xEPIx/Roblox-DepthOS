import * as THREE from 'three';

/**
 * Procedural Canvas-based textures for the authentic Roblox aesthetic
 */

export function createStudTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Neutral grey plastic base
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 128, 128);

  // Subtle grid border
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, 128, 128);

  // 2x2 studs per unit tile
  const studPositions = [
    [32, 32],
    [96, 32],
    [32, 96],
    [96, 96],
  ];

  const radius = 18;

  studPositions.forEach(([x, y]) => {
    // Drop shadow
    ctx.beginPath();
    ctx.arc(x, y + 2, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
    ctx.fill();

    // Stud outer ring
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#f0f0f0';
    ctx.fill();

    // Top highlight (inner bevel)
    ctx.beginPath();
    ctx.arc(x - 2, y - 2, radius - 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fill();

    // Stud center
    ctx.beginPath();
    ctx.arc(x, y, radius - 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Outer rim stroke
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createFaceTexture(faceType: 'smile' | 'chill' | 'determined' | 'derp' | 'cool'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 256);

  ctx.fillStyle = '#111111';
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (faceType === 'smile') {
    // Classic Roblox Smile
    // Eyes: Two solid black oval dots
    ctx.beginPath();
    ctx.ellipse(82, 95, 14, 20, 0, 0, Math.PI * 2);
    ctx.ellipse(174, 95, 14, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wide simple curved smile
    ctx.beginPath();
    ctx.arc(128, 110, 52, 0.25 * Math.PI, 0.75 * Math.PI);
    ctx.stroke();
  } else if (faceType === 'chill') {
    // Chill face: relaxed eyes and sweet smile
    ctx.beginPath();
    // Left eye curve
    ctx.arc(82, 100, 16, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    // Right eye curve
    ctx.beginPath();
    ctx.arc(174, 100, 16, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    // Subtle smile
    ctx.beginPath();
    ctx.arc(128, 125, 36, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();

    // Pink blush cheeks
    ctx.fillStyle = 'rgba(255, 100, 100, 0.35)';
    ctx.beginPath();
    ctx.arc(60, 125, 14, 0, Math.PI * 2);
    ctx.arc(196, 125, 14, 0, Math.PI * 2);
    ctx.fill();
  } else if (faceType === 'determined') {
    // Determined: angled eyebrows and grit teeth
    // Left eyebrow
    ctx.beginPath();
    ctx.moveTo(60, 75);
    ctx.lineTo(105, 92);
    ctx.stroke();
    // Right eyebrow
    ctx.beginPath();
    ctx.moveTo(196, 75);
    ctx.lineTo(151, 92);
    ctx.stroke();

    // Eyes
    ctx.beginPath();
    ctx.ellipse(82, 110, 12, 15, 0, 0, Math.PI * 2);
    ctx.ellipse(174, 110, 12, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Grin with teeth
    ctx.beginPath();
    ctx.roundRect(88, 145, 80, 24, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.stroke();
    // Teeth line
    ctx.beginPath();
    ctx.moveTo(88, 157);
    ctx.lineTo(168, 157);
    ctx.lineWidth = 4;
    ctx.stroke();
  } else if (faceType === 'derp') {
    // Derp face: wonky big eyes + open mouth
    ctx.beginPath();
    ctx.arc(75, 95, 22, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(78, 98, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#111111';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(175, 90, 28, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(170, 85, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#111111';
    ctx.fill();

    // Open mouth with tongue
    ctx.beginPath();
    ctx.arc(128, 155, 28, 0, Math.PI);
    ctx.fillStyle = '#8b0000';
    ctx.fill();
    ctx.stroke();

    // Tongue
    ctx.beginPath();
    ctx.arc(136, 165, 14, 0, Math.PI);
    ctx.fillStyle = '#ff6b81';
    ctx.fill();
  } else if (faceType === 'cool') {
    // Sunglasses face
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.roundRect(50, 75, 65, 45, [4, 4, 14, 14]);
    ctx.roundRect(141, 75, 65, 45, [4, 4, 14, 14]);
    ctx.fill();
    // Bridge
    ctx.fillRect(112, 85, 32, 10);

    // Sunglass glint
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(60, 85);
    ctx.lineTo(95, 85);
    ctx.moveTo(151, 85);
    ctx.lineTo(186, 85);
    ctx.stroke();

    // Smug side grin
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(140, 140, 36, 0.1 * Math.PI, 0.45 * Math.PI);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createCheckpointTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 256, 256);

  // Concentric checkpoint rings
  const center = 128;
  const rings = [
    { r: 110, fill: '#00e676' },
    { r: 85, fill: '#ffffff' },
    { r: 60, fill: '#00e676' },
    { r: 35, fill: '#ffffff' },
  ];

  rings.forEach((ring) => {
    ctx.beginPath();
    ctx.arc(center, center, ring.r, 0, Math.PI * 2);
    ctx.fillStyle = ring.fill;
    ctx.fill();
  });

  // Star in the middle
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  const spikes = 5;
  const outerRadius = 24;
  const innerRadius = 11;
  let rot = (Math.PI / 2) * 3;
  let x = center;
  let y = center;
  const step = Math.PI / spikes;

  ctx.moveTo(center, center - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = center + Math.cos(rot) * outerRadius;
    y = center + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = center + Math.cos(rot) * innerRadius;
    y = center + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(center, center - outerRadius);
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createBloxyColaTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Red soda can background
  ctx.fillStyle = '#d32f2f';
  ctx.fillRect(0, 0, 256, 256);

  // White dynamic wave
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(0, 160);
  ctx.bezierCurveTo(80, 100, 160, 220, 256, 120);
  ctx.lineTo(256, 180);
  ctx.bezierCurveTo(160, 260, 80, 150, 0, 210);
  ctx.closePath();
  ctx.fill();

  // "BLOXY COLA" bold text
  ctx.font = 'bold 36px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText('BLOXY', 128, 90);
  ctx.font = 'bold 28px sans-serif';
  ctx.fillStyle = '#ffd54f';
  ctx.fillText('COLA', 128, 130);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createKeypressShockwaveTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 256, 256);

  const center = 128;
  const grad = ctx.createRadialGradient(center, center, 10, center, center, 120);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  grad.addColorStop(0.25, 'rgba(0, 240, 255, 0.15)');
  grad.addColorStop(0.65, 'rgba(0, 240, 255, 0.85)');
  grad.addColorStop(0.8, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.9, 'rgba(0, 240, 255, 0.9)');
  grad.addColorStop(1, 'rgba(0, 240, 255, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(center, center, 120, 0, Math.PI * 2);
  ctx.fill();

  // Subtle outer edge stroke
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(center, center, 96, 0, Math.PI * 2);
  ctx.stroke();

  // Inner accent ring
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(center, center, 72, 0, Math.PI * 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createHeatVaporTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 128, 128);

  const center = 64;
  const grad = ctx.createRadialGradient(center, center, 2, center, center, 60);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  grad.addColorStop(0.2, 'rgba(180, 245, 255, 0.85)');
  grad.addColorStop(0.5, 'rgba(70, 210, 255, 0.4)');
  grad.addColorStop(0.8, 'rgba(0, 160, 255, 0.12)');
  grad.addColorStop(1, 'rgba(0, 100, 255, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(center, center, 60, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

