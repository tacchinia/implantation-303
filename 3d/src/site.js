// Terrain, voirie, voisins, végétation, voitures.
import * as THREE from 'three';
import { GEO, SCENARIO } from './data.js';
import { rng, labelTexture } from './textures.js';
import { box, boxUV, railings } from './house.js';

// origine de la scène : centre approximatif du nouveau bâtiment
export const OX = 16, OZ = 36;
export const w2 = (x, y) => [x - OX, y - OZ];
const CENTER = [15.6, 36.6];               // centre du bâtiment (plan)
const VIEW_AXES = [308, 18, 96, 192, 262]; // azimuts des vues prédéfinies
const D2R = Math.PI / 180;

// ─── géométrie 2D ─────────────────────────────────────────────────────────
function pointInPoly([x, y], poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function distSeg([px, py], [ax, ay], [bx, by]) {
  const vx = bx - ax, vy = by - ay, L = vx * vx + vy * vy;
  let t = L ? ((px - ax) * vx + (py - ay) * vy) / L : 0; t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * vx), py - (ay + t * vy));
}
function distPolyline(p, pts, closed = false) {
  let d = Infinity;
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++) d = Math.min(d, distSeg(p, pts[i], pts[(i + 1) % pts.length]));
  return d;
}
function extendLine(pts, ext) {
  const a = pts[0], b = pts[1], y = pts[pts.length - 1], z = pts[pts.length - 2];
  const la = Math.hypot(a[0] - b[0], a[1] - b[1]), lz = Math.hypot(y[0] - z[0], y[1] - z[1]);
  return [[a[0] + (a[0] - b[0]) / la * ext, a[1] + (a[1] - b[1]) / la * ext], ...pts,
    [y[0] + (y[0] - z[0]) / lz * ext, y[1] + (y[1] - z[1]) / lz * ext]];
}

// Ruban posé au sol le long d'une polyligne (UV en mètres)
function ribbon(pts, width, y, closed = false) {
  const P = pts.map(([x, z]) => w2(x, z));
  const n = P.length, pos = [], uv = [], idx = [];
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const prev = P[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], next = P[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
    const cur = P[i];
    let d1 = [cur[0] - prev[0], cur[1] - prev[1]], d2 = [next[0] - cur[0], next[1] - cur[1]];
    const n1 = Math.hypot(...d1) || 1, n2 = Math.hypot(...d2) || 1;
    d1 = [d1[0] / n1, d1[1] / n1]; d2 = [d2[0] / n2, d2[1] / n2];
    if (i === 0 && !closed) d1 = d2; if (i === n - 1 && !closed) d2 = d1;
    const t = [d1[0] + d2[0], d1[1] + d2[1]], tl = Math.hypot(...t) || 1;
    const nrm = [-t[1] / tl, t[0] / tl];
    const miter = 1 / Math.max(0.3, nrm[0] * -d1[1] + nrm[1] * d1[0]);
    const hw = (width / 2) * miter;
    if (i > 0) acc += Math.hypot(cur[0] - prev[0], cur[1] - prev[1]);
    pos.push(cur[0] + nrm[0] * hw, y, cur[1] + nrm[1] * hw, cur[0] - nrm[0] * hw, y, cur[1] - nrm[1] * hw);
    uv.push(0, acc, width, acc);
  }
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const a = 2 * i, b = 2 * ((i + 1) % n);
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  // garantir des normales vers le haut
  const nrmA = g.attributes.normal;
  for (let i = 0; i < nrmA.count; i++) nrmA.setXYZ(i, 0, 1, 0);
  return g;
}

function flatPoly(pts, y) {
  const shape = new THREE.Shape(pts.map(([x, z]) => { const [a, b] = w2(x, z); return new THREE.Vector2(a, -b); }));
  const g = new THREE.ShapeGeometry(shape);
  g.rotateX(-Math.PI / 2); g.translate(0, y, 0);
  return g;
}

