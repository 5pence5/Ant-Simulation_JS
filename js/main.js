import { Simulation } from './simulation.js';

const canvas = document.getElementById('canvas');
canvas.style.display = 'block';
canvas.style.width = '100vw';
canvas.style.height = '100vh';

defineCanvasSize();
const simulation = new Simulation(canvas);
resizeSimulation();

let lastTime = performance.now();
function frame(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;
  simulation.update(dt);
  simulation.render();
  requestAnimationFrame(frame);
}

requestAnimationFrame((timestamp) => {
  lastTime = timestamp;
  frame(timestamp);
});

window.addEventListener('resize', () => {
  defineCanvasSize();
  resizeSimulation();
});

function defineCanvasSize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function resizeSimulation() {
  simulation.resize(canvas.width, canvas.height);
}

window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'r') {
    resizeSimulation();
  }
});
