// Chapter 2: the double-bridge experiment. Goss, Aron, Deneubourg & Pasteels (1989, Naturwissenschaften)
// and Deneubourg, Aron, Goss & Pasteels (1990, J. Insect Behav.) linked an Argentine ant nest to food by a
// bridge with two branches. With unequal branches the colony usually ended up on the shorter one; with
// equal branches it still picked one, at random; and when the short branch was added only after the long
// one was in use, the colony mostly stayed on the long one.
// Our model follows theirs in spirit: ants mark a branch each time they cross it, in both directions, and
// choose at each fork with P(short) = (k + S)^n / ((k + S)^n + (k + L)^n), the form Deneubourg's group used
// (n = 2, k = 20, as quoted in Goss et al. 1989, eq. 3). Speeds, flows and timings are our own round numbers, not measurements.
import { THREE, M, AntSwarm, ground, nestMound, foodPile, rng, spark, clamp, COL } from '../ants.js';
import { box } from '../kit.js';

const NEST = [-9, 0], FOOD = [9, 0], A = [-5.5, 0], B = [5.5, 0];
const N = 160, K = 20, NN = 2, V = 2.2, EVAP = 0.004, LATE = 150;

// A path through points in the xz plane with arc-length lookup.
class Path {
  constructor(pts, samples = 240) {
    const c = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
    this.curve = c; this.p = c.getSpacedPoints(samples); this.len = c.getLength();
  }
  at(u, out) { // u in [0,1]
    const n = this.p.length - 1, f = clamp(u, 0, 1) * n, i = Math.min(n - 1, Math.floor(f)), k = f - i, a = this.p[i], b = this.p[i + 1];
    out.x = a.x + (b.x - a.x) * k; out.z = a.z + (b.z - a.z) * k; out.h = Math.atan2(b.z - a.z, b.x - a.x);
    return out;
  }
}
const shortPts = () => [A, [-2.5, -0.9], [2.5, -0.9], B];
function longPts(ratio, Ls) {
  const mk = (h) => [A, [-5.2, h * 0.55], [-3.6, h], [3.6, h], [5.2, h * 0.55], B];
  let lo = 0.5, hi = 20;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (new Path(mk(m), 80).len < ratio * Ls) lo = m; else hi = m; }
  return mk((lo + hi) / 2);
}

// The colony on the bridge, as a small event-driven model. seg: 0 nest stem, 1 branch, 2 food stem.
export class BridgeSim {
  constructor(lens, { seed = 1, late = false } = {}) { this.lens = lens; this.late = late; this.reset(seed); }
  reset(seed) {
    this.seed = seed; this.r = rng(seed); this.t = 0; this.tau = [0, 0]; this.cross = []; this.hist = []; this.next = 0;
    this.ants = Array.from({ length: N }, (_, i) => ({ seg: -1, d: 1, u: 0, b: 0, wait: i * 0.45 }));
  }
  open(b) { return b === 1 || !this.late || this.t >= LATE; }
  choose() {
    if (!this.open(0)) return 1;
    const s = (K + this.tau[0]) ** NN, l = (K + this.tau[1]) ** NN;
    return this.r() < s / (s + l) ? 0 : 1;
  }
  step(dt) {
    const [stem, , ] = this.lens;
    for (const a of this.ants) {
      if (a.seg < 0) { a.wait -= dt; if (a.wait <= 0) { a.seg = 0; a.d = 1; a.u = 0; } continue; }
      const L = a.seg === 1 ? this.lens[1 + a.b] : stem;
      a.u += (V * dt) / L;
      if (a.u < 1) continue;
      a.u -= 1;
      if (a.d > 0) {
        if (a.seg === 0) { a.b = this.choose(); this.tau[a.b] += 1; a.seg = 1; this.cross.push([this.t, a.b]); }
        else if (a.seg === 1) { this.tau[a.b] += 1; a.seg = 2; }
        else { a.d = -1; a.seg = 2; a.u = 0; } // at the food: turn round
      } else {
        if (a.seg === 2) { a.b = this.choose(); this.tau[a.b] += 1; a.seg = 1; this.cross.push([this.t, a.b]); }
        else if (a.seg === 1) { this.tau[a.b] += 1; a.seg = 0; }
        else { a.seg = -1; a.wait = 1 + this.r() * 2; } // home: rest, then out again
      }
    }
    const keep = Math.exp(-EVAP * dt); this.tau[0] *= keep; this.tau[1] *= keep;
    this.t += dt;
    while (this.cross.length && this.cross[0][0] < this.t - 60) this.cross.shift();
    if (this.t >= this.next) { this.next += 5; this.hist.push(this.share()); if (this.hist.length > 80) this.hist.shift(); }
  }
  share() { const c = this.cross.filter((x) => this.late ? x[0] >= LATE || this.t < LATE : true); return c.length ? c.filter((x) => x[1] === 0).length / c.length : 0.5; }
  run(sec, dt = 0.1) { for (let t = 0; t < sec; t += dt) this.step(dt); }
}

