# Ant Simulation - JavaScript Rewrite

This repository originally contains a Unity (C#) project implementing an ant simulation. The goal is to rewrite the experience in JavaScript so it can run directly in the browser.

## Project Plan

1. Create a `js` directory to hold the JavaScript implementation.
2. Use vanilla JavaScript and the HTML5 Canvas API for rendering.
3. Mirror the behaviour of the Unity project: ants search for food, leave pheromone trails, and return to the nest.
4. Keep dependencies minimal. Use `npm` to manage any packages.
5. Provide a setup script (`setup.sh`) that prepares the directory structure and checks that Node.js is available.

## Guidelines

- Keep JavaScript code in the `js` directory.
- Use ES6 modules and features when possible.
- Document major features and decisions in `js/README.md`.


## Task and Progress Tracking

- Keep a list of upcoming tasks in a "Tasks" section below.
- Maintain a "Progress" section below recording completed work.
- Update both sections as you work on the project.

## Original Unity (C#) Project Structure

- `Assets/`
  - `Graphics/` – Sprites and visual assets for the Unity scene.
  - `Prefabs/` – Prefabricated GameObjects used to compose the simulation.
  - `SavedMap/` – Serialized environment data for reproducing colony layouts.
  - `Scenes/`
    - `SampleScene.unity` – Main Unity scene hosting the simulation.
  - `Scripts/`
    - `Ant.cs`
    - `AntColony.cs`
    - `AntSettings.cs`
    - `FoodSource.cs`
    - `Marching Squares/` – Terrain generation helpers.
    - `PerceptionMap.cs`
    - `Quitter.cs`

### Tasks

- Port the core ant behaviour (movement, pheromone detection, food gathering) from the Unity C# scripts into JavaScript modules.
- Implement canvas-based rendering for the colony, environment, and pheromone trails.
- Recreate simulation controls (start, pause, reset, speed adjustments) in the browser UI.
- Validate behaviour parity with the original Unity implementation through side-by-side comparisons or documented tests.

### Progress

- Established the `js` directory with an `index.html` scaffold and placeholder `main.js` entry point.
- Documented the Unity C# project structure to guide the porting work.
