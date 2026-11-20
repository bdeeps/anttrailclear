// Chapter 6: from ants to algorithms. Marco Dorigo's Ant System (PhD thesis, Politecnico di Milano, 1992;
// first technical report 1991) and the Ant Colony System of Dorigo & Gambardella (IEEE Trans. Evol.
// Comput. 1(1):53-66, 1997, doi:10.1109/4235.585892) search for short tours in the travelling salesman
// problem with virtual ants. Each ant builds a tour, choosing the next city with probability proportional to
// pheromone^alpha × (1/distance)^beta; pheromone evaporates by a fraction rho per round and each ant adds
// Q/length on the edges it used. This is plain Ant System, written from that description; the exact best
// tour is found by brute force (Held-Karp dynamic programming) for comparison.
import { THREE, M, AntSwarm, ground, rng, clamp, lerp, COL } from '../ants.js';
import { sphere } from '../kit.js';

function heldKarp(D) {
  const n = D.length, F = 1 << (n - 1), dp = new Float64Array(F * n).fill(Infinity), par = new Int8Array(F * n).fill(-1);
  for (let j = 1; j < n; j++) dp[(1 << (j - 1)) * n + j] = D[0][j];
  for (let m = 1; m < F; m++) for (let j = 1; j < n; j++) {
    if (!(m & (1 << (j - 1)))) continue; const v = dp[m * n + j]; if (v === Infinity) continue;
    for (let k = 1; k < n; k++) { if (m & (1 << (k - 1))) continue; const m2 = m | (1 << (k - 1)), w = v + D[j][k]; if (w < dp[m2 * n + k]) { dp[m2 * n + k] = w; par[m2 * n + k] = j; } }
  }
  let best = Infinity, last = -1; for (let j = 1; j < n; j++) { const w = dp[(F - 1) * n + j] + D[j][0]; if (w < best) { best = w; last = j; } }
  const tour = []; let m = F - 1, j = last; while (j > 0) { tour.push(j); const p = par[m * n + j]; m &= ~(1 << (j - 1)); j = p; }
  tour.push(0); return { len: best, tour: tour.reverse() };
}

