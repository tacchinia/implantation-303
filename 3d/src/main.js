import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import * as TX from './textures.js';
import { buildHouse, FACADES, KEY_LABEL, W, LEN } from './house.js';
import { buildSite, w2, FOLIAGE } from './site.js';
import { SCENARIO } from './data.js';

const D2R = Math.PI / 180;
const $ = (id) => document.getElementById(id);
const isSmall = () => window.matchMedia('(max-width: 760px)').matches;

// ─── rendu ────────────────────────────────────────────────────────────────
const stage = $('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(stage.clientWidth, stage.clientHeight);
renderer.shadowMap.enabled = true;
renderer.localClippingEnabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.62;
renderer.outputColorSpace = THREE.SRGBColorSpace;
stage.appendChild(renderer.domElement);
renderer.domElement.tabIndex = 0;
renderer.domElement.setAttribute('aria-label', 'Vue 3D de la maison');
TX.setMaxAniso(Math.min(8, renderer.capabilities.getMaxAnisotropy()));

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xc9d3d6, 140, 420);
const camera = new THREE.PerspectiveCamera(42, stage.clientWidth / stage.clientHeight, 0.2, 2000);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = 88 * D2R;
controls.minDistance = 3;
controls.maxDistance = 180;
controls.autoRotateSpeed = 0.6;

// ─── matériaux ───────────────────────────────────────────────────────────
const std = (o) => new THREE.MeshStandardMaterial(o);
const larchOpts = { boardW: 0.14, gap: 0.012, age: 0.15 };
const larchTex = TX.larchTextures(larchOpts);
const deckTex = TX.larchTextures({ boardW: 0.14, gap: 0.008, age: 0.35, boards: 8, seed: 5 });
const M = {
  render: std({ map: TX.renderTexture(), color: '#efebe3', roughness: 0.95 }),
  larch: std({ map: larchTex.map, bumpMap: larchTex.bump, bumpScale: 2.5, roughness: 0.82 }),
  deck: std({ map: deckTex.map, bumpMap: deckTex.bump, bumpScale: 1.5, roughness: 0.85 }),
  roof: std({ map: TX.roofTexture(), color: '#4a4c50', roughness: 0.8 }),
  fascia: std({ color: '#3a302a', roughness: 0.8 }),
  soffit: std({ color: '#b78a5c', roughness: 0.85 }),
  frame: std({ color: '#33373b', roughness: 0.5, metalness: 0.3 }),
  door: std({ color: '#33373b', roughness: 0.5, metalness: 0.2 }),
  metal: std({ color: '#3a3e42', roughness: 0.45, metalness: 0.6 }),
  glass: new THREE.MeshPhysicalMaterial({ color: '#27363f', roughness: 0.04, metalness: 0.1, envMapIntensity: 1.4, side: THREE.DoubleSide }),
  grass: std({ map: TX.grassTexture(), roughness: 1 }),
  grassPaver: std({ map: TX.grassPaverTexture(), roughness: 0.95, side: THREE.DoubleSide }),
  asphalt: std({ map: TX.asphaltTexture(), roughness: 0.9 }),
  curb: std({ color: '#b9b6ae', roughness: 0.9, side: THREE.DoubleSide }),
  carportFloor: std({ map: TX.paverTexture(), roughness: 0.9 }),
  slab: std({ map: TX.slabTexture(), roughness: 0.9 }),
  limit: new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false }),
  limitPost: std({ color: '#e8e2d4', roughness: 0.7 }),
  neighbor: std({ color: '#d9d6cf', roughness: 0.95 }),
  neighborRoof: std({ color: '#8d8a86', roughness: 0.9 }),
  trunk: std({ color: '#5a4636', roughness: 1 }),
  birch: std({ color: '#e7e3da', roughness: 0.9 }),
  conifer: std({ color: '#2f4f2e', roughness: 1, flatShading: true }),
  foliage: FOLIAGE.summer.map((c) => std({ color: c, roughness: 1, flatShading: true })),
  farFoliage: std({ color: '#4c6b3a', roughness: 1, flatShading: true }),
  carGlass: std({ color: '#1d2429', roughness: 0.1, metalness: 0.4 }),
  tyre: std({ color: '#1b1b1b', roughness: 0.9 }),
  lamp: std({ color: '#f4f1e8', emissive: '#6d6a60', roughness: 0.3 }),
  concrete: std({ map: TX.renderTexture(), color: '#bdbab3', roughness: 0.9 }),
  lowWall: std({ map: TX.renderTexture(), color: '#c8c4bb', roughness: 0.9 }),
  pavedEast: std({ map: TX.paverTexture('#bdb6a8', 0.2, 0.1, 1.2, 47), roughness: 0.9 }),
  timber: std({ color: '#8a6a4a', roughness: 0.85 }),
  shrubs: {
    buis: std({ color: '#2f5a2c', roughness: 1, flatShading: true }),
    berberis: std({ color: '#6b2a30', roughness: 1, flatShading: true }),
    spiree: std({ color: '#8fb05a', roughness: 1, flatShading: true }),
    lavande: std({ color: '#8b80ad', roughness: 1, flatShading: true }),
    lavandeLeaf: std({ color: '#8f9c86', roughness: 1, flatShading: true }),
    cornStem: std({ color: '#a2342a', roughness: 0.9 }),
    cornLeaf: std({ color: '#6e9448', roughness: 1, flatShading: true }),
    thuya: std({ color: '#3a5f31', roughness: 1, flatShading: true }),
    graminee: std({ color: '#c3b47c', roughness: 1, flatShading: true }),
  },
  person: std({ color: '#5d6770', roughness: 0.85 }),
};