export default {
  id: 'bridge',
  short: 'Two bridges',
  title: 'The double-bridge experiment',
  subtitle: 'Give ants two ways to food, one short and one long, and see which they pick.',
  view: { pos: [0, 19, 15], target: [0, 0, 1.5] },
  learn: `<p>In 1989 Simon Goss, Serge Aron, Jean-Louis Deneubourg and Jacques Pasteels, in Brussels, joined a nest of <b>Argentine ants</b> to food with a bridge that split into two branches, one twice as long as the other. With the long branch twice the length of the short one, the colony settled on the <b>short branch</b> in all 14 colonies they tested; with a ratio of 1.4 it did so in 15 of 18. No ant measured anything.</p>
    <p>The trick is time. Ants mark the bridge every time they cross. Those who happen to take the short branch reach the food and get back <b>sooner</b>, so the short branch collects marks faster. At each fork an ant prefers the branch that smells stronger, so the lead grows. With two <b>equal</b> branches the colony still picks one, by chance, which shows the choice comes from feedback, not from comparing lengths.</p>
    <p>It is not perfect. When the team offered the long branch first and added the short one later, only 2 of 18 colonies switched. The rest <b>stayed on the long one</b>: the old trail was too strong to beat. In the model, chance sometimes favours the long branch early, and then it wins.</p>
    <p class="tip"><b>Try it:</b> change the <b>length ratio</b>, then press <b>Run 20 trials</b> to see how often the short branch wins. Set the ratio to 1. Then switch on <b>Short branch added late</b>.</p>
    <p class="note">The choice rule has the form Deneubourg’s group used; speeds and numbers of ants are round numbers of our own. Each run uses its own random seed, so results really do vary.</p>`,
  terms: [
    { t: 'Argentine ant', d: 'Linepithema humile, a small South American ant, now spread worldwide, that marks trails as it walks.' },
    { t: 'Double bridge', d: 'An experiment where a nest and food are joined by two branches, so you can see which the colony chooses.' },
    { t: 'Choice function', d: 'A rule giving the chance an ant takes each branch, based on how much scent each one has.' },
    { t: 'Symmetry breaking', d: 'When a system with two equal options ends up favouring one, because small chance differences get amplified.' },
    { t: 'Lock-in', d: 'When an early choice becomes so strong that a better option found later cannot take over.' },
  ],
  defaults: { ratio: 2, speed: 3, late: false },
  controls: [
    { key: 'ratio', type: 'range', label: 'Long ÷ short length', min: 1, max: 2.5, step: 0.1, fmt: (v) => v.toFixed(1) + '×' },
    { key: 'late', type: 'toggle', label: 'Short branch added late', hint: 'Only the long branch is open for the first 150 simulated seconds.' },
    { key: 'speed', type: 'range', label: 'Time speed', min: 0.5, max: 10, step: 0.5, fmt: (v) => v + '×' },
    { key: 'act', type: 'buttons', label: 'Experiment', items: [{ label: 'Run again', act: (s, inst) => inst.restart() }, { label: 'Run 20 trials', act: (s, inst) => inst.trials(20) }] },
  ],
  onChange(s, key) { if (key === 'ratio' || key === 'late') s._dirty = true; },
  quiz: [
    { q: 'Why does the short branch usually win?', options: ['Ants measure both branches', 'Ants on it get back sooner, so it gets marked more often', 'A scout chooses it', 'It smells of food'], answer: 1, why: 'Faster round trips mean more marks per minute, and stronger scent attracts more ants.' },
    { q: 'What happens with two equal branches?', options: ['Ants split 50:50 forever', 'The colony still ends up mostly on one, chosen by chance', 'Ants refuse to cross', 'They always take the left one'], answer: 1, why: 'Small random differences early on get amplified by feedback.' },
    { q: 'If the long branch is in use before the short one is added, what usually happens?', options: ['Ants switch at once', 'Most ants stay on the long branch', 'The colony splits evenly', 'Ants build a third branch'], answer: 1, why: 'The established trail is too strong for the new one to catch up. This is lock-in.' },
  ],
  reel: [
    { ms: 5000, caption: 'Give ants two bridges to the same food: one short, one twice as long.', set: { ratio: 2, speed: 4, late: false }, act: (s, inst) => inst.restart(12, 4), view: { pos: [0, 17, 13], target: [0, 0, 1.5] }, spin: 0 },
    { ms: 5600, caption: 'Ants on the short one get back sooner and mark it more. Soon nearly all use it.', set: { ratio: 2, speed: 5, late: false }, act: (s, inst) => inst.restart(12, 70), view: { pos: [-6, 12, 13], target: [0, 0, 1] }, spin: 0.2 },
  ],
  build({ stage, s: S }) {
    stage.floor.visible = false;
    stage.root.add(ground(46, { seed: 9 }));
    const plat = (x, c) => { const b = box(4, 0.3, 4, M.matte(c)); b.position.set(x, 0.15, 0); stage.root.add(b); };
    plat(NEST[0] - 1, 0x4a3628); plat(FOOD[0] + 1, 0x4a3628);
    const nest = nestMound(0.9); nest.position.set(NEST[0] - 1.2, 0.3, 0); stage.root.add(nest);
    const pile = foodPile(0.8); pile.position.set(FOOD[0] + 0.6, 0.3, 0); stage.root.add(pile);
    stage.label('Nest', [NEST[0] - 1.2, 1.3, 0]); stage.label('Food', [FOOD[0] + 0.6, 1.3, 0]);
    const lS = stage.label('', [0, 1, -2.2], stage.root, 'hot'), lL = stage.label('', [0, 1, 4], stage.root);
    const g = new THREE.Group(); g.position.y = 0.3; stage.root.add(g);
    const sw = new AntSwarm(N, { scale: 0.3 }); sw.mesh.position.y = 0.3; stage.root.add(sw.mesh);
    const stems = [new Path([NEST, [-7.2, 0], A]), new Path([B, [7.2, 0], FOOD])];
    let paths, sim, built = null, tubes = [], glow = [];
    const wood = M.matte(0xc9a46e), cA = new THREE.Color(0x5b3fa8), cB = new THREE.Color(COL.amber);
    const strip = (p, mat, w = 0.26) => { const m = new THREE.Mesh(new THREE.TubeGeometry(p.curve, 120, w, 8), mat); m.scale.y = 0.22; m.receiveShadow = true; g.add(m); return m; };
    stems.forEach((p) => strip(p, wood));
    const rebuild = (s) => {
      tubes.forEach((t) => { g.remove(t); t.geometry.dispose(); }); glow.forEach((t) => { g.remove(t); t.geometry.dispose(); t.material.dispose(); });
      const sp = new Path(shortPts()), lp = new Path(longPts(s.ratio, sp.len));
      paths = [sp, lp];
      tubes = paths.map((p) => strip(p, wood));
      glow = paths.map((p) => { const m = strip(p, new THREE.MeshBasicMaterial({ color: cA, transparent: true, opacity: 0.9, toneMapped: false }), 0.14); m.position.y = 0.06; return m; });
      sim = new BridgeSim([stems[0].len, sp.len, lp.len], { late: s.late, seed: sim?.seed ?? 1 });
      built = { ratio: s.ratio, late: s.late };
      s._dirty = false;
      lS.position.set(0, 1, -2.4); lL.position.set(0, 1, longPts(s.ratio, sp.len)[2][1] + 0.8);
    };
    rebuild(S);
    let trials = null, t = 0;
    const tmp = {}, white = new THREE.Color(0xffffff);
    return {
      restart(seed = 1 + Math.floor(Math.random() * 1e6), warm = 0) { if (S._dirty) rebuild(S); sim.reset(seed); if (warm) sim.run(warm); },
      trials(n) {
        if (S._dirty) rebuild(S);
        const out = { n, short: 0, clear: 0, ratio: S.ratio, late: S.late };
        for (let i = 0; i < n; i++) {
          const b = new BridgeSim(sim.lens, { seed: 1000 + i * 7919 + Math.floor(Math.random() * 1e5), late: S.late });
          b.run(S.late ? LATE + 300 : 300);
          const sh = b.share(); if (sh > 0.5) out.short++; if (sh > 0.8 || sh < 0.2) out.clear++;
        }
        trials = out;
      },
      update(dt, s) {
        if (s._dirty || built.ratio !== s.ratio || built.late !== s.late) { rebuild(s); sim.reset(1 + Math.floor(Math.random() * 1e6)); trials = null; }
        t += dt;
        let left = dt * s.speed; while (left > 1e-6) { const d = Math.min(0.05, left); sim.step(d); left -= d; }
        const open0 = sim.open(0);
        tubes[0].visible = glow[0].visible = open0;
        const tot = sim.tau[0] + sim.tau[1] + 1e-9;
        const mxT = Math.max(sim.tau[0], sim.tau[1], 1e-9);
        glow.forEach((m, i) => { const k = (sim.tau[i] / mxT) * (mxT / (mxT + 10)); m.material.color.copy(cA).lerp(cB, k).lerp(white, Math.max(0, k - 0.8)); m.material.opacity = 0.35 + 0.6 * k; });
        sim.ants.forEach((a, i) => {
          if (a.seg < 0) { sw.hide(i); return; }
          const p = a.seg === 1 ? paths[a.b] : stems[a.seg === 0 ? 0 : 1];
          p.at(a.d > 0 ? a.u : 1 - a.u, tmp);
          const h = a.d > 0 ? tmp.h : tmp.h + Math.PI, off = a.d > 0 ? 0.09 : -0.09;
          sw.place(i, tmp.x - Math.sin(tmp.h) * off, tmp.z + Math.cos(tmp.h) * off, h, 0.06, 1, a.d < 0 ? new THREE.Color(COL.food) : null, Math.abs(Math.sin(t * 20 + i)) * 0.01);
        });
        sw.done();
        lS.element.textContent = open0 ? `Short: ${Math.round((sim.tau[0] / tot) * 100)}% of scent` : 'Short: not yet added';
        lL.element.textContent = `Long (${s.ratio.toFixed(1)}×): ${Math.round((sim.tau[1] / tot) * 100)}%`;
      },
      readout(s) {
        const sh = sim.share(), lateWait = sim.late && sim.t < LATE;
        const say = lateWait ? 'Only the long branch is open. The colony is building a trail on it.'
          : sim.cross.length < 15 ? 'Ants are spreading over both branches.'
          : sh > 0.8 ? 'The colony has settled on the short branch.' : sh < 0.2 ? (s.ratio > 1.05 ? 'The colony has settled on the long branch. It happens.' : 'The colony has picked one branch, by chance.') : 'Still undecided. Feedback is building on one side.';
        const tri = trials ? `<div class="row"><span>${trials.n} trials at ${trials.ratio.toFixed(1)}×${trials.late ? ', short late' : ''}</span><b>short won ${trials.short} of ${trials.n}</b></div>` : '';
        return `<div class="big">${Math.round(sh * 100)}% on the short branch</div><p class="r-say">${say}</p>
          ${spark(sim.hist, { mid: 0.5 })}
          <div class="row"><span>Share of crossings, last minute</span><b>${Math.round(sh * 100)}% short</b></div>
          <div class="row"><span>Simulated time</span><b>${Math.floor(sim.t / 60)} min ${Math.floor(sim.t % 60)} s</b></div>${tri}`;
      },
    };
  },
};
