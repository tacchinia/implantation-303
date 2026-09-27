// Textures procédurales (canvas) : aucune image externe.
// Convention : une texture couvre `sizeX × sizeY` mètres ; les géométries portent
// des UV en mètres, donc repeat = 1/size.
import * as THREE from 'three';

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let maxAniso = 8;
export function setMaxAniso(v) { maxAniso = v; }

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function toTex(c, sizeX, sizeY, color = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / sizeX, 1 / sizeY);
  t.anisotropy = maxAniso;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function noise(ctx, w, h, amp, r) {
  const img = ctx.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * amp;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

function blotches(ctx, w, h, r, n, colors, rMin, rMax) {
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, rad = rMin + r() * (rMax - rMin);
    const col = colors[Math.floor(r() * colors.length)];
    for (const [ox, oy] of [[0, 0], [w, 0], [-w, 0], [0, h], [0, -h]]) {
      const g = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rad);
      g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(x + ox - rad, y + oy - rad, rad * 2, rad * 2);
    }
  }
}

export function grassTexture() {
  const r = rng(11), S = 512;
  const [c, x] = canvas(S, S);
  x.fillStyle = '#5b7d39'; x.fillRect(0, 0, S, S);
  blotches(x, S, S, r, 40, ['rgba(110,140,60,.35)', 'rgba(60,90,35,.35)', 'rgba(140,150,70,.25)'], 30, 110);
  for (let i = 0; i < 14000; i++) {
    const px = r() * S, py = r() * S, l = 2 + r() * 5;
    const g = 70 + r() * 80;
    x.strokeStyle = `rgba(${g * 0.55 | 0},${g | 0},${g * 0.35 | 0},${0.35 + r() * 0.4})`;
    x.lineWidth = 1;
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + (r() - 0.5) * 2, py - l); x.stroke();
  }
  noise(x, S, S, 14, r);
  return toTex(c, 3, 3);
}

// Pavés gazon (dalles alvéolées béton + gazon) : module 60 × 40 cm, 8 alvéoles.
export function grassPaverTexture() {
  const r = rng(21), W = 512, H = 512; // 1.2 m × 1.2 m (2 × 3 dalles)
  const [c, x] = canvas(W, H);
  x.fillStyle = '#86837b'; x.fillRect(0, 0, W, H);
  noise(x, W, H, 26, r);
  const pxm = W / 1.2;
  const cols = 8, rows = 12; // alvéoles de 15 × 10 cm
  const cw = 1.2 / cols * pxm, ch = 1.2 / rows * pxm;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const x0 = i * cw + cw * 0.12, y0 = j * ch + ch * 0.14, w = cw * 0.76, h = ch * 0.72;
    x.fillStyle = '#3b4a2b'; x.fillRect(x0 - 1, y0 - 1, w + 2, h + 2);
    const g = 95 + r() * 45;
    x.fillStyle = `rgb(${g * 0.5 | 0},${g | 0},${g * 0.3 | 0})`;
    x.fillRect(x0, y0, w, h);
    for (let k = 0; k < 40; k++) {
      const gg = 60 + r() * 110;
      x.fillStyle = `rgba(${gg * 0.55 | 0},${gg | 0},${gg * 0.3 | 0},.8)`;
      x.fillRect(x0 + r() * w, y0 + r() * h, 1.5, 2.5);
    }
    // l'herbe déborde parfois sur le béton
    if (r() < 0.35) {
      x.fillStyle = 'rgba(95,130,60,.55)';
      x.fillRect(x0 - 2 + r() * 4, y0 - 3, w * 0.8, 3);
    }
  }
  // joints entre dalles (60 × 40 cm)
  x.strokeStyle = 'rgba(40,40,36,.55)'; x.lineWidth = 2;
  for (let i = 0; i <= 2; i++) { x.beginPath(); x.moveTo(i * 0.6 * pxm, 0); x.lineTo(i * 0.6 * pxm, H); x.stroke(); }
  for (let j = 0; j <= 3; j++) { x.beginPath(); x.moveTo(0, j * 0.4 * pxm); x.lineTo(W, j * 0.4 * pxm); x.stroke(); }
  return toTex(c, 1.2, 1.2);
}

export function asphaltTexture() {
  const r = rng(31), S = 512;
  const [c, x] = canvas(S, S);
  x.fillStyle = '#56585a'; x.fillRect(0, 0, S, S);
  blotches(x, S, S, r, 30, ['rgba(40,40,42,.3)', 'rgba(110,110,108,.2)'], 20, 90);
  noise(x, S, S, 40, r);
  return toTex(c, 4, 4);
}

