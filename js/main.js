'use strict';
/* main.js：两个卷轴加一个舞台，三个视口共用一块铺满窗口的画布（按各自 DOM 元素的位置裁剪着画）。
   画面按老主机的路子出：低分辨率渲染再按整数倍放大、顶点吸附、抖点。
   流程：拉杆 → 卷轴停 → 两个原型飞进舞台绕圈 → 闪光 → 新怪兽落地 → 档案卡、图鉴。 */
(() => {
const ui = {};
['gl', 'app', 'stage', 'banner', 'bNo', 'bName', 'bSt', 'flash', 'winA', 'winB', 'nameA', 'nameB', 'go', 'reroll', 'card', 'cardBody', 'sheetBtn', 'sheetX',
  'dexBtn', 'dexN', 'snd', 'langBtn', 'shareBtn', 'imgBtn', 'shot', 'shotImg', 'shotDl', 'shotShare', 'toast', 'loading', 'creditBtn', 'credits', 'creditList', 'picker', 'pickTitle', 'pickGrid', 'dex', 'dexSub', 'dexGrid', 'dexEmpty', 'tabSlot', 'tabCustom'].forEach(id => { ui[id] = document.getElementById(id); });
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const now = () => performance.now() / 1000;
const easeOut = p => 1 - (1 - p) ** 3;
const backOut = p => 1 + 2.2 * (p - 1) ** 3 + 1.2 * (p - 1) ** 2;
const elastic = p => p <= 0 ? 0 : p >= 1 ? 1 : 2 ** (-10 * p) * Math.sin((p * 10 - 0.75) * (2 * PI / 3)) + 1;
const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);
const no3 = n => 'No.' + String(n).padStart(3, '0');
const newSeed = () => (Math.random() * 4294967296) >>> 0;
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 存不了就算了 */ } };

