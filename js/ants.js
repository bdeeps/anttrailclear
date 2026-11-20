// Shared parts for AntTrailClear: a seeded random generator, an ant drawn from simple shapes and
// instanced hundreds of times, a ground plane, a pheromone field drawn as a heat map, and a small
// agent-based colony that lays and follows scent. All of it is our own code and procedural drawing.
import { THREE, M, clamp, lerp, smooth, canvasTexture } from './kit.js';

export { THREE, M, clamp, lerp, smooth };
export const COL = { soil: 0x3a2c22, sand: 0xd9b77e, ant: 0x2b1a12, antRed: 0x8a3a1c, food: 0xa3e635, amber: 0xffb547, coral: 0xff7a59, cyan: 0x8ef0ff, violet: 0xc49bff, nest: 0x1a120c };

// Mulberry32: the same seed gives the same run, so the video is repeatable.
export const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export const gauss = (r) => { const u = Math.max(1e-9, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
export const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// ---------------------------------------------------------------- one ant, as one merged geometry
// Faces +x, about 1 unit long, feet on y = 0. Head, thorax, a thin waist (petiole) and the gaster,
// six legs and two elbowed antennae.
function merge(geos) {
  const parts = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  let n = 0; parts.forEach((g) => { n += g.attributes.position.count; });
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
  let o = 0;
  parts.forEach((g) => { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return out;
}
function ell(rx, ry, rz, x, y, z, seg = 10) { const g = new THREE.SphereGeometry(1, seg, Math.max(6, seg * 0.6)); g.scale(rx, ry, rz); g.translate(x, y, z); return g; }
function stick(a, b, r) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), L = A.distanceTo(B);
  const g = new THREE.CylinderGeometry(r, r, L, 5, 1, true);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  g.applyQuaternion(q); const m = A.clone().add(B).multiplyScalar(0.5); g.translate(m.x, m.y, m.z);
  return g;
}
export function antGeometry() {
  const y = 0.2, parts = [
    ell(0.12, 0.1, 0.1, 0.36, y + 0.03, 0),       // head
    ell(0.16, 0.075, 0.07, 0.12, y + 0.02, 0),    // thorax
    ell(0.04, 0.05, 0.04, -0.05, y + 0.02, 0),    // petiole node
    ell(0.22, 0.15, 0.15, -0.28, y + 0.05, 0, 12), // gaster
  ];
  // legs: three pairs from the thorax, out and down to the ground
  [[0.2, 0.32], [0.12, 0.05], [0.04, -0.24]].forEach(([x0, x1]) => {
    for (const s of [-1, 1]) {
      const knee = [lerp(x0, x1, 0.45), y + 0.12, s * 0.2];
      parts.push(stick([x0, y, s * 0.04], knee, 0.014), stick(knee, [x1, 0, s * 0.34], 0.011));
    }
  });
  for (const s of [-1, 1]) { const el = [0.5, y + 0.2, s * 0.06]; parts.push(stick([0.44, y + 0.1, s * 0.04], el, 0.01), stick(el, [0.68, y + 0.12, s * 0.16], 0.009)); }
  return merge(parts);
}

// Hundreds of ants in one draw call. place(i, x, z, heading, scale, tint).
export class AntSwarm {
  constructor(count, { color = COL.ant, scale = 0.32 } = {}) {
    this.count = count; this.scale = scale;
    this.mesh = new THREE.InstancedMesh(antGeometry(), M.matte(0xffffff, { roughness: 0.5 }), count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.castShadow = true;
    this.base = new THREE.Color(color);
    this.c = new THREE.Color();
    this.o = new THREE.Object3D();
    for (let i = 0; i < count; i++) this.mesh.setColorAt(i, this.base);
  }
  place(i, x, z, h, y = 0, s = 1, tint = null, bob = 0) {
    const o = this.o; o.position.set(x, y + bob, z); o.rotation.set(0, -h, 0); o.scale.setScalar(this.scale * s); o.updateMatrix();
    this.mesh.setMatrixAt(i, o.matrix);
    if (tint !== undefined) this.mesh.setColorAt(i, tint ?? this.base);
  }
  hide(i) { this.o.position.set(0, -50, 0); this.o.scale.setScalar(0.0001); this.o.updateMatrix(); this.mesh.setMatrixAt(i, this.o.matrix); }
  done(n = this.count) { this.mesh.count = n; this.mesh.instanceMatrix.needsUpdate = true; if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true; }
}

// ---------------------------------------------------------------- ground
export function ground(size, { color = '#3b2d22', speck = '#5a4532', seed = 7, sand = false } = {}) {
  const r = rng(seed);
  const { tex } = canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { g.fillStyle = r() < 0.5 ? speck : 'rgba(0,0,0,0.18)'; const s = 1 + r() * (sand ? 2 : 3.5); g.globalAlpha = 0.25 + r() * 0.5; g.fillRect(r() * w, r() * h, s, s); }
    g.globalAlpha = 1;
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(size / 12, size / 12);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), M.matte(0xffffff, { map: tex }));
  m.rotation.x = -Math.PI / 2; m.receiveShadow = true;
  return m;
}

// ---------------------------------------------------------------- pheromone field
// A square grid of scent values over a size×size patch centred on the origin. It evaporates
// exponentially, spreads a little, and is drawn as a heat map on a texture just above the ground.
const HEAT = [[0, [40, 20, 90, 0]], [0.12, [110, 40, 170, 110]], [0.35, [200, 60, 170, 190]], [0.65, [255, 140, 60, 225]], [1, [255, 240, 170, 245]]];
function heat(k, out, o) {
  let i = 0; while (i < HEAT.length - 2 && k > HEAT[i + 1][0]) i++;
  const [k0, a] = HEAT[i], [k1, b] = HEAT[i + 1], u = clamp((k - k0) / (k1 - k0), 0, 1);
  for (let c = 0; c < 4; c++) out[o + c] = a[c] + (b[c] - a[c]) * u;
}
export class Field {
  constructor(n, size) {
    this.n = n; this.size = size; this.cell = size / n;
    this.v = new Float32Array(n * n); this.tmp = new Float32Array(n * n);
    this.pix = new Uint8Array(n * n * 4);
    this.tex = new THREE.DataTexture(this.pix, n, n, THREE.RGBAFormat);
    this.tex.magFilter = THREE.LinearFilter; this.tex.minFilter = THREE.LinearFilter; this.tex.colorSpace = THREE.SRGBColorSpace;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, depthWrite: false, toneMapped: false }));
    this.mesh.rotation.x = -Math.PI / 2; this.mesh.position.y = 0.02; this.mesh.renderOrder = 1;
    this.scale = 4; this.visible = true;
  }
  clear() { this.v.fill(0); }
  idx(x, z) { const n = this.n, i = Math.floor((x / this.size + 0.5) * n), j = Math.floor((z / this.size + 0.5) * n); return i < 0 || j < 0 || i >= n || j >= n ? -1 : j * n + i; }
  get(x, z) {
    // bilinear sample
    const n = this.n, fx = (x / this.size + 0.5) * n - 0.5, fz = (z / this.size + 0.5) * n - 0.5;
    const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, w = fz - j;
    if (i < 0 || j < 0 || i >= n - 1 || j >= n - 1) return 0;
    const v = this.v, k = j * n + i;
    return (v[k] * (1 - u) + v[k + 1] * u) * (1 - w) + (v[k + n] * (1 - u) + v[k + n + 1] * u) * w;
  }
  add(x, z, a) {
    const n = this.n, i = Math.floor((x / this.size + 0.5) * n), j = Math.floor((z / this.size + 0.5) * n);
    if (i < 1 || j < 1 || i > n - 2 || j > n - 2) return;
    const k = j * n + i; this.v[k] = Math.min(this.v[k] + a, 60);
  }
  // evaporate with rate e (per second), diffuse with rate d (fraction per second shared with neighbours)
  step(dt, e, d = 0.4) {
    const n = this.n, v = this.v, t = this.tmp, keep = Math.exp(-e * dt), mix = clamp(d * dt, 0, 0.25);
    if (mix > 0) {
      for (let j = 1; j < n - 1; j++) for (let i = 1; i < n - 1; i++) {
        const k = j * n + i;
        t[k] = (v[k] * (1 - mix) + (v[k - 1] + v[k + 1] + v[k - n] + v[k + n]) * mix * 0.25) * keep;
      }
      this.v = t; this.tmp = v;
    } else for (let k = 0; k < v.length; k++) v[k] *= keep;
  }
  paint(x0, z0, x1, z1, a, w = 1) {
    const L = Math.hypot(x1 - x0, z1 - z0), steps = Math.max(1, Math.ceil(L / (this.cell * 0.5)));
    for (let s = 0; s <= steps; s++) { const k = s / steps; for (let q = -w + 1; q < w; q++) this.add(lerp(x0, x1, k) + q * this.cell * (z1 - z0) / (L || 1), lerp(z0, z1, k) - q * this.cell * (x1 - x0) / (L || 1), a); }
  }
  total() { let s = 0; for (let k = 0; k < this.v.length; k++) s += this.v[k]; return s; }
  draw() {
    const v = this.v, p = this.pix, sc = this.scale;
    // texture rows run opposite to world z once the plane is laid flat, so flip them here
    const n = this.n;
    for (let j = 0; j < n; j++) { const o = (n - 1 - j) * n; for (let i = 0; i < n; i++) { const x = v[j * n + i]; heat(x / (x + sc), p, (o + i) * 4); } }
    this.tex.needsUpdate = true;
  }
}