// Pavés béton (sol du couvert à voitures, chemins)
export function paverTexture(tone = '#b7b3aa', bw = 0.2, bh = 0.1, sizeM = 1.2, seed = 41) {
  const r = rng(seed), S = 512, pxm = S / sizeM;
  const [c, x] = canvas(S, S);
  x.fillStyle = '#6f6c66'; x.fillRect(0, 0, S, S);
  const rowsN = Math.round(sizeM / bh), colsN = Math.round(sizeM / bw);
  const base = new THREE.Color(tone);
  for (let j = 0; j < rowsN; j++) for (let i = -1; i <= colsN; i++) {
    const off = (j % 2) * bw / 2;
    const x0 = (i * bw + off) * pxm, y0 = j * bh * pxm;
    const k = 0.9 + r() * 0.16;
    x.fillStyle = `rgb(${base.r * 255 * k | 0},${base.g * 255 * k | 0},${base.b * 255 * k | 0})`;
    x.fillRect(x0 + 1.5, y0 + 1.5, bw * pxm - 3, bh * pxm - 3);
  }
  noise(x, S, S, 18, r);
  return toTex(c, sizeM, sizeM);
}

// Dalles de pierre/béton 60 × 40 (terrasse du rez, chemin)
export function slabTexture() { return paverTexture('#c9c4b9', 0.6, 0.4, 1.2, 43); }

// Crépi : texture presque blanche, teintée par material.color
export function renderTexture() {
  const r = rng(51), S = 512;
  const [c, x] = canvas(S, S);
  x.fillStyle = '#f2f2f2'; x.fillRect(0, 0, S, S);
  blotches(x, S, S, r, 18, ['rgba(0,0,0,.015)', 'rgba(255,255,255,.03)'], 40, 140);
  noise(x, S, S, 12, r);
  return toTex(c, 2, 2);
}

// Tuiles plates : rangs horizontaux, la texture x suit la pente.
export function roofTexture() {
  const r = rng(61), W = 512, H = 512; // 1.36 m (4 rangs) × 1.0 m (4 tuiles)
  const [c, x] = canvas(W, H);
  const rowsN = 4, tilesN = 4, rw = W / rowsN, tw = H / tilesN;
  for (let i = 0; i < rowsN; i++) {
    for (let j = -1; j <= tilesN; j++) {
      const off = (i % 2) * tw / 2, y0 = j * tw + off, x0 = i * rw;
      const k = 200 + r() * 40;
      const g = x.createLinearGradient(x0, 0, x0 + rw, 0);
      g.addColorStop(0, `rgb(${k * 0.72 | 0},${k * 0.72 | 0},${k * 0.72 | 0})`);
      g.addColorStop(0.85, `rgb(${k | 0},${k | 0},${k | 0})`);
      g.addColorStop(1, `rgb(${k * 0.55 | 0},${k * 0.55 | 0},${k * 0.55 | 0})`);
      x.fillStyle = g; x.fillRect(x0, y0 + 1, rw, tw - 2);
    }
  }
  noise(x, W, H, 16, r);
  return toTex(c, 1.36, 1.0);
}

// Feuillage de haie
export function hedgeTexture() {
  const r = rng(71), S = 256;
  const [c, x] = canvas(S, S);
  x.fillStyle = '#304f25'; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 2600; i++) {
    const g = 60 + r() * 110;
    x.fillStyle = `rgba(${g * 0.5 | 0},${g | 0},${g * 0.35 | 0},.85)`;
    x.beginPath(); x.ellipse(r() * S, r() * S, 2 + r() * 3, 1.2 + r() * 2, r() * 3, 0, 7); x.fill();
  }
  return toTex(c, 1, 1);
}