/* ---------- 音效：8-bit 芯片音。两路方波（占空比 12.5% / 25% / 50%）、一路三角波、一路 1 位噪声，音量按台阶走 ---------- */
const sfx = (() => {
  let ctx = null, master = null, on = lsGet('stitch-snd', true) !== false, noiseBuf = null, tk = 0;
  const waves = {}, N = n => 440 * 2 ** ((n - 69) / 12);   // MIDI 音高 → 频率
  function unlock() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = on ? 0.28 : 0; master.connect(ctx.destination); } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  }
  function wave(duty) {
    if (!waves[duty]) {
      const n = 24, re = new Float32Array(n), im = new Float32Array(n);
      for (let k = 1; k < n; k++) re[k] = 2 / (k * PI) * Math.sin(k * PI * duty);
      waves[duty] = ctx.createPeriodicWave(re, im);
    }
    return waves[duty];
  }
  function steps(g, t, dur, vol, n) { for (let i = 0; i < n; i++) g.gain.setValueAtTime(vol * Math.round(15 * (1 - i / n)) / 15, t + dur * i / n); g.gain.setValueAtTime(0, t + dur); }
  function sq(note, at, dur, vol = 0.5, duty = 0.5, slide = 0) {
    if (!ctx) return;
    const t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain();
    o.setPeriodicWave(wave(duty)); o.frequency.setValueAtTime(N(note), t); if (slide) o.frequency.linearRampToValueAtTime(N(note + slide), t + dur);
    steps(g, t, dur, vol, 5); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function tri(note, at, dur, vol = 0.7, slide = 0) {
    if (!ctx) return;
    const t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(N(note), t); if (slide) o.frequency.linearRampToValueAtTime(N(note + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.setValueAtTime(0, t + dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function nz(at, dur, vol = 0.5, rate = 1) {
    if (!ctx) return;
    if (!noiseBuf) {
      const n = ctx.sampleRate, d = (noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate)).getChannelData(0);
      let v = 1;
      for (let i = 0; i < n; i++) { if (i % 5 === 0) v = Math.random() < 0.5 ? -1 : 1; d[i] = v; }
    }
    const t = ctx.currentTime + at, s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = noiseBuf; s.loop = true; s.playbackRate.value = rate; steps(g, t, dur, vol, 12);
    s.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.02);
  }
  return {
    unlock, get on() { return on; },
    toggle() { on = !on; lsSet('stitch-snd', on); unlock(); if (master) master.gain.value = on ? 0.28 : 0; if (on) sq(84, 0, 0.05, 0.3, 0.25); return on; },
    click: () => sq(84, 0, 0.035, 0.28, 0.25),
    pick: () => { sq(76, 0, 0.05, 0.3, 0.25); sq(83, 0.05, 0.08, 0.3, 0.25); },
    tick: () => sq(79 + (tk++ % 2) * 5, 0, 0.03, 0.26, 0.125),
    stop: () => { sq(60, 0, 0.05, 0.45); sq(48, 0.05, 0.09, 0.45); nz(0, 0.06, 0.3, 1); },
    charge: d => {            // 越爬越高、越来越密的琶音
      let t = 0, i = 0;
      while (t < d) { const k = t / d; sq(Math.min(100, 48 + [0, 4, 7, 12][i % 4] + 12 * Math.floor(i / 8)), t, 0.05, 0.2 + k * 0.12, 0.125); t += 0.12 - k * 0.085; i++; }
      tri(33, 0, d, 0.5, 24);
    },
    boom: () => { nz(0, 0.8, 0.3, 0.3); nz(0, 0.22, 0.2, 1); tri(52, 0, 0.4, 0.4, -28); },
    fanfare: n => {           // 登场小曲：上行琶音接长音，星级高再加一串闪光
      [72, 76, 79, 84].forEach((m, i) => { sq(m, i * 0.08, 0.075, 0.34, 0.25); sq(m - 12, i * 0.08, 0.075, 0.18, 0.5); });
      sq(88, 0.32, 0.15, 0.34, 0.25); sq(91, 0.48, 0.42, 0.36, 0.25); sq(84, 0.48, 0.42, 0.2, 0.5);
      tri(48, 0, 0.3, 0.6); tri(55, 0.32, 0.15, 0.6); tri(60, 0.48, 0.42, 0.6);
      if (n >= 3) [96, 91, 88, 84, 88, 91, 96, 100].slice(0, n * 2 - 2).forEach((m, i) => sq(m, 0.92 + i * 0.045, 0.04, 0.26, 0.125));
    },
  };
})();

/* ---------- 渲染器：低分辨率、不抗锯齿，由 CSS 按最近点放大 ---------- */
let renderer;
try { renderer = new T.WebGLRenderer({ canvas: ui.gl, antialias: false, alpha: true }); } catch (e) { return; }
renderer.outputEncoding = T.sRGBEncoding;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.BasicShadowMap;
renderer.autoClear = false; renderer.setClearColor(0x000000, 0); renderer.localClippingEnabled = true;
let CH = 1, PX = 2;   // PX：一个渲染像素占几个 CSS 像素。取整数个屏幕物理像素，让舞台纵向大约 320 行
function resize() {
  const w = ui.gl.clientWidth || 1, h = ui.gl.clientHeight || 1, dpr = window.devicePixelRatio || 1;
  CH = h; PX = Math.max(1, Math.round((ui.stage.clientHeight || 480) * dpr / 320)) / dpr;
  renderer.setPixelRatio(1 / PX); renderer.setSize(w, h, false);
}

function litScene(shadow) {
  const s = new T.Scene();
  s.add(new T.HemisphereLight(0xffffff, 0x8a7c6c, 0.78));
  const d = new T.DirectionalLight(0xffffff, 0.8); d.position.set(3.5, 7, 5);
  if (shadow) {
    d.castShadow = true; d.shadow.mapSize.set(512, 512);
    const c = d.shadow.camera; c.left = -6; c.right = 6; c.top = 6; c.bottom = -6; c.near = 1; c.far = 26;
    d.shadow.bias = -0.002; d.shadow.normalBias = 0.04;
  }
  s.add(d);
  return s;
}
/* 钉在相机上的底板：一块上下渐变的色块，抖点之后就是老主机那种背景 */
function backdrop(camx) {
  const g = new T.PlaneGeometry(2, 2);
  g.setAttribute('color', new T.Float32BufferAttribute(new Float32Array(12), 3));
  const m = new T.Mesh(g, psx(new T.MeshBasicMaterial({ vertexColors: true, depthTest: false, depthWrite: false, fog: false })));
  m.renderOrder = -10; m.frustumCulled = false; m.position.z = -30; m.scale.set(60, 60, 1);
  m.paint = (top, bottom) => { const a = g.attributes.color; [top, top, bottom, bottom].forEach((c, i) => a.setXYZ(i, c.r, c.g, c.b)); a.needsUpdate = true; };
  camx.add(m);
  return m;
}

/* ---------- 卷轴 ---------- */
const GAP = 4.2;
class Reel {
  constructor(win, lab, defs, build) {
    this.win = win; this.lab = lab; this.scene = litScene(false);
    this.cam = new T.PerspectiveCamera(24, 1, 0.1, 60); this.cam.position.set(0, 0.4, 7.6); this.cam.lookAt(0, 0, 0);
    this.scene.add(this.cam); this.bg = backdrop(this.cam);
    this.items = defs.map(d => { const b = build(d); b.def = d; b.group.visible = false; this.scene.add(b.group); return b; });
    this.n = defs.length; this.pos = 0; this.last = 0; this.anim = null; this.onStop = null;
    this.setLabel();
  }
  get index() { return ((Math.round(this.pos) % this.n) + this.n) % this.n; }
  setLabel() { this.lab.textContent = this.items[this.index].def.name; }
  jump(i) { this.pos = this.last = i; this.anim = null; this.setLabel(); }
  spinTo(target, dur, loops) {
    const n = this.n, from = this.pos;
    let to;
    if (loops) { to = Math.ceil(from) + loops * n; to += (((target - to) % n) + n) % n; }
    else { let d = (((target - Math.round(from)) % n) + n) % n; if (d > n / 2) d -= n; to = Math.round(from) + d; }
    this.anim = { from, to, t0: now(), dur, loops };
  }
  update(t) {
    const n = this.n;
    if (this.anim) {
      const a = this.anim, p = clamp((now() - a.t0) / a.dur, 0, 1);
      this.pos = a.from + (a.to - a.from) * (a.loops ? backOut(p) : easeOut(p));
      const idx = Math.round(this.pos);
      if (idx !== this.last) { this.last = idx; this.setLabel(); if (a.loops) sfx.tick(); }
      if (p >= 1) {
        this.pos = this.last = ((a.to % n) + n) % n; this.anim = null; this.setLabel();
        if (a.loops) { sfx.stop(); this.win.classList.remove('thunk'); void this.win.offsetWidth; this.win.classList.add('thunk'); }
        const f = this.onStop; this.onStop = null; if (f) f();
      }
    }
    const base = Math.floor(this.pos), f = this.pos - base;
    for (const it of this.items) it.group.visible = false;
    for (const [k, off] of [[base, -f], [base + 1, 1 - f]]) {
      if (Math.abs(off) > 0.98) continue;
      const it = this.items[((k % n) + n) % n];
      it.group.visible = true; it.group.position.y = off * GAP - it.h / 2; it.group.rotation.y = 0.55 + t * 0.6;
      for (const fn of it.ticks) fn(t);
    }
  }
}
let reelA = null, reelB = null;   // 素材载入后才建

/* ---------- 缩略图：借主画布拍小照（透明底） ---------- */
function shoot(fn, size = 96) {
  renderer.setScissorTest(false); renderer.setPixelRatio(1); renderer.setSize(size, size, false);
  PSX.snap.set(size / 2, size / 2);
  for (const r of [reelA, reelB]) { r.cam.aspect = 1; r.cam.position.z = 9.8; r.cam.updateProjectionMatrix(); r.bg.visible = false; }
  try { return fn(); } finally { for (const r of [reelA, reelB]) { r.cam.position.z = 7.6; r.bg.visible = true; } resize(); }
}
function snap(scene, cam) { renderer.clear(); renderer.render(scene, cam); return ui.gl.toDataURL('image/png'); }
function reelThumbs(reel) {
  for (const it of reel.items) it.group.visible = false;
  return reel.items.map(it => {
    it.group.visible = true; it.group.position.y = -it.h / 2; it.group.rotation.y = 0.6;
    for (const fn of it.ticks) fn(1.3);
    const u = snap(reel.scene, reel.cam);
    it.group.visible = false;
    return u;
  });
}
function beastThumb(b) {
  for (const it of reelA.items) it.group.visible = false;
  b.group.position.y = -b.h / 2; b.group.rotation.y = 0.6; reelA.scene.add(b.group);
  for (const fn of b.ticks) fn(1.3);
  const u = snap(reelA.scene, reelA.cam);
  reelA.scene.remove(b.group);
  return u;
}

/* ---------- 舞台：一座微缩城市的圆盘，背后是钉在相机上的放射线 ---------- */
const S = { mode: 'slot', busy: true, beast: null, yaw: 0, pitch: 0.2, zoom: 1, shake: 0, raySpeed: 0.06, rot: 0, idle: 9, sway: 1 };
const stage = litScene(true), world = new T.Group(), cam = new T.PerspectiveCamera(30, 1, 0.1, 80), city = [];
stage.add(world, cam); stage.fog = new T.Fog(0x1746b0, 11, 26);
const RAYS = 20, rays = (() => {
  const pos = [], g = new T.BufferGeometry();
  for (let i = 0; i < RAYS * 2; i++) { const a0 = i * PI / RAYS, a1 = (i + 1) * PI / RAYS; pos.push(0, 0, 0, Math.cos(a0) * 30, Math.sin(a0) * 30, 0, Math.cos(a1) * 30, Math.sin(a1) * 30, 0); }
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(new Float32Array(pos.length), 3));
  const m = new T.Mesh(g, psx(new T.MeshBasicMaterial({ vertexColors: true, depthTest: false, depthWrite: false, fog: false })));
  m.renderOrder = -10; m.frustumCulled = false; m.position.z = -40; cam.add(m);
  return m;
})();
/* 3D 里用到的主题色从 CSS 变量取，明暗切换时重刷 */
function applyTheme() {
  const cs = getComputedStyle(document.documentElement), col = n => lin(cs.getPropertyValue(n).trim() || '#888888');
  const a = col('--ray-a'), b = col('--ray-b'), glowC = col('--ray-glow'), well = col('--well'), at = rays.geometry.attributes.color;
  for (let i = 0; i < RAYS * 2; i++) {
    const c = i % 2 ? a : b, mid = c.clone().lerp(glowC, 0.45);
    at.setXYZ(i * 3, mid.r, mid.g, mid.b); at.setXYZ(i * 3 + 1, c.r, c.g, c.b); at.setXYZ(i * 3 + 2, c.r, c.g, c.b);
  }
  at.needsUpdate = true; stage.fog.color.copy(b);
  for (const r of [reelA, reelB]) if (r) r.bg.paint(well, well.clone().multiplyScalar(0.72));
}
(() => {
  const topTex = ctex(256, 256, (x, w) => {
    const c = w / 2;
    x.fillStyle = '#86b85a'; x.fillRect(0, 0, w, w);
    x.fillStyle = '#a39c8e'; x.beginPath(); x.arc(c, c, w * 0.475, 0, 7); x.fill();
    x.strokeStyle = '#5c5850'; x.lineWidth = 7;
    for (let i = 0; i < 6; i++) { const a = i * PI / 3 + 0.3; x.beginPath(); x.moveTo(c + Math.cos(a) * w * 0.25, c + Math.sin(a) * w * 0.25); x.lineTo(c + Math.cos(a) * w * 0.5, c + Math.sin(a) * w * 0.5); x.stroke(); }
    x.lineWidth = 10; x.beginPath(); x.arc(c, c, w * 0.262, 0, 7); x.stroke();
    x.strokeStyle = '#f3e9c8'; x.lineWidth = 1.5; x.setLineDash([5, 5]); x.beginPath(); x.arc(c, c, w * 0.262, 0, 7); x.stroke(); x.setLineDash([]);
    x.fillStyle = '#cdb67c'; x.beginPath(); x.arc(c, c, w * 0.24, 0, 7); x.fill();
  });
  const soil = M('#6b4a2e');
  const plat = new T.Mesh(new T.CylinderGeometry(4.6, 4.8, 0.5, 28), [soil, psx(new T.MeshLambertMaterial({ map: topTex })), soil]);
  plat.position.y = -0.25; plat.receiveShadow = true; world.add(plat);

  const R = rng(42), unit = new T.BoxGeometry(1, 1, 1), roof = M('#4a4640');
  const winTex = ctex(32, 32, (x, w, h) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); x.fillStyle = '#39445a'; for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) x.fillRect(4 + c * 15, 4 + r * 10, 9, 6); });
  const walls = ['#f4e9d0', '#eaa79a', '#9db7c9', '#f1c85b', '#cfc7b6'].map(c => psx(new T.MeshLambertMaterial({ color: lin(c), map: winTex })));
  for (let i = 0; i < 70; i++) {
    const a = R() * PI * 2, r = 2.8 + R() * 1.5, wd = 0.14 + R() * 0.16, ht = 0.16 + R() * 0.42, wall = pick(R, walls);
    const b = new T.Mesh(unit, [wall, wall, roof, roof, wall, wall]);
    b.scale.set(wd, ht, wd * (0.8 + R() * 0.5)); b.position.set(Math.cos(a) * r, ht / 2, Math.sin(a) * r); b.rotation.y = R() * PI;
    b.castShadow = b.receiveShadow = true; b.userData = { y0: ht / 2, vy: 0 };
    world.add(b); city.push(b);
  }
  const leaf = M('#3f8f3a'), trunk = M('#7a5a3a');
  for (let i = 0; i < 16; i++) {
    const a = R() * PI * 2, r = 2.6 + R() * 1.8, s = 0.45 + R() * 0.4;
    const tr = grp(cyl(0.025, 0.03, 0.14, trunk, 5).at(0, 0.07, 0), cone(0.11, 0.3, leaf, 5).at(0, 0.28, 0));
    tr.scale.setScalar(s); tr.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); tr.userData = { y0: 0, vy: 0 };
    world.add(tr); city.push(tr);
  }
})();
function fitCam(w, h) {
  const asp = w / h, vf = Math.tan(T.MathUtils.degToRad(cam.fov) / 2);
  const d = Math.max(4.0 / 2 / vf, 4.9 / 2 / (vf * asp)) * S.zoom;
  const sx = (Math.random() - 0.5) * S.shake * d * 0.3, sy = (Math.random() - 0.5) * S.shake * d * 0.3;
  cam.aspect = asp; cam.position.set(sx, 1.25 + Math.sin(S.pitch) * d + sy, Math.cos(S.pitch) * d); cam.lookAt(sx, 1.3 + sy, 0); cam.updateProjectionMatrix();
}

