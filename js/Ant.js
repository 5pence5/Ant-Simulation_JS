// Depends on Vector2.js, AntSettings.js, PerceptionMap.js, FoodSource.js (indirectly via colony)

class Ant {
    // Enum for Ant states
    static State = {
        SearchingForFood: 0,
        ReturningHome: 1,
        // Potentially other states like Fleeing, etc.
    };

    constructor(settings, position, colony, initialForwardDir = null) {
        this.settings = settings; // AntSettings instance
        this.colony = colony;     // Reference to the AntColony instance

        this.currentPosition = position.clone();
        this.homePos = position.clone();

        this.currentForwardDir = initialForwardDir ? initialForwardDir.normalize() : new Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
        this.currentVelocity = this.currentForwardDir.multiply(settings.maxSpeed);

        this.currentState = Ant.State.SearchingForFood;
        
        this.deathTime = performance.now() / 1000.0 + settings.lifetime; // Time in seconds
        this.timeAlive = 0;

        this.collectedFood = null; // Will hold a FoodItem instance when carrying food
        this.targetFood = null;    // Target FoodItem

        // Steering forces
        this.pheromoneSteerForce = Vector2.zero;
        this.randomSteerForce = Vector2.zero;
        this.obstacleAvoidForce = Vector2.zero; // Placeholder for now
        this.targetSteerForce = Vector2.zero;

        // Turning around state
        this.turningAround = false;
        this.turnAroundForce = Vector2.zero;
        this.turnAroundOriginDir = Vector2.zero;
        this.turnAroundTargetDir = Vector2.zero;
        this.turnAroundProgress = 0;
        this.turnAroundDuration = 0.5; // seconds to complete a 180 turn, adjust as needed

        // Pheromone placement
        this.lastPheromonePos = this.currentPosition.clone();

        // Timers for periodic actions
        this.nextRandomSteerTime = 0;
        this.nextDirUpdateTime = 0; // For less frequent direction updates (from C#)

        // Time tracking for pheromone strength or other logic
        this.leftHomeTime = performance.now() / 1000.0;
        this.leftFoodTime = 0; // Will be set when food is collected

        // Max number of entries to retrieve from perception map
        this.maxPheromoneResults = 20; 
        this.pheromoneResults = new Array(this.maxPheromoneResults);
    }

    // --- Main Update Method ---
    update(deltaTime, foodSources) { // foodSources might be passed via colony or directly
        this.timeAlive += deltaTime;

        if (this.settings.useDeath && performance.now() / 1000.0 > this.deathTime) {
            // Handle ant death (e.g., remove from simulation, notify colony)
            if (this.colony) {
                this.colony.removeAnt(this);
            }
            return; // Skip further updates if dead
        }
        
        // Reset forces that are recalculated each frame
        this.targetSteerForce = Vector2.zero;
        this.pheromoneSteerForce = Vector2.zero;
        // randomSteerForce is handled by its own timer
        // obstacleAvoidForce is a placeholder

        this.handlePheromonePlacement();
        this.handleRandomSteering();

        if (this.turningAround) {
            this.continueTurnAround(deltaTime);
        } else {
            if (this.currentState === Ant.State.SearchingForFood) {
                this.handleSearchForFood(foodSources);
            } else if (this.currentState === Ant.State.ReturningHome) {
                this.handleReturnHome();
            }
        }

        this.handleCollisionSteering(); // Placeholder
        this.handleMovement(deltaTime);
    }

    // --- Behavioral Handlers ---
    handleMovement(deltaTime) {
        let steerForce = Vector2.zero;
        
        if (this.turningAround) {
            steerForce = steerForce.add(this.turnAroundForce);
        } else {
            steerForce = steerForce.add(this.targetSteerForce);
            steerForce = steerForce.add(this.pheromoneSteerForce);
            steerForce = steerForce.add(this.randomSteerForce);
            steerForce = steerForce.add(this.obstacleAvoidForce); // Placeholder
        }

        // Normalize steerForce if magnitude > 1, then scale by targetSteerStrength
        // This prevents individual forces from dominating too much
        if (steerForce.magnitude() > 1) {
            steerForce = steerForce.normalize();
        }
        // The C# version seems to apply targetSteerStrength more selectively.
        // For now, a general application, might need refinement.
        let desiredVelocity = this.currentForwardDir.multiply(this.settings.maxSpeed).add(steerForce.multiply(this.settings.targetSteerStrength));

        this.steerTowards(desiredVelocity, deltaTime);

        // Update position
        this.currentPosition = this.currentPosition.add(this.currentVelocity.multiply(deltaTime));

        // Basic boundary collision (example, replace with proper collision later)
        // This assumes canvas/world dimensions are known, e.g., via colony or settings
        // if (this.colony && this.colony.worldSize) {
        //     if (this.currentPosition.x < 0 || this.currentPosition.x > this.colony.worldSize.x ||
        //         this.currentPosition.y < 0 || this.currentPosition.y > this.colony.worldSize.y) {
        //         this.currentForwardDir = this.currentForwardDir.multiply(-1); // Reverse direction
        //         this.currentPosition = this.currentPosition.add(this.currentVelocity.multiply(deltaTime)); // Move back slightly
        //         this.startTurnAround(this.currentForwardDir.multiply(-1)); // Turn fully around
        //     }
        // }
    }

