// Chapter 1: a scent trail on the ground. Hundreds of simulated ants search, find food, and lay scent on
// the way home; others follow and reinforce it; scent evaporates. The model is our own agent-based
// cartoon (see Colony in ../ants.js). The rule "lay pheromone when returning with food, follow it when
// searching" is the classic recruitment story for mass-foraging ants (Wilson 1962 on fire ants;
// Hölldobler & Wilson, The Ants, 1990). Rates and distances here are not those of any one species.
import { THREE, Colony, AntSwarm, ground, nestMound, foodPile, drawColony, clamp } from '../ants.js';

const NEST = [-7.5, 2.5], FOOD = [7, -3.5];

export default {
  id: 'scent',
  short: 'Scent on the ground',
  title: 'A trail made of smell',
  subtitle: 'One ant finds food and marks the way home. Others follow, and add their own.',
  view: { pos: [0, 17, 13], target: [0, 0, 0] },
  learn: `<p>Many ants smell with their <b>antennae</b> and talk with chemicals called <b>pheromones</b>. When a forager finds food it picks some up and walks home, and on the way it dabs a little trail pheromone on the ground with the tip of its abdomen.</p>
    <p>Nestmates that touch the trail follow it out, find the same food, and lay more scent on their way back. A good food source gets <b>more ants, so more scent, so more ants</b>. That loop is called <b>positive feedback</b>.</p>
    <p>The scent does not last. It <b>evaporates</b>, so a trail only survives while ants keep refreshing it. When the food runs out, ants stop marking and the trail fades on its own. Evaporation is what lets the colony forget.</p>
    <p class="tip"><b>Try it:</b> press <b>Start again</b> and watch the first lucky ant. Then turn <b>evaporation</b> up until the trail cannot hold, or turn <b>scent per step</b> down. Hide the scent to see the ants alone.</p>
    <p class="note">The heat map is the amount of scent in each patch of ground. This is our own simple model, not real data. Here only ants carrying food lay scent; many real species also mark on the way out.</p>`,
  terms: [
    { t: 'Pheromone', d: 'A chemical signal that one animal releases and others of the same species respond to.' },
    { t: 'Trail pheromone', d: 'Scent laid on the ground that leads nestmates to food. In fire ants it comes from a gland called the Dufour’s gland.' },
    { t: 'Recruitment', d: 'Getting nestmates to come and help, here by laying a trail to food.' },
    { t: 'Evaporation', d: 'Scent turning into gas and drifting away, so an unused trail fades.' },
    { t: 'Positive feedback', d: 'A loop where more of something causes even more of it: more ants, more scent, more ants.' },
  ],
  defaults: { n: 300, deposit: 1, evap: 0.05, speed: 2, show: true },
  controls: [
    { key: 'evap', type: 'log', label: 'Evaporation', min: 0.005, max: 0.5, fmt: (v) => `half gone in ${Math.max(1, Math.round(Math.LN2 / v))} s`, ends: ['lasts', 'vanishes'] },
    { key: 'deposit', type: 'range', label: 'Scent per step', min: 0, max: 3, step: 0.05, fmt: (v) => v.toFixed(2) + '×' },
    { key: 'n', type: 'range', label: 'Ants', min: 20, max: 500, step: 10, fmt: (v) => String(Math.round(v)) },
    { key: 'speed', type: 'range', label: 'Time speed', min: 0.25, max: 6, step: 0.25, fmt: (v) => v + '×' },
    { key: 'show', type: 'toggle', label: 'Show the scent' },
    { key: 'act', type: 'buttons', label: 'Run', items: [{ label: 'Start again', act: (s, inst) => inst.restart() }, { label: 'Wipe the trail', act: (s, inst) => inst.wipe() }] },
  ],
  quiz: [
    { q: 'In this model, when does an ant lay trail scent?', options: ['All the time', 'On the way home with food', 'Only inside the nest', 'Never'], answer: 1, why: 'Returning foragers mark the way, so the trail always leads to food that has been found.' },
    { q: 'Why does a good trail keep getting stronger?', options: ['A leader orders more ants out', 'More ants on it lay more scent, which draws more ants', 'The food smells stronger', 'The ground stores it'], answer: 1, why: 'That loop is positive feedback.' },
    { q: 'What happens if the scent evaporates very fast?', options: ['The trail gets stronger', 'Trails cannot form, and ants keep wandering', 'Ants run faster', 'Nothing changes'], answer: 1, why: 'Scent vanishes before the next ant arrives, so there is nothing to follow.' },
    { q: 'Why is evaporation useful to the colony?', options: ['It is not', 'It lets old trails to empty food sources fade away', 'It feeds the ants', 'It keeps rivals out'], answer: 1, why: 'An unrefreshed trail fades, so the colony stops sending ants to food that is gone.' },
  ],
  reel: [
    { ms: 5200, caption: 'An ant finds food and walks home, dabbing scent on the ground.', set: { n: 300, deposit: 1, evap: 0.05, speed: 2.5, show: true }, act: (s, inst) => inst.restart(11, 10), view: { pos: [0, 15, 11], target: [0, 0, 0] }, spin: 0 },
    { ms: 5600, caption: 'Others follow the scent and add their own. The trail grows. Unused scent fades.', set: { n: 300, deposit: 1, evap: 0.05, speed: 3, show: true }, act: (s, inst) => inst.restart(11, 32), view: { pos: [-9, 9, 11], target: [0, 0, -0.5] }, spin: 0.25 },
  ],
  build({ stage, s: S }) {
    stage.floor.visible = false;
    stage.root.add(ground(40));
    const col = new Colony({ n: 500, size: 24, grid: 128, nest: NEST, foods: [{ x: FOOD[0], z: FOOD[1], r: 0.8 }], seed: 3 });
    stage.root.add(col.field.mesh);
    const sw = new AntSwarm(500); stage.root.add(sw.mesh);
    const nest = nestMound(); nest.position.set(NEST[0], 0, NEST[1]); stage.root.add(nest);
    const pile = foodPile(0.8); pile.position.set(FOOD[0], 0, FOOD[1]); stage.root.add(pile);
    stage.label('Nest', [NEST[0], 1, NEST[1]]); stage.label('Food', [FOOD[0], 1, FOOD[1]]);
    let t = 0, first = null;
    const P = (s) => ({ n: s.n, deposit: s.deposit, evap: s.evap });
    const sim = (sec, s) => { let left = sec; while (left > 1e-6) { const d = Math.min(1 / 30, left); col.step(d, P(s)); left -= d; if (first === null && col.found) first = col.time; } };
    const api = {
      restart(seed = 1 + Math.floor(Math.random() * 1e6), warm = 0) { col.reset(seed); first = null; if (warm) sim(warm, S); },
      wipe() { col.field.clear(); },
      update(dt, s) {
        t += dt;
        sim(dt * s.speed, s);
        col.field.mesh.visible = s.show;
        if (s.show) col.field.draw();
        drawColony(col, sw, Math.round(s.n), t);
      },
      readout(s) {
        const n = Math.round(s.n), carrying = col.ants.slice(0, n).filter((a) => a.st === 1 && a.out <= 0).length;
        const rate = col.log.length ? (col.log.length * 60) / Math.min(60, Math.max(5, col.time)) : 0;
        const say = first === null ? 'Every ant is searching at random. Nobody knows where the food is yet.'
          : rate < 3 ? 'An ant has found the food. Its scent is faint, so few others find the way yet.'
          : col.onTrail(n) > 0.25 ? 'A trail has formed. Most foragers now walk the same line.' : 'Scent is building up. Watch the line between nest and food.';
        return `<div class="big">${first === null ? 'Searching' : `First find at ${first.toFixed(0)} s`}</div><p class="r-say">${say}</p>
          <div class="row"><span>Ants carrying food</span><b>${carrying} of ${n}</b></div>
          <div class="row"><span>Food brought home</span><b>${Math.round(rate)} per min</b></div>
          <div class="row"><span>Ants on a trail</span><b>${Math.round(clamp(col.onTrail(n), 0, 1) * 100)}%</b></div>`;
      },
    };
    return api;
  },
};