export default {
  id: 'aco',
  short: 'Ants in computers',
  title: 'From ants to algorithms',
  subtitle: 'Virtual ants and evaporating virtual scent find short routes between cities.',
  view: { pos: [0, 15, 12], target: [0, 0, 0.5] },
  learn: `<p>In 1991–92 the Italian computer scientist <b>Marco Dorigo</b>, working on his PhD in Milan, turned the double-bridge result into a method for hard routing puzzles. He called it the <b>Ant System</b>; the family is now called <b>Ant Colony Optimization</b>.</p>
    <p>The classic test is the <b>travelling salesman problem</b>: visit every city once and come back, by the shortest round trip. The number of possible tours explodes as cities are added, so checking them all soon becomes hopeless. Here, each round, a team of <b>virtual ants</b> each builds a tour. At each step an ant picks the next city at random, but favours roads that are <b>short</b> and roads that carry more <b>virtual pheromone</b>. Then every road loses some pheromone (<b>evaporation</b>) and each ant adds pheromone to its roads, more if its tour was short.</p>
    <p>Good roads collect pheromone, so later ants use them more, as on the bridge. Variants of the idea have been applied to vehicle routing, scheduling and routing data through networks.</p>
    <p class="tip"><b>Try it:</b> watch the road network thin out to one bright loop. Set <b>pheromone weight</b> to 0 (ants just pick near cities) or <b>distance weight</b> to 0 (only scent). Push <b>evaporation</b> very low and the ants can lock in early on a worse tour.</p>
    <p class="note">This is the plain 1990s Ant System with our own settings. The exact best tour is computed by brute force, which only works for small maps.</p>`,
  terms: [
    { t: 'Ant Colony Optimization', d: 'A family of computer methods in which simulated ants and evaporating virtual pheromone search for good solutions.' },
    { t: 'Travelling salesman problem', d: 'Find the shortest round trip that visits every city once. A standard hard puzzle in computing.' },
    { t: 'Heuristic', d: 'A rule of thumb that usually helps, here “prefer nearby cities”.' },
    { t: 'Exploration vs exploitation', d: 'The balance between trying new routes and reusing the best ones found so far.' },
  ],
  defaults: { cities: 10, alpha: 1, beta: 3, rho: 0.3, speed: 1.5 },
  controls: [
    { key: 'cities', type: 'range', label: 'Cities', min: 6, max: 12, step: 1, fmt: (v) => String(v) },
    { key: 'alpha', type: 'range', label: 'Pheromone weight (α)', min: 0, max: 3, step: 0.1, fmt: (v) => v.toFixed(1) },
    { key: 'beta', type: 'range', label: 'Distance weight (β)', min: 0, max: 5, step: 0.1, fmt: (v) => v.toFixed(1) },
    { key: 'rho', type: 'log', label: 'Evaporation per round (ρ)', min: 0.01, max: 0.9, fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'speed', type: 'range', label: 'Speed', min: 0.25, max: 6, step: 0.25, fmt: (v) => v + '×' },
    { key: 'act', type: 'buttons', label: 'Map', items: [{ label: 'New cities', act: (s, inst) => inst.newMap() }, { label: 'Restart the ants', act: (s, inst) => inst.restart() }] },
  ],
  onChange(s, key) { if (key === 'cities') s._map = true; },
  quiz: [
    { q: 'In Ant Colony Optimization, what is the “pheromone”?', options: ['A real chemical', 'A number stored on each road that ants add to and that fades', 'The road length', 'A city'], answer: 1, why: 'It is a virtual scent: a number that good tours increase and evaporation decreases.' },
    { q: 'Why do short tours end up with the most pheromone?', options: ['They are chosen by a leader', 'Ants add more to roads in short tours, and good roads get chosen again', 'Short roads evaporate slower', 'By luck only'], answer: 1, why: 'As on the double bridge, better options are reinforced faster.' },
    { q: 'What can happen with almost no evaporation?', options: ['The ants always find the best tour', 'They can lock in early on a worse tour', 'Nothing', 'They stop moving'], answer: 1, why: 'Old choices never fade, so early luck dominates, like the late short branch.' },
    { q: 'Who introduced the Ant System?', options: ['Charles Darwin', 'Marco Dorigo', 'Alan Turing', 'E. O. Wilson'], answer: 1, why: 'Dorigo described it in his early-1990s work in Milan.' },
  ],
  reel: [
    { ms: 5800, caption: 'Computers copy the trick. Virtual ants and fading virtual scent find short routes between cities.', set: { cities: 10, alpha: 1, beta: 3, rho: 0.3, speed: 2.5 }, act: (s, inst) => inst.restart(4, 2), view: { pos: [0, 14, 10], target: [0, 0, 0.5] }, spin: 0.3 },
  ],
  build({ stage, s: S }) {
    stage.floor.visible = false;
    stage.root.add(ground(40, { color: '#1f2430', speck: '#2b3242', seed: 6 }));
    const board = new THREE.Group(); stage.root.add(board);
    const cyl = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true);
    const up = new THREE.Vector3(0, 1, 0), tmpV = new THREE.Vector3();
    const place = (m, a, b, r, y) => { tmpV.set(b[0] - a[0], 0, b[1] - a[1]); const L = tmpV.length(); m.position.set((a[0] + b[0]) / 2, y, (a[1] + b[1]) / 2); m.quaternion.setFromUnitVectors(up, tmpV.normalize()); m.scale.set(r, L, r); };
    let C = [], D = [], tau = [], edges = [], bestM = [], pins = [], opt = null, best = null, iter = 0, tours = [], phase = 0, mapSeed = 4, r = rng(1), firstBest = 0;
    const sw = new AntSwarm(12, { color: 0xc7b07a, scale: 0.42 }); stage.root.add(sw.mesh);
    const cA = new THREE.Color(0x4a3a8a), cB = new THREE.Color(COL.amber);
    const clearBoard = () => { board.children.slice().forEach((o) => { board.remove(o); o.traverse((k) => { if (k.material) k.material.dispose(); if (k.geometry && k.geometry !== cyl) k.geometry.dispose(); if (k.isCSS2DObject) k.element.remove(); }); }); };
    const newMap = (seed, n) => {
      clearBoard(); mapSeed = seed;
      const rr = rng(seed); C = [];
      while (C.length < n) { const p = [(rr() - 0.5) * 17, (rr() - 0.5) * 11 + 0.5]; if (C.every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) > 2.4)) C.push(p); }
      D = C.map((a) => C.map((b) => Math.hypot(a[0] - b[0], a[1] - b[1])));
      opt = heldKarp(D);
      edges = [];
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const m = new THREE.Mesh(cyl, new THREE.MeshBasicMaterial({ color: cA, transparent: true, opacity: 0.5, toneMapped: false, depthWrite: false })); board.add(m); edges.push({ i, j, m }); }
      bestM = C.map(() => { const m = new THREE.Mesh(cyl, M.glow(COL.food)); board.add(m); return m; });
      pins = C.map((p, i) => { const g = new THREE.Group(); const b = sphere(0.32, M.plastic(i === 0 ? COL.coral : 0xe9eef8)); b.position.y = 0.32; g.add(b); g.position.set(p[0], 0, p[1]); board.add(g); return g; });
      S._map = false; restart(1);
    };
    const restart = (seed) => {
      const n = C.length; r = rng(seed);
      // tau0 = 1 / (n * nearest-neighbour tour length), the usual starting level
      let cur = 0, seen = new Set([0]), L = 0; while (seen.size < n) { let b = -1; for (let j = 0; j < n; j++) if (!seen.has(j) && (b < 0 || D[cur][j] < D[cur][b])) b = j; L += D[cur][b]; cur = b; seen.add(b); } L += D[cur][0];
      tau = C.map(() => C.map(() => 1 / (n * L)));
      best = null; iter = 0; phase = 0; firstBest = 0; build();
    };
    const tourLen = (t) => t.reduce((s, c, k) => s + D[c][t[(k + 1) % t.length]], 0);
    const build = () => { // one round: n ants each build a tour
      const n = C.length; tours = [];
      for (let a = 0; a < n; a++) {
        const t = [a % n], used = new Set(t);
        while (t.length < n) {
          const c = t[t.length - 1]; let tot = 0; const w = [];
          for (let j = 0; j < n; j++) { if (used.has(j)) { w.push(0); continue; } const v = Math.pow(tau[c][j], S.alpha) * Math.pow(1 / D[c][j], S.beta); w.push(v); tot += v; }
          let x = r() * tot, pick = -1; for (let j = 0; j < n; j++) { if (!w[j]) continue; x -= w[j]; pick = j; if (x <= 0) break; }
          if (pick < 0) pick = [...Array(n).keys()].find((j) => !used.has(j));
          t.push(pick); used.add(pick);
        }
        tours.push({ t, L: tourLen(t) });
      }
    };
    const finish = () => { // evaporate and deposit, then remember the best
      const n = C.length;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) tau[i][j] *= 1 - S.rho;
      tours.forEach(({ t, L }) => { for (let k = 0; k < n; k++) { const a = t[k], b = t[(k + 1) % n]; tau[a][b] += 1 / L; tau[b][a] += 1 / L; } if (!best || L < best.L - 1e-9) { best = { t: t.slice(), L }; firstBest = iter + 1; } });
      iter++;
    };
    newMap(mapSeed, S.cities);
    const ROUND = 1.6;
    return {
      newMap() { newMap(1 + Math.floor(Math.random() * 1e6), S.cities); },
      restart(seed = 1 + Math.floor(Math.random() * 1e6), warmRounds = 0) { restart(seed); for (let k = 0; k < warmRounds; k++) { finish(); build(); } },
      update(dt, s) {
        if (s._map || C.length !== s.cities) newMap(mapSeed, s.cities);
        phase += (dt * s.speed) / ROUND;
        while (phase >= 1) { phase -= 1; finish(); build(); }
        const n = C.length;
        let mx = 0; edges.forEach((e) => { mx = Math.max(mx, tau[e.i][e.j]); });
        edges.forEach((e) => { const k = Math.pow(tau[e.i][e.j] / (mx || 1), 0.7); place(e.m, C[e.i], C[e.j], 0.015 + 0.11 * k, 0.05); e.m.material.color.copy(cA).lerp(cB, k); e.m.material.opacity = 0.15 + 0.8 * k; });
        bestM.forEach((m, k) => { m.visible = !!best; if (best) place(m, C[best.t[k]], C[best.t[(k + 1) % n]], 0.05, 0.75); });
        // ants walk their tours during the round
        tours.forEach(({ t }, a) => {
          const f = phase * n, k = Math.floor(f), u = f - k, A = C[t[k % n]], B = C[t[(k + 1) % n]];
          sw.place(a, lerp(A[0], B[0], u), lerp(A[1], B[1], u), Math.atan2(B[1] - A[1], B[0] - A[0]), 0.02);
        });
        for (let a = tours.length; a < sw.count; a++) sw.hide(a);
        sw.done();
      },
      readout() {
        const gap = best ? (best.L / opt.len - 1) * 100 : null;
        const tours = C.length > 2 ? Array.from({ length: C.length - 1 }, (_, i) => i + 1).reduce((a, b) => a * b, 1) / 2 : 1;
        const say = !best ? 'The first ants are out. Every road starts with the same faint scent.'
          : gap < 0.01 ? `The ants found the shortest tour, on round ${firstBest}.` : `Best so far is ${gap.toFixed(1)}% longer than the shortest possible.`;
        return `<div class="big">Round ${iter}</div><p class="r-say">${say}</p>
          <div class="row"><span>Best tour found</span><b>${best ? best.L.toFixed(1) : '…'}</b></div>
          <div class="row"><span>Shortest possible</span><b>${opt.len.toFixed(1)}</b></div>
          <div class="row"><span>Different round trips</span><b>${tours.toLocaleString('en-GB')}</b></div>`;
      },
    };
  },
};
