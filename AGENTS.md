# Ant Simulation - JavaScript Port

This repository originally contains a Unity project implementing an ant simulation. The goal is to build a JavaScript version that runs directly in the browser.

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

### Tasks
- Add interactive controls to tweak colony parameters (pheromone rates, ant count).
- Optimise pheromone rendering to reduce fill calls on large canvases.

### Progress
- Ported the Unity C# simulation behaviour to JavaScript with Canvas-based rendering and pheromone trails.
