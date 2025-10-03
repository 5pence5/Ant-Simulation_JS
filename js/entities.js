import {
  TAU,
  add,
  angleDifference,
  clamp,
  directionFromAngle,
  distanceSquared,
  lerp,
  randomRange,
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
    this.senseAngle = Math.PI / 4;
    this.senseDistance = 24;
    this.depositRate = 220;
    this.dstBetweenMarkers = 8;
    this.depositMinMultiplier = 0.5;
    this.homeDepositRamp = 2.4;
    this.foodDepositRamp = 1.6;
    this.depositJitter = 3;
    this.jitterStrength = Math.PI * 0.5;
    this.clock = 0;
    this.distanceSinceDeposit = this.dstBetweenMarkers;
    this.lastDeposit = {
      time: -Infinity,
      position: { ...position },
    };
    this.lastHomeDeparture = 0;
    this.lastFoodPickup = 0;
  }

  reset(position) {
    this.position = { ...position };
    this.state = SEARCHING;
    this.carryingFood = false;
    this.heading = Math.random() * TAU;
    this.speed = randomRange(35, 55);
    this.clock = 0;
    this.distanceSinceDeposit = this.dstBetweenMarkers;
    this.lastDeposit = {
      time: -Infinity,
      position: { ...position },
    };
    this.lastHomeDeparture = 0;
    this.lastFoodPickup = 0;
  }

  update(dt, world) {
    const { pheromones, width, height } = world;
    this.clock += dt;

    const targetField = this.state === SEARCHING ? 'food' : 'home';
    const desiredHeading = this._chooseHeading(targetField, world);
    this._steerTowards(desiredHeading, dt);
    const travelled = this._move(dt, width, height);
    this._maybeDeposit(dt, pheromones, travelled);
    this._interact(world);
  }

  _chooseHeading(targetField, world) {
    const senseOffsets = [0, this.senseAngle, -this.senseAngle];
    let bestHeading = this.heading;
    let bestValue = -Infinity;

    for (const offset of senseOffsets) {
      const direction = directionFromAngle(this.heading + offset);
      const samplePos = add(this.position, {
        x: direction.x * this.senseDistance,
        y: direction.y * this.senseDistance,
      });
      const value = world.pheromones.sample(samplePos.x, samplePos.y, targetField);
      const jitter = randomRange(-1, 1) * 5; // slight randomisation
      const scoredValue = value + jitter;
      if (scoredValue > bestValue) {
        bestValue = scoredValue;
        bestHeading = this.heading + offset;
      }
    }

    if (bestValue <= 0) {
      bestHeading = this.heading + randomRange(-this.senseAngle, this.senseAngle);
    }

    const wander = randomRange(-this.jitterStrength, this.jitterStrength) * 0.5;
    return wrapAngle(bestHeading + wander);
  }

  _steerTowards(targetHeading, dt) {
    const diff = angleDifference(targetHeading, this.heading);
    const maxTurn = this.turnSpeed * dt;
    const turn = clamp(diff, -maxTurn, maxTurn);
    this.heading = wrapAngle(this.heading + turn);
  }

  _move(dt, width, height) {
    const direction = directionFromAngle(this.heading);
    const distance = this.speed * dt;
    this.position.x += direction.x * distance;
    this.position.y += direction.y * distance;

    this.position.x = wrap(this.position.x, 0, width);
    this.position.y = wrap(this.position.y, 0, height);
    return distance;
  }

  _maybeDeposit(dt, pheromones, travelled) {
    this.distanceSinceDeposit += travelled;
    if (this.distanceSinceDeposit < this.dstBetweenMarkers) {
      return;
    }

    const depositType = this.state === SEARCHING ? 'home' : 'food';
    const rampDuration = this.state === SEARCHING ? this.homeDepositRamp : this.foodDepositRamp;
    const referenceTime = this.state === SEARCHING ? this.lastHomeDeparture : this.lastFoodPickup;
    const elapsed = Math.max(0, this.clock - referenceTime);
    const ratio = rampDuration > 0 ? clamp(elapsed / rampDuration, 0, 1) : 1;
    const multiplier = lerp(this.depositMinMultiplier, 1, ratio);
    const offsetX = randomRange(-this.depositJitter, this.depositJitter);
    const offsetY = randomRange(-this.depositJitter, this.depositJitter);

    pheromones.addPheromone(
      this.position.x + offsetX,
      this.position.y + offsetY,
      depositType,
      this.depositRate * dt * multiplier,
    );

    this.lastDeposit = {
      time: this.clock,
      position: { x: this.position.x, y: this.position.y },
    };
    this.distanceSinceDeposit -= this.dstBetweenMarkers;
    if (this.distanceSinceDeposit < 0) {
      this.distanceSinceDeposit = 0;
    }
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
        this.lastFoodPickup = this.clock;
        this.distanceSinceDeposit = this.dstBetweenMarkers;
      }
    } else if (this.state === RETURNING) {
      const distanceToNestSq = distanceSquared(this.position, world.nest.position);
      if (distanceToNestSq <= world.nest.radius * world.nest.radius) {
        this.carryingFood = false;
        this.state = SEARCHING;
        world.nest.deliverFood();
        this.heading = randomRange(-Math.PI, Math.PI);
        this.lastHomeDeparture = this.clock;
        this.distanceSinceDeposit = this.dstBetweenMarkers;
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
