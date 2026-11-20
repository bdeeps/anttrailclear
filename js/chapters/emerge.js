// Chapter 3: no one in charge. The same agent model as chapter 1, with three food piles that run out.
// Each ant follows three local rules; the trail network, the switch to new food and the abandonment of
// empty piles emerge from feedback and evaporation. Turning off "smell" breaks the feedback loop.
// Background: self-organisation in social insects (Camazine et al., Self-Organization in Biological
// Systems, 2001; Deneubourg & Goss 1989; Gordon on harvester ants with no central control).
import { THREE, M, Colony, AntSwarm, ground, nestMound, foodPile, drawColony, rng, clamp, COL } from '../ants.js';
import { sphere } from '../kit.js';

const NEST = [0, 0.5];
const FOODS = [{ x: -7.5, z: -5, r: 0.8, amount: 160 }, { x: 8, z: -4.5, r: 0.8, amount: 160 }, { x: 4.5, z: 7.5, r: 0.8, amount: 160 }];

export default {
  id: 'emerge',
  short: 'No one in charge',
  title: 'Nobody gives the orders',
  subtitle: 'Simple rules, followed by many ants, add up to a smart colony.',
  view: { pos: [0, 19, 13], target: [0, 0, 0.5] },
  learn: `<p>The queen does not lead. She lays eggs. No ant has a map, and no ant knows how many others are out, or where the best food is. Each one only senses the few millimetres of ground around it.</p>
    <p>Each ant here follows just three rules: <b>wander, and turn toward the stronger scent</b>; <b>when you find food, carry it home and mark the way</b>; <b>at home, drop it and go again</b>. Out of those rules come things no single ant planned: trails to every pile, more ants on closer piles, and a quick switch when a pile runs out.</p>
    <p>This is <b>self-organisation</b>, and the result is called <b>emergent</b> behaviour. It needs two things working against each other: <b>positive feedback</b> (scent attracts ants who add scent) and <b>negative feedback</b> (evaporation, and food running out). Deborah Gordon’s decades of work on harvester ants in Arizona showed colonies also decide how many ants go out from how often ants meet each other, again with no one in charge.</p>
    <p class="tip"><b>Try it:</b> switch off <b>Ants can smell scent</b> and watch the colony fall apart. Lower the number of <b>ants</b> until trails stop forming. Turn on <b>Follow one ant</b> to see what a single ant can sense.</p>
    <p class="note">Each pile holds 160 loads. The rules are our own simple version, for illustration.</p>`,
  terms: [
    { t: 'Self-organisation', d: 'Order that arises from many local interactions, without a leader or a plan.' },
    { t: 'Emergence', d: 'A pattern of the whole group that no single member shows or intends.' },
    { t: 'Negative feedback', d: 'A loop that damps things down, such as scent evaporating or food running out.' },
    { t: 'Stigmergy', d: 'Coordination through marks left in the environment: an ant changes the ground, and the ground changes what the next ant does.' },
  ],
  defaults: { n: 350, smell: true, follow1: false, evap: 0.04, speed: 3 },
  controls: [
    { key: 'smell', type: 'toggle', label: 'Ants can smell scent', hint: 'Off: ants still find food and lay scent, but nobody follows it.' },
    { key: 'n', type: 'range', label: 'Ants', min: 10, max: 600, step: 10, fmt: (v) => String(Math.round(v)) },
    { key: 'evap', type: 'log', label: 'Evaporation', min: 0.005, max: 0.5, fmt: (v) => `half gone in ${Math.max(1, Math.round(Math.LN2 / v))} s` },
    { key: 'follow1', type: 'toggle', label: 'Follow one ant' },
    { key: 'speed', type: 'range', label: 'Time speed', min: 0.5, max: 8, step: 0.5, fmt: (v) => v + '×' },
    { key: 'act', type: 'buttons', label: 'Food', items: [{ label: 'Refill and restart', act: (s, inst) => inst.restart() }, { label: 'Move the food', act: (s, inst) => inst.shuffle() }] },
  ],
  quiz: [
    { q: 'Who decides which food pile the colony works on?', options: ['The queen', 'A scout leader', 'Nobody: it emerges from simple rules and scent', 'The oldest ant'], answer: 2, why: 'Each ant reacts only to what it senses nearby. The pattern belongs to the group.' },
    { q: 'What happens when ants cannot smell the trail?', options: ['They do better', 'Trails stop mattering and food comes home much more slowly', 'They all stay home', 'Nothing changes'], answer: 1, why: 'Without the feedback loop every ant has to find food alone, by chance.' },
    { q: 'Why does the colony stop visiting an empty pile?', options: ['A leader tells it', 'No one marks the way back, and the old scent evaporates', 'The ants remember', 'Rain'], answer: 1, why: 'Returning ants are what refresh a trail; without them it fades.' },
    { q: 'Coordination through marks left in the environment is called…', options: ['Stigmergy', 'Telepathy', 'Hierarchy', 'Photosynthesis'], answer: 0, why: 'The ground itself carries the message from ant to ant.' },
  ],
  reel: [
    { ms: 5600, caption: 'No ant is in charge. Each follows a few simple rules, and a network of trails appears.', set: { n: 350, smell: true, follow1: false, evap: 0.04, speed: 4 }, act: (s, inst) => inst.restart(21, 30), view: { pos: [0, 18, 12], target: [0, 0, 0.5] }, spin: 0.3 },
  ],
  build({ stage, s: S }) {
    stage.floor.visible = false;
    stage.root.add(ground(44, { seed: 5 }));
    const col = new Colony({ n: 600, size: 26, grid: 140, nest: NEST, foods: FOODS, seed: 4 });
    stage.root.add(col.field.mesh);
    const sw = new AntSwarm(600); stage.root.add(sw.mesh);
    const nest = nestMound(); nest.position.set(NEST[0], 0, NEST[1]); stage.root.add(nest);
    stage.label('Nest', [NEST[0], 1.1, NEST[1]]);
    const piles = FOODS.map((f, i) => { const p = foodPile(0.8, 10 + i); p.position.set(f.x, 0, f.z); stage.root.add(p); return p; });
    const tags = FOODS.map((f) => stage.label('', [f.x, 1.1, f.z]));
    // the followed ant: a ring and three sniff points
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.45, 32), M.glow(COL.cyan, { side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; stage.root.add(ring);
    const sniff = [0, 1, 2].map(() => { const m = sphere(0.09, M.glow(COL.cyan)); m.castShadow = false; stage.root.add(m); return m; });
    const me = stage.label('', [0, 0, 0], stage.root, 'hot');
    let t = 0, history = [];
    const P = (s) => ({ n: s.n, smell: s.smell, evap: s.evap, deposit: 1 });
    const sim = (sec, s) => { let left = sec; while (left > 1e-6) { const d = Math.min(1 / 30, left); col.step(d, P(s)); left -= d; } };
    return {
      restart(seed = 1 + Math.floor(Math.random() * 1e6), warm = 0) { col.foodSpec = FOODS; col.reset(seed); if (warm) sim(warm, S); },
      shuffle() {
        const r = rng(Math.floor(Math.random() * 1e6));
        col.foodSpec = FOODS.map((f) => { let x, z; do { x = (r() - 0.5) * 20; z = (r() - 0.5) * 20; } while (Math.hypot(x - NEST[0], z - NEST[1]) < 5); return { ...f, x, z }; });
        col.foods = col.foodSpec.map((f) => ({ ...f, left: f.amount }));
      },
      update(dt, s) {
        t += dt; sim(dt * s.speed, s);
        col.field.draw();
        drawColony(col, sw, Math.round(s.n), t);
        col.foods.forEach((f, i) => { piles[i].position.set(f.x, 0, f.z); piles[i].setLeft(f.left / f.amount); tags[i].position.set(f.x, 1.1, f.z); tags[i].element.textContent = f.left > 0 ? `${f.left} left` : 'Empty'; });
        const a = col.ants[0], on = s.follow1 && a.out <= 0;
        ring.visible = on; me.visible = on; sniff.forEach((m) => { m.visible = on; });
        if (on) {
          ring.position.set(a.x, 0.04, a.z);
          [-0.6, 0, 0.6].forEach((da, k) => sniff[k].position.set(a.x + Math.cos(a.h + da) * 0.75, 0.08, a.z + Math.sin(a.h + da) * 0.75));
          me.position.set(a.x, 0.9, a.z);
          me.element.textContent = a.st ? 'Carrying food: heading home, marking' : col.field.get(a.x, a.z) > 1 ? 'Searching: on a trail, following it' : 'Searching: no scent here, wandering';
        }
      },
      readout(s) {
        const n = Math.round(s.n), rate = col.log.length ? (col.log.length * 60) / Math.min(60, Math.max(5, col.time)) : 0;
        const left = col.foods.reduce((k, f) => k + Math.max(0, f.left), 0);
        const say = !s.smell ? 'No one follows the scent, so every ant searches alone. Food trickles in.'
          : left === 0 ? 'All food is gone. Nobody refreshes the trails, so they fade away.'
          : n < 60 ? 'Too few ants: scent evaporates before the next ant comes by.'
          : col.onTrail(n) > 0.3 ? 'Trails link the nest to the food. No ant planned them.' : 'Ants are exploring. Trails start where lucky ants found food.';
        return `<div class="big">${Math.round(rate)} loads per minute</div><p class="r-say">${say}</p>
          <div class="row"><span>Ants on a trail</span><b>${Math.round(clamp(col.onTrail(n), 0, 1) * 100)}%</b></div>
          <div class="row"><span>Food still out there</span><b>${left} of ${FOODS.length * 160}</b></div>
          <div class="row"><span>Leaders</span><b>none</b></div>`;
      },
    };
  },
};
