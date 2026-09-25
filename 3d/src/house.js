// Modèle du nouveau bâtiment, repère local :
//   u = axe est (0 → 9 m, façade ouest à u = 0), v = axe sud (0 → 15,3 m, nord à v = 0),
//   h = hauteur au-dessus du terrain (±0,00).
// three.js : x = u, y = h, z = v. Le groupe est ensuite posé et tourné selon l'implantation.
//
// Relevé des plans (sans cotes, mis à l'échelle sur l'emprise 9,0 × 15,3 m) :
//  · rez (appartement 1) : v 4,8 → 15,3 ; au nord, 3 places couvertes sous la dalle de l'étage ;
//  · étage (appartement 2) : v 1,1 → 15,3, en retrait de 2,07 m côté ouest à partir de v 7,7
//    (terrasse sur le toit du rez) ;
//  · escalier extérieur le long de la façade ouest (v 2,44 → 6,44) puis coursive jusqu'au sud ;
//  · toit à deux pans décalés (35 %), faîte haut côté ouest, ressaut au droit de u ≈ 5,15 ;
//  · auvent en tuiles au-dessus de l'entrée du couvert (nord).
import * as THREE from 'three';

export const W = 9.0, LEN = 15.3;
export const L1 = 2.85;            // niveau fini de l'étage / dessus des murs du rez
const P = 0.35;                    // pente 35 %
const ALPHA = Math.atan(P);
export const hw = (u) => 5.5 + (u + 0.7) * P;   // sous-face pan ouest (égout à u = -0,7)
export const he = (u) => 5.4 + (9.7 - u) * P;   // sous-face pan est (égout à u = 9,7)
const US = 5.15;                   // ressaut entre les deux pans
const T = 0.35;                    // épaisseur des murs
const CLAD = 0.028;                // épaisseur du bardage

// ─── utilitaires ──────────────────────────────────────────────────────────
export function boxUV(geo, w, h, d) {
  const uv = geo.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
    const i = f * 4 + k;
    uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]);
  }
  return geo;
}
export function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(boxUV(new THREE.BoxGeometry(w, h, d), w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
// boîte définie par ses bornes u, h, v
function boxB(u0, u1, h0, h1, v0, v1, mat) {
  return box(u1 - u0, h1 - h0, v1 - v0, mat, (u0 + u1) / 2, (h0 + h1) / 2, (v0 + v1) / 2);
}

const BASIS = {
  S: { sx: [1, 0, 0], n: [0, 0, 1] },
  N: { sx: [-1, 0, 0], n: [0, 0, -1] },
  E: { sx: [0, 0, -1], n: [1, 0, 0] },
  W: { sx: [0, 0, 1], n: [-1, 0, 0] },
};
function wallMatrix(dir, face) {
  const b = BASIS[dir];
  const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(...b.sx), new THREE.Vector3(0, 1, 0), new THREE.Vector3(...b.n));
  const o = { S: [0, face], N: [W, face], E: [face, LEN], W: [face, 0] }[dir];
  m.setPosition(o[0], 0, o[1]);
  return m;
}

function wallShape(outline, holes, extend = 0) {
  let pts = outline;
  if (extend) {
    const sMin = Math.min(...outline.map((p) => p[0])), sMax = Math.max(...outline.map((p) => p[0]));
    pts = outline.map(([s, h]) => [s === sMin ? s - extend : s === sMax ? s + extend : s, h]);
  }
  const shape = new THREE.Shape(pts.map(([s, h]) => new THREE.Vector2(s, h)));
  const hMin = Math.min(...outline.map((p) => p[1]));
  for (const o of holes) {
    const h0 = Math.max(o.h[0], hMin + 0.03);
    const p = new THREE.Path();
    p.moveTo(o.s[0], h0); p.lineTo(o.s[1], h0); p.lineTo(o.s[1], o.h[1]); p.lineTo(o.s[0], o.h[1]); p.closePath();
    shape.holes.push(p);
  }
  return shape;
}

function polyArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; }
  return Math.abs(a) / 2;
}

