import { Ant, FoodSource, Nest } from './entities.js';
import { PheromoneGrid } from './pheromoneGrid.js';
import { clamp, randomRange } from './utils.js';

export class Simulation {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.pheromones = new PheromoneGrid(this.width, this.height);
    this.nest = new Nest({ x: this.width * 0.5, y: this.height * 0.5 });
    this.ants = [];
    this.foodSources = [];
    this.spawnAnts(120);
    this.spawnFoodSources();
    this.maxAnts = 160;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.pheromones.resize(width, height);
    this.nest.position = { x: width * 0.5, y: height * 0.5 };
    this.nest.foodStored = 0;
    this.foodSources = [];
    this.spawnFoodSources();
    for (const ant of this.ants) {
      const offset = {
        x: randomRange(-this.nest.radius * 0.5, this.nest.radius * 0.5),
        y: randomRange(-this.nest.radius * 0.5, this.nest.radius * 0.5),
      };
      ant.reset({
        x: this.nest.position.x + offset.x,
        y: this.nest.position.y + offset.y,
      });
    }
  }

  spawnAnts(count) {
    for (let i = 0; i < count; i += 1) {
      const offsetRadius = randomRange(0, this.nest.radius * 0.6);
      const angle = randomRange(0, Math.PI * 2);
      const position = {
        x: this.nest.position.x + Math.cos(angle) * offsetRadius,
        y: this.nest.position.y + Math.sin(angle) * offsetRadius,
      };
      this.ants.push(new Ant(position));
    }
  }

  spawnFoodSources() {
    const sources = 4;
    for (let i = 0; i < sources; i += 1) {
      const margin = 60;
      const x = randomRange(margin, this.width - margin);
      const y = randomRange(margin, this.height - margin);
      const amount = randomRange(160, 320);
      const radius = clamp(amount / 12, 12, 28);
      this.foodSources.push(new FoodSource({ x, y }, amount, radius));
    }
  }

  update(dt) {
    const capped = Math.min(dt, 0.12);
    const steps = Math.max(1, Math.ceil(capped / 0.02));
    const stepDt = capped / steps;

    for (let step = 0; step < steps; step += 1) {
      this.pheromones.update(stepDt);
      for (const ant of this.ants) {
        ant.update(stepDt, this);
      }
    }

    this.foodSources = this.foodSources.filter((source) => !source.isDepleted());
    if (this.foodSources.length < 3) {
      this._trySpawnFood();
    }

    if (this.ants.length < this.maxAnts && this.nest.foodStored > this.ants.length * 0.5) {
      this.spawnAnts(1);
    }
  }

  _trySpawnFood() {
    const attempts = 5;
    for (let i = 0; i < attempts; i += 1) {
      const margin = 80;
      const x = randomRange(margin, this.width - margin);
      const y = randomRange(margin, this.height - margin);
      const amount = randomRange(180, 260);
      const radius = clamp(amount / 14, 10, 26);
      const source = new FoodSource({ x, y }, amount, radius);
      if (this._isLocationFree(source.position, source.radius)) {
        this.foodSources.push(source);
        return;
      }
    }
  }

  _isLocationFree(position, radius) {
    if (Math.hypot(position.x - this.nest.position.x, position.y - this.nest.position.y) < this.nest.radius * 4) {
      return false;
    }

    return this.foodSources.every((source) => {
      const dx = source.position.x - position.x;
      const dy = source.position.y - position.y;
      const minDistance = source.radius + radius + 40;
      return dx * dx + dy * dy > minDistance * minDistance;
    });
  }

  findFoodNear(position) {
    for (const source of this.foodSources) {
      const dx = source.position.x - position.x;
      const dy = source.position.y - position.y;
      if (dx * dx + dy * dy <= source.radius * source.radius && source.amount > 0) {
        return source;
      }
    }
    return null;
  }

  render() {
    const { context } = this;
    context.fillStyle = '#1c1b1f';
    context.fillRect(0, 0, this.width, this.height);

    this.pheromones.render(context);

    for (const source of this.foodSources) {
      source.render(context);
    }

    this.nest.render(context);

    for (const ant of this.ants) {
      ant.render(context);
    }

    this._renderOverlay();
  }

  _renderOverlay() {
    const { context } = this;
    context.save();
    context.fillStyle = 'rgba(255, 255, 255, 0.85)';
    context.font = '14px "Fira Sans", "Segoe UI", sans-serif';
    context.textBaseline = 'top';
    context.fillText(`Ants: ${this.ants.length}`, 16, 16);
    context.fillText(`Food stored: ${this.nest.foodStored}`, 16, 34);
    context.fillText('Tip: Resize the window to reshape the terrain.', 16, 52);
    context.restore();
  }
}