/* ---------- 特效 ---------- */
const glow = c => psx(new T.MeshBasicMaterial({ color: lin(c), fog: false }));
const orb = new T.Group(), orbCore = new T.Mesh(new T.SphereGeometry(1, 10, 7), glow('#fff7c2')), beams = new T.Group();
for (let i = 0; i < 10; i++) {
  const b = new T.Mesh(new T.ConeGeometry(0.09, 3.2, 4), glow(i % 2 ? '#ffd21f' : '#ffffff')), p = new T.Group();
  b.position.y = 1.6; p.add(b); p.rotation.z = i * PI / 5; beams.add(p);
}
orb.add(orbCore, beams); orb.position.set(0, 1.35, 0); orb.visible = false; stage.add(orb);

const rings = [0, 1].map(i => {
  const mt = glow(i ? '#ffffff' : '#ffd21f'); mt.transparent = true;
  const m = new T.Mesh(new T.TorusGeometry(1, 0.035, 4, 24), mt);
  m.rotation.x = H; m.position.y = 0.06; m.visible = false; stage.add(m);
  return m;
});
let ringT = -1;

const DN = 150, deb = new T.InstancedMesh(new T.BoxGeometry(0.075, 0.075, 0.075), psx(new T.MeshLambertMaterial()), DN);
const dp = Array.from({ length: DN }, () => ({ p: new T.Vector3(), v: new T.Vector3(), r: new T.Vector3(), s: 1 })), dummy = new T.Object3D();
let debT = 9;
deb.instanceMatrix.setUsage(T.DynamicDrawUsage); deb.frustumCulled = false; deb.castShadow = true; deb.visible = false; stage.add(deb);
function burst() {
  const cs = ['#f8cf12', '#de2a1b', '#ffffff', '#1746b0', '#17130f'].map(lin);
  debT = 0; deb.visible = true;
  dp.forEach((d, i) => {
    const a = Math.random() * PI * 2, sp = (2 + Math.random() * 6) * (0.4 + Math.random());
    d.p.set(0, 1.2, 0); d.v.set(Math.cos(a) * sp, 3 + Math.random() * 8, Math.sin(a) * sp); d.r.set(Math.random() * 8, Math.random() * 8, Math.random() * 8); d.s = 0.5 + Math.random() * 1.1;
    deb.setColorAt(i, cs[i % cs.length]);
  });
  deb.instanceColor.needsUpdate = true;
}
function updateFx(dt) {
  if (deb.visible) {
    debT += dt;
    const k = clamp(1 - (debT - 1.3) / 0.8, 0, 1);
    dp.forEach((d, i) => {
      d.v.y -= 17 * dt; d.p.addScaledVector(d.v, dt);
      if (d.p.y < 0.07) { d.p.y = 0.07; d.v.y *= -0.45; d.v.x *= 0.7; d.v.z *= 0.7; }
      dummy.position.copy(d.p); dummy.rotation.set(d.r.x * debT, d.r.y * debT, d.r.z * debT); dummy.scale.setScalar(Math.max(0.001, d.s * k)); dummy.updateMatrix();
      deb.setMatrixAt(i, dummy.matrix);
    });
    deb.instanceMatrix.needsUpdate = true;
    if (debT > 2.2) deb.visible = false;
  }
  if (ringT >= 0) {
    ringT += dt;
    rings.forEach((m, i) => { const k = clamp((ringT - i * 0.12) / 0.7, 0, 1); m.visible = k > 0 && k < 1; m.scale.setScalar(0.4 + k * 6.5); m.material.opacity = 1 - k; });
    if (ringT > 1) ringT = -1;
  }
  for (const b of city) {
    const u = b.userData;
    if (u.vy !== 0 || b.position.y > u.y0) { u.vy -= 22 * dt; b.position.y += u.vy * dt; if (b.position.y <= u.y0) { b.position.y = u.y0; u.vy = 0; } }
  }
}