// ─── définition des murs ──────────────────────────────────────────────────
// key : groupe de façade pour le bardage ; s : abscisse le long de la façade (voir wallMatrix).
const rect = (s0, s1, h0, h1) => [[s0, h0], [s1, h0], [s1, h1], [s0, h1]];
export const WALLS = [
  // REZ
  { key: 'S_rdc', dir: 'S', face: LEN, outline: rect(0, W, 0, L1),
    holes: [{ s: [1.4, 4.17], h: [0, 2.1], t: 'slide' }, { s: [5.97, 7.76], h: [0, 2.1], t: 'slide' }] },
  { key: 'N_rdc', dir: 'N', face: 4.8, outline: rect(0, W, 0, L1),
    holes: [{ s: [6.1, 6.95], h: [0, 2.1], t: 'door' }, { s: [7.5, 8.1], h: [1.5, 2.1], t: 'vent' }] },
  { key: 'W_rdc', dir: 'W', face: 0, outline: rect(4.8 + T, LEN - T, 0, L1),
    holes: [{ s: [6.2, 6.75], h: [1.35, 1.95], t: 'vent' }, { s: [7.73, 8.65], h: [0, 2.15], t: 'door' },
      { s: [9.8, 10.8], h: [1.2, 2.15], t: 'win' }, { s: [12.5, 13.6], h: [0, 2.15], t: 'slide' }] },
  { key: 'E_rdc', dir: 'E', face: W, outline: rect(T, LEN - 4.8 - T, 0, L1),
    holes: [{ s: [4.3, 5.0], h: [1.3, 2.2], t: 'win' }, { s: [6.8, 7.9], h: [1.1, 2.2], t: 'win' }] },
  // ÉTAGE
  { key: 'N_up', dir: 'N', face: 1.1,
    outline: [[0, L1], [W, L1], [W, hw(0)], [W - US, hw(US)], [W - US, he(US)], [0, he(W)]],
    holes: [{ s: [2.7, 3.6], h: [4.05, 5.0], t: 'win' }] },
  { key: 'S_up', dir: 'S', face: LEN,
    outline: [[2.07, L1], [W, L1], [W, he(W)], [US, he(US)], [US, hw(US)], [2.07, hw(2.07)]],
    holes: [{ s: [3.1, 4.3], h: [3.85, 5.0], t: 'win' }, { s: [5.87, 7.8], h: [3.85, 5.0], t: 'win' }] },
  { key: 'E_up', dir: 'E', face: W, outline: rect(T, LEN - 1.1 - T, L1, he(W)),
    holes: [{ s: [0.94, 2.23], h: [3.95, 5.2], t: 'win' }, { s: [3.45, 4.75], h: [3.95, 5.2], t: 'win' },
      { s: [6.16, 8.04], h: [3.95, 5.2], t: 'win' }, { s: [9.55, 10.4], h: [3.95, 5.2], t: 'win' }] },
  { key: 'W_up', dir: 'W', face: 0, outline: [[1.1 + T, L1], [7.7 - T, L1], [7.7 - T, hw(0)], [1.1 + T, hw(0)]],
    holes: [{ s: [3.0, 4.2], h: [3.9, 5.1], t: 'win' }, { s: [4.6, 5.9], h: [3.9, 5.1], t: 'win' }] },
  { key: 'W_up', dir: 'S', face: 7.7, outline: [[0, L1], [2.07, L1], [2.07, hw(2.07)], [0, hw(0)]], holes: [] },
  { key: 'W_up', dir: 'W', face: 2.07, outline: [[7.7, L1], [LEN - T, L1], [LEN - T, hw(2.07)], [7.7, hw(2.07)]],
    holes: [{ s: [8.45, 9.4], h: [L1, 5.0], t: 'door' }, { s: [10.8, 13.85], h: [L1, 5.05], t: 'slide' }] },
];

