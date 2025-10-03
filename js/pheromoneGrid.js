import { clamp } from './utils.js';

export class PheromoneGrid {
  constructor(width, height, cellSize = 12) {
    this.cellSize = cellSize;
    this.maxIntensity = 300;
    this.evaporationRate = 0.55; // intensity per second
    this.diffusionRate = 4.5; // neighbour blending per second
    this.resize(width, height);
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.cols = Math.ceil(width / this.cellSize);
    this.rows = Math.ceil(height / this.cellSize);
    const cellCount = this.cols * this.rows;
    this.fields = {
      food: new Float32Array(cellCount),
      home: new Float32Array(cellCount),
    };
    this._scratch = {
      food: new Float32Array(cellCount),
      home: new Float32Array(cellCount),
    };
  }

  _indexFromWorld(x, y) {
    const col = clamp(Math.floor(x / this.cellSize), 0, this.cols - 1);
    const row = clamp(Math.floor(y / this.cellSize), 0, this.rows - 1);
    return row * this.cols + col;
  }

  addPheromone(x, y, type, amount) {
    const field = this.fields[type];
    if (!field) return;
    const index = this._indexFromWorld(x, y);
    field[index] = clamp(field[index] + amount, 0, this.maxIntensity);
  }

  sample(x, y, type) {
    const field = this.fields[type];
    if (!field) return 0;
    const index = this._indexFromWorld(x, y);
    return field[index];
  }

  sampleArea(x, y, radius, type) {
    const field = this.fields[type];
    if (!field || radius <= 0) return 0;

    const minCol = clamp(Math.floor((x - radius) / this.cellSize), 0, this.cols - 1);
    const maxCol = clamp(Math.floor((x + radius) / this.cellSize), 0, this.cols - 1);
    const minRow = clamp(Math.floor((y - radius) / this.cellSize), 0, this.rows - 1);
    const maxRow = clamp(Math.floor((y + radius) / this.cellSize), 0, this.rows - 1);

    let total = 0;
    let count = 0;
    const radiusSq = radius * radius;

    for (let row = minRow; row <= maxRow; row += 1) {
      const cy = row * this.cellSize + this.cellSize * 0.5;
      for (let col = minCol; col <= maxCol; col += 1) {
        const cx = col * this.cellSize + this.cellSize * 0.5;
        const dx = cx - x;
        const dy = cy - y;
        if (dx * dx + dy * dy > radiusSq) continue;

        const index = row * this.cols + col;
        total += field[index];
        count += 1;
      }
    }

    if (count === 0) return 0;
    return total / count;
  }

  update(dt) {
    this._evaporate(dt);
    this._diffuse(dt);
  }

  _evaporate(dt) {
    const decayFactor = Math.max(0, 1 - this.evaporationRate * dt);
    for (const key of Object.keys(this.fields)) {
      const field = this.fields[key];
      for (let i = 0; i < field.length; i += 1) {
        field[i] *= decayFactor;
        if (field[i] < 0.01) field[i] = 0;
      }
    }
  }

  _diffuse(dt) {
    const blend = clamp(this.diffusionRate * dt, 0, 1);
    if (blend <= 0) return;

    for (const key of Object.keys(this.fields)) {
      const field = this.fields[key];
      const scratch = this._scratch[key];
      scratch.set(field);

      for (let row = 0; row < this.rows; row += 1) {
        for (let col = 0; col < this.cols; col += 1) {
          const index = row * this.cols + col;
          let total = field[index];
          let count = 1;

          if (col > 0) {
            total += scratch[index - 1];
            count += 1;
          }
          if (col < this.cols - 1) {
            total += scratch[index + 1];
            count += 1;
          }
          if (row > 0) {
            total += scratch[index - this.cols];
            count += 1;
          }
          if (row < this.rows - 1) {
            total += scratch[index + this.cols];
            count += 1;
          }

          const average = total / count;
          field[index] = field[index] + (average - field[index]) * blend;
        }
      }
    }
  }

  render(context) {
    const alphaScale = 1 / this.maxIntensity;
    context.save();
    context.globalCompositeOperation = 'lighter';

    for (const key of Object.keys(this.fields)) {
      const field = this.fields[key];
      const color = key === 'food' ? '0, 200, 120' : '70, 140, 255';

      for (let row = 0; row < this.rows; row += 1) {
        for (let col = 0; col < this.cols; col += 1) {
          const index = row * this.cols + col;
          const intensity = field[index];
          if (intensity <= 0) continue;

          const alpha = clamp(intensity * alphaScale, 0, 0.4);
          context.fillStyle = `rgba(${color}, ${alpha.toFixed(3)})`;
          context.fillRect(
            col * this.cellSize,
            row * this.cellSize,
            this.cellSize,
            this.cellSize,
          );
        }
      }
    }

    context.restore();
  }
}
