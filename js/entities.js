import {
  TAU,
  add,
  angleDifference,
  angleFromDirection,
  clamp,
  directionFromAngle,
  distanceSquared,
  normalize,
  randomRange,
  scale,
  subtract,
  wrap,
  wrapAngle,
} from './utils.js';

const SEARCHING = 'searching';
const RETURNING = 'returning';

export class Ant {
  constructor(position) {
    this.position = { ...position };
    this.heading = Math.random() * TAU;
    this.speed = randomRange(35, 55);
    this.state = SEARCHING;
    this.carryingFood = false;
    this.turnSpeed = Math.PI * 2;
    this.sensorSpacing = 24;
    this.sensorRadius = this.sensorSpacing * 0.6;
    this.timeBetweenDirUpdate = 0.15;
    this.pheromoneWeight = 1;
    this.depositRate = 220;
    this.jitterStrength = Math.PI * 0.5;
    this.nextDirUpdateTime = randomRange(0, this.timeBetweenDirUpdate);
    this.cachedHeading = this.heading;
    this.pheromoneSteerForce = directionFromAngle(this.heading);
  }

  reset(position) {
    this.position = { ...position };
    this.state = SEARCHING;
    this.carryingFood = false;
    this.heading = Math.random() * TAU;
    this.speed = randomRange(35, 55);
    this.nextDirUpdateTime = randomRange(0, this.timeBetweenDirUpdate);
    this.cachedHeading = this.heading;
    this.pheromoneSteerForce = directionFromAngle(this.heading);
  }

  update(dt, world) {
    const { pheromones, width, height } = world;
    const depositType = this.state === SEARCHING ? 'home' : 'food';
    pheromones.addPheromone(this.position.x, this.position.y, depositType, this.depositRate * dt);

    const targetField = this.state === SEARCHING ? 'food' : 'home';
    const desiredHeading = this._chooseHeading(targetField, world, dt);
    this._steerTowards(desiredHeading, dt);
    this._move(dt, width, height);
    this._interact(world);
  }

  _chooseHeading(targetField, world, dt) {
    this.nextDirUpdateTime -= dt;
    if (this.nextDirUpdateTime > 0) {
      return this.cachedHeading;
    }

    while (this.nextDirUpdateTime <= 0) {
      this.nextDirUpdateTime += this.timeBetweenDirUpdate;
    }

    const forwardDir = directionFromAngle(this.heading);
    const lateral = { x: -forwardDir.y, y: forwardDir.x };

    const centreSample = add(this.position, scale(forwardDir, this.sensorSpacing));
    const leftSample = add(centreSample, scale(lateral, this.sensorSpacing));
    const rightSample = add(centreSample, scale(lateral, -this.sensorSpacing));

    const centreStrength = world.pheromones.sampleArea(
      centreSample.x,
      centreSample.y,
      this.sensorRadius,
      targetField,
    );
    const leftStrength = world.pheromones.sampleArea(
      leftSample.x,
      leftSample.y,
      this.sensorRadius,
      targetField,
    );
    const rightStrength = world.pheromones.sampleArea(
      rightSample.x,
      rightSample.y,
      this.sensorRadius,
      targetField,
    );

    const candidates = [
      { strength: centreStrength, direction: normalize(subtract(centreSample, this.position)) },
      { strength: leftStrength, direction: normalize(subtract(leftSample, this.position)) },
      { strength: rightStrength, direction: normalize(subtract(rightSample, this.position)) },
    ];

    let best = candidates[0];
    let bestScore = candidates[0].strength * this.pheromoneWeight;
    for (let i = 1; i < candidates.length; i += 1) {
      const score = candidates[i].strength * this.pheromoneWeight;
      if (score > bestScore) {
        best = candidates[i];
        bestScore = score;
      }
    }

    if (!Number.isFinite(bestScore) || bestScore <= 0) {
      this.pheromoneSteerForce = { x: 0, y: 0 };
      const wander = randomRange(-this.jitterStrength, this.jitterStrength) * 0.5;
      this.cachedHeading = wrapAngle(this.heading + wander);
      return this.cachedHeading;
    }

    this.pheromoneSteerForce = scale(best.direction, bestScore);
    const combined = normalize({
      x: forwardDir.x + this.pheromoneSteerForce.x,
      y: forwardDir.y + this.pheromoneSteerForce.y,
    });

    const wander = randomRange(-this.jitterStrength, this.jitterStrength) * 0.25;
    this.cachedHeading = wrapAngle(angleFromDirection(combined) + wander);
    return this.cachedHeading;
  }