// ─── ciel, soleil, environnement ─────────────────────────────────────────
const sky = new Sky(); sky.scale.setScalar(5000); scene.add(sky);
const su = sky.material.uniforms;
su.turbidity.value = 5; su.rayleigh.value = 1.4; su.mieCoefficient.value = 0.004; su.mieDirectionalG.value = 0.8;
const envSky = new Sky(); envSky.scale.setScalar(5000);
const envScene = new THREE.Scene(); envScene.add(envSky);
Object.keys(su).forEach((k) => { envSky.material.uniforms[k].value = su[k].value; });
const pmrem = new THREE.PMREMGenerator(renderer);
let envRT = null;

const sun = new THREE.DirectionalLight(0xfff4e5, 3.2);
sun.castShadow = true;
const sm = isSmall() ? 2048 : 4096;
sun.shadow.mapSize.set(sm, sm);
Object.assign(sun.shadow.camera, { left: -38, right: 38, top: 38, bottom: -38, near: 1, far: 260 });
sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight(0xdfeaf5, 0x51603f, 0.35);
scene.add(hemi);

const LAT = 46.2; // Suisse romande (hypothèse), heure solaire
function sunAngles(month, hour) {
  const doy = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349][month];
  const decl = 23.44 * Math.sin(D2R * (360 / 365) * (284 + doy));
  const H = 15 * (hour - 12), phi = LAT * D2R, d = decl * D2R, h = H * D2R;
  const el = Math.asin(Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.cos(h));
  let az = Math.atan2(Math.sin(h), Math.cos(h) * Math.sin(phi) - Math.tan(d) * Math.cos(phi)) + Math.PI;
  return { el, az };
}
let envTimer = 0;
function updateSun() {
  const { el, az } = sunAngles(+$('month').value, +$('hour').value);
  const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
  su.sunPosition.value.copy(dir);
  envSky.material.uniforms.sunPosition.value.copy(dir);
  const up = Math.max(0, Math.sin(el));
  sun.intensity = el > 0 ? 3.4 * Math.min(1, up * 3) : 0;
  sun.color.setHSL(0.09, 0.6, 0.62 + Math.min(0.33, up * 0.6));
  hemi.intensity = 0.15 + 0.3 * Math.min(1, up * 2.5);
  const tgt = houseCenter();
  sun.target.position.copy(tgt);
  sun.position.copy(tgt).addScaledVector(dir, 120);
  const hh = +$('hour').value, hs = Math.floor(hh), mn = Math.round((hh - hs) * 60);
  $('hourOut').textContent = `${String(hs).padStart(2, '0')}:${String(mn).padStart(2, '0')}`;
  $('sunOut').textContent = el > 0 ? `azimut ${Math.round(az / D2R)}° · hauteur ${Math.round(el / D2R)}°` : 'soleil couché';
  clearTimeout(envTimer);
  envTimer = setTimeout(updateEnv, 120);
}
function updateEnv() {
  if (envRT) envRT.dispose();
  envRT = pmrem.fromScene(envScene, 0, 0.1, 1000);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.55;
}