export const FACADES = [
  { id: 'N', name: 'Nord', sub: 'couvert / pignon', keys: ['N_rdc', 'N_up'] },
  { id: 'E', name: 'Est', sub: 'longue façade', keys: ['E_rdc', 'E_up'] },
  { id: 'S', name: 'Sud', sub: 'jardin', keys: ['S_rdc', 'S_up'] },
  { id: 'W', name: 'Ouest', sub: 'escalier, terrasse', keys: ['W_rdc', 'W_up'] },
];
export const KEY_LABEL = {
  N_rdc: 'Nord · fond du couvert', N_up: 'Nord · étage (pignon)', E_rdc: 'Est · rez', E_up: 'Est · étage',
  S_rdc: 'Sud · rez', S_up: 'Sud · étage (pignon)', W_rdc: 'Ouest · rez', W_up: 'Ouest · étage et terrasse',
};

// ─── construction ─────────────────────────────────────────────────────────
export function buildHouse(M) {
  const g = new THREE.Group();
  const clad = {};              // key → [mesh]
  const pickables = [];
  const area = {};

  for (const w of WALLS) {
    const mtx = wallMatrix(w.dir, w.face);
    // mur enduit
    const geo = new THREE.ExtrudeGeometry(wallShape(w.outline, w.holes), { depth: T, bevelEnabled: false });
    geo.translate(0, 0, -T); geo.applyMatrix4(mtx);
    const mesh = new THREE.Mesh(geo, M.render);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.userData.key = w.key;
    g.add(mesh); pickables.push(mesh);
    // bardage mélèze (même découpe, posé devant le mur)
    const cg = new THREE.ExtrudeGeometry(wallShape(w.outline, w.holes, CLAD), { depth: CLAD, bevelEnabled: false });
    cg.applyMatrix4(mtx);
    const cm = new THREE.Mesh(cg, M.larch);
    cm.castShadow = cm.receiveShadow = true;
    cm.visible = false; cm.userData.key = w.key;
    g.add(cm); pickables.push(cm);
    (clad[w.key] ||= []).push(cm);
    const a = polyArea(w.outline) - w.holes.reduce((s, o) => s + (o.s[1] - o.s[0]) * (o.h[1] - o.h[0]), 0);
    area[w.key] = (area[w.key] || 0) + a;
    // menuiseries
    const og = new THREE.Group(); og.matrixAutoUpdate = false; og.matrix.copy(mtx);
    for (const o of w.holes) addOpening(og, o, M);
    g.add(og);
  }

  // dalle au-dessus du couvert, rive de dalle
  g.add(boxB(0, W, L1 - 0.3, L1, 1.1, 4.8, M.render));
  // poteaux du couvert
  g.add(boxB(0.02, 0.24, 0, L1 - 0.3, 1.12, 1.34, M.render));
  g.add(boxB(W - 0.24, W - 0.02, 0, L1 - 0.3, 1.12, 1.34, M.render));

  // terrasse de l'étage + coursive (dalle béton), escalier extérieur
  g.add(boxB(-1.14, 2.07, L1 - 0.2, L1 + 0.05, 7.7, LEN + 0.25, M.concrete));
  g.add(boxB(-1.14, 0, L1 - 0.2, L1 + 0.05, 6.44, 7.7, M.concrete));
  for (const v of [6.5, 9.6, 12.6, LEN + 0.15]) g.add(boxB(-1.12, -1.02, 0, L1 - 0.2, v - 0.05, v + 0.05, M.metal));
  const nR = 17, rise = (L1 + 0.05) / nR, going = 4.0 / 16;
  for (let i = 0; i < 16; i++) {
    const v0 = 2.44 + i * going;
    g.add(boxB(-1.1, -0.06, (i + 1) * rise - 0.05, (i + 1) * rise, v0, v0 + going + 0.02, M.deck));
  }
  // limons
  for (const u of [-1.13, -0.07]) {
    const len = Math.hypot(4.0, L1), lim = box(0.05, 0.28, len, M.metal);
    lim.position.set(u, L1 / 2 - 0.05, 2.44 + 2.0);
    lim.rotation.x = -Math.atan2(L1, 4.0);
    g.add(lim);
  }
  // garde-corps (barreaudage vertical métal)
  const rails = [];
  rails.push({ a: [-1.1, 2.44, rise], b: [-1.1, 6.44, L1 + 0.05] });
  rails.push({ a: [-1.1, 6.44, L1 + 0.05], b: [-1.1, LEN + 0.23, L1 + 0.05] });
  rails.push({ a: [-1.1, LEN + 0.23, L1 + 0.05], b: [2.07, LEN + 0.23, L1 + 0.05] });
  g.add(railings(rails, M.metal));

  // ─── toiture ───
  const roofMats = [M.fascia, M.fascia, M.roof, M.soffit, M.fascia, M.fascia];
  const t = 0.26;
  const slab = (u0, u1, v0, v1, side) => {
    const run = u1 - u0, len = run / Math.cos(ALPHA);
    const m = new THREE.Mesh(boxUV(new THREE.BoxGeometry(len, t, v1 - v0), len, t, v1 - v0), roofMats);
    const uc = (u0 + u1) / 2, hc = (side === 'W' ? hw(uc) : he(uc));
    const nx = side === 'W' ? -Math.sin(ALPHA) : Math.sin(ALPHA), ny = Math.cos(ALPHA);
    m.position.set(uc + nx * t / 2, hc + ny * t / 2, (v0 + v1) / 2);
    m.rotation.z = side === 'W' ? ALPHA : -ALPHA;
    m.castShadow = m.receiveShadow = true;
    return m;
  };
  g.add(slab(-0.7, 5.75, 0.3, 8.65, 'W'));
  g.add(slab(1.2, 5.75, 8.65, LEN + 0.8, 'W'));
  g.add(slab(US, 9.7, 0.3, LEN + 0.8, 'E'));
  // ressaut entre les pans (bandeau bois sombre)
  const hTopE = he(US) + t / Math.cos(ALPHA);
  g.add(boxB(US - 0.12, US + 0.02, hTopE - 0.05, hw(US), 0.3, LEN + 0.8, M.fascia));
  // chevrons apparents sous les avant-toits
  const rafterU = (u0, u1, v, side) => {
    const run = u1 - u0, len = run / Math.cos(ALPHA);
    const m = box(len, 0.14, 0.08, M.soffit);
    const uc = (u0 + u1) / 2, hc = (side === 'W' ? hw(uc) : he(uc)) - 0.07;
    m.position.set(uc, hc, v); m.rotation.z = side === 'W' ? ALPHA : -ALPHA;
    return m;
  };
  for (let v = 1.3; v < 8.6; v += 0.9) g.add(rafterU(-0.66, 0, v, 'W'));
  for (let v = 8.9; v < LEN + 0.7; v += 0.9) g.add(rafterU(1.24, 2.07, v, 'W'));
  for (let v = 0.5; v < LEN + 0.7; v += 0.9) g.add(rafterU(W, 9.66, v, 'E'));
  // chéneaux
  const gutter = (u, h, v0, v1) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, v1 - v0, 10, 1, false, 0, Math.PI), M.metal);
    c.rotation.x = Math.PI / 2; c.rotation.y = Math.PI / 2; c.position.set(u, h, (v0 + v1) / 2); c.castShadow = true;
    return c;
  };
  g.add(gutter(-0.76, hw(-0.7) + 0.05, 0.3, 8.65));
  g.add(gutter(1.14, hw(1.2) + 0.05, 8.65, LEN + 0.8));
  g.add(gutter(9.76, he(9.7) + 0.05, 0.3, LEN + 0.8));
  // descentes d'eau pluviale
  const pipe = (u, v, h) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, h, 8), M.metal); c.position.set(u, h / 2, v); c.castShadow = true; return c; };
  g.add(pipe(W + 0.08, LEN - 0.25, he(W)));
  g.add(pipe(W + 0.08, 1.25, he(W)));
  g.add(pipe(-0.08, LEN - 0.25, L1 - 0.2));

  // auvent tuilé au-dessus de l'entrée du couvert
  {
    const dv = 1.6, dh = 0.55, len = Math.hypot(dv, dh), a = Math.atan2(dh, dv);
    const m = new THREE.Mesh(boxUV(new THREE.BoxGeometry(len, 0.18, 9.6), len, 0.18, 9.6), roofMats);
    m.rotation.set(0, Math.PI / 2, -a, 'YZX');
    m.position.set(W / 2, 3.95 - dh / 2 + 0.09, 1.1 - dv / 2);
    m.castShadow = m.receiveShadow = true;
    g.add(m);
    g.add(boxB(-0.3, W + 0.3, 3.2, 3.4, -0.5, -0.38, M.fascia));
    for (const u of [0.1, W / 2, W - 0.1]) {
      const s = box(0.1, 0.12, 1.5, M.soffit); s.position.set(u, 3.62, 0.35); s.rotation.x = -a; g.add(s);
    }
  }

  return { group: g, clad, pickables, area };
}

