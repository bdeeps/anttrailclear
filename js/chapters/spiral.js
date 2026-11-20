// Chapter 5: when following goes wrong. Army ants have very poor eyesight and keep together by following
// the scent of the ants ahead. If a column loops back on itself they can circle for hours: an "ant mill".
// Schneirla described one in "A unique case of circular milling in ants" (American Museum Novitates
// no. 1253, 1944); William Beebe described a very large one in 1921 (reported as in British Guiana).
// Model: the same Colony as chapter 1, but every ant lays scent all the time and there is no food or nest.
// We start the ants on a ring, as if a column had curled back on itself.
import { THREE, M, Colony, AntSwarm, ground, drawColony, clamp } from '../ants.js';

const R0 = 4.5;

export default {
  id: 'spiral',
  short: 'The death spiral',
  title: 'When following goes wrong',
  subtitle: 'Army ants that only follow the ant ahead can march in a circle until they drop.',
  view: { pos: [0, 15, 11], target: [0, 0, 0] },
  learn: `<p>The same rule that finds short paths has a weakness. <b>Army ants</b> are nearly blind and move in huge raiding columns, each ant following the scent of the ones in front. If the head of a column bends round and meets its own tail, nobody is leading any more.</p>
    <p>Then every ant follows the ant ahead, and the circle feeds itself: walking lays scent, and scent keeps them walking. The result is an <b>ant mill</b>, sometimes called a <b>death spiral</b>. In 1944 the American animal psychologist T. C. Schneirla described one in detail, and the naturalist William Beebe had reported a huge one in 1921, in South America. Mills can go on for hours, until ants die of exhaustion or something breaks the loop.</p>
    <p>It is the same positive feedback that builds a good trail, with no brake. Evaporation and a little <b>randomness</b> are what let ants escape.</p>
    <p class="tip"><b>Try it:</b> press <b>Start a mill</b>. Lower <b>trail following</b> or raise <b>wandering</b> until the ring breaks up. Press <b>Rain on it</b> to wash part of the trail away.</p>
    <p class="note">Our model starts the ants on a ring. In the wild, mills begin when a column loses its way, often after rain washes trails out.</p>`,
  terms: [
    { t: 'Army ant', d: 'Ants that hunt in large moving columns and swarms rather than from one fixed nest, such as Eciton in the Americas.' },
    { t: 'Ant mill', d: 'A circle of ants each following the one in front, which can go on until they are exhausted.' },
    { t: 'Runaway feedback', d: 'Positive feedback with nothing to stop it, so a pattern locks in even when it is harmful.' },
  ],
  defaults: { follow: 1.6, wander: 0.8, evap: 0.08, speed: 1.5 },
  controls: [
    { key: 'follow', type: 'range', label: 'Trail following', min: 0, max: 2.5, step: 0.05, fmt: (v) => v.toFixed(2) + '×' },
    { key: 'wander', type: 'range', label: 'Wandering', min: 0.2, max: 4, step: 0.1, fmt: (v) => v.toFixed(1) },
    { key: 'evap', type: 'log', label: 'Evaporation', min: 0.01, max: 1, fmt: (v) => `half gone in ${Math.max(1, Math.round(Math.LN2 / v))} s` },
    { key: 'speed', type: 'range', label: 'Time speed', min: 0.5, max: 5, step: 0.5, fmt: (v) => v + '×' },
    { key: 'act', type: 'buttons', label: 'Do', items: [{ label: 'Start a mill', act: (s, inst) => inst.restart() }, { label: 'Rain on it', act: (s, inst) => inst.rain() }] },
  ],
  quiz: [
    { q: 'Why can army ants end up walking in a circle?', options: ['They are lost on purpose', 'Each follows the scent of the ant ahead, and the column has looped back on itself', 'The queen orders it', 'They are dancing'], answer: 1, why: 'With no leader and a closed loop, following the ant ahead means going round forever.' },
    { q: 'Which change helps ants escape the mill in the model?', options: ['Following the trail more strongly', 'More random wandering or faster evaporation', 'More ants', 'Nothing can'], answer: 1, why: 'Randomness and fading scent weaken the feedback that holds the circle together.' },
    { q: 'What do ant mills show about simple rules?', options: ['They never fail', 'The same feedback that finds good paths can lock ants into a bad one', 'Ants can see well', 'Leaders are useless'], answer: 1, why: 'Positive feedback with no brake can trap a whole group.' },
  ],
  reel: [
    { ms: 5400, caption: 'Following can go wrong. Army ants that loop back on their own trail can circle until they drop.', set: { follow: 1.6, wander: 0.8, evap: 0.08, speed: 2 }, act: (s, inst) => inst.restart(3, 8), view: { pos: [3, 8, 6.5], target: [0, 0, 0] }, spin: 0.6 },
  ],
  build({ stage, s: S }) {
    stage.floor.visible = false;
    stage.root.add(ground(40, { color: '#2f2a1f', speck: '#4d4430', seed: 12 }));
    const N = 360;
    const col = new Colony({ n: N, size: 22, grid: 128, nest: [100, 100], foods: [], seed: 2, laySearch: 2.2 });
    col.field.scale = 14;
    stage.root.add(col.field.mesh);
    const sw = new AntSwarm(N, { color: 0x1c0a04, scale: 0.36 }); stage.root.add(sw.mesh);
    // rain: a few streaks drawn as thin boxes that fall briefly
    const drops = new THREE.Group(); stage.root.add(drops);
    const dmat = M.ghost(0xbfd8ff, 0.5);
    for (let i = 0; i < 80; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.8, 0.02), dmat); drops.add(m); }
    drops.visible = false;
    let t = 0, rainT = 0, rainA = 0;
    const P = (s) => ({ n: N, follow: s.follow, wander: s.wander, evap: s.evap, deposit: 0, antSpeed: 2 });
    const sim = (sec, s) => { let left = sec; while (left > 1e-6) { const d = Math.min(1 / 30, left); col.step(d, P(s)); left -= d; } };
    const ring = (seed) => {
      col.reset(seed);
      col.ants.forEach((a, i) => { const ang = (i / N) * Math.PI * 2, rr = R0 + (col.r() - 0.5) * 0.8; a.x = Math.cos(ang) * rr; a.z = Math.sin(ang) * rr; a.h = ang + Math.PI / 2; a.out = 0; a.st = 0; });
      for (let k = 0; k < 240; k++) { const a0 = (k / 240) * Math.PI * 2, a1 = ((k + 1) / 240) * Math.PI * 2; col.field.paint(Math.cos(a0) * R0, Math.sin(a0) * R0, Math.cos(a1) * R0, Math.sin(a1) * R0, 3, 2); }
    };
    ring(3);
    return {
      restart(seed = 1 + Math.floor(Math.random() * 1e6), warm = 0) { ring(seed); if (warm) sim(warm, S); },
      rain() {
        rainA = Math.random() * Math.PI * 2; rainT = 1.2;
        const n = col.field.n, cx = Math.cos(rainA) * R0, cz = Math.sin(rainA) * R0;
        for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const x = ((i + 0.5) / n - 0.5) * col.field.size, z = ((j + 0.5) / n - 0.5) * col.field.size; if (Math.hypot(x - cx, z - cz) < 2.6) col.field.v[j * n + i] = 0; }
        col.ants.forEach((a) => { if (Math.hypot(a.x - cx, a.z - cz) < 2.6) a.h += (col.r() - 0.5) * 3; });
      },
      update(dt, s) {
        t += dt; sim(dt * s.speed, s);
        col.field.draw();
        drawColony(col, sw, N, t);
        rainT = Math.max(0, rainT - dt); drops.visible = rainT > 0;
        if (drops.visible) drops.children.forEach((m, i) => { const a = rainA + ((i * 0.618) % 1 - 0.5) * 0.9, r = R0 + (((i * 0.37) % 1) - 0.5) * 3; m.position.set(Math.cos(a) * r, ((t * 9 + i * 0.7) % 4), Math.sin(a) * r); });
      },
      readout() {
        let inRing = 0, sumW = 0;
        col.ants.forEach((a) => { const r = Math.hypot(a.x, a.z); if (r > 2 && r < 7.5) { inRing++; sumW += (-Math.sin(Math.atan2(a.z, a.x)) * Math.cos(a.h) + Math.cos(Math.atan2(a.z, a.x)) * Math.sin(a.h)); } });
        const share = inRing / N, swirl = inRing ? sumW / inRing : 0;
        const milling = share > 0.6 && Math.abs(swirl) > 0.6;
        const say = milling ? 'A mill. Each ant follows the one ahead, and nobody is leading.' : share > 0.4 ? 'The circle is weakening. Some ants are breaking away.' : 'The ring has broken up. Ants are free to wander off.';
        return `<div class="big">${milling ? 'Milling' : 'Breaking up'}</div><p class="r-say">${say}</p>
          <div class="row"><span>Ants in the ring</span><b>${Math.round(clamp(share, 0, 1) * 100)}%</b></div>
          <div class="row"><span>All going the same way</span><b>${Math.round(clamp(Math.abs(swirl), 0, 1) * 100)}%</b></div>
          <div class="row"><span>Laps so far (ring of ${R0} units)</span><b>${Math.floor((col.time * 2) / (2 * Math.PI * R0))}</b></div>`;
      },
    };
  },
};
