<!-- glassbox:start -->
<!-- Generated from glassbox.json by the Glassbox hub (npm run readme -- anttrailclear). Edit glassbox.json, not this block. -->

<h1 align="center">AntTrailClear</h1>

<p align="center"><b>How do ants find the shortest path?</b><br>No ant knows the map, yet a colony finds the shortest way to food in minutes. Watch hundreds of simulated ants lay scent, run the famous two-bridge experiment yourself, and see how the same trick routes trucks and data.</p>

<p align="center"><a href="https://glassbox.how/anttrailclear/"><b>▶ Play with it</b></a> &nbsp;·&nbsp; <a href="https://glassbox.how/e/anttrailclear/">Read the 60-second explainer</a></p>

<p align="center">
  <a href="https://glassbox.how/e/anttrailclear/"><img alt="Glassbox No. 253" src="https://img.shields.io/badge/Glassbox-No.%20253-8ef0ff"></a>
  <a href="https://glassbox.how/e/anttrailclear/"><img alt="Nature" src="https://img.shields.io/badge/field-Nature-a3e635"></a>
  <a href="LICENSE"><img alt="Code: MIT" src="https://img.shields.io/badge/code-MIT-3fb950"></a>
  <a href="LICENSE-CONTENT.md"><img alt="Content: CC BY 4.0" src="https://img.shields.io/badge/content-CC%20BY%204.0-ef9421"></a>
  <a href="#privacy"><img alt="Privacy: explained" src="https://img.shields.io/badge/privacy-explained-555"></a>
</p>

## In 60 seconds

1. **A trail made of smell.** A forager that finds food walks home dabbing trail pheromone on the ground. Nestmates follow the scent, find the food and add their own on the way back. More ants make more scent, which draws more ants. The scent also evaporates, so a trail lasts only while ants keep refreshing it.
2. **Two bridges, one winner.** In 1989 a Brussels team joined Argentine ants to food by a bridge with a short and a long branch. With the long branch twice as long, all 14 colonies settled on the short one. Ants on it get back sooner, so it is marked more often and pulls ahead. Nobody measures anything.
3. **Chance and lock-in.** With two equal branches, colonies still end up on one, picked by chance. And when the short branch was only added after the long one was in use, just 2 of 18 colonies switched. Feedback finds good paths quickly, but an early trail can trap the colony.
4. **No one in charge.** The queen lays eggs; she does not lead. Each ant follows a few local rules: wander, turn toward stronger scent, carry food home and mark the way. Trails to every food pile, and the switch when one runs out, emerge from those rules. This is self-organisation.
5. **More than smell.** Saharan desert ants forage alone and lay no trails. They run straight home by path integration: a sky compass for direction and a step count for distance. Ants given stilts at the food overshot home, at about 15 m instead of 10; ants on stumps stopped at about 6 m. Army ants that follow only scent can get stuck in a circle, an ant mill.
6. **Ants in computers.** In the early 1990s Marco Dorigo turned the idea into Ant Colony Optimization. Virtual ants build routes, favouring short roads and roads with more virtual pheromone, which evaporates each round. Good roads are reinforced, so the colony homes in on short tours. Variants are used for routing and scheduling problems.

## Words worth knowing

| Term | Meaning |
|---|---|
| **Pheromone** | A chemical signal released by one animal that changes the behaviour of others of its species. |
| **Trail pheromone** | Scent laid on the ground that leads nestmates to food. |
| **Positive feedback** | A loop where more of something produces even more of it: more ants, more scent, more ants. |
| **Evaporation** | Scent drifting away over time, so unused trails fade and the colony can forget. |
| **Double-bridge experiment** | A test where a nest and food are linked by two branches, to see which one the colony chooses. |
| **Self-organisation** | Order that arises from many local interactions, with no leader or plan. |
| **Stigmergy** | Coordination through marks left in the environment, like scent on the ground. |
| **Path integration** | Keeping a running total of direction and distance travelled, so the way home is always known. |
| **Ant mill** | A circle of ants each following the one ahead, which can continue until they are exhausted. |
| **Ant Colony Optimization** | Computer methods that use simulated ants and evaporating virtual pheromone to find good routes. |