  _steerTowards(targetHeading, dt) {
    const diff = angleDifference(targetHeading, this.heading);
    const maxTurn = this.turnSpeed * dt;
    const turn = clamp(diff, -maxTurn, maxTurn);
    this.heading = wrapAngle(this.heading + turn);
  }

  _move(dt, width, height) {
    const direction = directionFromAngle(this.heading);
    this.position.x += direction.x * this.speed * dt;
    this.position.y += direction.y * this.speed * dt;

    this.position.x = wrap(this.position.x, 0, width);
    this.position.y = wrap(this.position.y, 0, height);
  }

  _interact(world) {
    if (this.state === SEARCHING) {
      const food = world.findFoodNear(this.position);
      if (food) {
        this.carryingFood = true;
        this.state = RETURNING;
        food.take();
        const toNest = Math.atan2(world.nest.position.y - this.position.y, world.nest.position.x - this.position.x);
        this.heading = toNest + randomRange(-Math.PI / 6, Math.PI / 6);
      }
    } else if (this.state === RETURNING) {
      const distanceToNestSq = distanceSquared(this.position, world.nest.position);
      if (distanceToNestSq <= world.nest.radius * world.nest.radius) {
        this.carryingFood = false;
        this.state = SEARCHING;
        world.nest.deliverFood();
        this.heading = randomRange(-Math.PI, Math.PI);
      }
    }
  }

  render(context) {
    context.save();
    context.translate(this.position.x, this.position.y);
    context.rotate(this.heading);

    context.beginPath();
    context.moveTo(6, 0);
    context.lineTo(-6, 4);
    context.lineTo(-6, -4);
    context.closePath();
    context.fillStyle = this.carryingFood ? '#f0d24d' : '#fefefe';
    context.fill();
    context.strokeStyle = 'rgba(0,0,0,0.35)';
    context.lineWidth = 1;
    context.stroke();

    context.restore();
  }
}

export class FoodSource {
  constructor(position, amount = 200, radius = 16) {
    this.position = { ...position };
    this.amount = amount;
    this.radius = radius;
  }

  take() {
    if (this.amount <= 0) return false;
    this.amount -= 1;
    return true;
  }

  isDepleted() {
    return this.amount <= 0;
  }

  render(context) {
    const alpha = clamp(this.amount / 200, 0.2, 1);
    context.save();
    context.translate(this.position.x, this.position.y);
    const gradient = context.createRadialGradient(0, 0, 2, 0, 0, this.radius);
    gradient.addColorStop(0, `rgba(0, 180, 120, ${alpha})`);
    gradient.addColorStop(1, 'rgba(0, 90, 60, 0.1)');
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(0, 0, this.radius, 0, TAU);
    context.fill();
    context.restore();
  }
}

export class Nest {
  constructor(position, radius = 22) {
    this.position = { ...position };
    this.radius = radius;
    this.foodStored = 0;
  }

  deliverFood() {
    this.foodStored += 1;
  }

  render(context) {
    context.save();
    context.translate(this.position.x, this.position.y);
    context.fillStyle = '#b07a45';
    context.beginPath();
    context.arc(0, 0, this.radius, 0, TAU);
    context.fill();

    context.fillStyle = '#4b2e16';
    context.beginPath();
    context.arc(0, 0, this.radius * 0.45, 0, TAU);
    context.fill();
    context.restore();
  }
}
