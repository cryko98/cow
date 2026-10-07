// Chronically On Web ($COW) — procedural 3D cow built with Three.js
// Fully animated: breathing, idle bob, cursor tracking, blinking, and emotes
// (wave, wink, nod, shake, dance, type, jump, spin, happy, earflick, lookaround).
import * as THREE from 'three';

const COLORS = {
  cream: '#f4e8cf',
  brown: '#4a3326',
  pink: 0xf3a3ad,
  pinkDark: 0xe08793,
  nostril: 0xb85c6a,
  horn: 0xe9d9a8,
  hoof: 0x3a2a1f,
  laptop: 0x9ea7bb,
  laptopDark: 0x5f677c,
  key: 0x2a3041,
  eyeWhite: 0xffffff,
  iris: 0x5c7394,
  pupil: 0x121212,
};

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function blob(ctx, cx, cy, r, rnd) {
  const n = 8 + Math.floor(rnd() * 5);
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const d = rnd() * r * 0.5;
    const rr = r * (0.5 + rnd() * 0.4);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    ctx.moveTo(x + rr, y);
    ctx.arc(x, y, rr, 0, Math.PI * 2);
  }
  ctx.fill();
}

function makeSpotTexture({ seed = 1, fixed = [], random = 0, avoid = null, W = 1024, H = 512 }) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const rnd = mulberry32(seed);
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = COLORS.brown;
  for (const f of fixed) {
    const x = f.u * W, y = (1 - f.v) * H;
    for (const dx of [-W, 0, W]) blob(ctx, x + dx, y, f.r * W, rnd);
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
  // soft fur speckle
  ctx.globalAlpha = 0.07;
  for (let i = 0; i < 6000; i++) {
    ctx.fillStyle = rnd() < 0.5 ? '#000' : '#fff';
    ctx.fillRect(rnd() * W, rnd() * H, 2, 2);
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

function makeStickerTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#9ea7bb';
  ctx.fillRect(0, 0, 256, 256);
  ctx.translate(128, 136);
  ctx.strokeStyle = '#2b3140';
  ctx.fillStyle = '#e7ebf3';
  ctx.lineWidth = 9;
  ctx.lineJoin = 'round';
  // ears
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(s * 78, -10, 30, 18, s * 0.25, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  }
  // horns
  ctx.fillStyle = '#d7dce6';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 30, -55);
    ctx.quadraticCurveTo(s * 62, -70, s * 50, -98);
    ctx.quadraticCurveTo(s * 55, -62, s * 38, -48);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  }
  // head
  ctx.fillStyle = '#e7ebf3';
  ctx.beginPath();
  ctx.ellipse(0, 0, 62, 70, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  // patch
  ctx.fillStyle = '#2b3140';
  ctx.beginPath();
  ctx.ellipse(-30, -32, 24, 22, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // snout
  ctx.fillStyle = '#c7ccd8';
  ctx.beginPath();
  ctx.ellipse(0, 30, 42, 28, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  // nostrils
  ctx.fillStyle = '#2b3140';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(s * 15, 30, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // eyes
  for (const s of [-1, 1]) {
    ctx.fillStyle = s < 0 ? '#e7ebf3' : '#2b3140';
    ctx.beginPath();
    ctx.arc(s * 26, -24, 7, 0, Math.PI * 2);
    ctx.fill();
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

const EMOTES = {
  wave: { d: 2.6, fn(p, P) { const e = ease(p, 0.18); P.armR.x = lerp(P.armR.x, -0.25, e); P.armR.z = lerp(P.armR.z, -2.45, e) + Math.sin(p * Math.PI * 7) * 0.38 * e; P.headZ += 0.16 * e; P.headY += 0.12 * e; P.mouth = lerp(P.mouth, 1.2, e); } },
  wink: { d: 1.3, fn(p, P) { const e = ease(p, 0.25); P.lidL = clamp(Math.sin(Math.PI * p) * 1.8, 0, 1); P.headZ += -0.18 * e; P.mouth = lerp(P.mouth, 1.25, e); P.armR.z += 0.3 * e; } },
  blink: { d: 0.3, fn(p, P) { const v = Math.sin(Math.PI * p); P.lidL = Math.max(P.lidL, v); P.lidR = Math.max(P.lidR, v); } },
  nod: { d: 1.3, fn(p, P) { const e = ease(p, 0.15); P.headX += Math.sin(p * Math.PI * 4) * 0.22 * e; P.mouth = lerp(P.mouth, 1.1, e); } },
  shake: { d: 1.3, fn(p, P) { const e = ease(p, 0.15); P.headY += Math.sin(p * Math.PI * 4) * 0.42 * e; P.eyeX += Math.sin(p * Math.PI * 4) * 0.2 * e; } },
  dance: { d: 3.2, fn(p, P) { const e = ease(p, 0.12); P.y += Math.abs(Math.sin(p * Math.PI * 12)) * 0.16 * e; P.rotZ += Math.sin(p * Math.PI * 6) * 0.11 * e; P.rotY += Math.sin(p * Math.PI * 3) * 0.35 * e; P.armR.z = lerp(P.armR.z, -1.8, e) + Math.sin(p * Math.PI * 6) * 0.7 * e; P.armL.z = lerp(P.armL.z, 1.8, e) - Math.sin(p * Math.PI * 6) * 0.7 * e; P.armR.x = lerp(P.armR.x, -0.6, e); P.armL.x = lerp(P.armL.x, -0.6, e); P.headZ += Math.sin(p * Math.PI * 6) * 0.22 * e; P.mouth = lerp(P.mouth, 1.3, e); P.earL += Math.sin(p * Math.PI * 12) * 0.2 * e; P.earR -= Math.sin(p * Math.PI * 12) * 0.2 * e; } },
  type: { d: 2.6, fn(p, P) { const e = ease(p, 0.15); P.armR.x += Math.sin(p * Math.PI * 18) * 0.09 * e; P.armL.x += Math.cos(p * Math.PI * 18) * 0.09 * e; P.headX += 0.28 * e; P.lidL = Math.max(P.lidL, 0.2 * e); P.lidR = Math.max(P.lidR, 0.2 * e); P.eyeY += 0.2 * e; } },
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
    this.opts = Object.assign({ interactive: true, cameraZ: 8.4, cameraY: 0.25, autoIdle: true, onEmote: null, onClick: null, scale: 1, lookStrength: 1 }, opts);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    this.camera.position.set(0, this.opts.cameraY, this.opts.cameraZ);
    this.camera.lookAt(0, 0.1, 0);

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
    s.add(new THREE.HemisphereLight(0xbcd3ff, 0x2a1a3a, 0.95));
    const key = new THREE.DirectionalLight(0xfff1dc, 2.2);
    key.position.set(3, 5.5, 4.5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -4; key.shadow.camera.right = 4;
    key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
    key.shadow.camera.near = 1; key.shadow.camera.far = 20;
    key.shadow.bias = -0.0015;
    key.shadow.radius = 4;
    s.add(key);
    const rimCyan = new THREE.PointLight(0x3fd9ff, 18, 14, 2);
    rimCyan.position.set(-4, 2.5, -2.5);
    s.add(rimCyan);
    const rimPink = new THREE.PointLight(0xff4fd8, 12, 14, 2);
    rimPink.position.set(4, 1.5, -3);
    s.add(rimPink);
    const fill = new THREE.PointLight(0x6d8cff, 6, 12, 2);
    fill.position.set(-3, -1, 4);
    s.add(fill);
  }

  _build() {
    const bodyTex = makeSpotTexture({ seed: 11, random: 8 });
    const headTex = makeSpotTexture({
      seed: 7,
      fixed: [
        { u: 0.315, v: 0.55, r: 0.085 },
        { u: 0.08, v: 0.8, r: 0.07 },
        { u: 0.72, v: 0.62, r: 0.09 },
        { u: 0.5, v: 0.85, r: 0.06 },
      ],
      random: 2,
      avoid: (u, v) => (u > 0.1 && u < 0.4 && v < 0.7) || (u > 0.12 && u < 0.26 && v > 0.45 && v < 0.68),
    });

    const furMat = (map) => new THREE.MeshStandardMaterial({ map, roughness: 0.92, metalness: 0 });
    const matBody = furMat(bodyTex);
    const matHead = furMat(headTex);
    const matCream = new THREE.MeshStandardMaterial({ color: COLORS.cream, roughness: 0.92 });
    const matBrown = new THREE.MeshStandardMaterial({ color: COLORS.brown, roughness: 0.92 });
    const matPink = new THREE.MeshStandardMaterial({ color: COLORS.pink, roughness: 0.75 });
    const matPinkDark = new THREE.MeshStandardMaterial({ color: COLORS.pinkDark, roughness: 0.75 });
    const matNostril = new THREE.MeshStandardMaterial({ color: COLORS.nostril, roughness: 0.7 });
    const matHorn = new THREE.MeshStandardMaterial({ color: COLORS.horn, roughness: 0.5 });
    const matHoof = new THREE.MeshStandardMaterial({ color: COLORS.hoof, roughness: 0.6 });
    const matLaptop = new THREE.MeshStandardMaterial({ color: COLORS.laptop, roughness: 0.45, metalness: 0.35 });
    const matLaptopDark = new THREE.MeshStandardMaterial({ color: COLORS.laptopDark, roughness: 0.5, metalness: 0.3 });
    const matKey = new THREE.MeshStandardMaterial({ color: COLORS.key, roughness: 0.7 });
    const matEye = new THREE.MeshStandardMaterial({ color: COLORS.eyeWhite, roughness: 0.25 });
    const matIris = new THREE.MeshStandardMaterial({ color: COLORS.iris, roughness: 0.3 });
    const matPupil = new THREE.MeshStandardMaterial({ color: COLORS.pupil, roughness: 0.2 });
    const matHi = new THREE.MeshBasicMaterial({ color: 0xffffff });

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
    ground.position.y = -2.02;
    ground.receiveShadow = true;
    root.add(ground);

    // body
    const body = M(new THREE.SphereGeometry(1, 64, 48), matBody, 0, -0.3, 0);
    body.scale.set(0.95, 1.1, 0.85);
    this.body = body; this.bodyScale = body.scale.clone();
    root.add(body);

    // legs
    for (const s of [-1, 1]) {
      const leg = M(new THREE.CapsuleGeometry(0.27, 0.5, 8, 24), matBody, s * 0.42, -1.45, 0.08);
      root.add(leg);
      const hoof = M(new THREE.SphereGeometry(0.3, 32, 24), matHoof, s * 0.42, -1.86, 0.1);
      hoof.scale.set(1.05, 0.55, 1.1);
      root.add(hoof);
    }

    // udder
    const udder = M(new THREE.SphereGeometry(0.28, 32, 24), matPink, 0.05, -1.02, 0.62);
    udder.scale.set(1.15, 0.75, 0.8);
    root.add(udder);
    for (const [x, z] of [[-0.14, 0.78], [0.06, 0.86], [0.26, 0.76]]) {
      root.add(M(new THREE.CapsuleGeometry(0.05, 0.08, 4, 12), matPinkDark, x, -1.2, z));
    }

    // tail
    const tail = new THREE.Group();
    tail.position.set(0, -0.55, -0.82);
    tail.rotation.x = 0.55;
    const tailMesh = M(new THREE.CylinderGeometry(0.04, 0.06, 0.9, 12), matBody, 0, -0.45, 0);
    tail.add(tailMesh);
    const tuft = M(new THREE.SphereGeometry(0.14, 24, 16), matBrown, 0, -0.95, 0);
    tuft.scale.set(1, 1.6, 1);
    tail.add(tuft);
    this.tail = tail;
    root.add(tail);

    // head
    const head = new THREE.Group();
    head.position.set(0, 0.75, 0.1);
    this.head = head;
    root.add(head);
    const hg = new THREE.Group();
    hg.position.set(0, 0.55, 0.15);
    head.add(hg);

    const skull = M(new THREE.SphereGeometry(0.78, 64, 48), matHead);
    skull.scale.set(1, 0.92, 0.9);
    hg.add(skull);

    // snout
    const snout = M(new THREE.SphereGeometry(0.5, 48, 32), matPink, 0, -0.28, 0.62);
    snout.scale.set(1.2, 0.72, 0.8);
    hg.add(snout);
    for (const s of [-1, 1]) {
      const n = M(new THREE.SphereGeometry(0.055, 16, 12), matNostril, s * 0.17, -0.2, 1.0);
      n.scale.set(1, 1.35, 0.6);
      hg.add(n);
    }
    const mouth = M(new THREE.TorusGeometry(0.25, 0.028, 10, 32, Math.PI), matNostril, 0, -0.46, 0.99);
    mouth.rotation.z = Math.PI;
    this.mouth = mouth;
    hg.add(mouth);

    // eyes
    this.eyes = []; this.lids = [];
    for (const s of [-1, 1]) {
      const eg = new THREE.Group();
      eg.position.set(s * 0.31, 0.12, 0.6);
      const white = M(new THREE.SphereGeometry(0.17, 32, 24), matEye);
      eg.add(white);
      const inner = new THREE.Group();
      inner.add(M(new THREE.SphereGeometry(0.105, 24, 16), matIris, 0, 0, 0.09));
      inner.add(M(new THREE.SphereGeometry(0.06, 24, 16), matPupil, 0, 0, 0.135));
      const hi = M(new THREE.SphereGeometry(0.035, 12, 8), matHi, -0.045, 0.055, 0.155);
      hi.castShadow = false;
      inner.add(hi);
      eg.add(inner);
      eg.userData.inner = inner;
      hg.add(eg);
      this.eyes.push(eg);
      // eyelid (hemisphere rotating down over the eye)
      const lid = M(new THREE.SphereGeometry(0.188, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), s > 0 ? matBrown : matCream);
      lid.position.copy(eg.position);
      lid.rotation.x = -0.9;
      hg.add(lid);
      this.lids.push(lid);
    }

    // ears
    this.ears = [];
    for (const s of [-1, 1]) {
      const ear = new THREE.Group();
      ear.position.set(s * 0.7, 0.3, -0.05);
      const outer = M(new THREE.SphereGeometry(0.3, 32, 20), s > 0 ? matBrown : matCream, s * 0.28, 0, 0);
      outer.scale.set(1, 0.5, 0.26);
      ear.add(outer);
      const innerEar = M(new THREE.SphereGeometry(0.24, 32, 20), matPinkDark, s * 0.28, 0, 0.055);
      innerEar.scale.set(1, 0.42, 0.18);
      ear.add(innerEar);
      ear.rotation.z = s * -0.3;
      ear.rotation.y = s * 0.35;
      ear.userData.baseZ = ear.rotation.z;
      hg.add(ear);
      this.ears.push(ear);
    }

    // horns
    for (const s of [-1, 1]) {
      const horn = new THREE.Group();
      horn.position.set(s * 0.3, 0.66, -0.05);
      horn.rotation.z = s * -0.55;
      const cone = M(new THREE.ConeGeometry(0.11, 0.48, 20), matHorn, 0, 0.22, 0);
      horn.add(cone);
      horn.add(M(new THREE.SphereGeometry(0.11, 16, 12), matHorn, 0, 0, 0));
      hg.add(horn);
    }

    // arms
    const makeArm = (s) => {
      const arm = new THREE.Group();
      arm.position.set(s * 0.78, 0.25, 0.3);
      arm.add(M(new THREE.CapsuleGeometry(0.19, 0.55, 8, 24), matBody, 0, -0.4, 0));
      const hoof = M(new THREE.SphereGeometry(0.23, 32, 24), matHoof, 0, -0.78, 0);
      hoof.scale.set(1, 0.85, 1);
      arm.add(hoof);
      root.add(arm);
      return arm;
    };
    this.armR = makeArm(-1);
    this.armL = makeArm(1);

    // laptop
    const laptop = new THREE.Group();
    laptop.position.set(0.05, -0.15, 1.0);
    laptop.rotation.y = -0.3;
    const base = M(new THREE.BoxGeometry(1.15, 0.05, 0.8), matLaptop);
    laptop.add(base);
    laptop.add(M(new THREE.BoxGeometry(0.9, 0.012, 0.42), matKey, 0, 0.03, -0.08));
    // keycap grid
    for (let r = 0; r < 4; r++) for (let c = 0; c < 10; c++) {
      const k = M(new THREE.BoxGeometry(0.07, 0.012, 0.07), matLaptopDark, -0.4 + c * 0.088, 0.04, -0.24 + r * 0.095);
      k.castShadow = false;
      laptop.add(k);
    }
    laptop.add(M(new THREE.BoxGeometry(0.32, 0.012, 0.16), matLaptopDark, 0, 0.03, 0.26));
    const lid = new THREE.Group();
    lid.position.set(0, 0.025, 0.4);
    lid.rotation.x = 0.28;
    const lidBox = M(new THREE.BoxGeometry(1.15, 0.78, 0.04), matLaptop, 0, 0.39, 0);
    lid.add(lidBox);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 0.66), new THREE.MeshBasicMaterial({ map: makeScreenTexture() }));
    screen.position.set(0, 0.39, -0.021);
    screen.rotation.y = Math.PI;
    lid.add(screen);
    const sticker = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshStandardMaterial({ map: makeStickerTexture(), roughness: 0.5, metalness: 0.2 }));
    sticker.position.set(0, 0.39, 0.021);
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
      armR: { x: -1.25 + Math.sin(t * 2.2) * 0.03, z: 0.5 },
      armL: { x: -1.25 + Math.cos(t * 2.2) * 0.03, z: -0.5 },
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
    this.lids[0].rotation.x = lerp(-0.9, 1.57, clamp(P.lidL, 0, 1));
    this.lids[1].rotation.x = lerp(-0.9, 1.57, clamp(P.lidR, 0, 1));
    for (const eg of this.eyes) eg.userData.inner.rotation.set(P.eyeY, P.eyeX, 0);
    this.ears[0].rotation.z = this.ears[0].userData.baseZ + P.earL;
    this.ears[1].rotation.z = this.ears[1].userData.baseZ - P.earR;
    this.tail.rotation.y = P.tail;
    this.mouth.scale.set(P.mouth, P.mouth * 0.9 + 0.1, 1);

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.ro.disconnect(); this.io.disconnect();
    this.renderer.dispose();
  }
}
