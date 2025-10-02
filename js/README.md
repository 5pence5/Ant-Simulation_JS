# JavaScript Ant Simulation

This directory hosts the browser-based rewrite of the Unity C# ant simulation. The Unity behaviours were translated into plain JavaScript modules that render on an HTML5 canvas.

## Features

- Ant agents wander, search for food, and return to the nest using pheromone trails.
- Dual pheromone grid (home and food) with diffusion and evaporation.
- Dynamic food spawning and nest storage tracking.
- Responsive layout that resizes with the browser window (or press `R` to regenerate the arena).

## Project Structure

- `index.html` – Entry point with canvas and overlay HUD.
- `styles.css` – Minimal styling for the full-screen canvas and informational HUD.
- `main.js` – Boots the simulation loop and handles resizing/resetting.
- `simulation.js` – Manages world state, updates ants, pheromones, nest, and food sources.
- `entities.js` – Implements ant, food, and nest classes.
- `pheromoneGrid.js` – Grid-based pheromone storage with evaporation and diffusion.
- `utils.js` – Vector and math helpers shared across modules.

## Running Locally

No build step is required. Any static file server can host the simulation:

```bash
# From the repository root
npx serve js
```

Then open the reported URL (typically <http://localhost:3000>) in your browser.

Alternatively, open `js/index.html` directly from disk in most modern browsers.

## Controls

- **Resize window / Press `R`** – Reset the simulation arena and respawn food.

## Notes

- The pheromone visualisation uses additive blending: green trails point toward food while blue trails lead home.
- The simulation intentionally keeps dependencies to zero; everything runs on vanilla ES modules.