// ─── menuiseries ─────────────────────────────────────────────────────────
function addOpening(g, o, M) {
  const [s0, s1] = o.s, h0 = o.h[0], h1 = o.h[1];
  const w = s1 - s0, h = h1 - h0, cx = (s0 + s1) / 2, cy = (h0 + h1) / 2;
  const z = -0.13, f = 0.07, d = 0.09;
  if (o.t === 'vent') {
    g.add(box(w, h, 0.04, M.metal, cx, cy, z));
    for (let y = h0 + 0.06; y < h1 - 0.03; y += 0.07) g.add(box(w - 0.04, 0.02, 0.05, M.frame, cx, y, z + 0.03));
    return;
  }
  // cadre
  g.add(box(w, f, d, M.frame, cx, h1 - f / 2, z));
  g.add(box(f, h, d, M.frame, s0 + f / 2, cy, z));
  g.add(box(f, h, d, M.frame, s1 - f / 2, cy, z));
  if (o.t === 'door') {
    g.add(box(w - 2 * f, h - f, 0.05, M.door, cx, h0 + (h - f) / 2, z));
    // cadre de panneau
    g.add(box(w * 0.5, h * 0.3, 0.02, M.frame, cx, h0 + h * 0.68, z + 0.035));
    g.add(box(w * 0.5, h * 0.3, 0.02, M.frame, cx, h0 + h * 0.3, z + 0.035));
    g.add(box(0.03, 0.18, 0.05, M.metal, s1 - f - 0.1, h0 + 1.05, z + 0.05));
    return;
  }
  g.add(box(w, f, d, M.frame, cx, h0 + f / 2, z));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w - 2 * f, h - 2 * f), M.glass);
  glass.position.set(cx, cy, z); g.add(glass);
  const leaves = o.t === 'slide' ? Math.max(2, Math.round(w / 1.4)) : Math.max(1, Math.min(3, Math.round(w / 0.55)));
  for (let i = 1; i < leaves; i++) g.add(box(0.06, h - 2 * f, d, M.frame, s0 + (w * i) / leaves, cy, z));
  if (o.t === 'win') {
    // tablette alu
    g.add(box(w + 0.06, 0.03, 0.22, M.metal, cx, h0 - 0.015, -0.07));
  }
}

export function railings(list, mat) {
  const g = new THREE.Group();
  const H = 1.0, step = 0.12;
  const bars = [];
  for (const { a, b } of list) {
    const [ua, va, ha] = a, [ub, vb, hb] = b;
    const L = Math.hypot(ub - ua, vb - va);
    const n = Math.max(1, Math.round(L / step));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      bars.push([ua + (ub - ua) * t, va + (vb - va) * t, ha + (hb - ha) * t]);
    }
    // main courante et lisse basse
    for (const off of [H, 0.08]) {
      const len3 = Math.hypot(ub - ua, vb - va, hb - ha);
      const m = box(0.05, 0.04, len3, mat);
      m.position.set((ua + ub) / 2, (ha + hb) / 2 + off, (va + vb) / 2);
      m.lookAt(ub, hb + off, vb);
      g.add(m);
    }
  }
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.02, H, 0.02), mat, bars.length);
  const m4 = new THREE.Matrix4();
  bars.forEach(([u, v, h], i) => { m4.makeTranslation(u, h + H / 2, v); im.setMatrixAt(i, m4); });
  im.castShadow = true;
  g.add(im);
  return g;
}