// ─── maison + site ───────────────────────────────────────────────────────
const site = buildSite(M, scene);
const house = buildHouse(M);
const B = SCENARIO.building;
{
  const [x, z] = w2(B.x, B.y);
  house.group.position.set(x, 0, z);
  house.group.rotation.y = -B.rot * D2R;
  scene.add(house.group);
  // sol du couvert (pavés béton) et abords
  const floor = new THREE.Mesh(new THREE.BoxGeometry(W + 0.4, 0.06, 5.5), M.carportFloor);
  floor.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = v * ((i % 2) ? 5.5 : W + 0.4); });
  floor.position.set(W / 2, 0.0, -0.55 + 2.75); floor.receiveShadow = true; house.group.add(floor);
  const path = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 13.3), M.slab);
  path.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = v * ((i % 2) ? 13.3 : 1.6); });
  path.position.set(-0.8, 0.0, 2.3 + 6.65); path.receiveShadow = true; house.group.add(path);
  const terr = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.08, 2.4), M.slab);
  terr.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = v * ((i % 2) ? 2.4 : 7.4); });
  terr.position.set(3.9, 0.0, LEN + 1.2); terr.receiveShadow = true; house.group.add(terr);
  // voitures sous le couvert + P4
  const colors = ['#8a9096', '#1f2d44', '#e8e6e1'];
  [1.55, 4.5, 7.45].forEach((u, i) => { const c = site.makeCar(colors[i]); c.position.set(u, 0, 2.35); site.groups.cars.add(c); c.userData.local = true; });
  // les voitures du couvert suivent le repère du bâtiment
  const carsLocal = new THREE.Group(); carsLocal.position.copy(house.group.position); carsLocal.rotation.copy(house.group.rotation);
  while (site.groups.cars.children.length) carsLocal.add(site.groups.cars.children[0]);
  site.groups.cars.add(carsLocal);
  const p4 = SCENARIO.parkings[0], c4 = site.makeCar('#7a2e2a'); const [px, pz] = w2(p4.x, p4.y);
  c4.position.set(px, 0, pz); c4.rotation.y = -p4.rot * D2R + Math.PI; site.groups.cars.add(c4);
  // silhouette à l'échelle (1,75 m) près de l'escalier
  const person = new THREE.Group();
  const limb = (r, len, x, y, z) => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 10), M.person); m.position.set(x, y, z); return m; };
  const torso = limb(0.17, 0.42, 0, 1.2, 0); torso.scale.set(1.15, 1, 0.7);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), M.person); head.position.y = 1.64;
  [torso, head, limb(0.07, 0.72, -0.1, 0.44, 0), limb(0.07, 0.72, 0.1, 0.44, 0), limb(0.05, 0.55, -0.25, 1.18, 0), limb(0.05, 0.55, 0.25, 1.18, 0)]
    .forEach((m) => { m.castShadow = true; person.add(m); });
  person.position.set(-2.3, 0, 1.5);
  const pl = new THREE.Group(); pl.position.copy(house.group.position); pl.rotation.copy(house.group.rotation); pl.add(person);
  site.groups.people.add(pl);
}
function houseCenter() {
  const p = new THREE.Vector3(W / 2, 3, LEN / 2 - 0.5);
  return house.group.localToWorld(p);
}
house.group.updateMatrixWorld(true);

