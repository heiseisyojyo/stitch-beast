'use strict';
/* fusion.js：把两只真实模型切开再缝上。
   每个模型有一根主轴：横着的（动物、车）沿 Z，头在 +Z；竖着的（植物、冰箱）沿 Y，头在 +Y。
   缝法分两类。
   切开对接（车辆这类适合拦腰切的东西）：
     换头 / 拦腰对接 / 三段夹心   沿同一根轴对接。一横一竖时，身体保持原样，出头的那一方先转 90 度再接
     背上嫁接                     竖的那截种在横的背上，身体不切
   整件安装（不该被切开的东西，由 data.js 里每个物件的 modes 指定，各有权重）：
     wear 整件当头 / carry 整件背在背上 / tailprop 装在尾部 / topper 只取顶上那截装在头顶（会转）
     hang 气囊用绳子吊着生物 / beam 悬在上方用光束吸着生物
   接口的处理：两截在接口附近各自收放到同一个尺寸再对上，切口按真实截面封口，外面包一圈带针脚的布套。
   同一个种子缝出同一只。 */

const AX = { z: { u: 0, v: 1, w: 2 }, y: { u: 0, v: 2, w: 1 } };   // 沿 w 轴切，截面坐标是 (u, v)
const smooth = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);

/* ---------- 截面 ---------- */
/* 平面 w=c 与模型三角形的交线，串成闭合轮廓。交点按「它落在哪条棱上」来对号，不靠坐标四舍五入 */
function cutLoops(tris, axis, c) {
  const { u, v, w } = AX[axis], segs = [], vk = i => tris[i] + ',' + tris[i + 1] + ',' + tris[i + 2];
  for (let i = 0; i < tris.length; i += 9) {
    const d = [tris[i + w] - c, tris[i + 3 + w] - c, tris[i + 6 + w] - c];
    if ((d[0] > 0) === (d[1] > 0) && (d[1] > 0) === (d[2] > 0)) continue;
    const ends = [];
    for (let e = 0; e < 3; e++) {
      let a = i + e * 3, b = i + ((e + 1) % 3) * 3, da = d[e], db = d[(e + 1) % 3];
      if ((da > 0) === (db > 0)) continue;
      let ka = vk(a), kb = vk(b);
      if (ka > kb) { [a, b] = [b, a]; [da, db] = [db, da]; [ka, kb] = [kb, ka]; }
      const t = da / (da - db);
      ends.push({ k: ka + '|' + kb, p: [tris[a + u] + (tris[b + u] - tris[a + u]) * t, tris[a + v] + (tris[b + v] - tris[a + v]) * t] });
    }
    if (ends.length === 2 && ends[0].k !== ends[1].k) segs.push(ends);
  }
  const map = new Map();
  segs.forEach((s, i) => { for (const e of s) { if (!map.has(e.k)) map.set(e.k, []); map.get(e.k).push(i); } });
  const used = new Uint8Array(segs.length), loops = [];
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue;
    used[i] = 1;
    const pts = [segs[i][0].p, segs[i][1].p], start = segs[i][0].k;
    let end = segs[i][1].k;
    for (let guard = 0; guard < 4000 && end !== start; guard++) {
      const j = (map.get(end) || []).find(x => !used[x]);
      if (j === undefined) break;
      used[j] = 1;
      const nx = segs[j][0].k === end ? segs[j][1] : segs[j][0];
      pts.push(nx.p); end = nx.k;
    }
    if (end === start) pts.pop();
    if (pts.length < 3) continue;
    let A = 0, cu = 0, cv = 0, minU = 1e9, maxU = -1e9, minV = 1e9, maxV = -1e9;
    for (let k = 0; k < pts.length; k++) {
      const p = pts[k], q = pts[(k + 1) % pts.length], cr = p[0] * q[1] - q[0] * p[1];
      A += cr; cu += (p[0] + q[0]) * cr; cv += (p[1] + q[1]) * cr;
      minU = Math.min(minU, p[0]); maxU = Math.max(maxU, p[0]); minV = Math.min(minV, p[1]); maxV = Math.max(maxV, p[1]);
    }
    A /= 2;
    if (Math.abs(A) < 0.004) continue;
    loops.push({ pts, area: Math.abs(A), cu: cu / (6 * A), cv: cv / (6 * A), w: maxU - minU, h: maxV - minV });
  }
  return loops.sort((a, b) => b.area - a.area);
}
function ellipseLoop(cu, cv, w, h, n = 12) {
  const pts = [];
  for (let i = 0; i < n; i++) { const a = i / n * PI * 2; pts.push([cu + Math.cos(a) * w / 2, cv + Math.sin(a) * h / 2]); }
  return { pts, area: PI * w * h / 4, cu, cv, w, h };
}
const scaleLoop = (L, cu, cv, fu, fv) => ({ pts: L.pts.map(p => [cu + (p[0] - cu) * fu, cv + (p[1] - cv) * fv]), area: L.area * fu * fv, cu: cu + (L.cu - cu) * fu, cv: cv + (L.cv - cv) * fv, w: L.w * fu, h: L.h * fv });
/* 模型在主轴比例 f 处的截面（带缓存）。main 是面积最大的那一圈，对接时以它为准 */
function section(Mo, f, ax) {
  const axis = ax || (Mo.def.up ? 'y' : 'z'), key = axis + Math.round(f * 1000);
  let s = Mo.sec.get(key);
  if (!s) {
    const { u, v, w } = AX[axis], b0 = Mo.box.min.getComponent(w), c = b0 + (Mo.box.max.getComponent(w) - b0) * f;
    let loops = cutLoops(Mo.tris, axis, c);
    const real = loops.length > 0;
    if (!real) { const sz = Mo.box.getSize(new T.Vector3()), o = Mo.box.getCenter(new T.Vector3()); loops = [ellipseLoop(o.getComponent(u), o.getComponent(v), sz.getComponent(u) * 0.3, sz.getComponent(v) * 0.3)]; }
    s = { axis, c, loops, main: loops[0], real };
    Mo.sec.set(key, s);
  }
  return s;
}
function capGeometry(loops, axis, c) {
  const { u, v, w } = AX[axis], pos = [];
  for (const L of loops) {
    let faces;
    try { faces = T.ShapeUtils.triangulateShape(L.pts.map(p => new T.Vector2(p[0], p[1])), []); } catch (e) { continue; }
    for (const f of faces) for (const k of f) { const p = [0, 0, 0]; p[u] = L.pts[k][0]; p[v] = L.pts[k][1]; p[w] = c; pos.push(p[0], p[1], p[2]); }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
  return g;
}

/* ---------- 布套 ---------- */
const CLOTH = psx(new T.MeshLambertMaterial({
  side: T.DoubleSide,
  map: ctex(32, 16, (x, w, h) => {
    x.fillStyle = '#d6bd88'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#c2a76e'; for (let i = 0; i < w; i += 2) for (let j = (i / 2) % 2; j < h; j += 2) x.fillRect(i, j, 1, 1);   // 布纹
    x.fillStyle = '#3a2a1c'; for (let i = 0; i < w; i += 4) { x.fillRect(i, 2, 2, 2); x.fillRect(i + 2, 12, 2, 2); }           // 两排针脚
  }),
}));
function hull(pts) {   // 凸包，逆时针
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  lo.pop(); up.pop();
  return lo.concat(up);
}
/* 布套：把接口两边的轮廓一起包住的一圈厚带子（凸包拉出厚度，两头封口），两边都从它里面穿出来 */
function collar(pts, cu, cv, axis, c, thick) {
  const { u, v, w } = AX[axis], pos = [], uvs = [], idx = [];
  const hp = hull(pts).map(p => { const dx = p[0] - cu, dy = p[1] - cv, l = Math.hypot(dx, dy) || 1; return [cu + dx * 1.04 + dx / l * 0.03, cv + dy * 1.04 + dy / l * 0.03]; });
  const n = hp.length, put = (pu, pv, pw, tu, tv) => { const q = [0, 0, 0]; q[u] = pu; q[v] = pv; q[w] = pw; pos.push(q[0], q[1], q[2]); uvs.push(tu, tv); };
  let acc = 0;
  for (let i = 0; i <= n; i++) {
    const p = hp[i % n];
    if (i) acc += Math.hypot(p[0] - hp[i - 1][0], p[1] - hp[i - 1][1]);
    put(p[0], p[1], c - thick / 2, acc / 0.45, 0); put(p[0], p[1], c + thick / 2, acc / 0.45, 1);
  }
  for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  for (const side of [-1, 1]) {
    const base = pos.length / 3;
    put(cu, cv, c + side * thick / 2, 0.3, 0.5);
    for (let i = 0; i < n; i++) put(hp[i][0], hp[i][1], c + side * thick / 2, 0.3, 0.5);
    for (let i = 0; i < n; i++) idx.push(base, base + 1 + i, base + 1 + (i + 1) % n);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = new T.Mesh(g, CLOTH); m.castShadow = true; m.receiveShadow = true;
  return m;
}
/* ---------- 切一截 ----------
   保留主轴上 [lo, hi] 这段（0..1 的比例，null 表示那头不切），用裁剪面隐藏其余部分。
   tap = { lo: [fu, fv], hi: [fu, fv] }：让这一截在接口处横向收放到给定倍数，离接口越远越接近原样。 */
function makePiece(Mo, lo, hi, tap, ax) {
  const def = Mo.def, axis = ax || (def.up ? 'y' : 'z'), { u, v, w } = AX[axis];
  const sLo = lo != null ? section(Mo, lo, axis) : null, sHi = hi != null ? section(Mo, hi, axis) : null, cLo = sLo ? sLo.c : -1e9, cHi = sHi ? sHi.c : 1e9;
  const span = Math.min(cHi, Mo.box.max.getComponent(w)) - Math.max(cLo, Mo.box.min.getComponent(w)), Lt = clamp(span * 0.55, 0.2, 0.9);
  const fl = tap && tap.lo, fh = tap && tap.hi;
  const group = new T.Group(), model = new T.Group(), planesL = [], planesW = [], mats = [], geos = [], cuts = {}, box = new T.Box3(), tmp = new T.Vector3(), seen = new Map();
  const capMat = def.cut ? M(def.cut, { ds: 1 }) : def.kind === 'bio' ? K.flesh : K.metal;
  const conv = m => { let c = seen.get(m); if (!c) { c = psx(m.clone()); c.clippingPlanes = planesW; c.clipShadows = true; mats.push(c); seen.set(m, c); } return c; };
  const warp = p => {
    if (fl) { const t = 1 - smooth((p[w] - cLo) / Lt), m = sLo.main; p[u] = m.cu + (p[u] - m.cu) * (1 + (fl[0] - 1) * t); p[v] = m.cv + (p[v] - m.cv) * (1 + (fl[1] - 1) * t); }
    if (fh) { const t = 1 - smooth((cHi - p[w]) / Lt), m = sHi.main; p[u] = m.cu + (p[u] - m.cu) * (1 + (fh[0] - 1) * t); p[v] = m.cv + (p[v] - m.cv) * (1 + (fh[1] - 1) * t); }
  };
  for (const part of Mo.parts) {
    let g = part.geometry;
    if (fl || fh) {
      g = g.clone(); geos.push(g);
      const pos = g.attributes.position, p = [0, 0, 0];
      for (let i = 0; i < pos.count; i++) {
        p[0] = pos.getX(i); p[1] = pos.getY(i); p[2] = pos.getZ(i); warp(p); pos.setXYZ(i, p[0], p[1], p[2]);
        if (p[w] >= cLo && p[w] <= cHi) box.expandByPoint(tmp.set(p[0], p[1], p[2]));
      }
      pos.needsUpdate = true; g.computeBoundingSphere(); g.computeBoundingBox();
    } else {
      const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) { tmp.fromBufferAttribute(pos, i); const t = tmp.getComponent(w); if (t >= cLo && t <= cHi) box.expandByPoint(tmp); }
    }
    const mesh = new T.Mesh(g, Array.isArray(part.material) ? part.material.map(conv) : conv(part.material));
    mesh.castShadow = true; mesh.receiveShadow = true; model.add(mesh);
  }
  const cutAt = (s, keepAbove, f) => {
    planesL.push(new T.Plane(new T.Vector3().setComponent(w, keepAbove ? 1 : -1), keepAbove ? -s.c : s.c)); planesW.push(new T.Plane());
    const loops = f ? s.loops.map(L => scaleLoop(L, s.main.cu, s.main.cv, f[0], f[1])) : s.loops, main = loops[0];
    if (s.real) {
      const geo = capGeometry(loops, axis, s.c), cap = new T.Mesh(geo, capMat);
      cap.castShadow = true; cap.position.setComponent(w, keepAbove ? 0.004 : -0.004); geos.push(geo); group.add(cap);
    }
    for (const L of loops) for (const p of L.pts) { tmp.setComponent(u, p[0]); tmp.setComponent(v, p[1]); tmp.setComponent(w, s.c); box.expandByPoint(tmp); }
    const Pt = new T.Vector3(); Pt.setComponent(u, main.cu); Pt.setComponent(v, main.cv); Pt.setComponent(w, s.c);
    return { c: s.c, loops, main, P: Pt };
  };
  if (sLo) cuts.lo = cutAt(sLo, true, fl);
  if (sHi) cuts.hi = cutAt(sHi, false, fh);
  group.add(model);
  return {
    def, axis, group, model, cuts, box, mats, geos, cLo, cHi,
    update() { group.updateWorldMatrix(true, false); for (let i = 0; i < planesL.length; i++) planesW[i].copy(planesL[i]).applyMatrix4(group.matrixWorld); },
  };
}

/* 物件当脸的时候，给它安一对会乱转的眼睛。从正前方扫一排光线，找出最靠前那块面的宽度，眼睛按这个宽度来摆；
   如果这一截是扁平躺着的（比如平放的手机），正面太薄，就改从上方找，安在顶面靠前的位置。
   要在这一截还没被挪动、缩放之前调用 */
function addEyes(piece, R) {
  const b = piece.box, { w } = AX[piece.axis], Hh = b.max.y - b.min.y, Wd = b.max.x - b.min.x, depth = b.max.z - b.min.z, cx0 = (b.min.x + b.max.x) / 2;
  piece.group.updateMatrixWorld(true);
  const ray = new T.Raycaster(), kept = k => { const t = k.point.getComponent(w); return t >= piece.cLo && t <= piece.cHi; };
  const cast = (o, d) => { ray.set(o, d); const h = ray.intersectObject(piece.model, true).find(kept); return h ? h.point : null; };
  const put = (x, y, z, r, up) => {
    const pupil = ell(r * 0.46, r * 0.46, r * 0.26, K.black), ph = R() * 6, e = grp(ell(r, r, r * 0.55, K.eyeW), pupil).at(x, y, z);
    if (up) e.rotation.x = -H;
    tick(t => { pupil.position.set(Math.sin(t * 6 + ph) * r * 0.3, -r * 0.18 + Math.cos(t * 4.3 + ph) * r * 0.24, r * 0.42); });
    piece.group.add(e);
  };
  if (Hh < 0.32 * Math.max(Wd, depth)) {
    const r = clamp(Wd * 0.15, 0.07, 0.22), dx = Math.max(Wd * 0.22, r * 1.05), z = b.max.z - depth * 0.24, down = new T.Vector3(0, -1, 0);
    for (const sx of [-1, 1]) { const p = cast(new T.Vector3(cx0 + sx * dx, b.max.y + 1, z), down); put(cx0 + sx * dx, (p ? p.y : b.max.y) + r * 0.2, z, r, true); }
    return;
  }
  const dir = new T.Vector3(0, 0, -1), probe = (x, y) => cast(new T.Vector3(x, y, b.max.z + 1), dir);
  let best = null;
  for (const fy of [0.64, 0.52, 0.76, 0.4, 0.3]) {
    const y = b.min.y + Hh * fy, hits = [];
    for (let i = 0; i <= 16; i++) { const p = probe(b.min.x + Wd * i / 16, y); if (p) hits.push(p); }
    if (!hits.length) continue;
    const zmax = Math.max(...hits.map(p => p.z)), front = hits.filter(p => p.z > zmax - Math.max(0.25, depth * 0.2));
    const xl = Math.min(...front.map(p => p.x)), xr = Math.max(...front.map(p => p.x)), cand = { y, zmax, cx: (xl + xr) / 2, span: xr - xl };
    if (!best || cand.span > best.span) best = cand;
    if (cand.span >= 0.25) { best = cand; break; }
  }
  if (!best) best = { y: b.min.y + Hh * 0.64, zmax: b.max.z, cx: cx0, span: Wd * 0.5 };
  const span = Math.max(best.span, 0.22), r = clamp(span * 0.17, 0.07, 0.22), dx = Math.max(span * 0.24, r * 1.05);
  const pl = probe(best.cx - dx, best.y), pr = probe(best.cx + dx, best.y), z = Math.max(pl ? pl.z : best.zmax, pr ? pr.z : best.zmax);
  for (const sx of [-1, 1]) put(best.cx + sx * dx, best.y, z + r * 0.2, r, false);
}

function fitToStage(root, box, lift, ticks) {
  const sz = box.getSize(new T.Vector3()), c = box.getCenter(new T.Vector3());
  const k = Math.min(2.7 / sz.y, 3.4 / sz.x, 3.6 / sz.z);
  root.scale.setScalar(k); root.position.set(-c.x * k, (lift - box.min.y) * k, -c.z * k);
  const holder = new T.Group(); holder.add(root);
  return { group: holder, ticks, h: (sz.y + lift) * k };
}

/* 原型：卷轴里和飞进舞台时用 */
function soloModel(def) {
  const ctx = begin(), Mo = LIB[def.id], g = Mo.root.clone(true), root = new T.Group();
  root.add(g);
  if (def.float) tick(t => { g.position.y = 0.12 + Math.sin(t * 1.8) * 0.08; });
  return fitToStage(root, Mo.box, def.float ? 0.25 : 0, ctx.ticks);
}

/* 从正上方往下找这一截在 (x, z) 处的表面高度；要在它还没被挪动之前调用 */
function topAt(piece, x, z) {
  piece.group.updateMatrixWorld(true);
  const ray = new T.Raycaster(new T.Vector3(x, piece.box.max.y + 1, z), new T.Vector3(0, -1, 0)), h = ray.intersectObject(piece.model, true)[0];
  return h ? h.point.y : piece.box.max.y;
}
/* 两点之间拉一根绳 */
function rope(a, b) {
  const m = new T.Mesh(G('rope', () => new T.CylinderGeometry(0.018, 0.018, 1, 4)), K.thread), d = b.clone().sub(a);
  m.position.copy(a).addScaledVector(d, 0.5); m.scale.y = d.length(); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
  return m;
}
const BEAM = psx(new T.MeshBasicMaterial({ color: lin('#fff27a'), transparent: true, opacity: 0.38, depthWrite: false, side: T.DoubleSide, fog: false }));
const SPECIAL = ['wear', 'carry', 'tailprop', 'topper', 'hang', 'beam'];

function assemble(A, B, seed) {
  const ctx = begin(), R = rng(seed || 1), MA = LIB[A.id], MB = LIB[B.id], same = !!A.up === !!B.up, r = R(), coin = R() < 0.5, boost = 1 + R() * 0.3;
  /* 先按物件自带的装法抽（各有权重），没抽中再走切开对接 */
  let kind = null, acc = 0, X, Y;   // X 出头（或装上去的那件），Y 出身体
  for (const [k, wt] of B.modes || []) { acc += wt; if (r < acc) { kind = k; break; } }
  if (kind) { X = B; Y = A; }
  else {
    const q0 = (r - acc) / Math.max(1e-6, 1 - acc);
    if (!same && q0 < 0.22) { kind = 'rider'; X = A.up ? A : B; Y = A.up ? B : A; }
    else { const q = same ? q0 : (q0 - 0.22) / 0.78; kind = q < 0.2 ? 'sandwich' : q < 0.62 ? 'head' : 'half'; X = coin ? A : B; Y = coin ? B : A; }
  }
  const special = SPECIAL.includes(kind);
  /* 切开对接时若一横一竖：身体保持原样，出头的那一方转 90 度，跟身体同一根轴 */
  const MY = LIB[Y.id], MX = !special && !same && kind !== 'rider' ? turned(LIB[X.id]) : LIB[X.id];
  const hfX = kind === 'half' ? 0.5 : X.hf || 0.4, hfY = kind === 'half' ? 0.5 : Y.hf || 0.4;
  const root = new T.Group(), bodyG = new T.Group(), hp = new T.Group(), mount = new T.Group(), pieces = [], extra = [];   // extra：布套这些现做的几何体
  root.add(bodyG); hp.add(mount);
  const keep = m => { extra.push(m.geometry); return m; };
  const fit = (sb, sh) => clamp(Math.sqrt((sb.w * sb.h) / Math.max(1e-4, sh.w * sh.h)), 0.6, 1.8);
  /* 两边接口各让一半：目标尺寸取两者的几何平均，各自的收放幅度封顶 */
  const meet = (sb, sh, s) => {
    const tw = Math.sqrt(sb.w * sh.w * s), th = Math.sqrt(sb.h * sh.h * s), cl = x => clamp(x, 0.6, 1.6);
    return { b: [cl(tw / sb.w), cl(th / sb.h)], h: [cl(tw / (sh.w * s)), cl(th / (sh.h * s))] };
  };
  /* 同轴接口的布套：在身体那截的坐标里，把两边轮廓一起包住 */
  const seam = (bp, bc, hc, s) => {
    const pts = bc.main.pts.concat(hc ? hc.main.pts.map(p => [bc.main.cu + (p[0] - hc.main.cu) * s, bc.main.cv + (p[1] - hc.main.cv) * s]) : []);
    bp.group.add(keep(collar(pts, bc.main.cu, bc.main.cv, bp.axis, bc.c, 0.16)));
  };
  /* 给装上去的那件垫一圈布：取它底部的水平截面 */
  const saddle = (piece, y, s) => { const L0 = cutLoops(piece.Mo.tris, 'y', y)[0]; if (L0) piece.group.add(keep(collar(L0.pts, L0.cu, L0.cv, 'y', y, 0.12 / s))); };
  let body, head, tail = null, tp = null, eyes = false, sH = 1, sT = 1, float = !!Y.float, spinner = null, still = false;
  const ref = new T.Vector3();   // 装上去那件用哪个点去对锚点（它自己的坐标）

  if (special) {
    const up = !!MA.def.up, hfA = A.hf || 0.4;
    body = kind === 'wear' ? makePiece(MA, null, 1 - hfA) : makePiece(MA, null, null);
    const MO = kind === 'carry' && B.carryTurn ? turned(MB) : MB;
    head = kind === 'topper' ? makePiece(MO, B.topper || 0.72, null, null, 'y') : kind === 'hang' ? makePiece(MO, B.hang || 0.3, null, null, 'y') : makePiece(MO, null, null);
    head.Mo = MO;
    const bb = body.box, hb = head.box, bs = bb.getSize(new T.Vector3()), hs = hb.getSize(new T.Vector3()), bcx = (bb.min.x + bb.max.x) / 2, bcz = (bb.min.z + bb.max.z) / 2;
    hb.getCenter(ref);
    if (kind === 'wear') {            // 生物切掉头，整件东西装在脖子上，脸朝前，配一对眼睛
      addEyes(head, R); eyes = true;
      const bc = body.cuts.hi, sb = bc.main;
      sH = clamp(1.1 * Math.max(sb.w, sb.h) / Math.max(hs.x, hs.y), 0.25, 0.9);   // 头比脖子粗一圈就够，别把身体全挡住
      if (up) ref.y = hb.min.y + hs.y * 0.06; else ref.z = hb.min.z + hs.z * 0.1;
      seam(body, bc, null, 1); hp.position.copy(bc.P);
    } else if (kind === 'carry') {    // 整件背在背上，底下垫一圈布
      sH = clamp(0.75 * Math.max(bs.x, bs.z) / Math.max(hs.x, hs.y, hs.z), 0.35, 1.1) * boost;
      ref.y = hb.min.y + hs.y * 0.05; saddle(head, ref.y + 0.03, sH);
      hp.position.set(bcx, topAt(body, bcx, bcz), bcz); float = float || !!B.carryFloat;
    } else if (kind === 'tailprop') { // 装在尾部，朝后吹
      sH = clamp(0.85 * bs.y / hs.y, 0.3, 1.0) * boost; ref.z = hb.min.z + hs.z * 0.1; mount.rotation.y = PI;
      const zr = up ? bb.min.z + bs.z * 0.15 : bb.min.z + bs.z * 0.06;
      hp.position.set(bcx, bb.min.y + bs.y * (up ? 0.35 : 0.55), zr);
    } else {                          // 顶上的三种：螺旋桨、气囊、飞碟。生物都飘起来
      const hz = up ? bcz : bb.max.z - bs.z * hfA * 0.5, top = topAt(body, bcx, kind === 'topper' ? hz : bcz);
      float = true;
      if (kind === 'topper') {        // 只取顶上那截（螺旋桨），立在头顶上转
        sH = clamp(1.0 * Math.max(bs.x, bs.z) / Math.max(hs.x, hs.z), 0.5, 1.3) * boost;
        ref.y = head.cuts.lo.c; const L0 = head.cuts.lo.main;
        head.group.add(keep(collar(L0.pts, L0.cu, L0.cv, 'y', ref.y, 0.1 / sH)));
        ref.x = L0.cu; ref.z = L0.cv; hp.position.set(bcx, top - 0.03, hz); spinner = mount;
      } else if (kind === 'hang') {   // 气囊悬在上方，四根绳子拴着生物
        sH = clamp(1.5 * Math.max(bs.x, bs.z) / Math.max(hs.x, hs.z), 0.6, 1.6) * boost;
        const c0 = head.cuts.lo, gap = 0.3 + bs.y * 0.1;
        ref.set(c0.main.cu, c0.c, c0.main.cv); hp.position.set(bcx, top + gap, bcz);
        const rim = hull(c0.main.pts), at = new T.Vector3(bcx, top - 0.04, bcz);
        for (let i = 0; i < 4; i++) { const p = rim[Math.floor(i * rim.length / 4)]; bodyG.add(rope(new T.Vector3(bcx + (p[0] - ref.x) * sH, top + gap + 0.02, bcz + (p[1] - ref.z) * sH), at)); }
        still = true;
      } else {                        // 飞碟悬在上方，一道光束罩着生物
        sH = clamp(1.3 * Math.max(bs.x, bs.z) / Math.max(hs.x, hs.z), 0.6, 1.5) * boost;
        const gap = 0.45, y0 = top + gap, hgt = y0 - bb.min.y + 0.4, rT = hs.x * sH * 0.22, rB = Math.max(bs.x, bs.z) * 0.62;
        ref.y = hb.min.y; hp.position.set(bcx, y0, bcz);
        const beam = new T.Mesh(new T.CylinderGeometry(rT, rB, hgt, 12, 1, true), BEAM);
        beam.position.set(bcx, y0 - hgt / 2 + 0.05, bcz); beam.renderOrder = 5; extra.push(beam.geometry); bodyG.add(beam);
      }
    }
  } else if (kind === 'rider') {
    body = makePiece(MY, null, null); head = makePiece(MX, 1 - Math.max(hfX, 0.55), null);
    if (Y.kind === 'mech') { addEyes(body, R); eyes = true; }
    /* 从正上方找到背的高度，把那截种上去，根部包一圈布套 */
    const bb0 = body.box, hb = head.box, hc = head.cuts.lo, xc = (bb0.min.x + bb0.max.x) / 2, zc = (bb0.min.z + bb0.max.z) / 2;
    sH = clamp(0.8 * (bb0.max.x - bb0.min.x) / Math.max(0.2, hb.max.x - hb.min.x), 0.6, 1.5) * boost;
    head.group.add(keep(collar(hc.main.pts, hc.main.cu, hc.main.cv, head.axis, hc.c + 0.03 / sH, 0.14 / sH)));
    ref.copy(hc.P); hp.position.set(xc, topAt(body, xc, zc) - 0.05, zc);
  } else {
    const fX = 1 - (kind === 'sandwich' ? Math.min(hfX, 0.36) : hfX), fY = kind === 'sandwich' ? 0.7 : 1 - hfY;
    const sb = section(MY, fY).main, sh = section(MX, fX).main;
    sH = fit(sb, sh) * boost;
    const m1 = meet(sb, sh, sH), tapB = { hi: m1.b };
    let m2 = null;
    if (kind === 'sandwich') { const sb2 = section(MY, 0.3).main, st = section(MX, 0.3).main; sT = fit(sb2, st); m2 = meet(sb2, st, sT); tapB.lo = m2.b; }
    body = makePiece(MY, kind === 'sandwich' ? 0.3 : null, fY, tapB); head = makePiece(MX, fX, null, { lo: m1.h });
    if (kind === 'sandwich') tail = makePiece(MX, null, 0.3, { hi: m2.h });
    if (X.kind === 'mech') { addEyes(head, R); eyes = true; }
    seam(body, body.cuts.hi, head.cuts.lo, sH);
    ref.copy(head.cuts.lo.P); hp.position.copy(body.cuts.hi.P);
    if (tail) {
      const tc = tail.cuts.hi;
      seam(body, body.cuts.lo, tc, sT);
      tail.group.scale.setScalar(sT); tail.group.position.copy(tc.P).multiplyScalar(-sT);
      tp = new T.Group(); tp.position.copy(body.cuts.lo.P); tp.add(tail.group); bodyG.add(tp);
    }
  }
  pieces.push(body, head); if (tail) pieces.push(tail);
  head.group.scale.setScalar(sH); head.group.position.copy(ref).multiplyScalar(-sH);
  mount.add(head.group);
  bodyG.add(body.group, hp);

  const wagAxis = MY.def.up ? 'z' : 'y';
  tick(t => {
    const sq = float ? 0 : Math.cos(t * 6.6) * 0.035;
    bodyG.position.y = float ? Math.sin(t * 1.6) * 0.1 : Math.abs(Math.sin(t * 3.3)) * 0.1;
    bodyG.scale.set(1 - sq * 0.5, 1 + sq, 1 - sq * 0.5);
    if (spinner) spinner.rotation.y = t * 13;
    else if (still) hp.rotation.set(Math.sin(t * 1.1) * 0.03, 0, Math.sin(t * 0.8) * 0.03);
    else hp.rotation.set(Math.sin(t * 2.3) * 0.07, Math.sin(t * 0.9) * 0.12, Math.sin(t * 1.7) * 0.06);
    if (tp) tp.rotation[wagAxis] = Math.sin(t * 3) * 0.14;
    for (const p of pieces) p.update();
  });

  for (const fn of ctx.ticks) fn(0);
  root.updateMatrixWorld(true);
  const bbx = new T.Box3();
  for (const p of pieces) bbx.union(p.box.clone().applyMatrix4(p.group.matrixWorld));
  const out = fitToStage(root, bbx, float ? 0.4 : 0, ctx.ticks);
  out.recipe = { kind, head: X, body: Y, eyes };
  out.dispose = () => { for (const p of pieces) { p.mats.forEach(m => m.dispose()); p.geos.forEach(g => g.dispose()); } extra.forEach(g => g.dispose()); };
  return out;
}

/* 档案：名字、称号、身高体重、必杀技、弱点、数值、目击报告，全部由种子决定；文字按当前语言（见 i18n.js）拼 */
function profile(A, B, seed, recipe) {
  const R = rng((seed ^ 0x9e3779b9) >>> 0), F = L.fmt, P = L.parts;
  const x = R(), stars = x < 0.4 ? 1 : x < 0.7 ? 2 : x < 0.88 ? 3 : x < 0.97 ? 4 : 5;
  const name = F.name(pick(R, B.pre), A.short, pick(R, L.suffix[stars - 1]));
  const st = [0, 1, 2].map(i => clamp(Math.round((A.stat[i] + B.stat[i]) / 2 + (R() - 0.5) * 22 + stars * 3), 5, 100));
  const X = recipe.head, Y = recipe.body, cls = d => (d.kind === 'bio' ? 'A' : 'B'), k = recipe.kind, row = (label, d) => [label, d.name, cls(d)];
  const second = { carry: P.back, tailprop: P.tailp, topper: P.top, hang: P.above, beam: P.above, rider: P.back }[k];
  const parts = k === 'head' || k === 'wear' ? [row(P.head, X), row(P.body, Y)]
    : k === 'half' ? [row(P.half1, X), row(P.half2, Y)]
      : k === 'sandwich' ? [row(P.head, X), row(P.waist, Y), row(P.tail, X)]
        : [row(P.body, Y), row(second, X)];
  if (recipe.eyes) parts.push([P.eyes, P.eyesVal, 'none']);
  const epithet = F.epithet(pick(R, B.epi), pick(R, A.epi)), height = Math.round(28 + R() * 46 + stars * 7), weight = (0.8 + R() * 5 + stars * 0.9).toFixed(1);
  const skill = F.skill(pick(R, B.atk), pick(R, A.atk)), lore = F.lore(pick(R, A.habit), pick(R, B.quirk));
  return {
    no: BIO.indexOf(A) * MECH.length + MECH.indexOf(B) + 1,
    name, stars, method: L.kind[k], parts, epithet, skill, lore,
    height: F.height(height), weight: F.weight(weight), home: F.home(A.home, B.place), weak: B.weak,
    stats: [st[0], st[1], st[2], Math.round(78 + R() * 22)].map((v, i) => [L.stats[i], v]),
    a: A.name, b: B.name,
  };
}
