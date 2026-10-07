// Chronically On Web ($COW) — procedural 3D cow built with Three.js, modelled after the $COW logo.
// Fully animated: breathing, idle bob, cursor tracking, blinking, and emotes
// (wave, wink, nod, shake, dance, type, jump, spin, happy, earflick, lookaround, sleepy).
import * as THREE from 'three';

const COLORS = {
  cream: '#f6ead2',
  brown: '#4b3327',
  pink: 0xf1a4ac,
  pinkDark: 0xe38d98,
  nostril: 0xc7707e,
  mouth: 0xb85b6a,
  horn: 0xe9d9a3,
  hoof: 0x3b2a20,
  laptop: 0xa8aec8,
  laptopDark: 0x6c7390,
  key: 0x2c3345,
  eyeWhite: 0xffffff,
  iris: 0x7b92b4,
  irisRim: 0x44576f,
  eyeRing: 0x5a4336,
  pupil: 0x101418,
};

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function blob(ctx, cx, cy, r, rnd, soft = 0.5) {
  const n = 9 + Math.floor(rnd() * 5);
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const d = rnd() * r * soft;
    const rr = r * (0.55 + rnd() * 0.35);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    ctx.moveTo(x + rr, y);
    ctx.arc(x, y, rr, 0, Math.PI * 2);
  }
  ctx.fill();
}

// Cream fur with chocolate patches. fixed = [{u,v,r}] in UV space (v = 1 at top of the sphere/lathe).
function makeSpotTexture({ seed = 1, fixed = [], random = 0, avoid = null, W = 1024, H = 512 }) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const rnd = mulberry32(seed);
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(0, 0, W, H);
  // subtle warm shading noise on the cream
  ctx.globalAlpha = 0.025;
  for (let i = 0; i < 1600; i++) {
    ctx.fillStyle = rnd() < 0.5 ? '#c9a36a' : '#ffffff';
    const r = 6 + rnd() * 14;
    ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = COLORS.brown;
  for (const f of fixed) {
    const x = f.u * W, y = (1 - f.v) * H;
    for (const dx of [-W, 0, W]) blob(ctx, x + dx, y, f.r * W, rnd, f.soft ?? 0.5);
  }
  let count = 0, tries = 0;
  while (count < random && tries < 400) {
    tries++;
    const u = rnd(), v = 0.12 + rnd() * 0.76;
    if (avoid && avoid(u, v)) continue;
    const x = u * W, y = (1 - v) * H, r = (0.045 + rnd() * 0.06) * W;
    for (const dx of [-W, 0, W]) blob(ctx, x + dx, y, r, rnd);
    count++;
  }
  // fur speckle
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 5000; i++) {
    ctx.fillStyle = rnd() < 0.5 ? '#000' : '#fff';
    ctx.fillRect(rnd() * W, rnd() * H, 1.5, 2);
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

// fine noise used as a bump map to fake short fur
function makeFurBump() {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, S, S);
  const rnd = mulberry32(99);
  for (let i = 0; i < 26000; i++) {
    const v = 90 + Math.floor(rnd() * 80);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    const x = rnd() * S, y = rnd() * S;
    ctx.fillRect(x, y, 1.5, 3 + rnd() * 5);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 3);
  return tex;
}

function makeStickerTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#a8aec8';
  ctx.fillRect(0, 0, 256, 256);
  ctx.translate(128, 136);
  const dark = '#3b4154', light = '#dfe3ee';
  ctx.strokeStyle = dark; ctx.fillStyle = light;
  ctx.lineWidth = 10; ctx.lineJoin = 'round';
  for (const s of [-1, 1]) { // ears
    ctx.beginPath(); ctx.ellipse(s * 80, -6, 32, 19, s * 0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.fillStyle = '#c9cedd';
  for (const s of [-1, 1]) { // horns
    ctx.beginPath(); ctx.moveTo(s * 28, -60); ctx.quadraticCurveTo(s * 70, -70, s * 58, -104); ctx.quadraticCurveTo(s * 60, -66, s * 40, -52); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.fillStyle = light;
  ctx.beginPath(); ctx.ellipse(0, 0, 66, 72, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); // head
  ctx.fillStyle = dark;
  ctx.beginPath(); ctx.ellipse(34, -30, 26, 24, -0.3, 0, Math.PI * 2); ctx.fill(); // patch
  ctx.fillStyle = '#b9bfd2';
  ctx.beginPath(); ctx.ellipse(0, 32, 46, 30, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); // snout
  ctx.fillStyle = dark;
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 16, 32, 6, 9, 0, 0, Math.PI * 2); ctx.fill(); }
  for (const s of [-1, 1]) { // eyes
    ctx.fillStyle = s > 0 ? light : dark;
    ctx.beginPath(); ctx.arc(s * 28, -26, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = s > 0 ? dark : light;
    ctx.beginPath(); ctx.arc(s * 28, -26, 4, 0, Math.PI * 2); ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeScreenTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 320;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 320);
  g.addColorStop(0, '#0d1a3a'); g.addColorStop(1, '#071022');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 320);
  ctx.strokeStyle = 'rgba(80,140,255,.15)';
  for (let x = 0; x < 512; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 320); ctx.stroke(); }
  for (let y = 0; y < 320; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke(); }
  ctx.strokeStyle = '#3ef2b3'; ctx.lineWidth = 6; ctx.lineJoin = 'round';
  ctx.beginPath();
  const pts = [[30, 260], [90, 230], [150, 245], [210, 180], [270, 200], [330, 120], [390, 140], [470, 50]];
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.stroke();
  ctx.fillStyle = '#3ef2b3'; ctx.font = 'bold 44px sans-serif';
  ctx.fillText('+248%', 300, 300);
  ctx.fillStyle = '#9fc5ff'; ctx.font = 'bold 26px sans-serif';
  ctx.fillText('$COW · still online', 24, 40);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const ease = (p, k = 0.2) => {
  const a = Math.min(1, p / k), b = Math.min(1, (1 - p) / k);
  const s = (x) => x * x * (3 - 2 * x);
  return Math.min(s(a), s(b));
};
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Rest pose of the arms: right arm (viewer's left) rests on the keyboard, left arm holds the laptop from below.
const ARM_R = { x: -0.89, z: 0.58 };
const ARM_L = { x: -0.86, z: 0.0 };

const EMOTES = {
  wave: { d: 2.6, fn(p, P) { const e = ease(p, 0.18); P.armR.x = lerp(P.armR.x, -0.25, e); P.armR.z = lerp(P.armR.z, -2.45, e) + Math.sin(p * Math.PI * 7) * 0.38 * e; P.headZ += 0.16 * e; P.headY += 0.12 * e; P.mouth = lerp(P.mouth, 1.2, e); } },
  wink: { d: 1.3, fn(p, P) { const e = ease(p, 0.25); P.lidL = clamp(Math.sin(Math.PI * p) * 1.8, 0, 1); P.headZ += -0.18 * e; P.mouth = lerp(P.mouth, 1.25, e); P.armR.z += 0.3 * e; } },
  blink: { d: 0.3, fn(p, P) { const v = Math.sin(Math.PI * p); P.lidL = Math.max(P.lidL, v); P.lidR = Math.max(P.lidR, v); } },
  nod: { d: 1.3, fn(p, P) { const e = ease(p, 0.15); P.headX += Math.sin(p * Math.PI * 4) * 0.22 * e; P.mouth = lerp(P.mouth, 1.1, e); } },
  shake: { d: 1.3, fn(p, P) { const e = ease(p, 0.15); P.headY += Math.sin(p * Math.PI * 4) * 0.42 * e; P.eyeX += Math.sin(p * Math.PI * 4) * 0.2 * e; } },
  dance: { d: 3.2, fn(p, P) { const e = ease(p, 0.12); P.y += Math.abs(Math.sin(p * Math.PI * 12)) * 0.16 * e; P.rotZ += Math.sin(p * Math.PI * 6) * 0.11 * e; P.rotY += Math.sin(p * Math.PI * 3) * 0.35 * e; P.armR.z = lerp(P.armR.z, -1.8, e) + Math.sin(p * Math.PI * 6) * 0.7 * e; P.armL.z = lerp(P.armL.z, 1.8, e) - Math.sin(p * Math.PI * 6) * 0.7 * e; P.armR.x = lerp(P.armR.x, -0.6, e); P.armL.x = lerp(P.armL.x, -0.6, e); P.headZ += Math.sin(p * Math.PI * 6) * 0.22 * e; P.mouth = lerp(P.mouth, 1.3, e); P.earL += Math.sin(p * Math.PI * 12) * 0.2 * e; P.earR -= Math.sin(p * Math.PI * 12) * 0.2 * e; } },
  type: { d: 2.6, fn(p, P) { const e = ease(p, 0.15); P.armR.x += Math.sin(p * Math.PI * 18) * 0.09 * e; P.armL.x += Math.cos(p * Math.PI * 18) * 0.06 * e; P.headX += 0.28 * e; P.lidL = Math.max(P.lidL, 0.2 * e); P.lidR = Math.max(P.lidR, 0.2 * e); P.eyeY += 0.2 * e; } },
  jump: { d: 1.3, fn(p, P) { const e = ease(p, 0.2); P.y += Math.sin(Math.PI * p) * 0.95; P.bodySy *= 1 + Math.sin(Math.PI * p * 2) * 0.08; P.armR.z = lerp(P.armR.z, -2.2, e); P.armL.z = lerp(P.armL.z, 2.2, e); P.armR.x = lerp(P.armR.x, -0.3, e); P.armL.x = lerp(P.armL.x, -0.3, e); P.mouth = lerp(P.mouth, 1.3, e); P.lidL = 0; P.lidR = 0; } },
  spin: { d: 1.6, fn(p, P) { const s = p * p * (3 - 2 * p); P.rotY += Math.PI * 2 * s; P.y += Math.sin(Math.PI * p) * 0.3; P.armR.z = lerp(P.armR.z, -1.5, ease(p)); P.armL.z = lerp(P.armL.z, 1.5, ease(p)); } },
  happy: { d: 1.8, fn(p, P) { const e = ease(p, 0.2); P.lidL = Math.max(P.lidL, 0.55 * e); P.lidR = Math.max(P.lidR, 0.55 * e); P.y += Math.abs(Math.sin(p * Math.PI * 4)) * 0.12 * e; P.headZ += Math.sin(p * Math.PI * 2) * 0.2 * e; P.mouth = lerp(P.mouth, 1.4, e); P.armR.z = lerp(P.armR.z, -1.2, e); P.armL.z = lerp(P.armL.z, 1.2, e); P.armR.x = lerp(P.armR.x, -0.8, e); P.armL.x = lerp(P.armL.x, -0.8, e); } },
  earflick: { d: 0.7, fn(p, P) { P.earL += Math.sin(p * Math.PI * 2) * 0.45; } },
  lookaround: { d: 2.2, fn(p, P) { const e = ease(p, 0.2); P.headY += Math.sin(p * Math.PI * 2) * 0.55 * e; P.eyeX += Math.sin(p * Math.PI * 2) * 0.3 * e; } },
  sleepy: { d: 2.4, fn(p, P) { const e = ease(p, 0.25); P.lidL = Math.max(P.lidL, 0.75 * e); P.lidR = Math.max(P.lidR, 0.75 * e); P.headX += 0.3 * e; P.headZ += 0.15 * e; P.y -= 0.05 * e; } },
};

export const EMOTE_NAMES = Object.keys(EMOTES);

export class Cow {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.opts = Object.assign({ interactive: true, cameraZ: 8.8, cameraY: 0.3, autoIdle: true, onEmote: null, onClick: null, scale: 1, lookStrength: 1 }, opts);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    this.camera.position.set(0, this.opts.cameraY, this.opts.cameraZ);
    this.camera.lookAt(0, 0.15, 0);

    this.look = { x: 0, y: 0 };
    this.lookTarget = { x: 0, y: 0 };
    this.emote = null;
    this.blinkTimer = 2 + Math.random() * 3;
    this.idleTimer = 5 + Math.random() * 4;
    this.visible = true;
    this.clock = new THREE.Clock();
    this.time = 0;

    this._lights();
    this._build();
    this._resize();
    this.ro = new ResizeObserver(() => this._resize());
    this.ro.observe(canvas.parentElement);
    this.io = new IntersectionObserver((en) => { this.visible = en[0].isIntersecting; }, { threshold: 0.01 });
    this.io.observe(canvas);
    if (this.opts.interactive) this._pointer();
    this._loop = this._loop.bind(this);
    this.raf = requestAnimationFrame(this._loop);
  }

  _lights() {
    const s = this.scene;
    s.add(new THREE.HemisphereLight(0xcfe0ff, 0x3a2a4a, 1.0));
    const key = new THREE.DirectionalLight(0xfff3e0, 2.4);
    key.position.set(2.5, 6, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -4; key.shadow.camera.right = 4;
    key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
    key.shadow.camera.near = 1; key.shadow.camera.far = 20;
    key.shadow.bias = -0.0015;
    key.shadow.radius = 4;
    s.add(key);
    const fillFront = new THREE.DirectionalLight(0xdfe8ff, 0.7);
    fillFront.position.set(-3, 1, 6);
    s.add(fillFront);
    const rimCyan = new THREE.PointLight(0x3fd9ff, 16, 14, 2);
    rimCyan.position.set(-4, 2.5, -2.5);
    s.add(rimCyan);
    const rimPink = new THREE.PointLight(0xff4fd8, 10, 14, 2);
    rimPink.position.set(4, 1.5, -3);
    s.add(rimPink);
  }

  _build() {
    const furBump = makeFurBump();
    // Body patches, placed like the logo (lathe UV: u=0 front, 0.25 right (+x), 0.5 back, 0.75 left (-x); v=1 top)
    const bodyTex = makeSpotTexture({
      seed: 11,
      fixed: [
        { u: 0.78, v: 0.82, r: 0.085 }, // left shoulder
        { u: 0.14, v: 0.42, r: 0.10 },  // right belly
        { u: 0.86, v: 0.34, r: 0.09 },  // left hip
        { u: 0.36, v: 0.66, r: 0.08 },  // right flank
        { u: 0.55, v: 0.72, r: 0.10 },  // back
        { u: 0.62, v: 0.30, r: 0.08 },  // back-left low
      ],
    });
    // Head patches (sphere UV: u=0.25 front, 0.5 right (+x), 0 / 1 left (-x); v=1 top)
    const headTex = makeSpotTexture({
      seed: 7,
      fixed: [
        { u: 0.31, v: 0.54, r: 0.12, soft: 0.35 },  // around the right eye
        { u: 0.43, v: 0.62, r: 0.10, soft: 0.4 },   // extends to the right side of the head
        { u: 0.47, v: 0.48, r: 0.085, soft: 0.4 },
        { u: 0.12, v: 0.84, r: 0.08 },              // top-left, by the left horn
        { u: 0.62, v: 0.80, r: 0.09 },              // back-right top
        { u: 0.80, v: 0.50, r: 0.09 },              // back-left
      ],
    });
    const legTexL = makeSpotTexture({ seed: 21, fixed: [{ u: 0.65, v: 0.22, r: 0.22, soft: 0.3 }] });
    const legTexR = makeSpotTexture({ seed: 22, fixed: [{ u: 0.3, v: 0.12, r: 0.14, soft: 0.3 }] });
    const armTex = makeSpotTexture({ seed: 23, fixed: [{ u: 0.5, v: 0.75, r: 0.14, soft: 0.3 }] });

    const furMat = (map) => new THREE.MeshStandardMaterial({ map, roughness: 0.95, metalness: 0, bumpMap: furBump, bumpScale: 0.006 });
    const matBody = furMat(bodyTex);
    const matHead = furMat(headTex);
    const matLegL = furMat(legTexL);
    const matLegR = furMat(legTexR);
    const matArm = furMat(armTex);
    const matCream = new THREE.MeshStandardMaterial({ color: COLORS.cream, roughness: 0.95, bumpMap: furBump, bumpScale: 0.006 });
    const matBrown = new THREE.MeshStandardMaterial({ color: COLORS.brown, roughness: 0.95, bumpMap: furBump, bumpScale: 0.006 });
    const matPink = new THREE.MeshStandardMaterial({ color: COLORS.pink, roughness: 0.7 });
    const matPinkDark = new THREE.MeshStandardMaterial({ color: COLORS.pinkDark, roughness: 0.75 });
    const matNostril = new THREE.MeshStandardMaterial({ color: COLORS.nostril, roughness: 0.7 });
    const matMouth = new THREE.MeshStandardMaterial({ color: COLORS.mouth, roughness: 0.6 });
    const matHorn = new THREE.MeshStandardMaterial({ color: COLORS.horn, roughness: 0.55 });
    const matHoof = new THREE.MeshStandardMaterial({ color: COLORS.hoof, roughness: 0.65 });
    const matLaptop = new THREE.MeshStandardMaterial({ color: COLORS.laptop, roughness: 0.4, metalness: 0.3 });
    const matLaptopDark = new THREE.MeshStandardMaterial({ color: COLORS.laptopDark, roughness: 0.5, metalness: 0.3 });
    const matKey = new THREE.MeshStandardMaterial({ color: COLORS.key, roughness: 0.7 });
    const matEye = new THREE.MeshStandardMaterial({ color: COLORS.eyeWhite, roughness: 0.2 });
    const matIris = new THREE.MeshStandardMaterial({ color: COLORS.iris, roughness: 0.25 });
    const matIrisRim = new THREE.MeshStandardMaterial({ color: COLORS.irisRim, roughness: 0.3 });
    const matPupil = new THREE.MeshStandardMaterial({ color: COLORS.pupil, roughness: 0.15 });
    const matHi = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const matEyeRing = new THREE.MeshStandardMaterial({ color: COLORS.eyeRing, roughness: 0.9 });

    const M = (geo, mat, x = 0, y = 0, z = 0) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = true; m.receiveShadow = true;
      return m;
    };

    const root = new THREE.Group();
    root.scale.setScalar(this.opts.scale);
    this.root = root;
    this.scene.add(root);

    // ground shadow
    const ground = new THREE.Mesh(new THREE.CircleGeometry(3, 48), new THREE.ShadowMaterial({ opacity: 0.32 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2.05;
    ground.receiveShadow = true;
    root.add(ground);

    // ---- body: pear-shaped lathe like the logo (narrow shoulders, round belly)
    const profile = new THREE.SplineCurve([
      new THREE.Vector2(0.001, -1.4), new THREE.Vector2(0.55, -1.36), new THREE.Vector2(0.86, -1.15), new THREE.Vector2(0.99, -0.75),
      new THREE.Vector2(0.97, -0.3), new THREE.Vector2(0.84, 0.1), new THREE.Vector2(0.66, 0.45), new THREE.Vector2(0.45, 0.68), new THREE.Vector2(0.001, 0.8),
    ]).getPoints(40);
    const body = M(new THREE.LatheGeometry(profile, 56), matBody);
    body.scale.set(1, 1, 0.86);
    this.body = body; this.bodyScale = body.scale.clone();
    root.add(body);

    // ---- legs + mitten hooves
    for (const s of [-1, 1]) {
      const leg = M(new THREE.CapsuleGeometry(0.28, 0.55, 8, 24), s < 0 ? matLegL : matLegR, s * 0.42, -1.42, 0.05);
      root.add(leg);
      const hoof = M(new THREE.SphereGeometry(0.34, 32, 24), matHoof, s * 0.44, -1.8, 0.1);
      hoof.scale.set(1.05, 0.72, 1.15);
      root.add(hoof);
    }

    // ---- udder
    const udder = M(new THREE.SphereGeometry(0.34, 32, 24), matPink, 0.02, -1.14, 0.6);
    udder.scale.set(1.1, 0.72, 0.85);
    root.add(udder);
    for (const [x, z] of [[-0.2, 0.76], [-0.05, 0.86], [0.12, 0.86], [0.26, 0.74]]) {
      root.add(M(new THREE.CapsuleGeometry(0.055, 0.1, 4, 12), matPinkDark, x, -1.36, z));
    }

    // ---- tail with tuft
    const tail = new THREE.Group();
    tail.position.set(-0.15, -0.85, -0.78);
    tail.rotation.set(0.5, 0, 0.45);
    tail.add(M(new THREE.CylinderGeometry(0.045, 0.065, 0.85, 12), matCream, 0, -0.42, 0));
    const tuft = M(new THREE.SphereGeometry(0.17, 24, 16), matBrown, 0, -0.9, 0);
    tuft.scale.set(1, 1.5, 1);
    tail.add(tuft);
    this.tail = tail; this.tailBase = tail.rotation.clone();
    root.add(tail);

    // ---- head
    const head = new THREE.Group();
    head.position.set(0, 0.7, 0.05);
    this.head = head;
    root.add(head);
    const hg = new THREE.Group();
    hg.position.set(0, 0.55, 0.1);
    head.add(hg);

    const skull = M(new THREE.SphereGeometry(0.95, 72, 48), matHead);
    skull.scale.set(1.04, 0.88, 0.9);
    hg.add(skull);

    // snout: big pink muzzle covering the lower half of the face
    const snout = M(new THREE.SphereGeometry(0.5, 48, 32), matPink, 0, -0.38, 0.6);
    snout.scale.set(1.46, 1.0, 1.0);
    hg.add(snout);
    for (const s of [-1, 1]) {
      const n = M(new THREE.SphereGeometry(0.075, 20, 14), matNostril, s * 0.23, -0.28, 1.06);
      n.scale.set(1, 1.3, 0.55);
      hg.add(n);
    }
    const mouth = M(new THREE.TorusGeometry(0.4, 0.03, 10, 48, Math.PI), matMouth, 0, -0.52, 1.0);
    mouth.rotation.z = Math.PI;
    mouth.scale.set(1, 0.65, 1);
    this.mouth = mouth; this.mouthScale = mouth.scale.clone();
    hg.add(mouth);

    // eyes — big, grey-blue iris, large pupil, two highlights
    this.eyes = []; this.lids = [];
    for (const s of [-1, 1]) {
      const eg = new THREE.Group();
      eg.position.set(s * 0.36, 0.1, 0.7);
      const white = M(new THREE.SphereGeometry(0.21, 40, 28), matEye);
      eg.add(white);
      const ring = M(new THREE.TorusGeometry(0.2, 0.013, 10, 48), matEyeRing, 0, 0, 0.05);
      ring.castShadow = false;
      eg.add(ring);
      const inner = new THREE.Group();
      inner.add(M(new THREE.SphereGeometry(0.16, 32, 20), matIrisRim, 0, 0, 0.07));
      inner.add(M(new THREE.SphereGeometry(0.145, 32, 20), matIris, 0, 0, 0.092));
      inner.add(M(new THREE.SphereGeometry(0.095, 28, 18), matPupil, 0, 0, 0.148));
      const hi = M(new THREE.SphereGeometry(0.05, 14, 10), matHi, -0.055, 0.07, 0.195);
      hi.castShadow = false;
      inner.add(hi);
      const hi2 = M(new THREE.SphereGeometry(0.022, 10, 8), matHi, 0.06, -0.055, 0.2);
      hi2.castShadow = false;
      inner.add(hi2);
      eg.add(inner);
      eg.userData.inner = inner;
      hg.add(eg);
      this.eyes.push(eg);
      // eyelid (hemisphere rotating down over the eye) — brown on the patch side
      const lid = M(new THREE.SphereGeometry(0.228, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2), s > 0 ? matBrown : matCream);
      lid.position.copy(eg.position);
      lid.rotation.x = -0.95;
      hg.add(lid);
      this.lids.push(lid);
    }

    // ears — both chocolate brown outside, pink inside, drooping slightly
    this.ears = [];
    for (const s of [-1, 1]) {
      const ear = new THREE.Group();
      ear.position.set(s * 0.95, 0.28, -0.1);
      const outer = M(new THREE.SphereGeometry(0.42, 32, 20), matBrown, s * 0.4, 0, 0);
      outer.scale.set(1, 0.52, 0.28);
      ear.add(outer);
      const innerEar = M(new THREE.SphereGeometry(0.31, 32, 20), matPinkDark, s * 0.42, 0, 0.075);
      innerEar.scale.set(1, 0.44, 0.2);
      ear.add(innerEar);
      ear.rotation.z = s * -0.28;
      ear.rotation.y = s * 0.42;
      ear.userData.baseZ = ear.rotation.z;
      hg.add(ear);
      this.ears.push(ear);
    }

    // horns — ridged, curving outward like the logo (stacked spheres along a curve)
    for (const s of [-1, 1]) {
      const horn = new THREE.Group();
      horn.position.set(s * 0.42, 0.78, -0.12);
      const N = 11;
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const r = lerp(0.16, 0.045, t);
        const seg = M(new THREE.SphereGeometry(r, 20, 14), matHorn, s * (0.02 + 0.46 * t * t), 0.52 * t - 0.14 * t * t, -0.04 * t);
        seg.scale.set(1, 1.15, 1);
        horn.add(seg);
      }
      hg.add(horn);
    }

    // ---- arms with mitten hooves
    const makeArm = (s) => {
      const arm = new THREE.Group();
      arm.position.set(s * 0.72, 0.15, 0.3);
      arm.add(M(new THREE.CapsuleGeometry(0.2, 0.52, 8, 24), matArm, 0, -0.38, 0));
      const hoof = M(new THREE.SphereGeometry(0.27, 32, 24), matHoof, 0, -0.78, 0);
      hoof.scale.set(1, 0.85, 1.05);
      arm.add(hoof);
      root.add(arm);
      return arm;
    };
    this.armR = makeArm(-1);
    this.armL = makeArm(1);

    // ---- laptop (lavender-grey, cow sticker on the lid)
    const laptop = new THREE.Group();
    laptop.position.set(0.1, -0.4, 0.95);
    laptop.rotation.y = -0.25;
    const base = M(new THREE.BoxGeometry(1.3, 0.05, 0.9), matLaptop);
    laptop.add(base);
    laptop.add(M(new THREE.BoxGeometry(1.02, 0.012, 0.46), matKey, 0, 0.03, -0.1));
    for (let r = 0; r < 4; r++) for (let c = 0; c < 11; c++) {
      const k = M(new THREE.BoxGeometry(0.075, 0.012, 0.075), matLaptopDark, -0.46 + c * 0.092, 0.04, -0.28 + r * 0.1);
      k.castShadow = false;
      laptop.add(k);
    }
    laptop.add(M(new THREE.BoxGeometry(0.36, 0.012, 0.18), matLaptopDark, 0, 0.03, 0.3));
    const lid = new THREE.Group();
    lid.position.set(0, 0.025, 0.45);
    lid.rotation.x = 0.26;
    lid.add(M(new THREE.BoxGeometry(1.3, 0.8, 0.04), matLaptop, 0, 0.4, 0));
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.16, 0.68), new THREE.MeshBasicMaterial({ map: makeScreenTexture() }));
    screen.position.set(0, 0.4, -0.021);
    screen.rotation.y = Math.PI;
    lid.add(screen);
    const sticker = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshStandardMaterial({ map: makeStickerTexture(), roughness: 0.45, metalness: 0.2 }));
    sticker.position.set(0, 0.4, 0.021);
    lid.add(sticker);
    laptop.add(lid);
    const glow = new THREE.PointLight(0x5fd1ff, 4, 3.5, 2);
    glow.position.set(0, 0.5, -0.3);
    laptop.add(glow);
    root.add(laptop);
    this.laptop = laptop;
  }

  _pointer() {
    const onMove = (cx, cy) => {
      const r = this.canvas.getBoundingClientRect();
      const mx = r.left + r.width / 2, my = r.top + r.height * 0.42;
      const nx = (cx - mx) / Math.max(320, window.innerWidth * 0.5);
      const ny = (cy - my) / Math.max(240, window.innerHeight * 0.5);
      this.lookTarget.x = clamp(nx, -1, 1) * this.opts.lookStrength;
      this.lookTarget.y = clamp(ny, -1, 1) * this.opts.lookStrength;
    };
    window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY), { passive: true });
    window.addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t) onMove(t.clientX, t.clientY); }, { passive: true });
    this.canvas.addEventListener('click', () => {
      const pool = ['wave', 'wink', 'happy', 'jump', 'nod', 'dance', 'spin'];
      const name = pool[Math.floor(Math.random() * pool.length)];
      this.play(name);
      if (this.opts.onClick) this.opts.onClick(name);
    });
    this.canvas.style.cursor = 'pointer';
  }

  play(name) {
    const def = EMOTES[name];
    if (!def) return false;
    this.emote = { name, t: 0, d: def.d, fn: def.fn };
    this.idleTimer = 6 + Math.random() * 5;
    if (this.opts.onEmote) this.opts.onEmote(name);
    return true;
  }

  get isBusy() { return !!this.emote; }

  _resize() {
    const el = this.canvas.parentElement;
    const w = Math.max(1, el.clientWidth), h = Math.max(1, el.clientHeight);
    this.renderer.setSize(w, h, false);
    const aspect = w / h;
    this.camera.aspect = aspect;
    const fit = Math.max(1, 0.92 / aspect);
    this.camera.position.z = this.opts.cameraZ * fit;
    this.camera.updateProjectionMatrix();
  }

  _loop() {
    this.raf = requestAnimationFrame(this._loop);
    const dt = Math.min(0.05, this.clock.getDelta());
    this.time += dt;
    if (!this.visible || document.hidden) return;
    const t = this.time;

    // smooth look
    this.look.x = lerp(this.look.x, this.lookTarget.x, 1 - Math.pow(0.001, dt));
    this.look.y = lerp(this.look.y, this.lookTarget.y, 1 - Math.pow(0.001, dt));

    // base idle pose
    const P = {
      y: Math.sin(t * 1.6) * 0.04,
      rotY: Math.sin(t * 0.35) * 0.05,
      rotZ: 0,
      bodySy: 1 + Math.sin(t * 2.2) * 0.012,
      headX: -this.look.y * 0.32 + Math.sin(t * 0.9) * 0.03,
      headY: this.look.x * 0.55,
      headZ: Math.sin(t * 0.7) * 0.03,
      armR: { x: ARM_R.x + Math.sin(t * 2.2) * 0.03, z: ARM_R.z },
      armL: { x: ARM_L.x + Math.cos(t * 2.2) * 0.02, z: ARM_L.z },
      lidL: 0, lidR: 0,
      earL: Math.sin(t * 3.1) * 0.03, earR: Math.sin(t * 2.7 + 1) * 0.03,
      tail: Math.sin(t * 2.4) * 0.35,
      eyeX: this.look.x * 0.28, eyeY: this.look.y * 0.22,
      mouth: 1,
    };

    // blinking
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      this.blinkTimer = 2.2 + Math.random() * 3.5;
      if (!this.emote || this.emote.name !== 'wink') this.play('blink');
    }

    // random idle emotes
    if (this.opts.autoIdle && !this.emote) {
      this.idleTimer -= dt;
      if (this.idleTimer <= 0) {
        const pool = ['earflick', 'lookaround', 'type', 'nod', 'earflick', 'happy'];
        this.play(pool[Math.floor(Math.random() * pool.length)]);
      }
    }

    // active emote
    if (this.emote) {
      this.emote.t += dt;
      const p = Math.min(1, this.emote.t / this.emote.d);
      this.emote.fn(p, P, t);
      if (p >= 1) this.emote = null;
    }

    // apply pose
    const r = this.root;
    r.position.y = P.y * this.opts.scale;
    r.rotation.y = P.rotY;
    r.rotation.z = P.rotZ;
    this.body.scale.set(this.bodyScale.x, this.bodyScale.y * P.bodySy, this.bodyScale.z);
    this.head.rotation.set(P.headX, P.headY, P.headZ);
    this.armR.rotation.set(P.armR.x, 0, P.armR.z);
    this.armL.rotation.set(P.armL.x, 0, P.armL.z);
    this.lids[0].rotation.x = lerp(-0.95, 1.57, clamp(P.lidL, 0, 1));
    this.lids[1].rotation.x = lerp(-0.95, 1.57, clamp(P.lidR, 0, 1));
    for (const eg of this.eyes) eg.userData.inner.rotation.set(P.eyeY, P.eyeX, 0);
    this.ears[0].rotation.z = this.ears[0].userData.baseZ + P.earL;
    this.ears[1].rotation.z = this.ears[1].userData.baseZ - P.earR;
    this.tail.rotation.y = P.tail;
    this.mouth.scale.set(this.mouthScale.x * P.mouth, this.mouthScale.y * (P.mouth * 0.9 + 0.1), 1);

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.ro.disconnect(); this.io.disconnect();
    this.renderer.dispose();
  }
}