// ─── Mélèze en lames verticales ───────────────────────────────────────────
// boardW : largeur utile de lame (m) ; gap : vide entre lames (m) ;
// age : 0 = neuf (miel/orangé), 1 = grisé (argent).
const FRESH = [27, 0.58, 0.5];  // HSL
const AGED = [35, 0.05, 0.6];
export function larchCanvases({ boardW, gap, age, boards = 8, heightM = 3, seed = 91 }) {
  const r = rng(seed);
  const W = 1024, H = 1024;
  const pitch = boardW + gap, sizeX = boards * pitch;
  const pxm = W / sizeX, pyM = H / heightM;
  const [c, x] = canvas(W, H);
  const [b, bx] = canvas(W, H);
  const lerp = (a, c2, t) => a + (c2 - a) * t;
  x.fillStyle = '#17120d'; x.fillRect(0, 0, W, H);
  bx.fillStyle = '#000'; bx.fillRect(0, 0, W, H);
  for (let i = 0; i < boards; i++) {
    const x0 = i * pitch * pxm, bw = boardW * pxm;
    const h = lerp(FRESH[0], AGED[0], age) + (r() - 0.5) * 6;
    const s = Math.max(0, lerp(FRESH[1], AGED[1], age) + (r() - 0.5) * 0.14);
    const l = lerp(FRESH[2], AGED[2], age) + (r() - 0.5) * 0.12;
    x.fillStyle = `hsl(${h},${s * 100}%,${l * 100}%)`;
    x.fillRect(x0, 0, bw, H);
    bx.fillStyle = '#9a9a9a'; bx.fillRect(x0, 0, bw, H);
    // aboutage : joint horizontal occasionnel
    if (r() < 0.5) {
      const y = r() * H;
      x.fillStyle = 'rgba(20,14,8,.55)'; x.fillRect(x0, y, bw, 2);
      bx.fillStyle = '#303030'; bx.fillRect(x0, y, bw, 2);
    }
    // fil du bois (veinage vertical, légèrement ondulé)
    const lines = 26 + Math.floor(r() * 18);
    for (let k = 0; k < lines; k++) {
      let px = x0 + r() * bw;
      const dark = r() < 0.7;
      const a = (dark ? 0.1 + r() * 0.22 : 0.06 + r() * 0.1) * (1 - age * 0.55);
      x.strokeStyle = dark ? `rgba(70,35,12,${a})` : `rgba(255,225,180,${a})`;
      x.lineWidth = 0.6 + r() * 1.8;
      x.beginPath(); x.moveTo(px, 0);
      const f = 0.004 + r() * 0.01, amp = 1 + r() * 3, ph = r() * 6;
      for (let y = 0; y <= H; y += 16) {
        const xx = Math.min(x0 + bw - 1, Math.max(x0 + 1, px + Math.sin(y * f + ph) * amp));
        x.lineTo(xx, y);
      }
      x.stroke();
    }
    // nœuds
    const knots = Math.floor(r() * 2.4);
    for (let k = 0; k < knots; k++) {
      const kx = x0 + bw * (0.2 + r() * 0.6), ky = r() * H, kr = (0.008 + r() * 0.012) * pxm;
      const kg = x.createRadialGradient(kx, ky, 0, kx, ky, kr * 2.2);
      kg.addColorStop(0, `rgba(60,28,10,${0.85 - age * 0.45})`);
      kg.addColorStop(0.45, `rgba(95,50,20,${0.5 - age * 0.25})`);
      kg.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = kg; x.beginPath(); x.ellipse(kx, ky, kr * 2, kr * 2.8, 0, 0, 7); x.fill();
    }
    // arêtes : léger ombrage sur les chants
    const eg = x.createLinearGradient(x0, 0, x0 + bw, 0);
    eg.addColorStop(0, 'rgba(0,0,0,.22)'); eg.addColorStop(0.08, 'rgba(0,0,0,0)');
    eg.addColorStop(0.92, 'rgba(0,0,0,0)'); eg.addColorStop(1, 'rgba(0,0,0,.28)');
    x.fillStyle = eg; x.fillRect(x0, 0, bw, H);
    // relief (bump) : fil + chanfreins
    for (let k = 0; k < 60; k++) {
      bx.strokeStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${0.05 + r() * 0.08})`;
      bx.lineWidth = 1; const px = x0 + r() * bw;
      bx.beginPath(); bx.moveTo(px, 0); bx.lineTo(px + (r() - 0.5) * 3, H); bx.stroke();
    }
    const bg = bx.createLinearGradient(x0, 0, x0 + bw, 0);
    bg.addColorStop(0, 'rgba(0,0,0,.6)'); bg.addColorStop(0.06, 'rgba(0,0,0,0)');
    bg.addColorStop(0.94, 'rgba(0,0,0,0)'); bg.addColorStop(1, 'rgba(0,0,0,.6)');
    bx.fillStyle = bg; bx.fillRect(x0, 0, bw, H);
  }
  // gris : légères coulures verticales plus sombres (patine)
  if (age > 0.3) {
    for (let k = 0; k < 30; k++) {
      x.fillStyle = `rgba(60,60,60,${(age - 0.3) * 0.12})`;
      x.fillRect(r() * W, 0, 4 + r() * 20, H);
    }
  }
  return { color: c, bump: b, sizeX, sizeY: heightM };
}

export function larchTextures(opts) {
  const cv = larchCanvases(opts);
  return { map: toTex(cv.color, cv.sizeX, cv.sizeY), bump: toTex(cv.bump, cv.sizeX, cv.sizeY, false) };
}

export function updateLarch(mat, opts) {
  const cv = larchCanvases(opts);
  for (const [key, src, color] of [['map', cv.color, true], ['bumpMap', cv.bump, false]]) {
    const old = mat[key];
    const t = toTex(src, cv.sizeX, cv.sizeY, color);
    mat[key] = t;
    if (old) old.dispose();
  }
  mat.needsUpdate = true;
}

// Étiquette texte posée au sol
export function labelTexture(text, { w = 1024, h = 128, font = '600 72px Archivo, Arial, sans-serif', color = 'rgba(255,255,255,.85)' } = {}) {
  const [c, x] = canvas(w, h);
  x.font = font; x.fillStyle = color; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.letterSpacing = '8px';
  x.fillText(text, w / 2, h / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso;
  return t;
}
