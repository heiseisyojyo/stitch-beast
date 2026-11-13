'use strict';
/* kit.js：随机数、逐帧动画登记、几样基础几何体和材质。约定：模型朝 +Z，头顶 +Y，地面 y=0。 */
const T = THREE, PI = Math.PI, H = PI / 2;

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (R, a) => a[Math.floor(R() * a.length)];
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/* 搭建时登记逐帧动画，搭完交给主循环去跑 */
let CUR = null;
function begin() { CUR = { ticks: [] }; return CUR; }
function tick(fn) { if (CUR) CUR.ticks.push(fn); }

const _g = new Map();
const G = (k, f) => { let g = _g.get(k); if (!g) { g = f(); _g.set(k, g); } return g; };
function mk(g, m) { const o = new T.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; return o; }
const P = T.Object3D.prototype;
P.at = function (x, y, z) { this.position.set(x, y, z); return this; };
P.rot = function (x, y, z) { this.rotation.set(x, y, z); return this; };
P.sc = function (x, y, z) { this.scale.set(x, y === undefined ? x : y, z === undefined ? x : z); return this; };

const box = (w, h, d, m) => mk(G(`b${w}|${h}|${d}`, () => new T.BoxGeometry(w, h, d)), m);
const ell = (x, y, z, m) => mk(G('s', () => new T.SphereGeometry(1, 28, 20)), m).sc(x, y, z);
const cyl = (rt, rb, h, m, n = 20) => mk(G(`c${rt}|${rb}|${h}|${n}`, () => new T.CylinderGeometry(rt, rb, h, n)), m);
const cone = (r, h, m, n = 16) => mk(G(`k${r}|${h}|${n}`, () => new T.ConeGeometry(r, h, n)), m);
const grp = (...k) => { const g = new T.Group(); k.flat().forEach(x => x && g.add(x)); return g; };

/* PS1 味的三件事：顶点吸附到低分辨率像素格（一动就抖）、颜色压到 15 位再加有序抖点、贴图不做平滑。
   场景里每个材质都要过一遍 psx()；克隆出来的材质要重新过一遍。uSnap 由主循环按当前视口填。 */
const PSX = { snap: new T.Vector2(160, 120) };
const PSX_VERT = `#include <project_vertex>
{ vec3 ndc = gl_Position.xyz / gl_Position.w; ndc.xy = floor(ndc.xy * uSnap + 0.5) / uSnap; gl_Position = vec4(ndc * gl_Position.w, gl_Position.w); }`;
const PSX_FRAG = `#include <dithering_fragment>
{ vec2 fc = floor(gl_FragCoord.xy), hc = floor(fc * 0.5);
  float bayer = fract(hc.x / 2.0 + hc.y * hc.y * 0.75) * 0.25 + fract(fc.x / 2.0 + fc.y * fc.y * 0.75);
  gl_FragColor.rgb = floor(gl_FragColor.rgb * 31.0 + bayer) / 31.0; }`;
function psxCompile(sh) {
  sh.uniforms.uSnap = { value: PSX.snap };
  sh.vertexShader = 'uniform vec2 uSnap;\n' + sh.vertexShader.replace('#include <project_vertex>', PSX_VERT);
  sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', PSX_FRAG);
}
function psx(m) { m.onBeforeCompile = psxCompile; return m; }
const lin = c => new T.Color(c).convertSRGBToLinear();

const _m = new Map();
function M(color, o) {
  const key = color + (o ? JSON.stringify(o) : '');
  let m = _m.get(key);
  if (!m) {
    m = psx(new T.MeshLambertMaterial({ color: lin(color), side: o && o.ds ? T.DoubleSide : T.FrontSide }));
    _m.set(key, m);
  }
  return m;
}
function ctex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.wrapS = t.wrapT = T.RepeatWrapping;
  t.magFilter = t.minFilter = T.NearestFilter; t.generateMipmaps = false;
  return t;
}

const K = {
  eyeW: M('#ffffff'), black: M('#15131a'),
  thread: M('#17130f'),              // 缝线
  flesh: M('#e9776d', { ds: 1 }),    // 生物的切口
  metal: M('#4b515c', { ds: 1 }),    // 物件的切口
};