/* ---------- 合体演出 ---------- */
const T1 = reduce ? 0.12 : 0.45, T2 = reduce ? 0.35 : 1.85;
let seq = null;
function dropBeast() { if (!S.beast) return; world.remove(S.beast.group); if (S.beast.dispose) S.beast.dispose(); S.beast = null; }
function busyUI(b) { ui.go.disabled = b; ui.reroll.disabled = b; ui.app.classList.toggle('busy', b); }
function fuse(a, b, seed) {
  S.busy = true; busyUI(true); ui.banner.hidden = true; ui.card.classList.remove('open');
  const A = BIO[a], B = MECH[b], built = assemble(A, B, seed);
  const ghost = src => { const piv = new T.Group(); src.group.position.y = -src.h / 2; piv.add(src.group); piv.visible = false; stage.add(piv); return { piv, ticks: src.ticks }; };
  seq = { t0: now(), A, B, seed, built, prof: profile(A, B, seed, built.recipe), gA: ghost(soloModel(A)), gB: ghost(soloModel(B)), step: 0, shown: false };
  sfx.charge(T2);
}
function boom(q) {
  q.step = 1;
  stage.remove(q.gA.piv, q.gB.piv); orb.visible = false;
  dropBeast();
  S.beast = q.built; q.built.group.scale.setScalar(0.001); world.add(q.built.group);
  lsSet('stitch-last', { a: q.A.id, b: q.B.id, seed: q.seed });
  if (!reduce) {
    ui.flash.classList.remove('on'); void ui.flash.offsetWidth; ui.flash.classList.add('on');
    burst(); ringT = 0; city.forEach(c => { c.userData.vy = 2 + Math.random() * 4; });
  }
  sfx.boom();
}
function updateSeq(t) {
  const q = seq;
  if (!q) return;
  const e = now() - q.t0;
  if (q.step === 0) {
    if (S.beast) { const k = Math.max(0, 1 - e / 0.22); S.beast.group.scale.setScalar(Math.max(0.001, k)); if (k === 0) dropBeast(); }
    const p = clamp((e - T1) / (T2 - T1), 0, 1);
    for (const [g, s] of [[q.gA, -1], [q.gB, 1]]) {
      g.piv.visible = true;
      if (e < T1) { const k = easeOut(e / T1); g.piv.position.set(s * (5.6 - 4.0 * k), 3.6 - 2.3 * k, 0.6); }
      else { const ang = p * p * 15 + (s < 0 ? PI : 0), rad = 1.6 * (1 - p) ** 1.4; g.piv.position.set(Math.cos(ang) * rad, 1.3 + Math.sin(e * 9 + s) * 0.06, Math.sin(ang) * rad + 0.6 * (1 - p)); }
      g.piv.scale.setScalar(0.5 - 0.3 * p); g.piv.rotation.y = e * (2 + p * 22) * s;
      for (const fn of g.ticks) fn(t);
    }
    orb.visible = p > 0; orbCore.scale.setScalar(0.001 + p * 0.75 * (1 + Math.sin(e * 43) * 0.1)); beams.rotation.z = e * 5; beams.scale.setScalar(0.2 + p * 0.9);
    S.shake = p * 0.07; S.raySpeed = 0.06 + p * 3;
    if (e >= T2) boom(q);
  } else {
    const p = clamp((e - T2) / 0.95, 0, 1);
    q.built.group.scale.setScalar(Math.max(0.001, elastic(p))); q.built.group.rotation.y = (1 - easeOut(p)) * PI * 4;
    S.shake = (1 - p) * 0.1; S.raySpeed = 0.06 + (1 - p) * 3;
    if (!q.shown && e > T2 + 0.3) { q.shown = true; showBanner(q.prof, true); renderCard(q.prof); sfx.fanfare(q.prof.stars); record(q); setCurrent(q.A, q.B, q.seed, q.prof); }
    if (p >= 1) { q.built.group.rotation.y = 0; S.shake = 0; seq = null; S.busy = false; busyUI(false); }
  }
}
function pull() {
  if (S.busy) return;
  sfx.unlock();
  if (S.mode === 'custom') { fuse(reelA.index, reelB.index, newSeed()); return; }
  S.busy = true; busyUI(true); ui.banner.hidden = true; ui.card.classList.remove('open');
  let a, b;
  do { a = Math.floor(Math.random() * BIO.length); b = Math.floor(Math.random() * MECH.length); } while (a === reelA.index && b === reelB.index);
  const seed = newSeed();
  reelA.spinTo(a, reduce ? 0.3 : 1.15, 2); reelB.spinTo(b, reduce ? 0.4 : 1.85, 3);
  reelB.onStop = () => setTimeout(() => fuse(a, b, seed), reduce ? 0 : 220);
}

