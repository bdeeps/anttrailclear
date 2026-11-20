// Chapter 4: more than smell. Saharan desert ants (Cataglyphis) forage alone and do not lay recruitment
// trails on the hot sand. They get home by path integration: a sun and sky-polarisation compass for
// direction, and a step counter for distance. Wittlinger, Wehner & Wolf (2006, Science 312:1965,
// doi:10.1126/science.1126912) trained ants over 10 m, then lengthened (stilts) or shortened (stumps) their
// legs at the feeder: median search points were 10.20 m (normal), 15.30 m (stilts) and 5.75 m (stumps).
// Santschi (c. 1911) shaded the sun and showed it via a mirror from the other side; the ants turned round.
// Our ant's search path is random and the drawing is not to scale (the ant is drawn huge).
import { THREE, M, ground, nestMound, foodPile, rng, gauss, clamp, lerp, COL } from '../ants.js';
import { antGeometry } from '../ants.js';
import { sphere, arrow, box } from '../kit.js';

const GAIN = { normal: 10.2 / 10.2, stilts: 15.3 / 10.2, stumps: 5.75 / 10.2 };
const LEGNAME = { normal: 'normal legs', stilts: 'stilts', stumps: 'stumps' };
const SUN = Math.PI * 0.8, V = 2.2;

function trip(seed) {
  // a winding search path that ends at food about 10 m from the nest
  const r = rng(seed), goal = r() * Math.PI * 2, G = [Math.cos(goal) * 10, Math.sin(goal) * 10];
  const pts = [[0, 0]]; let x = 0, z = 0, h = goal + (r() - 0.5) * 2;
  for (let i = 0; i < 400; i++) {
    const dx = G[0] - x, dz = G[1] - z, d = Math.hypot(dx, dz);
    if (d < 0.3) break;
    const pull = clamp(i / 250, 0.05, 1) * 1.2;
    h += gauss(r) * 0.55 + Math.atan2(Math.sin(Math.atan2(dz, dx) - h), Math.cos(Math.atan2(dz, dx) - h)) * pull * 0.25;
    x += Math.cos(h) * 0.12; z += Math.sin(h) * 0.12; pts.push([x, z]);
  }
  pts.push(G);
  const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, cum, len: cum[cum.length - 1], food: G };
}
const along = (T, d) => { let i = 1; while (i < T.cum.length - 1 && T.cum[i] < d) i++; const k = clamp((d - T.cum[i - 1]) / (T.cum[i] - T.cum[i - 1] || 1), 0, 1), a = T.pts[i - 1], b = T.pts[i]; return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), Math.atan2(b[1] - a[1], b[0] - a[0])]; };