    steerTowards(desiredVelocity, deltaTime) {
        const desiredDir = desiredVelocity.normalize();
        const currentSpeed = this.currentVelocity.magnitude();
        const targetSpeed = Math.min(this.settings.maxSpeed, desiredVelocity.magnitude());

        // Calculate steering force required to change direction
        const steerDir = desiredDir.subtract(this.currentForwardDir);
        const steerAccel = steerDir.multiply(this.settings.acceleration * deltaTime); // Simplified: should be based on how much velocity needs to change

        // Update velocity by adding steering acceleration
        // This is a simplified model. A more accurate one would consider current velocity vs desired.
        this.currentVelocity = this.currentVelocity.add(steerAccel);
        
        // Clamp speed to maxSpeed
        if (this.currentVelocity.magnitude() > this.settings.maxSpeed) {
            this.currentVelocity = this.currentVelocity.normalize().multiply(this.settings.maxSpeed);
        }

        // Update forward direction
        if (this.currentVelocity.magnitude() > 0.001) { // Avoid normalizing zero vector
             this.currentForwardDir = this.currentVelocity.normalize();
        }
    }
    
    handleCollisionSteering() {
        // Placeholder for obstacle avoidance logic.
        // In C#, this uses raycasts from "antennas".
        // For JS, we'll need a different strategy (e.g., spatial hashing, simple circle checks).
        this.obstacleAvoidForce = Vector2.zero; 

        // Example antenna logic (conceptual, needs actual collision detection)
        // const leftSensorPos = this.getSensorPosition(Math.PI / 4); // 45 degrees left
        // const rightSensorPos = this.getSensorPosition(-Math.PI / 4); // 45 degrees right
        // if (this.isCollidingAt(leftSensorPos)) this.obstacleAvoidForce = this.obstacleAvoidForce.add(this.currentForwardDir.rotate(Math.PI / 2).multiply(this.settings.collisionAvoidSteerStrength)); // Turn right
        // if (this.isCollidingAt(rightSensorPos)) this.obstacleAvoidForce = this.obstacleAvoidForce.add(this.currentForwardDir.rotate(-Math.PI / 2).multiply(this.settings.collisionAvoidSteerStrength)); // Turn left
    }

    handleSearchForFood(foodSources) { // foodSources might be an array or a manager object
        if (this.targetFood && this.targetFood.isCollected) { // Check if another ant got it
            this.targetFood = null;
        }

        if (!this.targetFood) {
            // Search for the closest food item within perception radius
            let closestFood = null;
            let minDistSq = this.settings.perceptionRadius * this.settings.perceptionRadius;

            for (const source of foodSources) { // Assuming foodSources is an array of FoodSource instances
                for (const foodItem of source.foodItems) {
                    const distSq = Vector2.distance(this.currentPosition, foodItem.position) * Vector2.distance(this.currentPosition, foodItem.position);
                    if (distSq < minDistSq) {
                        minDistSq = distSq;
                        closestFood = foodItem;
                    }
                }
            }
            
            if (closestFood) {
                this.targetFood = closestFood;
            }
        }

        if (this.targetFood) {
            const dirToFood = this.targetFood.position.subtract(this.currentPosition).normalize();
            this.targetSteerForce = dirToFood.multiply(this.settings.targetSteerStrength);

            // Check if close enough to collect food
            const distToFood = Vector2.distance(this.currentPosition, this.targetFood.position);
            if (distToFood < (this.settings.collisionRadius + 0.1) ) { // Using collisionRadius as pickup distance
                // "Collect" the food
                // In C#, FoodSource.ConsumeFood(targetFood) is called by AntManager.
                // Here, we'll assume colony or main simulation handles actual removal from FoodSource
                if (this.colony.requestFoodConsumption(this.targetFood)) {
                    this.collectedFood = this.targetFood; // Keep a reference
                    this.targetFood.isCollected = true; // Mark as collected
                    this.targetFood = null;
                    this.currentState = Ant.State.ReturningHome;
                    this.leftFoodTime = performance.now() / 1000.0;
                    this.startTurnAround(this.currentForwardDir.multiply(-1)); // Turn around to go home
                } else {
                    // Food was already taken or unavailable
                    this.targetFood = null;
                }
            }
        } else {
            // No target food, rely on pheromone steering
            this.handlePheromoneSteering();
        }
    }