// ─── bardage : état et interactions ──────────────────────────────────────
const cladState = { N_rdc: false, N_up: false, E_rdc: false, E_up: true, S_rdc: false, S_up: true, W_rdc_N: false, W_up_N: true, W_rdc_S: false, W_up_S: true };
const facadesEl = $('facades');
const toggles = {};
for (const f of FACADES) {
  const rh = document.createElement('div'); rh.className = 'rowh';
  rh.innerHTML = `${f.name}<small>${f.sub}</small>`;
  facadesEl.appendChild(rh);
  for (const key of f.keys) {
    const b = document.createElement('button');
    b.className = 'tog'; b.type = 'button';
    b.innerHTML = '<span class="sw"></span><span class="lbl">enduit</span>';
    b.setAttribute('aria-label', `Bardage ${KEY_LABEL[key]}`);
    b.addEventListener('click', () => setClad(key, !cladState[key]));
    facadesEl.appendChild(b); toggles[key] = b;
  }
}
function setClad(key, on) { cladState[key] = on; applyClad(); }
function applyClad() {
  let area = 0;
  for (const key in cladState) {
    const on = cladState[key];
    (house.clad[key] || []).forEach((m) => { m.visible = on; });
    const b = toggles[key];
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.querySelector('.lbl').textContent = on ? 'mélèze' : 'enduit';
    if (on) area += house.area[key];
  }
  $('areaOut').textContent = `≈ ${Math.round(area)} m² bardés`;
}
const PRESETS = {
  none: () => ({}),
  up: () => ({ N_up: true, E_up: true, S_up: true, W_up_N: true, W_up_S: true }),
  sw: () => ({ S_rdc: true, S_up: true, W_rdc_N: true, W_up_N: true, W_rdc_S: true, W_up_S: true }),
  all: () => Object.fromEntries(Object.keys(cladState).map((k) => [k, true])),
};
document.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => {
  const p = PRESETS[b.dataset.preset]();
  for (const k in cladState) cladState[k] = !!p[k];
  applyClad();
}));
applyClad();

// paramètres des lames
let larchTimer = 0;
function refreshLarch() {
  clearTimeout(larchTimer);
  larchTimer = setTimeout(() => TX.updateLarch(M.larch, larchOpts), 60);
}
$('boardW').addEventListener('input', (e) => {
  larchOpts.boardW = e.target.value / 100; $('boardWOut').textContent = `${e.target.value} cm`; refreshLarch();
});
$('age').addEventListener('input', (e) => {
  const v = +e.target.value; larchOpts.age = v / 100;
  $('ageOut').textContent = v < 20 ? 'neuf' : v < 55 ? '1–2 ans' : v < 85 ? 'grisant' : 'gris argent';
  refreshLarch();
});
document.querySelectorAll('#pose button').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('#pose button').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
  larchOpts.gap = b.dataset.v === 'open' ? 0.012 : 0.002; refreshLarch();
}));
$('boardWOut').textContent = '14 cm';

// matériaux au choix
function swatches(el, list, onPick, initial = 0) {
  list.forEach((s, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'swatch'; b.setAttribute('aria-pressed', i === initial ? 'true' : 'false');
    b.innerHTML = `<i style="background:${s.css || s.c}"></i>${s.name}`;
    b.addEventListener('click', () => {
      el.querySelectorAll('.swatch').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
      onPick(s);
    });
    $(el.id).appendChild(b);
  });
}
swatches($('renderSw'), [{ name: 'Blanc cassé', c: '#efebe3' }, { name: 'Gris perle', c: '#cfd0cc' }, { name: 'Sable', c: '#e2d3b8' }, { name: 'Anthracite', c: '#5a5d60' }],
  (s) => M.render.color.set(s.c));
swatches($('roofSw'), [{ name: 'Anthracite', c: '#4a4c50' }, { name: 'Brun', c: '#6c4e3f' }, { name: 'Terre cuite', c: '#a45a3c' }],
  (s) => M.roof.color.set(s.c));
swatches($('frameSw'), [{ name: 'Anthracite', c: '#33373b' }, { name: 'Blanc', c: '#f1f1ec' }, { name: 'Mélèze', c: '#b8753f', css: 'linear-gradient(90deg,#c98244,#a8622c)' }],
  (s) => { M.frame.color.set(s.c); M.door.color.set(s.c); M.frame.metalness = s.name === 'Anthracite' ? 0.3 : 0; });

// ─── sélection des façades dans la vue ───────────────────────────────────
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), tip = $('tip');
let down = null, hoverKey = null;
function pick(e) {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const all = ray.intersectObjects(scene.children, true);
  const hit = all.find((h) => h.object.visible && h.object.material !== M.limit);
  return hit && hit.object.userData.key ? hit.object.userData.key : null;
}
renderer.domElement.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) { down = null; return; }
  down = null;
  const key = pick(e);
  if (key) { setClad(key, !cladState[key]); showTip(e, key); }
});
renderer.domElement.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse' || e.buttons) { tip.hidden = true; return; }
  const key = pick(e);
  hoverKey = key;
  renderer.domElement.style.cursor = key ? 'pointer' : '';
  if (key) showTip(e, key); else tip.hidden = true;
});
renderer.domElement.addEventListener('pointerleave', () => { tip.hidden = true; });
function showTip(e, key) {
  tip.innerHTML = `<b>${KEY_LABEL[key]}</b> · ${cladState[key] ? 'mélèze — cliquer pour l’enduit' : 'enduit — cliquer pour le mélèze'}`;
  tip.hidden = false;
  const x = Math.min(e.clientX + 14, window.innerWidth - tip.offsetWidth - 8);
  tip.style.left = `${x}px`; tip.style.top = `${e.clientY + 16}px`;
}

