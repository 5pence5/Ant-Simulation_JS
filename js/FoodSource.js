// Depends on Vector2.js

class FoodItem {
    constructor(position) {
        this.position = position; // Vector2
        this.size = 5; // Default size, can be customized
        // In a real scenario, this might hold more info (e.g., graphic, type)
    }
}

class FoodSource {
    constructor({
        position = new Vector2(0, 0),
        radius = 10,
        // foodPrefab is conceptual here; we'll create FoodItem instances
        timeBetweenSpawns = 1, // Not directly used if spawning is driven by update/maintainAmount
        amount = 50,
        maintainAmount = true,
        blobCount = 3,
        seed = 0 // Note: Math.random() in JS is not directly seedable. This seed is for potential future PRNG.
    } = {}) {
        this.position = position; // Center position of the food source area
        this.radius = radius;
        this.amount = amount; // Target number of food items
        this.maintainAmount = maintainAmount;
        this.blobCount = blobCount;
        this.seed = seed; // Store seed

        // Simple PRNG (Linear Congruential Generator - LCG)
        // Parameters from https://en.wikipedia.org/wiki/Linear_congruential_generator#Parameters_in_common_use
        this.prng_m = 0x80000000; // 2^31
        this.prng_a = 1103515245;
        this.prng_c = 12345;
        this.prng_state = seed;

        this.foodItems = [];
        this.blobs = [];

        this.initBlobs();

        // Initial spawn
        for (let i = 0; i < this.amount; i++) {
            this.spawnFood();
        }
    }

    // Simple LCG random number generator (returns value between 0 and 1)
    random() {
        this.prng_state = (this.prng_a * this.prng_state + this.prng_c) % this.prng_m;
        return this.prng_state / (this.prng_m -1);
    }

    initBlobs() {
        const blobRadiusMin = this.radius * 0.1;
        const blobRadiusMax = this.radius * 0.4;

        for (let i = 0; i < this.blobCount; i++) {
            const angle = this.random() * Math.PI * 2;
            const dist = this.random() * this.radius * 0.75; // Place blobs not too close to the edge
            const blobPos = this.position.add(new Vector2(Math.cos(angle) * dist, Math.sin(angle) * dist));
            const blobRadius = blobRadiusMin + this.random() * (blobRadiusMax - blobRadiusMin);
            this.blobs.push({ position: blobPos, radius: blobRadius });
        }
        // If no blobs, make the source itself a blob
        if (this.blobs.length === 0) {
            this.blobs.push({ position: this.position.clone(), radius: this.radius });
        }
    }

    spawnFood() {
        if (this.blobs.length === 0) {
            console.error("No blobs to spawn food in.");
            return null;
        }

        // Pick a random blob
        const blobIndex = Math.floor(this.random() * this.blobs.length);
        const selectedBlob = this.blobs[blobIndex];

        // Generate a random point within the selected blob's radius
        const angle = this.random() * Math.PI * 2;
        const dist = this.random() * selectedBlob.radius;
        const spawnPos = selectedBlob.position.add(new Vector2(Math.cos(angle) * dist, Math.sin(angle) * dist));

        const newFood = new FoodItem(spawnPos);
        this.foodItems.push(newFood);
        return newFood;
    }

    // update method to maintain food amount
    update() {
        if (this.maintainAmount && this.foodItems.length < this.amount) {
            this.spawnFood();
        }
        // In a simulation, this might also handle food consumption, etc.
    }

    // Method to consume food, e.g., by an ant
    consumeFood(foodItem) {
        const index = this.foodItems.indexOf(foodItem);
        if (index > -1) {
            this.foodItems.splice(index, 1);
            return true; // Food consumed
        }
        return false; // Food not found
    }
}

// Export for use in other modules if using a module system (e.g., ES6 modules)
// For simple browser environments, this will make FoodSource and FoodItem globally available.
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = { FoodSource, FoodItem };
}