// ---------------------------------------------------------------- the colony
// Each ant follows three simple rules, and nothing else:
//  1. Searching: walk forward with a small random wobble. Sniff the ground a little ahead, to the left,
//     straight on and to the right, and turn toward the strongest scent.
//  2. When you find food, pick some up, turn around and head home. Ants keep track of where home is by
//     path integration (see chapter 4), modelled here as a pull toward the nest with some noise.
//     On the way home, dab scent on the ground.
//  3. At the nest, drop the food and go out again.
// Scent evaporates everywhere, all the time. This is a cartoon of a mass-recruiting ant; real species
// differ (many also mark on the way out, and use landmarks), but the feedback loop is the same.
export class Colony {
  constructor({ n = 300, size = 24, grid = 128, nest = [0, 0], foods = [], seed = 1, laySearch = 0 } = {}) {
    this.size = size; this.nest = nest; this.foodSpec = foods; this.max = n; this.laySearch = laySearch;
    this.field = new Field(grid, size);
    this.reset(seed);
  }
  reset(seed = this.seed) {
    this.seed = seed; this.r = rng(seed);
    this.field.clear();
    this.foods = this.foodSpec.map((f) => ({ ...f, left: f.amount ?? Infinity }));
    this.ants = [];
    for (let i = 0; i < this.max; i++) this.ants.push({ x: this.nest[0], z: this.nest[1], h: this.r() * Math.PI * 2, st: 0, out: i * 0.06, food: -1, trip: 0 });
    this.time = 0; this.delivered = 0; this.log = []; this.found = 0;
  }
  // p: { n, deposit, evap, follow (0..1), speed, smell (bool), wander }
  step(dt, p) {
    const f = this.field, r = this.r, half = this.size / 2 - 0.4, [nx, nz] = this.nest;
    const sd = 0.75, sa = 0.6, turn = 7 * (p.follow ?? 1), v = p.antSpeed ?? 2.2, wob = p.wander ?? 0.7;
    const n = Math.min(this.max, Math.round(p.n ?? this.max));
    for (let i = 0; i < n; i++) {
      const a = this.ants[i];
      if (a.out > 0) { a.out -= dt; continue; }
      if (a.st === 0) {
        if (p.smell !== false) {
          const L = f.get(a.x + Math.cos(a.h - sa) * sd, a.z + Math.sin(a.h - sa) * sd);
          const C = f.get(a.x + Math.cos(a.h) * sd, a.z + Math.sin(a.h) * sd);
          const R = f.get(a.x + Math.cos(a.h + sa) * sd, a.z + Math.sin(a.h + sa) * sd);
          const tot = L + C + R;
          if (tot > 0.02) { const bias = (R - L) / (tot + 0.3); a.h += bias * turn * dt; if (C < L && C < R) a.h += (r() - 0.5) * 0.6; }
        }
        a.h += gauss(r) * wob * Math.sqrt(dt);
        if (this.laySearch) f.add(a.x, a.z, this.laySearch * dt);
        for (let k = 0; k < this.foods.length; k++) {
          const fd = this.foods[k];
          if (fd.left > 0 && (a.x - fd.x) ** 2 + (a.z - fd.z) ** 2 < fd.r * fd.r) { a.st = 1; a.food = k; a.h += Math.PI; fd.left -= 1; a.trip = 0; this.found++; break; }
        }
      } else {
        // head home: path-integration pull plus noise, and lay scent
        const want = Math.atan2(nz - a.z, nx - a.x), dh = wrapA(want - a.h);
        a.h += dh * 3 * dt + gauss(r) * 1.1 * Math.sqrt(dt);
        f.add(a.x, a.z, (p.deposit ?? 1) * dt * 9);
        if ((a.x - nx) ** 2 + (a.z - nz) ** 2 < 0.36) { a.st = 0; a.h += Math.PI + (r() - 0.5) * 1.2; this.delivered++; this.log.push(this.time); }
      }
      a.x += Math.cos(a.h) * v * dt; a.z += Math.sin(a.h) * v * dt;
      if (a.x < -half || a.x > half) { a.x = clamp(a.x, -half, half); a.h = Math.PI - a.h; }
      if (a.z < -half || a.z > half) { a.z = clamp(a.z, -half, half); a.h = -a.h; }
    }
    f.step(dt, p.evap ?? 0.05, p.diffuse ?? 0.4);
    this.time += dt;
    while (this.log.length && this.log[0] < this.time - 60) this.log.shift();
  }
  run(seconds, p, dt = 1 / 30) { for (let t = 0; t < seconds; t += dt) this.step(dt, p); }
  onTrail(n) { let c = 0, m = 0; for (let i = 0; i < n; i++) { const a = this.ants[i]; if (a.out > 0) continue; m++; if (this.field.get(a.x, a.z) > 1) c++; } return m ? c / m : 0; }
}