    handleReturnHome() {
        const dirToHome = this.homePos.subtract(this.currentPosition);
        const distToHome = dirToHome.magnitude();

        if (distToHome < this.settings.perceptionRadius * 0.5) { // Prioritize direct return if close
            this.targetSteerForce = dirToHome.normalize().multiply(this.settings.targetSteerStrength);
            
            if (distToHome < (this.settings.collisionRadius + 0.1)) { // CollisionRadius as drop-off distance
                if (this.collectedFood) {
                    // "Drop" food
                    this.colony.registerCollectedFood(this.collectedFood); // Notify colony
                    this.collectedFood.isCollected = false; // Mark as available again (or destroy)
                    this.collectedFood = null; 
                }
                this.currentState = Ant.State.SearchingForFood;
                this.leftHomeTime = performance.now() / 1000.0;
                this.startTurnAround(this.currentForwardDir.multiply(-1)); // Turn around to search again
            }
        } else {
            // Rely on pheromone steering if home is not immediately in sight or further away
            this.handlePheromoneSteering();
             // Add a slight bias towards home even when following pheromones
            this.targetSteerForce = this.targetSteerForce.add(dirToHome.normalize().multiply(this.settings.targetSteerStrength * 0.1));
        }
    }

    handlePheromonePlacement() {
        const distSinceLastMarker = Vector2.distance(this.currentPosition, this.lastPheromonePos);
        if (distSinceLastMarker > this.settings.dstBetweenMarkers) {
            this.lastPheromonePos = this.currentPosition.clone();
            let weight = 1.0; // Default weight

            if (this.currentState === Ant.State.ReturningHome && this.settings.useFoodMarkers && this.collectedFood) {
                // Ant is returning home and has food, places "food" pheromones
                // Weight could be based on time since left food source
                const timeSinceLeftFood = Math.max(1, (performance.now() / 1000.0) - this.leftFoodTime);
                weight = Math.max(0.1, 1 - (timeSinceLeftFood / this.settings.pheromoneRunOutTime));
                if (this.colony.foodMarkers) {
                    this.colony.foodMarkers.add(this.currentPosition, weight);
                }
            } else if (this.currentState === Ant.State.SearchingForFood && this.settings.useHomeMarkers) {
                // Ant is searching for food, places "home" pheromones
                // Weight could be based on time since left home
                const timeSinceLeftHome = Math.max(1, (performance.now() / 1000.0) - this.leftHomeTime);
                weight = Math.max(0.1, 1 - (timeSinceLeftHome / this.settings.pheromoneRunOutTime));
                if (this.colony.homeMarkers) {
                    this.colony.homeMarkers.add(this.currentPosition, weight);
                }
            }
        }
    }

