// Depends on Vector2.js, AntSettings.js, PerceptionMap.js, Ant.js

class AntColony {
    constructor({
        settings, // AntSettings instance
        position = new Vector2(0, 0), // Colony center position
        radius = 2, // Radius of the colony nest area
        numToSpawn = 50,
        replenishDead = true,
        worldSize = { x: 80, y: 60 } // Default world size for perception maps
    }) {
        this.settings = settings;
        this.position = position;
        this.radius = radius; // For spawning ants within this area, and as home base
        this.numToSpawn = numToSpawn;
        this.replenishDead = replenishDead;
        this.worldSize = worldSize; // Used for PerceptionMap area

        this.ants = [];
        this.numFoodCollected = 0;
        this.timePassed = 0; // Optional, as in C#

        // Initialize PerceptionMaps for pheromones
        // The area for these maps should ideally cover the entire simulation space.
        this.homeMarkers = new PerceptionMap(this.worldSize, this.settings);
        this.foodMarkers = new PerceptionMap(this.worldSize, this.settings);

        // Spawn initial ants
        this.init();
    }

    init() {
        for (let i = 0; i < this.numToSpawn; i++) {
            this.spawnAnt();
        }
    }

    update(deltaTime, foodSources) { // foodSources will be an array of FoodSource instances
        this.timePassed += deltaTime;

        // Update all ants
        // Iterate backwards to allow safe removal of ants during the loop
        for (let i = this.ants.length - 1; i >= 0; i--) {
            const ant = this.ants[i];
            ant.update(deltaTime, foodSources);
            // Ant death is handled within ant.update by calling colony.removeAnt(this)
        }

        // Replenish dead ants
        if (this.replenishDead && this.ants.length < this.numToSpawn) {
            this.spawnAnt();
        }
    }

    spawnAnt() {
        // Spawn ant at a random position within the colony's radius
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * this.radius;
        const spawnPos = this.position.add(new Vector2(Math.cos(angle) * dist, Math.sin(angle) * dist));
        
        // Random initial forward direction
        const randomAngle = Math.random() * Math.PI * 2;
        const initialForwardDir = new Vector2(Math.cos(randomAngle), Math.sin(randomAngle));

        const newAnt = new Ant(this.settings, spawnPos, this, initialForwardDir);
        this.ants.push(newAnt);
    }

    // Called by an Ant when it successfully "drops" food at the colony
    registerCollectedFood(foodItem) {
        this.numFoodCollected++;
        // UI update would happen elsewhere, e.g., in a main simulation render loop
        // console.log(`Food collected! Total: ${this.numFoodCollected}`);
    }

    // Called by an Ant when it "collects" food from a FoodSource
    // This allows the colony to manage access to food if necessary,
    // or simply pass the request to the food source.
    requestFoodConsumption(foodItem) {
        // Find the food source that owns this foodItem
        // This is a bit inefficient; ideally, foodItem would know its source or be globally unique.
        // For now, assuming foodSources is available and not too large.
        // In the C# version, AntManager calls FoodSource.ConsumeFood.
        // Here, the Ant asks the Colony, which might ask the FoodSource.
        
        // Simplified: find the food source that contains this food item and tell it to consume it.
        // This requires foodSources to be accessible here, or a different pattern.
        // Let's assume `foodSources` is passed to `update` and available if needed,
        // but for now, the Ant directly marks food as `isCollected`. The actual removal from
        // the FoodSource's list might need to happen in the main loop or via the Ant itself
        // if it holds a reference to the FoodSource.
        // For now, we'll assume the Ant handles its `targetFood.isCollected = true`
        // and the FoodSource might later clean up collected items or the Ant tells it.

        // Let's refine this: The Ant has a targetFood. It should ask that FoodSource to consume it.
        // The Ant should call targetFood.source.consumeFood(targetFood).
        // This method in Colony might not be strictly necessary if Ants manage consumption directly.
        // However, if the Colony needs to mediate or track this, it can.

        // For this port, let's assume the Ant has already marked the food as "collected" (isCollected = true).
        // The colony's role here is mostly to acknowledge.
        // The actual removal from the FoodSource's list can be handled by the FoodSource itself
        // when an ant tries to pick up an already collected item, or periodically.

        // This method is less critical if ants directly interact with FoodSource for consumption.
        // Let's keep it simple for now. The critical part is `registerCollectedFood`.
        // C# AntManager calls foodSource.ConsumeFood(ant.TargetFood);
        // So, the ant should probably tell the food source directly.
        // Let's assume `ant.collectFood()` handles this interaction.
        // This method can return true to confirm consumption is allowed/successful.
        return true; // Placeholder, actual consumption logic is more complex.
    }

    // Called by an Ant when it dies
    removeAnt(antToRemove) {
        const index = this.ants.indexOf(antToRemove);
        if (index > -1) {
            this.ants.splice(index, 1);
            // console.log("Ant died and was removed from colony.");
        }
    }
}

// Export for use in other modules if using a module system (e.g., ES6 modules)
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = AntColony;
}