// Draws a colony's ants into a swarm. Ants carrying food get a green crumb tint.
export function drawColony(col, sw, n, t, carry = new THREE.Color(COL.food)) {
  const N = Math.min(n, sw.count);
  for (let i = 0; i < N; i++) {
    const a = col.ants[i];
    if (a.out > 0) { sw.hide(i); continue; }
    sw.place(i, a.x, a.z, a.h, 0.03, 1, a.st ? carry : null, Math.abs(Math.sin(t * 22 + i)) * 0.012);
  }
  sw.done(N);
}

// A nest mound and food piles, drawn simply.
export function nestMound(r = 0.9) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.matte(0x5b4331));
  m.scale.y = 0.35; m.castShadow = m.receiveShadow = true;
  const hole = new THREE.Mesh(new THREE.CircleGeometry(r * 0.22, 24), M.matte(0x0b0705)); hole.rotation.x = -Math.PI / 2; hole.position.y = r * 0.35 + 0.005;
  g.add(m, hole);
  return g;
}
export function foodPile(r = 0.6, seed = 3, color = COL.food) {
  const g = new THREE.Group(), rr = rng(seed), mat = M.plastic(color, { roughness: 0.6 });
  const geo = new THREE.SphereGeometry(1, 10, 8);
  for (let i = 0; i < 18; i++) {
    const a = rr() * Math.PI * 2, d = Math.sqrt(rr()) * r * 0.75, s = 0.07 + rr() * 0.07;
    const m = new THREE.Mesh(geo, mat); m.scale.setScalar(s); m.position.set(Math.cos(a) * d, s * 0.8 + rr() * 0.05, Math.sin(a) * d); m.castShadow = true; g.add(m);
  }
  g.setLeft = (k) => g.children.forEach((c, i) => { c.visible = i < Math.ceil(k * g.children.length); });
  return g;
}

// A tiny inline SVG sparkline for readouts.
export function spark(values, { w = 200, h = 40, min = 0, max = 1, color = '#a3e635', mid = null } = {}) {
  if (values.length < 2) return '';
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - ((clamp(v, min, max) - min) / (max - min)) * h).toFixed(1)}`).join(' ');
  const m = mid === null ? '' : `<line x1="0" x2="${w}" y1="${h - ((mid - min) / (max - min)) * h}" y2="${h - ((mid - min) / (max - min)) * h}" stroke="rgba(255,255,255,.25)" stroke-dasharray="3 3"/>`;
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">${m}<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2"/></svg>`;
}