// ─── points de vue ───────────────────────────────────────────────────────
function viewPose(name) {
  const c = houseCenter();
  const at = (azDeg, elDeg, dist, tgt = c) => {
    const az = azDeg * D2R, el = elDeg * D2R;
    return { pos: new THREE.Vector3(tgt.x + Math.sin(az) * Math.cos(el) * dist, tgt.y + Math.sin(el) * dist, tgt.z - Math.cos(az) * Math.cos(el) * dist), tgt: tgt.clone() };
  };
  const d = isSmall() ? 1.35 : 1;
  switch (name) {
    case 'aerial': return at(308, 36, 44 * d);
    case 'N': return at(18, 16, 17 * d);
    case 'E': return at(96, 10, 25 * d);
    case 'S': return at(192, 10, 25 * d);
    case 'W': return at(262, 10, 25 * d);
    case 'old': {
      const [x, z] = w2(18.5, 16.5);
      return at(200, 50, 42 * d, new THREE.Vector3(x, 2.0, z));
    }
    case 'street': {
      const [x, z] = w2(3.2, 21.5);
      return { pos: new THREE.Vector3(x, 1.65, z), tgt: new THREE.Vector3(c.x - 1, 3.2, c.z - 1) };
    }
  }
}
let tween = null;
function goTo(name, instant = false) {
  const p = viewPose(name);
  if (instant) { camera.position.copy(p.pos); controls.target.copy(p.tgt); controls.update(); return; }
  tween = { t0: performance.now(), dur: 1100, fromP: camera.position.clone(), fromT: controls.target.clone(), toP: p.pos, toT: p.tgt };
}
document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => goTo(b.dataset.view)));
$('spin').addEventListener('click', (e) => {
  controls.autoRotate = !controls.autoRotate;
  e.currentTarget.setAttribute('aria-pressed', String(controls.autoRotate));
  e.currentTarget.classList.toggle('primary', controls.autoRotate);
});

// ─── affichage ───────────────────────────────────────────────────────────
const bindShow = (id, grp) => $(id).addEventListener('change', (e) => { grp.visible = e.target.checked; });
bindShow('showTrees', site.groups.trees);
bindShow('showCars', site.groups.cars);
bindShow('showNeighbors', site.groups.neighbors);
bindShow('showLimits', site.groups.limits);
bindShow('showPeople', site.groups.people);
$('autumn').addEventListener('change', (e) => {
  const pal = e.target.checked ? FOLIAGE.autumn : FOLIAGE.summer;
  M.foliage.forEach((m, i) => m.color.set(pal[i]));
  M.farFoliage.color.set(e.target.checked ? '#8f7a3a' : '#4c6b3a');
});
$('hour').addEventListener('input', updateSun);
$('month').addEventListener('change', updateSun);

$('collapse').addEventListener('click', (e) => {
  const p = $('panel'), c = p.classList.toggle('collapsed');
  e.currentTarget.textContent = c ? 'Réglages' : 'Réduire';
  e.currentTarget.setAttribute('aria-expanded', String(!c));
});

// ─── boucle ──────────────────────────────────────────────────────────────
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
const compass = $('compass');
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function frame(now) {
  if (tween) {
    const t = Math.min(1, (now - tween.t0) / tween.dur), k = ease(t);
    camera.position.lerpVectors(tween.fromP, tween.toP, k);
    controls.target.lerpVectors(tween.fromT, tween.toT, k);
    if (t >= 1) tween = null;
  }
  controls.update();
  compass.style.transform = `rotate(${controls.getAzimuthalAngle() / D2R}deg)`;
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

updateSun();
updateEnv();
goTo('aerial', true);
$('loading').remove();
requestAnimationFrame(frame);