export default {
  id: 'compass',
  short: 'Sun, sky and steps',
  title: 'Ants that count their steps',
  subtitle: 'In the desert, scent burns off. Saharan ants steer by the sky and count their strides.',
  view: { pos: [0, 15, 12], target: [0, 0, 0] },
  learn: `<p>Not every ant follows a trail. <b>Cataglyphis</b> desert ants hunt alone on sand hot enough to kill them, and do not lay scent trails to food. A forager wanders far and wide, finds a dead insect, then runs <b>straight home</b>, not back along its winding route.</p>
    <p>It does this by <b>path integration</b>: it keeps a running total of every turn and every step, so it always knows the direction and distance back to the nest. For <b>direction</b> it uses the sun and the pattern of <b>polarised light</b> in the sky, which it can see even when the sun is hidden. Around 1911 Félix Santschi shaded the sun from foraging ants and showed it in a mirror from the other side. The ants turned round.</p>
    <p>For <b>distance</b> it counts steps. In 2006 Matthias Wittlinger, Rüdiger Wehner and Harald Wolf trained ants to walk 10 m to a feeder, then glued pig bristles to their legs as <b>stilts</b> or trimmed them to <b>stumps</b>. On the way home, stilt ants searched for the nest at about 15.3 m, stump ants at about 5.75 m, and normal ants at about 10.2 m. Ants that had walked out on the changed legs as well got it right.</p>
    <p>Ants also learn <b>landmarks</b>, and many trail-laying species use the sun and landmarks together with scent.</p>
    <p class="tip"><b>Try it:</b> press <b>New trip</b>. Then pick <b>stilts</b> or <b>stumps</b>, and switch on the <b>mirror</b>.</p>
    <p class="note">The search path is random, and the ant is drawn far bigger than life. Distances on the ground are in metres.</p>`,
  terms: [
    { t: 'Path integration', d: 'Keeping a running sum of direction and distance travelled, so you always know the way back to the start. Also called dead reckoning.' },
    { t: 'Sun compass', d: 'Using the sun’s position to hold a direction.' },
    { t: 'Polarised light', d: 'Light whose waves vibrate mostly in one plane. Sunlight scattered in the sky makes a pattern of it that many insects can see.' },
    { t: 'Odometer', d: 'A distance counter. In desert ants it is based on counting steps.' },
    { t: 'Cataglyphis', d: 'A genus of desert ants of North Africa and nearby regions, famous for navigation.' },
  ],
  defaults: { legs: 'normal', mirror: false, speed: 2 },
  controls: [
    { key: 'legs', type: 'seg', label: 'Legs for the trip home', options: [{ v: 'normal', label: 'Normal' }, { v: 'stilts', label: 'Stilts' }, { v: 'stumps', label: 'Stumps' }], hint: 'The legs are changed at the food, as in the 2006 experiment.' },
    { key: 'mirror', type: 'toggle', label: 'Santschi’s mirror', hint: 'Hide the sun and show it from the opposite side.' },
    { key: 'speed', type: 'range', label: 'Time speed', min: 0.5, max: 6, step: 0.5, fmt: (v) => v + '×' },
    { key: 'act', type: 'buttons', label: 'Trip', items: [{ label: 'New trip', act: (s, inst) => inst.restart() }, { label: 'Same trip again', act: (s, inst) => inst.again() }] },
  ],
  onChange(s, key) { if (key === 'legs' || key === 'mirror') s._again = true; },
  quiz: [
    { q: 'How does a desert ant get home after a winding search?', options: ['It follows its own scent back', 'It runs straight home using a sky compass and a step count', 'Others carry it', 'By luck'], answer: 1, why: 'Path integration keeps a running home vector.' },
    { q: 'Ants trained to walk 10 m were given stilts at the food. Where did they look for the nest?', options: ['At about 10 m', 'Too far, at about 15 m', 'Too short, at about 6 m', 'They gave up'], answer: 1, why: 'Longer legs mean longer strides, so the same step count covers more ground.' },
    { q: 'What happened when Santschi showed ants the sun in a mirror from the other side?', options: ['Nothing', 'They turned round', 'They stopped', 'They climbed the mirror'], answer: 1, why: 'Their compass was the sun, so a sun on the other side flipped their heading.' },
    { q: 'Why do these desert ants not use scent trails?', options: ['They cannot smell', 'They forage alone on very hot sand', 'Scent is forbidden', 'They do, always'], answer: 1, why: 'They hunt alone for scattered food, so there is no trail to share; they rely on the sky and their steps.' },
  ],
  reel: [
    { ms: 5600, caption: 'Desert ants have no trail. They count their steps and steer by the sun, then run straight home.', set: { legs: 'normal', mirror: false, speed: 3.5 }, act: (s, inst) => inst.restart(7, 6), view: { pos: [2, 13, 10], target: [0, 0, 0] }, spin: 0 },
    { ms: 5200, caption: 'Put the ant on stilts and its strides get longer. It overshoots home by half again.', set: { legs: 'stilts', mirror: false, speed: 4 }, act: (s, inst) => inst.restart(7, 14.5), view: { pos: [-3, 14, 11], target: [0, 0, 0] }, spin: 0 },
  ],
  build({ stage, s: S }) {
    stage.floor.visible = false;
    stage.root.add(ground(60, { color: '#c9a36a', speck: '#e3c48e', sand: true, seed: 2 }));
    const nest = nestMound(0.6); stage.root.add(nest);
    stage.label('Nest', [0, 0.9, 0]);
    // sun (and the sun seen in the mirror)
    const sunPos = (az) => [Math.cos(az) * 30, 18, Math.sin(az) * 30];
    const sun = sphere(1.6, M.glow(0xfff1b8)); sun.castShadow = false; sun.position.set(...sunPos(SUN)); stage.root.add(sun);
    const fake = sphere(1.6, M.glow(0xfff1b8, { transparent: true, opacity: 0.85 })); fake.castShadow = false; fake.position.set(...sunPos(SUN + Math.PI)); stage.root.add(fake);
    const lSun = stage.label('Sun', [0, 0, 0]);
    const mirror = box(0.08, 1.4, 1.6, M.metal(0xdfe8f0, { roughness: 0.05 })); stage.root.add(mirror);
    const shade = box(1.6, 0.06, 1.6, M.matte(0x222222)); stage.root.add(shade);
    const ant = new THREE.Mesh(antGeometry(), M.matte(0x3a1d10, { roughness: 0.5 })); ant.castShadow = true; stage.root.add(ant);
    const food = foodPile(0.5, 4, COL.amber); stage.root.add(food);
    const vec = arrow(COL.cyan, 1, 0.5, 0.06); stage.root.add(vec);
    const mk = (color) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * 900), 3)); const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color })); l.frustumCulled = false; stage.root.add(l); return l; };
    const lineOut = mk(0x7a4fd0), lineHome = mk(0xff7a59);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.55, 40), M.glow(COL.coral, { side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; stage.root.add(ring);
    const lEnd = stage.label('', [0, 0, 0], stage.root, 'hot');
    let T, ph, d, homeLen, homeDir, end, clock = 0, phase = 'out', seed = 7;
    const setLine = (l, pts) => { const a = l.geometry.attributes.position.array, n = Math.min(pts.length, 900); for (let i = 0; i < n; i++) { a[i * 3] = pts[i][0]; a[i * 3 + 1] = 0.05; a[i * 3 + 2] = pts[i][1]; } l.geometry.setDrawRange(0, n); l.geometry.attributes.position.needsUpdate = true; };
    let outDrawn = [], homeDrawn = [];
    const begin = (sd, s) => {
      seed = sd; T = trip(sd); d = 0; phase = 'out'; outDrawn = [[0, 0]]; homeDrawn = []; clock = 0;
      food.position.set(T.food[0], 0, T.food[1]);
      const fx = T.food[0], fz = T.food[1];
      homeLen = Math.hypot(fx, fz) * GAIN[s.legs];
      homeDir = Math.atan2(-fz, -fx) + (s.mirror ? Math.PI : 0);
      end = [fx + Math.cos(homeDir) * homeLen, fz + Math.sin(homeDir) * homeLen];
      s._again = false;
    };
    const pos = { x: 0, z: 0, h: 0 };
    const advance = (dt, s) => {
      clock += dt;
      if (phase === 'out') {
        d += V * dt; const [x, z, h] = along(T, d); pos.x = x; pos.z = z; pos.h = h;
        if (outDrawn.length < 900 && Math.hypot(x - outDrawn[outDrawn.length - 1][0], z - outDrawn[outDrawn.length - 1][1]) > 0.1) outDrawn.push([x, z]);
        if (d >= T.len) { phase = 'eat'; clock = 0; homeDrawn = [[T.food[0], T.food[1]]]; }
      } else if (phase === 'eat') { if (clock > 0.8) { phase = 'home'; d = 0; } }
      else if (phase === 'home') {
        d = Math.min(homeLen, d + V * 1.3 * dt);
        pos.x = T.food[0] + Math.cos(homeDir) * d; pos.z = T.food[1] + Math.sin(homeDir) * d; pos.h = homeDir;
        homeDrawn[1] = [pos.x, pos.z];
        if (d >= homeLen) { phase = 'search'; clock = 0; }
      } else if (phase === 'search') {
        // systematic search: loops of growing size around the point where it expected the nest
        const k = clock * 1.6, R = 0.4 + clock * 0.12;
        pos.x = end[0] + Math.cos(k) * R * Math.sin(k * 0.5); pos.z = end[1] + Math.sin(k) * R; pos.h = k + Math.PI / 2;
        if (homeDrawn.length < 600) homeDrawn.push([pos.x, pos.z]);
        if (Math.hypot(pos.x, pos.z) < 0.6) phase = 'done';
      }
    };
    begin(seed, S);
    return {
      restart(sd = 1 + Math.floor(Math.random() * 1e6), warm = 0) { begin(sd, S); let w = warm; while (w > 0) { advance(Math.min(0.05, w), S); w -= 0.05; } },
      again() { begin(seed, S); },
      update(dt, s) {
        if (s._again) begin(seed, s);
        let left = dt * s.speed; while (left > 1e-6) { const st = Math.min(0.05, left); advance(st, s); left -= st; }
        setLine(lineOut, outDrawn); setLine(lineHome, homeDrawn);
        const homeLeg = phase !== 'out';
        const ly = homeLeg && s.legs === 'stilts' ? 1.35 : homeLeg && s.legs === 'stumps' ? 0.7 : 1;
        ant.position.set(pos.x, 0, pos.z); ant.rotation.y = -pos.h; ant.scale.set(0.9, 0.9 * ly, 0.9);
        // the ant's believed home vector
        const bx = (phase === 'out' || phase === 'eat') ? -pos.x : end[0] - pos.x, bz = (phase === 'out' || phase === 'eat') ? -pos.z : end[1] - pos.z;
        const bl = Math.hypot(bx, bz);
        vec.visible = phase !== 'search' && phase !== 'done' && bl > 0.5;
        vec.position.set(pos.x, 0.5, pos.z); vec.rotation.set(0, 0, 0); vec.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(bx, 0, bz).normalize()); vec.set(Math.min(bl, 6));
        // mirror and shade beside the ant
        fake.visible = s.mirror; mirror.visible = s.mirror; shade.visible = s.mirror;
        sun.material.opacity = 1;
        lSun.position.copy(s.mirror ? fake.position : sun.position).y += 2.5; lSun.element.textContent = s.mirror ? 'Sun seen in the mirror' : 'Sun';
        mirror.position.set(pos.x + Math.cos(SUN + Math.PI) * 1.5, 0.7, pos.z + Math.sin(SUN + Math.PI) * 1.5); mirror.rotation.y = -(SUN + Math.PI);
        shade.position.set(pos.x, 1.6, pos.z);
        ring.visible = phase === 'search' || phase === 'done'; ring.position.set(end[0], 0.06, end[1]);
        lEnd.visible = ring.visible; lEnd.position.set(end[0], 1.2, end[1]);
        lEnd.element.textContent = `Searches here: ${(Math.hypot(end[0] - T.food[0], end[1] - T.food[1])).toFixed(1)} m from the food`;
      },
      readout(s) {
        const D = Math.hypot(T.food[0], T.food[1]);
        const say = phase === 'out' ? 'Searching. The winding route is long, but the ant keeps a running home vector (blue arrow).'
          : phase === 'eat' ? `Found food. ${s.legs === 'normal' ? '' : `Its legs are changed to ${LEGNAME[s.legs]}. `}Now it runs home.`
          : phase === 'home' ? (s.mirror ? 'The sun seems to be on the other side, so it runs the wrong way.' : 'Running straight home, counting steps.')
          : s.mirror ? 'It searched where its flipped compass said home was. Wrong side.'
          : s.legs === 'stilts' ? 'Longer strides: the same step count carried it too far.' : s.legs === 'stumps' ? 'Shorter strides: it stopped short and searches there.' : 'It stopped right by the nest and searches in loops until it finds the entrance.';
        return `<div class="big">${{ out: 'Outbound search', eat: 'At the food', home: 'Homeward run', search: 'Searching for the nest', done: 'Home' }[phase]}</div><p class="r-say">${say}</p>
          <div class="row"><span>Winding route out</span><b>${T.len.toFixed(0)} m</b></div>
          <div class="row"><span>Nest is really</span><b>${D.toFixed(1)} m away</b></div>
          <div class="row"><span>Measured, 2006 (median)</span><b>10.2 · 15.3 · 5.75 m</b></div>`;
      },
    };
  },
};