    handlePheromoneSteering() {
        const searchMap = (this.currentState === Ant.State.SearchingForFood) ? this.colony.foodMarkers : this.colony.homeMarkers;
        if (!searchMap) return;

        let strongestSignalDir = Vector2.zero;
        let totalWeight = 0;

        // Sensor points (simplified: one forward, two angled)
        const sensorAngles = [0, Math.PI / 6, -Math.PI / 6]; // Forward, 30deg left, 30deg right
        const sensorPositions = sensorAngles.map(angle => this.getSensorPosition(angle, this.settings.sensorDst));
        
        // Add current position as a sensor to ensure it picks up nearby signals
        sensorPositions.push(this.currentPosition.clone());


        for (const sensorPos of sensorPositions) {
            // Clear previous results. The C# version passes an array to be filled.
            // Here, we'll just get the results and process them.
            const entriesInSensorRegion = []; // This should be pre-allocated if possible for performance
            searchMap.getAllInCircle(entriesInSensorRegion, sensorPos); // Max results not used here, but could be a param for getAllInCircle

            for (const entry of entriesInSensorRegion) {
                 const dirToPheromone = entry.position.subtract(this.currentPosition);
                 const distSq = dirToPheromone.magnitude() * dirToPheromone.magnitude();
                 if (distSq > 0) { // Avoid division by zero if ant is on top of pheromone
                    // Weight by distance (closer pheromones are stronger) and initial weight
                    const weight = entry.initialWeight / (1 + distSq); // Simple weighting
                    strongestSignalDir = strongestSignalDir.add(dirToPheromone.normalize().multiply(weight));
                    totalWeight += weight;
                 }
            }
        }
        
        if (totalWeight > 0) {
            this.pheromoneSteerForce = strongestSignalDir.normalize().multiply(this.settings.pheromoneWeight);
        } else {
            this.pheromoneSteerForce = Vector2.zero;
        }
    }

    handleRandomSteering() {
        const currentTime = performance.now() / 1000.0;
        if (currentTime > this.nextRandomSteerTime && !this.targetFood && !this.turningAround) {
            const randomDir = this.getRandomDir();
            this.randomSteerForce = randomDir.multiply(this.settings.randomSteerStrength);
            this.nextRandomSteerTime = currentTime + (Math.random() * this.settings.randomSteerMaxDuration);
        } else if (this.targetFood || this.turningAround) {
             // Stop random steering if there's a specific target or turning
            this.randomSteerForce = Vector2.zero;
        }
    }

    startTurnAround(targetDir) {
        if(this.turningAround) return; // Already turning

        this.turningAround = true;
        this.turnAroundOriginDir = this.currentForwardDir.clone();
        this.turnAroundTargetDir = targetDir.normalize();
        this.turnAroundProgress = 0;
        
        // Calculate turn duration based on angle to turn (e.g. 0.5s for 180 deg)
        const angle = Math.acos(this.turnAroundOriginDir.dot(this.turnAroundTargetDir)); // Radians
        this.turnAroundDuration = (angle / Math.PI) * 0.5; // Proportional to 180 deg turn time

        if (this.turnAroundDuration < 0.01) { // Already facing target
            this.turningAround = false;
            this.currentForwardDir = this.turnAroundTargetDir.clone();
            this.turnAroundForce = Vector2.zero;
        }
    }

    continueTurnAround(deltaTime) {
        if (!this.turningAround) return;

        this.turnAroundProgress += deltaTime / this.turnAroundDuration;

        if (this.turnAroundProgress >= 1) {
            this.turningAround = false;
            this.currentForwardDir = this.turnAroundTargetDir.clone();
            this.turnAroundForce = Vector2.zero;
        } else {
            // Interpolate direction (Slerp would be better, LERP for now)
            const newDirX = this.turnAroundOriginDir.x + (this.turnAroundTargetDir.x - this.turnAroundOriginDir.x) * this.turnAroundProgress;
            const newDirY = this.turnAroundOriginDir.y + (this.turnAroundTargetDir.y - this.turnAroundOriginDir.y) * this.turnAroundProgress;
            this.currentForwardDir = new Vector2(newDirX, newDirY).normalize();
            
            // Apply a force to make the turn happen via steering mechanism
            this.turnAroundForce = this.currentForwardDir.subtract(this.currentVelocity.normalize()).normalize().multiply(this.settings.targetSteerStrength * 2); // Stronger force for turning
        }
    }


    // --- Helper Methods ---
    getSensorPosition(angleOffset, distance) { // Angle relative to currentForwardDir
        const dirX = this.currentForwardDir.x * Math.cos(angleOffset) - this.currentForwardDir.y * Math.sin(angleOffset);
        const dirY = this.currentForwardDir.x * Math.sin(angleOffset) + this.currentForwardDir.y * Math.cos(angleOffset);
        return this.currentPosition.add(new Vector2(dirX, dirY).multiply(distance));
    }

    getRandomDir() {
        const angle = Math.random() * 2 * Math.PI;
        return new Vector2(Math.cos(angle), Math.sin(angle));
    }

    // Placeholder for checking collision at a point (used by conceptual handleCollisionSteering)
    // isCollidingAt(point) { 
    //     // In a real scenario, this would check against world geometry / other ants
    //     return false; 
    // }
}

// Export for use in other modules if using a module system (e.g., ES6 modules)
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Ant;
}
