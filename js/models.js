'use strict';
/* models.js：载入素材 → 摆正（+Z 为前、+Y 为上）→ 归一化尺寸并落地 → 抽出三角形，供切割时算截面。
   模型以 base64 文本的形式放在 models/<id>.glb.js 里（由 tools/pack.py 生成），用 <script> 载入。
   LIB[id] = { def, root（可克隆的归一化模型）, parts（各网格）, tris（三角形顶点）, box, sec（截面缓存） } */
const LIB = {};
const MODEL_DIR = 'models/';

/* 素材自带的材质换成不带高光的顶点光照材质，贴图取最近点，再过一遍 PS 处理 */
const _conv = new Map();
function toPsx(m) {
  let c = _conv.get(m);
  if (!c) {
    c = psx(new T.MeshLambertMaterial({ color: m.color, map: m.map, vertexColors: m.vertexColors, side: m.side, transparent: m.transparent, opacity: m.opacity, alphaTest: m.alphaTest }));
    if (m.map) { m.map.magFilter = m.map.minFilter = T.NearestFilter; m.map.generateMipmaps = false; m.map.needsUpdate = true; }
    _conv.set(m, c);
  }
  return c;
}

function prepModel(def, scene) {
  const pre = new T.Group();
  pre.add(scene); pre.rotation.set(def.rx || 0, def.yaw || 0, def.rz || 0); pre.updateMatrixWorld(true);
  /* 把每个网格的顶点直接烤进统一坐标系，之后切割、变形都只跟这一套坐标打交道 */
  const raw = [], box = new T.Box3();
  pre.traverse(o => {
    if (!o.isMesh) return;
    let g = o.geometry.clone();
    if (!g.attributes.normal) { if (g.index) g = g.toNonIndexed(); g.computeVertexNormals(); }   // 有些素材不带法线：按面补上，否则光照算不出来
    g.applyMatrix4(o.matrixWorld); g.computeBoundingBox(); box.union(g.boundingBox);
    raw.push({ g, mat: Array.isArray(o.material) ? o.material.map(toPsx) : toPsx(o.material) });
  });
  const size = box.getSize(new T.Vector3()), c = box.getCenter(new T.Vector3());
  const k = (def.size || 2.4) / Math.max(size.x, size.y, size.z);
  const m4 = new T.Matrix4().makeScale(k, k, k).setPosition(-c.x * k, -box.min.y * k, -c.z * k);
  const root = new T.Group(), parts = [], out = [], v = new T.Vector3();
  for (const r of raw) {
    r.g.applyMatrix4(m4); r.g.computeBoundingBox(); r.g.computeBoundingSphere();
    const mesh = new T.Mesh(r.g, r.mat);
    mesh.castShadow = true; mesh.receiveShadow = true; root.add(mesh); parts.push(mesh);
    const pos = r.g.attributes.position, idx = r.g.index, n = idx ? idx.count : pos.count;
    for (let i = 0; i < n; i++) { v.fromBufferAttribute(pos, idx ? idx.getX(i) : i); out.push(v.x, v.y, v.z); }
  }
  const nb = new T.Box3(new T.Vector3((box.min.x - c.x) * k, 0, (box.min.z - c.z) * k), new T.Vector3((box.max.x - c.x) * k, size.y * k, (box.max.z - c.z) * k));
  return { def, root, parts, tris: new Float32Array(out), box: nb, sec: new Map() };
}

/* 把模型转 90 度，得到一份主轴换了方向的副本：竖的躺下（头朝前），横的立起来（头朝上）。
   一横一竖要对接时，出头的那一方用这份副本，这样两边的切口是同一个朝向，能对齐。
   生物：躺下时肚子朝下，立起来时肚子朝前。物件：上下与前后对调，原来的顶面或正面仍然朝外。 */
function turned(Mo) {
  if (Mo.turned) return Mo.turned;
  const def = Mo.def, m = new T.Matrix4(), box = new T.Box3(), out = [], v = new T.Vector3(), root = new T.Group(), parts = [];
  if (def.kind === 'mech') m.set(-1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1);
  else m.makeRotationX(def.up ? H : -H);
  const geos = Mo.parts.map(p => { const g = p.geometry.clone(); g.applyMatrix4(m); g.computeBoundingBox(); box.union(g.boundingBox); return g; });
  const c = box.getCenter(new T.Vector3()), size = box.getSize(new T.Vector3());
  geos.forEach((g, i) => {
    g.translate(-c.x, -box.min.y, -c.z); g.computeBoundingBox(); g.computeBoundingSphere();
    const mesh = new T.Mesh(g, Mo.parts[i].material);
    mesh.castShadow = true; mesh.receiveShadow = true; root.add(mesh); parts.push(mesh);
    const pos = g.attributes.position, idx = g.index, n = idx ? idx.count : pos.count;
    for (let k = 0; k < n; k++) { v.fromBufferAttribute(pos, idx ? idx.getX(k) : k); out.push(v.x, v.y, v.z); }
  });
  const nb = new T.Box3(new T.Vector3(-size.x / 2, 0, -size.z / 2), new T.Vector3(size.x / 2, size.y, size.z / 2));
  Mo.turned = { def: Object.assign({}, def, { up: !def.up }), root, parts, tris: new Float32Array(out), box: nb, sec: new Map() };
  return Mo.turned;
}

function loadModels(defs, onProgress) {
  const loader = new T.GLTFLoader();
  let done = 0;
  window.MODEL_B64 = window.MODEL_B64 || {};
  return Promise.all(defs.map(def => new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = MODEL_DIR + def.id + '.glb.js'; s.async = true;
    s.onerror = () => rej(new Error('模型没载入：' + def.id));
    s.onload = () => {
      const b64 = window.MODEL_B64[def.id];
      delete window.MODEL_B64[def.id]; s.remove();
      if (!b64) { rej(new Error('模型文件是空的：' + def.id)); return; }
      const bin = atob(b64), buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      /* 让载入器用 <img> 解贴图而不是 fetch(blob:)，后者在收紧的内容安全策略下会被拦 */
      const cib = window.createImageBitmap;
      try { window.createImageBitmap = undefined; } catch (e) { /* 改不了就按原样 */ }
      try {
        loader.parse(buf.buffer, '', g => { LIB[def.id] = prepModel(def, g.scene); done++; if (onProgress) onProgress(done, defs.length); res(); }, rej);
      } finally { try { window.createImageBitmap = cib; } catch (e) { /* 同上 */ } }
    };
    document.head.appendChild(s);
  })));
}