## A short history

**From a proverb that says ants have no ruler to step-counting desert ants, a maze of 32,768 paths, and algorithms that route network traffic.**

- **400 BCE** · "Go to the ant" (Book of Proverbs, traditionally ascribed to Solomon, Ancient Israel and Judah)
- **1882** · Candles, turntables and lost ants (John Lubbock, England)
- **1904** · How ants know their nestmates (Adele Marion Fielde, Marine Biological Laboratory, Woods Hole, Massachusetts)
- **1907** · The homing of ants (Charles Henry Turner, United States)
- **1911** · The mirror and the sun (Félix Santschi, Kairouan, Tunisia)
- **1959** · The trail is a chemical (E. O. Wilson, Harvard University, Cambridge, Massachusetts)
- **1988** · Desert ants keep a running total (Martin Müller and Rüdiger Wehner, Salt pans of Tunisia)
- **1989** · Self-organised shortcuts (Simon Goss, Serge Aron, Jean-Louis Deneubourg and Jacques Pasteels, Brussels, Belgium)

The full story, with 29 moments, charts, people and 51 sources: [glassbox.how/e/anttrailclear/history](https://glassbox.how/e/anttrailclear/history/). The data lives in [`history.json`](history.json).

## Privacy

This box has no accounts and no ads, and it ships its own fonts and libraries. When you run it yourself it sends nothing anywhere. On glassbox.how, the site's `/bar.js` also loads Glassbox's analytics: **Google Analytics** to count visits (it asks first in the EU, UK and Switzerland, and stays off when your browser sends Global Privacy Control or Do Not Track) and **ClickTrust** to detect bots.

It remembers a few things **in your own browser only**, and never sends them anywhere:

| Browser storage key | What it holds |
|---|---|
| `anttrailclear.v1` | Which chapters you have opened, your best quiz scores, and sound on or off. |

Exactly what each one sees is at [glassbox.how/privacy](https://glassbox.how/privacy/).

## Licences

- **Code:** [MIT](LICENSE). Use it, change it, ship it.
- **Explanations, text, images and videos** (`glassbox.json`, `glassbox/`): [CC BY 4.0](LICENSE-CONTENT.md). Credit “Glassbox, glassbox.how/e/anttrailclear”.
- **Third-party parts** keep their own licences: [three.js](https://threejs.org) (MIT), [Geist, Instrument Serif](https://openfontlicense.org) (SIL OFL 1.1).
- The Glassbox name and logo aren't covered by either licence. See the [terms](https://glassbox.how/terms/).

Found a mistake? [Open an issue](https://github.com/bdeeps/anttrailclear/issues). Corrections happen in public.
<!-- glassbox:end -->

## Run it

It's plain HTML, CSS and JavaScript. No build step and no dependencies. Run locally, it contacts no other website.

```bash
python3 -m http.server 8000
```

Three.js and the fonts ship in `vendor/` and `fonts/`, so it also works offline.

Then open http://localhost:8000.

## How it's built

| File | What |
|---|---|
| `index.html`, `css/app.css` | The page and its styles |
| `js/app.js`, `js/stage.js`, `js/ui.js`, `js/kit.js` | The shared Glassbox 3D engine: chapters, 3D stage, controls, quiz, video director |
| `js/chapters/*.js` | One file per chapter: the 3D model, controls, text, key terms, quiz and video scenes |
| `glassbox.json` | Title, question, explainer beats, key terms, browser storage and credits shown on glassbox.how |
| `reel` in each chapter | The storyboard the Glassbox studio records into short videos |
| `glassbox/` | The published video, slides, thumbnail and post copy |
| `fonts/`, `vendor/three/` | Self-hosted Geist and Instrument Serif (SIL OFL 1.1) and three.js (MIT) |