/* ---------- 登场大字、档案卡 ---------- */
function showBanner(p, slam) {
  ui.bNo.textContent = TX.appears(no3(p.no)); ui.bName.textContent = p.name; ui.bSt.textContent = stars(p.stars);
  ui.banner.hidden = false; ui.banner.classList.remove('slam');
  if (slam) { void ui.banner.offsetWidth; ui.banner.classList.add('slam'); }
}
function renderCard(p) {
  ui.cardBody.innerHTML = `
    <div class="c-top"><span class="no">${no3(p.no)}</span><span class="st" aria-label="${TX.danger(p.stars)}">${stars(p.stars)}</span></div>
    <h2>${p.name}</h2><p class="epi">${p.epithet}</p><p class="mix"><b>${p.a}</b> × <b>${p.b}</b></p>
    <dl class="facts">
      <div><dt>${TX.fHeight}</dt><dd>${p.height}</dd></div><div><dt>${TX.fWeight}</dt><dd>${p.weight}</dd></div>
      <div class="wide"><dt>${TX.fHome}</dt><dd>${p.home}</dd></div>
      <div class="wide"><dt>${TX.fSkill}</dt><dd>${p.skill}</dd></div>
      <div class="wide"><dt>${TX.fWeak}</dt><dd>${p.weak}</dd></div>
    </dl>
    <h3>${TX.recipe} · ${p.method}</h3>
    <ul class="parts">${p.parts.map(([k, v, r]) => `<li class="${r}"><span>${k}</span>${v}</li>`).join('')}</ul>
    <h3>${TX.power}</h3>
    <div class="bars">${p.stats.map(([k, v], i) => `<div><span>${k}</span><i style="--v:0%" data-v="${v}"></i><b>${i === 3 && v >= 96 ? TX.max : v}</b></div>`).join('')}</div>
    <h3>${TX.report}</h3><p class="lore">${p.lore}</p>`;
  requestAnimationFrame(() => ui.cardBody.querySelectorAll('.bars i').forEach(i => i.style.setProperty('--v', i.dataset.v + '%')));
}