// ─── végétation ───────────────────────────────────────────────────────────
export const FOLIAGE = {
  summer: ['#4d7a33', '#5d8b3b', '#3e6a32', '#6f9646', '#557f2e'],
  autumn: ['#c07a2c', '#d2a13c', '#a24c26', '#8a8f38', '#b8612b'],
};

function makeTreeFactory(M) {
  const ico = new THREE.IcosahedronGeometry(1, 1);
  const cone = new THREE.ConeGeometry(1, 1, 8);
  const trunkG = new THREE.CylinderGeometry(0.7, 1, 1, 7);
  const add = (grp, geo, mat, x, y, z, sx, sy, sz) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz);
    m.castShadow = true; m.receiveShadow = true; grp.add(m); return m;
  };
  return {
    deciduous(r, H) {
      const g = new THREE.Group(), th = H * 0.38, tr = 0.1 + H * 0.018;
      add(g, trunkG, M.trunk, 0, th / 2, 0, tr, th, tr);
      const cr = H * 0.33, fm = M.foliage[Math.floor(r() * M.foliage.length)];
      const n = 5 + Math.floor(r() * 4);
      for (let i = 0; i < n; i++) {
        const a = r() * Math.PI * 2, d = r() * cr * 0.6, s = cr * (0.55 + r() * 0.4);
        add(g, ico, fm, Math.cos(a) * d, th + cr * 0.7 + (r() - 0.3) * cr * 0.8, Math.sin(a) * d, s, s * 0.85, s);
      }
      return g;
    },
    conifer(r, H) {
      const g = new THREE.Group(), tr = 0.1 + H * 0.012;
      add(g, trunkG, M.trunk, 0, H * 0.1, 0, tr, H * 0.2, tr);
      const R = H * 0.22;
      for (let i = 0; i < 4; i++) {
        const k = 1 - i * 0.22;
        add(g, cone, M.conifer, 0, H * 0.15 + i * H * 0.2 + H * 0.2, 0, R * k, H * 0.42, R * k);
      }
      return g;
    },
    birch(r, H) {
      const g = new THREE.Group();
      add(g, trunkG, M.birch, 0, H * 0.35, 0, 0.09, H * 0.7, 0.09);
      const fm = M.foliage[Math.floor(r() * M.foliage.length)];
      for (let i = 0; i < 4; i++) {
        add(g, ico, fm, (r() - 0.5) * 0.8, H * (0.5 + i * 0.13), (r() - 0.5) * 0.8, H * 0.14, H * 0.2, H * 0.14);
      }
      return g;
    },
    // petits arbustes d'ornement, essences variées (bord de route)
    smallShrub(r, H, sp) {
      const g = new THREE.Group();
      const blobs = (mat, n, spread, sy = 0.85) => {
        for (let i = 0; i < n; i++) {
          const s = H * (0.35 + r() * 0.25);
          add(g, ico, mat, (r() - 0.5) * spread, s * sy * 0.9 + r() * H * 0.25, (r() - 0.5) * spread, s * (0.8 + r() * 0.4), s * sy, s * (0.8 + r() * 0.4));
        }
      };
      switch (sp) {
        case 'buis': blobs(M.shrubs.buis, 2 + Math.floor(r() * 2), H * 0.35, 0.9); break;
        case 'berberis': blobs(M.shrubs.berberis, 3, H * 0.5); break;
        case 'spiree': blobs(M.shrubs.spiree, 4, H * 0.7, 0.7); break;
        case 'lavande':
          for (let i = 0; i < 7; i++) {
            const a = r() * 6.3, d = r() * H * 0.45;
            add(g, ico, i < 3 ? M.shrubs.lavandeLeaf : M.shrubs.lavande, Math.cos(a) * d, H * (0.3 + r() * 0.35), Math.sin(a) * d, H * 0.22, H * 0.35, H * 0.22);
          }
          break;
        case 'cornouiller':
          for (let i = 0; i < 7; i++) {
            const m = add(g, trunkG, M.shrubs.cornStem, (r() - 0.5) * H * 0.4, H * 0.4, (r() - 0.5) * H * 0.4, 0.018, H * 0.8, 0.018);
            m.rotation.set((r() - 0.5) * 0.5, 0, (r() - 0.5) * 0.5);
          }
          blobs(M.shrubs.cornLeaf, 3, H * 0.6, 0.6);
          break;
        case 'thuya': add(g, cone, M.shrubs.thuya, 0, H * 0.5, 0, H * 0.28, H, H * 0.28); break;
        case 'graminee':
          for (let i = 0; i < 9; i++) {
            const m = add(g, cone, M.shrubs.graminee, (r() - 0.5) * H * 0.3, H * 0.45, (r() - 0.5) * H * 0.3, 0.06, H * 0.9, 0.06);
            m.rotation.set((r() - 0.5) * 0.6, 0, (r() - 0.5) * 0.6);
          }
          break;
      }
      return g;
    },
    shrub(r, H) {
      const g = new THREE.Group(), fm = M.foliage[Math.floor(r() * M.foliage.length)];
      for (let i = 0; i < 3; i++) add(g, ico, fm, (r() - 0.5) * H, H * 0.45, (r() - 0.5) * H, H * 0.6, H * 0.5, H * 0.6);
      return g;
    },
  };
}