/* ---------- 分享：链接能还原同一只；图片是一张现画的卡片 ---------- */
const SHARE_BASE = /\.github\.io$/.test(location.hostname) ? location.origin + location.pathname : 'https://heiseisyojyo.github.io/stitch-beast/';
const beastId = (A, B, seed) => `${A.id}-${B.id}-${seed >>> 0}`;
function readHash() {
  const m = /^#?([a-z]+)-([a-z]+)-(\d{1,10})$/.exec(location.hash || '');
  if (!m) return null;
  const a = BIO.findIndex(x => x.id === m[1]), b = MECH.findIndex(x => x.id === m[2]);
  return a < 0 || b < 0 ? null : { a, b, seed: Number(m[3]) >>> 0 };
}
function setCurrent(A, B, seed, prof) {
  S.cur = { A, B, seed, prof, id: beastId(A, B, seed) };
  if (location.hash !== '#' + S.cur.id) { try { location.replace('#' + S.cur.id); } catch (e) { /* 地址栏改不了也不影响玩 */ } }
}
let toastT = 0;
function toast(msg) { ui.toast.textContent = msg; ui.toast.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { ui.toast.hidden = true; }, 2400); }
async function share(file) {
  const c = S.cur;
  if (!c) return;
  const data = { title: TX.title, text: TX.shareText(c.prof.name), url: SHARE_BASE + '#' + c.id };
  if (file && navigator.canShare && navigator.canShare({ files: [file] })) data.files = [file];
  if (navigator.share) { try { await navigator.share(data); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(data.text + ' ' + data.url); toast(TX.copied); } catch (e) { toast(data.url); }
}
/* 借主画布按小尺寸把舞台渲染一帧，拷出来 */
function stageShot(w, h) {
  const d0 = deb.visible;
  deb.visible = false; renderer.setScissorTest(false); renderer.setPixelRatio(1); renderer.setSize(w, h, false); PSX.snap.set(w / 2, h / 2);
  fitCam(w, h); renderer.clear(); renderer.render(stage, cam);
  const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(ui.gl, 0, 0);
  deb.visible = d0; resize();
  return c;
}
function wrapText(x, text, maxW) {
  const out = [], words = /[\u3000-\u9fff\uff00-\uffef]/.test(text) ? Array.from(text) : text.split(/(?<= )/);
  let line = '';
  for (const w of words) { if (line && x.measureText(line + w).width > maxW) { out.push(line.trimEnd()); line = w; } else line += w; }
  if (line) out.push(line.trimEnd());
  return out;
}
function drawCard() {
  const c = S.cur, p = c.prof, W = 1080, Ht = 1350, cv = document.createElement('canvas'), x = cv.getContext('2d');
  const cs = getComputedStyle(document.documentElement), v = n => cs.getPropertyValue(n).trim(), fd = v('--f-display'), fb = v('--f-body');
  cv.width = W; cv.height = Ht;
  x.fillStyle = v('--cover'); x.fillRect(0, 0, W, Ht);
  x.fillStyle = v('--shadow'); x.fillRect(52, 52, W - 88, Ht - 88);
  x.fillStyle = v('--page'); x.strokeStyle = v('--ink'); x.lineWidth = 8; x.fillRect(40, 40, W - 88, Ht - 88); x.strokeRect(40, 40, W - 88, Ht - 88);
  x.textBaseline = 'alphabetic';
  x.fillStyle = v('--red'); x.font = `52px ${fd}`; x.fillText(TX.title, 76, 124);
  x.font = `700 30px ${fb}`; const no = no3(p.no), nw = x.measureText(no).width;
  x.fillStyle = v('--ink'); x.fillRect(W - 124 - nw, 84, nw + 32, 50); x.fillStyle = v('--page'); x.fillText(no, W - 108 - nw, 120);
  const shot = stageShot(368, 276);
  x.imageSmoothingEnabled = false; x.drawImage(shot, 76, 160, 920, 690); x.imageSmoothingEnabled = true;
  x.lineWidth = 8; x.strokeStyle = v('--ink'); x.strokeRect(76, 160, 920, 690);
  let fs = 112;
  do { x.font = `${fs}px ${fd}`; fs -= 4; } while (x.measureText(p.name).width > 900 && fs > 40);
  x.lineJoin = 'round'; x.fillStyle = v('--red'); x.fillText(p.name, 96, 852);
  x.lineWidth = 18; x.strokeStyle = '#17130f'; x.strokeText(p.name, 88, 844); x.fillStyle = '#f8cf12'; x.fillText(p.name, 88, 844);
  x.fillStyle = v('--red'); x.font = `44px ${fb}`; x.fillText(stars(p.stars), 76, 920);
  x.fillStyle = v('--ink'); x.font = `700 36px ${fb}`; let y = 980;
  for (const ln of wrapText(x, p.epithet, 920)) { x.fillText(ln, 76, y); y += 46; }
  y += 14;
  for (const [k, val] of [[TX.fHome, p.home], [TX.fSkill, p.skill], [TX.fWeak, p.weak]]) {
    x.fillStyle = v('--dim'); x.font = `24px ${fb}`; x.fillText(k, 76, y);
    x.fillStyle = v('--ink'); x.font = `700 30px ${fb}`;
    const lines = wrapText(x, val, 760).slice(0, 2);
    lines.forEach((ln, i) => x.fillText(ln, 236, y + i * 38));
    y += Math.max(1, lines.length) * 38 + 14;
  }
  x.fillStyle = v('--dim'); x.font = `24px ${fb}`;
  x.fillText(`${p.a} × ${p.b} · ${p.method}`, 76, Ht - 78);
  const site = SHARE_BASE.replace(/^https?:\/\//, '').replace(/\/$/, ''); x.fillText(site, W - 76 - x.measureText(site).width, Ht - 78);
  return cv;
}
let shotUrl = null, shotFile = null;
function openShot() {
  if (!S.cur || S.busy) return;
  sfx.unlock(); sfx.click();
  const done = () => drawCard().toBlob(b => {
    if (!b) return;
    if (shotUrl) URL.revokeObjectURL(shotUrl);
    shotUrl = URL.createObjectURL(b); shotFile = new File([b], 'kaiju.png', { type: 'image/png' });
    ui.shotImg.src = shotUrl; ui.shotDl.href = shotUrl; ui.shotDl.download = S.cur.prof.name + '.png';
    ui.shot.showModal();
  }, 'image/png');
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(done, done); else done();
}

/* ---------- 图鉴 ---------- */
let dex = lsGet('stitch-dex', []);
if (!Array.isArray(dex)) dex = [];
dex = dex.filter(d => d && BIO.some(x => x.id === d.a) && MECH.some(x => x.id === d.b));
const dexCache = new Map();
function dexCount() { ui.dexN.textContent = `${dex.length}/${BIO.length * MECH.length}`; }
function record(q) {
  dex = dex.filter(d => !(d.a === q.A.id && d.b === q.B.id));
  dex.unshift({ a: q.A.id, b: q.B.id, seed: q.seed });
  lsSet('stitch-dex', dex); dexCount();
}
function openDex() {
  if (S.busy) return;
  sfx.unlock(); sfx.click();
  ui.dexSub.textContent = TX.dexSub(dex.length, BIO.length * MECH.length);
  ui.dexEmpty.hidden = dex.length > 0;
  shoot(() => {
    ui.dexGrid.innerHTML = dex.map((d, i) => {
      const key = d.a + '|' + d.b + '|' + d.seed;
      if (!dexCache.has(key)) {
        const A = BIO.find(x => x.id === d.a), B = MECH.find(x => x.id === d.b), b = assemble(A, B, d.seed);
        dexCache.set(key, { img: beastThumb(b), p: profile(A, B, d.seed, b.recipe) }); b.dispose();
      }
      const v = dexCache.get(key);
      return `<button class="cell" data-i="${i}"><img src="${v.img}" alt=""><span>${v.p.name}</span><small>${stars(v.p.stars)}</small></button>`;
    }).join('');
  });
  ui.dex.showModal();
}
ui.dexGrid.addEventListener('click', e => {
  const c = e.target.closest('.cell');
  if (!c || S.busy) return;
  const d = dex[+c.dataset.i], a = BIO.findIndex(x => x.id === d.a), b = MECH.findIndex(x => x.id === d.b);
  ui.dex.close(); setMode('custom'); sfx.unlock();
  reelA.spinTo(a, 0.3, 0); reelB.spinTo(b, 0.3, 0);
  fuse(a, b, d.seed);
});

/* ---------- 自选 ---------- */
let thumbA = [], thumbB = [], pickReel = null;
function setMode(m) {
  S.mode = m;
  ui.tabSlot.setAttribute('aria-selected', String(m === 'slot')); ui.tabCustom.setAttribute('aria-selected', String(m === 'custom'));
  ui.app.classList.toggle('mode-custom', m === 'custom'); ui.go.textContent = m === 'slot' ? TX.go : TX.goCustom;
  lsSet('stitch-mode', m);
}
function openPicker(which) {
  if (S.busy) return;
  sfx.unlock(); sfx.click();
  pickReel = which === 'a' ? reelA : reelB;
  const th = which === 'a' ? thumbA : thumbB;
  ui.pickTitle.textContent = which === 'a' ? TX.pickA : TX.pickB;
  ui.pickGrid.innerHTML = pickReel.items.map((it, i) => `<button class="cell" data-i="${i}" aria-current="${i === pickReel.index}"><img src="${th[i] || ''}" alt=""><span>${it.def.name}</span></button>`).join('');
  ui.picker.showModal();
}
ui.pickGrid.addEventListener('click', e => {
  const c = e.target.closest('.cell');
  if (!c || !pickReel) return;
  pickReel.spinTo(+c.dataset.i, 0.3, 0); setMode('custom'); sfx.pick(); ui.picker.close();
});

/* ---------- 事件 ---------- */
ui.go.addEventListener('click', pull);
ui.reroll.addEventListener('click', () => { if (!S.busy) { sfx.unlock(); fuse(reelA.index, reelB.index, newSeed()); } });
ui.tabSlot.addEventListener('click', () => { setMode('slot'); sfx.unlock(); sfx.click(); });
ui.tabCustom.addEventListener('click', () => { setMode('custom'); sfx.unlock(); sfx.click(); });
ui.winA.addEventListener('click', () => openPicker('a'));
ui.winB.addEventListener('click', () => openPicker('b'));
document.querySelectorAll('.step').forEach(b => b.addEventListener('click', () => {
  if (S.busy) return;
  const reel = b.dataset.reel === 'a' ? reelA : reelB;
  reel.spinTo(reel.index + (+b.dataset.d), 0.22, 0); sfx.unlock(); sfx.tick();
}));
ui.dexBtn.addEventListener('click', openDex);
ui.creditBtn.addEventListener('click', () => {
  const row = d => { const c = CREDITS[d.id]; return `<li><b>${d.name}</b><span>${c.title} · ${c.by} · ${c.lic}</span><a href="${c.page}" target="_blank" rel="noopener">${TX.modelPage}</a></li>`; };
  ui.creditList.innerHTML = `<h3>${TX.groupA}</h3><ul>${BIO.map(row).join('')}</ul><h3>${TX.groupB}</h3><ul>${MECH.map(row).join('')}</ul>`;
  sfx.unlock(); sfx.click(); ui.credits.showModal();
});
ui.snd.addEventListener('click', () => { ui.snd.setAttribute('aria-pressed', String(sfx.toggle())); });
ui.langBtn.textContent = L.tag; ui.langBtn.addEventListener('click', nextLang);
ui.shareBtn.addEventListener('click', () => { sfx.unlock(); sfx.click(); share(null); });
ui.imgBtn.addEventListener('click', openShot);
ui.shotShare.addEventListener('click', () => share(shotFile));
window.addEventListener('hashchange', () => {
  const h = readHash();
  if (!h || S.busy || !reelA || (S.cur && S.cur.id === beastId(BIO[h.a], MECH[h.b], h.seed))) return;
  reelA.spinTo(h.a, 0.3, 0); reelB.spinTo(h.b, 0.3, 0); fuse(h.a, h.b, h.seed);
});
ui.snd.setAttribute('aria-pressed', String(sfx.on));
ui.sheetBtn.addEventListener('click', () => { ui.card.classList.add('open'); sfx.unlock(); sfx.click(); });
ui.sheetX.addEventListener('click', () => ui.card.classList.remove('open'));
document.querySelectorAll('dialog').forEach(d => {
  d.addEventListener('click', e => { if (e.target === d || e.target.closest('[data-close]')) d.close(); });
});
document.addEventListener('keydown', e => {
  if (e.code !== 'Space' || e.repeat || document.querySelector('dialog[open]')) return;
  if (e.target.closest && e.target.closest('button, input, textarea, select')) return;
  e.preventDefault(); pull();
});
let drag = null;
ui.stage.addEventListener('pointerdown', e => {
  if (e.target.closest('button')) return;
  drag = { x: e.clientX, y: e.clientY }; ui.stage.setPointerCapture(e.pointerId); ui.stage.classList.add('drag');
});
ui.stage.addEventListener('pointermove', e => {
  if (!drag) return;
  S.yaw += (e.clientX - drag.x) * 0.01; S.pitch = clamp(S.pitch + (e.clientY - drag.y) * 0.004, 0.02, 0.7);
  drag.x = e.clientX; drag.y = e.clientY; S.idle = 0;
});
const endDrag = () => { drag = null; ui.stage.classList.remove('drag'); };
ui.stage.addEventListener('pointerup', endDrag); ui.stage.addEventListener('pointercancel', endDrag);
ui.stage.addEventListener('wheel', e => { e.preventDefault(); S.zoom = clamp(S.zoom * (1 + e.deltaY * 0.001), 0.7, 1.5); }, { passive: false });
window.addEventListener('resize', resize);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

/* ---------- 主循环 ---------- */
function view(elm, scene, camx, fit) {
  const r = elm.getBoundingClientRect(), x = r.left + elm.clientLeft, y = r.top + elm.clientTop, w = elm.clientWidth, h = elm.clientHeight;
  if (w < 2 || h < 2 || y > CH || y + h < 0) return;
  renderer.setViewport(x, CH - y - h, w, h); renderer.setScissor(x, CH - y - h, w, h);
  PSX.snap.set(w / PX / 2, h / PX / 2);
  if (fit) fit(w, h); else { camx.aspect = w / h; camx.updateProjectionMatrix(); }
  renderer.render(scene, camx);
}
let lastT = 0;
function frame(ms) {
  requestAnimationFrame(frame);
  const t = ms / 1000, dt = clamp(t - lastT, 0.001, 0.05);
  lastT = t;
  reelA.update(t); reelB.update(t); updateSeq(t);
  S.idle += dt; S.sway += ((drag || S.idle < 2.5 ? 0 : 1) - S.sway) * Math.min(1, dt * 1.5);
  world.rotation.y = S.yaw + 0.4 + Math.sin(t * 0.4) * 0.45 * S.sway;
  if (S.beast) for (const fn of S.beast.ticks) fn(t);
  updateFx(dt);
  if (!reduce) { S.rot += dt * S.raySpeed; rays.rotation.z = S.rot; }
  renderer.setScissorTest(false); renderer.clear(); renderer.setScissorTest(true);
  view(ui.winA, reelA.scene, reelA.cam); view(ui.winB, reelB.scene, reelB.cam); view(ui.stage, stage, cam, fitCam);
}

/* ---------- 开机：先搬素材，再摆出上次（或默认）那只，不让舞台空着 ---------- */
resize();
busyUI(true); dexCount(); setMode(lsGet('stitch-mode', 'slot') === 'custom' ? 'custom' : 'slot');
window.__stitchReady = true;
ui.loading.textContent = TX.loading + '…';
loadModels([...BIO, ...MECH], (n, all) => { ui.loading.textContent = `${TX.loading} ${n}/${all}`; }).then(() => {
  reelA = new Reel(ui.winA, ui.nameA, BIO, soloModel); reelB = new Reel(ui.winB, ui.nameB, MECH, soloModel);
  applyTheme();
  shoot(() => { thumbA = reelThumbs(reelA); thumbB = reelThumbs(reelB); });
  /* 开机摆哪一只：链接里带着的优先，其次是上次那只，都没有就用默认的 */
  const linked = readHash(), saved = lsGet('stitch-last', null);
  let ia = saved ? BIO.findIndex(x => x.id === saved.a) : 0, ib = saved ? MECH.findIndex(x => x.id === saved.b) : 0, seed0 = saved ? saved.seed >>> 0 : 20261113;
  if (ia < 0 || ib < 0) { ia = 0; ib = 0; seed0 = 20261113; }
  if (linked) { ia = linked.a; ib = linked.b; seed0 = linked.seed; }
  reelA.jump(ia); reelB.jump(ib);
  S.beast = assemble(BIO[ia], MECH[ib], seed0); world.add(S.beast.group);
  const p0 = profile(BIO[ia], MECH[ib], seed0, S.beast.recipe);
  showBanner(p0, false); renderCard(p0); setCurrent(BIO[ia], MECH[ib], seed0, p0);
  ui.loading.hidden = true; S.busy = false; busyUI(false);
  window.__stitch = { S, reelA, reelB, fuse, pull, shoot, beastThumb, reelThumbs };
  requestAnimationFrame(frame);
}).catch(e => { ui.loading.textContent = TX.loadFail; console.error(e); });
})();