// ─── voiture stylisée ─────────────────────────────────────────────────────
function makeCar(M, color) {
  const g = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.5 });
  g.add(box(1.8, 0.62, 4.4, body, 0, 0.62, 0));
  const cab = box(1.6, 0.5, 2.3, M.carGlass, 0, 1.17, 0.15); g.add(cab);
  g.add(box(1.5, 0.05, 2.1, body, 0, 1.44, 0.15));
  const wheel = new THREE.CylinderGeometry(0.33, 0.33, 0.24, 16);
  for (const [x, z] of [[-0.82, 1.4], [0.82, 1.4], [-0.82, -1.4], [0.82, -1.4]]) {
    const w = new THREE.Mesh(wheel, M.tyre); w.rotation.z = Math.PI / 2; w.position.set(x, 0.33, z); w.castShadow = true; g.add(w);
  }
  for (const x of [-0.6, 0.6]) g.add(box(0.3, 0.1, 0.05, M.lamp, x, 0.78, -2.2));
  return g;
}

// ─── assemblage du site ───────────────────────────────────────────────────
export function buildSite(M, scene) {
  const groups = { trees: new THREE.Group(), cars: new THREE.Group(), neighbors: new THREE.Group(), limits: new THREE.Group(), people: new THREE.Group() };
  const root = new THREE.Group();
  Object.values(groups).forEach((g) => root.add(g));
  scene.add(root);

  // pelouse
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), M.grass);
  ground.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = v * 700; });
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  root.add(ground);

  // Rue de la Mairie (entre road_w et road_e), prolongée
  const rw = extendLine(GEO.road_w, 120), re = extendLine(GEO.road_e, 120);
  const road = new THREE.Mesh(flatPoly([...rw, ...re.slice().reverse()], 0.01), M.asphalt);
  road.receiveShadow = true; root.add(road);
  // bordures
  for (const line of [rw, re]) {
    const b = new THREE.Mesh(ribbon(line, 0.18, 0.05), M.curb); b.receiveShadow = true; root.add(b);
  }
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.1), new THREE.MeshBasicMaterial({ map: labelTexture('RUE DE LA MAIRIE'), transparent: true, depthWrite: false }));
  lbl.rotation.set(-Math.PI / 2, 0, Math.PI / 2 - 3.5 * D2R);
  const [lx, lz] = w2(4.6, 40); lbl.position.set(lx, 0.03, lz); root.add(lbl);

  // les pavés gazon s'arrêtent à la limite est de la parcelle (segment E2–E3 longeant l'accès)
  {
    const [ax, az] = w2(25.01, 22.299), [bx, bz] = w2(23.281, 36.161), [ix, iz] = w2(15, 30);
    const n = new THREE.Vector3(bz - az, 0, -(bx - ax)).normalize();
    if (n.x * (ix - ax) + n.z * (iz - az) < 0) n.negate();          // normale vers l'intérieur
    M.grassPaver.clippingPlanes = [new THREE.Plane(n, -(n.x * ax + n.z * az))];
  }
  // accès en pavés gazon + places de parc
  const acc = new THREE.Mesh(ribbon(SCENARIO.route.pts, SCENARIO.route.width, 0.02), M.grassPaver);
  acc.receiveShadow = true; root.add(acc);
  for (const p of SCENARIO.parkings) {
    const m = box(p.w, 0.05, p.h, M.grassPaver);
    const [x, z] = w2(p.x, p.y); m.position.set(x, 0.0, z); m.rotation.y = -p.rot * D2R; m.castShadow = false;
    root.add(m);
    const t = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), new THREE.MeshBasicMaterial({ map: labelTexture(p.label, { w: 256, h: 128, font: '700 90px Archivo, Arial, sans-serif', color: 'rgba(255,255,255,.8)' }), transparent: true, depthWrite: false }));
    t.rotation.set(-Math.PI / 2, 0, -p.rot * D2R); t.position.set(x, 0.04, z + 1.6); root.add(t);
  }
  // terrasse de la maison 169 : en hauteur, au niveau du 1er étage, sur deux piliers bois
  {
    const p = SCENARIO.terrace169, hw = p.w / 2, hd = p.h / 2, top = 2.8;
    const t = new THREE.Group();
    const [x, z] = w2(p.x, p.y); t.position.set(x, 0, z); t.rotation.y = -p.rot * D2R;
    t.add(box(p.w, 0.08, p.h, M.deck, 0, top - 0.04, 0));
    t.add(box(p.w, 0.2, 0.14, M.timber, 0, top - 0.18, hd - 0.12));      // sommier sud
    for (const sx of [-1, 1]) {
      t.add(box(0.12, 0.2, p.h, M.timber, sx * (hw - 0.1), top - 0.18, 0)); // solives de rive
      t.add(box(0.16, top - 0.28, 0.16, M.timber, sx * (hw - 0.15), (top - 0.28) / 2, hd - 0.15)); // piliers
    }
    t.add(railings([
      { a: [-hw + 0.03, -hd, top], b: [-hw + 0.03, hd - 0.03, top] },
      { a: [-hw + 0.03, hd - 0.03, top], b: [hw - 0.03, hd - 0.03, top] },
      { a: [hw - 0.03, hd - 0.03, top], b: [hw - 0.03, -hd, top] },
    ], M.metal));
    t.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    groups.neighbors.add(t);
  }
  // abords pavés de la maison 169 : tout le côté est jusqu'à la limite, et au sud, de la rue
  // jusqu'à la limite est. Au sud, le bord suit l'alignement des places P5/P6 (largeur variable
  // selon les décrochements de la façade) ; le dessous de la terrasse est pavé.
  {
    const pave = new THREE.Mesh(flatPoly([
      [22.852, 5.309], [27.884, 5.227], [26.24, 19.58], [9.78, 18.73],             // est, limite est, alignement P5/P6
      [10.08, 16.2], [10.756, 16.177], [15.251, 16.386], [15.251, 17.442],          // façade sud (décrochements)
      [19.712, 17.543], [19.761, 16.475], [22.594, 16.531],
    ], 0.03), M.pavedEast);
    pave.receiveShadow = true; root.add(pave);
  }

  // limites de parcelle (ruban clair)
  const lim = new THREE.Mesh(ribbon(GEO.parcel303, 0.1, 0.06, true), M.limit);
  groups.limits.add(lim);
  for (const p of GEO.parcel303) {
    const [x, z] = w2(...p); groups.limits.add(box(0.12, 0.25, 0.12, M.limitPost, x, 0.12, z));
  }

  // bâtiments voisins (volumes schématiques)
  const neighbor = (pts, h, roofH) => {
    const shape = new THREE.Shape(pts.map(([x, z]) => { const [a, b] = w2(x, z); return new THREE.Vector2(a, -b); }));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, [M.neighborRoof, M.neighbor]);
    m.castShadow = m.receiveShadow = true; groups.neighbors.add(m);
    if (roofH) {
      const cap = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: false }).rotateX(-Math.PI / 2), M.neighborRoof);
      cap.position.y = h; groups.neighbors.add(cap);
    }
  };
  neighbor(GEO.house169, 6.8, true);
  neighbor(GEO.house165, 6.5, true);
  neighbor(GEO.tl_bldg, 5.5, true);

  // obstacles pour la végétation
  const bRect = (() => {
    const { x, y, rot } = SCENARIO.building, a = rot * D2R, c = Math.cos(a), s = Math.sin(a);
    return [[-2, -2], [11, -2], [11, 17.5], [-2, 17.5]].map(([u, v]) => [x + u * c - v * s, y + u * s + v * c]);
  })();
  const blocked = (p, margin) => {
    for (const poly of [GEO.house169, GEO.house165, GEO.tl_bldg, bRect]) {
      if (pointInPoly(p, poly) || distPolyline(p, poly, true) < margin) return true;
    }
    if (distPolyline(p, SCENARIO.route.pts) < SCENARIO.route.width / 2 + margin * 0.6) return true;
    if (pointInPoly(p, [...rw, ...re.slice().reverse()]) || distPolyline(p, rw) < 1.2 || distPolyline(p, re) < 1.2) return true;
    for (const k of SCENARIO.parkings) if (Math.hypot(p[0] - k.x, p[1] - k.y) < 3.5 + margin * 0.3) return true;
    return false;
  };

  const F = makeTreeFactory(M);
  const r = rng(303);
  const place = (kind, mx, my, H) => {
    const t = F[kind](r, H); const [x, z] = w2(mx, my);
    t.position.set(x, 0, z); t.rotation.y = r() * Math.PI * 2; groups.trees.add(t);
  };
  // arbres choisis dans la parcelle
  place('birch', 21.4, 45.8, 8);          // bouleau, coin sud-est
  place('shrub', 16.5, 47.4, 1.4);
  place('shrub', 12.5, 48.6, 1.2);
  // lignée d'arbres au nord de l'accès : limite entre ancienne et nouvelle maison
  for (let i = 0; i < 4; i++) place('deciduous', 16.4 + i * 2.1, 23.45 + i * 0.11, 5.2 + r() * 0.8);
  // petits arbres dans la pelouse au sud de la maison 169
  place('deciduous', 18.0, 21.3, 3.6);
  place('birch', 24.3, 21.0, 4.2);
  place('deciduous', 9.75, 23.2, 3.2);
  // semis aléatoire autour de la parcelle
  let n = 0, guard = 0;
  while (n < 24 && guard++ < 4000) {
    const p = [-28 + r() * 95, -22 + r() * 100];
    if (pointInPoly(p, GEO.parcel303) || blocked(p, 2.2)) continue;
    if (Math.hypot(p[0] - CENTER[0], p[1] - CENTER[1]) < 22) continue; // dégager les abords
    // garder dégagés les axes des points de vue (centre du bâtiment → caméra)
    if (VIEW_AXES.some((az) => distSeg(p, CENTER, [CENTER[0] + Math.sin(az * D2R) * 34, CENTER[1] - Math.cos(az * D2R) * 34]) < 5)) continue;
    const k = r();
    place(k < 0.5 ? 'deciduous' : k < 0.75 ? 'conifer' : k < 0.88 ? 'birch' : 'shrub', p[0], p[1], k < 0.88 ? 6 + r() * 9 : 1.2 + r());
    n++;
  }
  // limite sud : muret de 30 cm de haut, 15 cm de large (côté intérieur de la limite)
  {
    const [a, b] = GEO.boundaries.south, [ax, az] = w2(...a), [bx, bz] = w2(...b);
    const L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L, h = 0.3, th = 0.15;
    const m = new THREE.Mesh(boxUV(new THREE.BoxGeometry(L, h, th), L, h, th), M.lowWall);
    m.position.set((ax + bx) / 2 - uz * th / 2, h / 2, (az + bz) / 2 + ux * th / 2);
    m.rotation.y = -Math.atan2(uz, ux);
    m.castShadow = m.receiveShadow = true; root.add(m);
  }
  // limite ouest (rue) : petits arbustes irréguliers, essences variées, espacés,
  // du muret sud jusqu'à l'ancienne maison, sauf l'accès de 5 m aux places de parc
  {
    const line = [GEO.boundaries.west[0], GEO.boundaries.west[1], GEO.boundaries.west[2], [10.08, 16.2]];
    const species = ['buis', 'lavande', 'cornouiller', 'thuya', 'spiree', 'berberis', 'graminee'];
    const heights = { buis: [0.5, 0.8], lavande: [0.45, 0.6], cornouiller: [1.0, 1.4], thuya: [0.8, 1.3], spiree: [0.7, 1.0], berberis: [0.6, 0.95], graminee: [0.8, 1.2] };
    const access = SCENARIO.route.pts[0];                 // axe de l'accès à la rue
    let prev = -1, d = 0.6;
    for (let i = 0; i < line.length - 1; i++) {
      const [ax, ay] = line[i], [bx, by] = line[i + 1];
      const L = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / L, uy = (by - ay) / L;
      while (d < L) {
        const inset = 0.3 + r() * 0.25;
        // intérieur de la parcelle : à gauche du sens de parcours (limite parcourue sud → nord)
        const p = [ax + ux * d - uy * inset, ay + uy * d + ux * inset];
        if (Math.abs(p[1] - access[1]) > SCENARIO.route.width / 2 + 0.3) {
          let sp; do { sp = species[Math.floor(r() * species.length)]; } while (sp === prev);
          prev = sp;
          const [h0, h1] = heights[sp], H = h0 + r() * (h1 - h0);
          const t = F.smallShrub(r, H, sp); const [x, z] = w2(...p);
          t.position.set(x, 0, z); t.rotation.y = r() * 6.3; groups.trees.add(t);
        }
        d += 1.1 + r() * 0.8;                             // espacement irrégulier
      }
      d -= L;
    }
  }

  // couronne lointaine (instanciée) pour l'horizon
  {
    const count = 260, crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), M.farFoliage, count);
    const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.3, 1, 6), M.trunk, count);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    let i = 0, tries = 0;
    while (i < count && tries++ < 5000) {
      const a = r() * Math.PI * 2, d = 75 + r() * 190;
      const x = Math.cos(a) * d, z = Math.sin(a) * d;
      if (Math.abs(x + 12) < 9) continue; // la rue traverse du nord au sud
      const H = 7 + r() * 12, R = H * (0.25 + r() * 0.15);
      p.set(x, H * 0.62, z); s.set(R, R * 1.1, R); m4.compose(p, q, s); crown.setMatrixAt(i, m4);
      p.set(x, H * 0.2, z); s.set(1, H * 0.4, 1); m4.compose(p, q, s); trunk.setMatrixAt(i, m4);
      i++;
    }
    crown.count = trunk.count = i;
    groups.trees.add(crown, trunk);
  }

  return { root, groups, makeCar: (c) => makeCar(M, c) };
}
