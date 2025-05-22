// Depends on Vector2.js and AntSettings.js

class PerceptionMap {
    // Entry structure (can be a simple object literal, or a class if preferred)
    static Entry = class {
        constructor(position, creationTime, initialWeight) {
            this.position = position; // Vector2
            this.creationTime = creationTime; // seconds
            this.initialWeight = initialWeight;
        }
    }

    // Cell class
    static Cell = class {
        constructor() {
            this.entries = []; // Using an array for entries, similar to LinkedList<Entry>
        }

        add(entry) {
            this.entries.push(entry);
        }

        // Optional: Method to remove an entry if needed, though C# version removes during iteration
        remove(entry) {
            const index = this.entries.indexOf(entry);
            if (index > -1) {
                this.entries.splice(index, 1);
            }
        }
    }

    constructor(area, antSettings) {
        this.area = area; // { x: width, y: height }
        this.antSettings = antSettings;

        // Initialize properties based on antSettings
        const perceptionRadius = Math.max(0.01, this.antSettings.sensorSize);
        this.sqrPerceptionRadius = perceptionRadius * perceptionRadius;

        this.numCellsX = Math.ceil(this.area.x / perceptionRadius);
        this.numCellsY = Math.ceil(this.area.y / perceptionRadius);

        // Using Vector2 for halfSize for consistency, though it's just a pair of numbers here
        this.halfSize = new Vector2(this.numCellsX * perceptionRadius, this.numCellsY * perceptionRadius).multiply(0.5);
        this.cellSizeReciprocal = 1 / perceptionRadius;

        // Initialize the cells grid
        this.cells = [];
        for (let x = 0; x < this.numCellsX; x++) {
            this.cells[x] = [];
            for (let y = 0; y < this.numCellsY; y++) {
                this.cells[x][y] = new PerceptionMap.Cell();
            }
        }
        // Skipping particle display initialization for now
    }

    /**
     * Translates a world position (point) to cell grid coordinates.
     * @param {Vector2} point The world position.
     * @returns {{x: number, y: number}} The cell coordinates.
     */
    cellCoordFromPos(point) {
        let x = Math.floor((point.x + this.halfSize.x) * this.cellSizeReciprocal);
        let y = Math.floor((point.y + this.halfSize.y) * this.cellSizeReciprocal);
        // Clamp coordinates to be within grid bounds
        x = Math.max(0, Math.min(x, this.numCellsX - 1));
        y = Math.max(0, Math.min(y, this.numCellsY - 1));
        return { x, y };
    }

    /**
     * Adds a pheromone entry at a given point.
     * @param {Vector2} point The position to add the entry.
     * @param {number} initialWeight The initial weight of the pheromone.
     */
    add(point, initialWeight) {
        const cellCoord = this.cellCoordFromPos(point);
        const cell = this.cells[cellCoord.x][cellCoord.y];
        
        const currentTime = performance.now() / 1000.0; // Time in seconds
        const entry = new PerceptionMap.Entry(point, currentTime, initialWeight);
        cell.add(entry);

        // Particle display logic skipped as per instructions
    }

    /**
     * Gets all entries within a perception circle.
     * @param {Array<PerceptionMap.Entry>} resultArray An array to store the results.
     * @param {Vector2} centre The centre of the perception circle.
     * @returns {number} The number of entries found and added to resultArray.
     */
    getAllInCircle(resultArray, centre) {
        const cellCoord = this.cellCoordFromPos(centre);
        let count = 0;
        const currentTime = performance.now() / 1000.0; // Time in seconds

        for (let offsetY = -1; offsetY <= 1; offsetY++) {
            for (let offsetX = -1; offsetX <= 1; offsetX++) {
                const cellX = cellCoord.x + offsetX;
                const cellY = cellCoord.y + offsetY;

                if (cellX >= 0 && cellX < this.numCellsX && cellY >= 0 && cellY < this.numCellsY) {
                    const cell = this.cells[cellX][cellY];
                    const remainingEntries = []; // To store entries that are not expired

                    for (let i = 0; i < cell.entries.length; i++) {
                        const entry = cell.entries[i];
                        const currentLifetime = currentTime - entry.creationTime;

                        if (currentLifetime > this.antSettings.pheromoneEvaporateTime) {
                            // Entry has expired, do not add to remainingEntries (effectively removing it)
                            continue;
                        }
                        remainingEntries.push(entry); // Keep non-expired entry

                        // Check if entry is inside perception radius (using squared distance for efficiency)
                        if (centre.subtract(entry.position).magnitude() * centre.subtract(entry.position).magnitude() < this.sqrPerceptionRadius) {
                            // The C# version expects resultArray to be pre-sized.
                            // For JS, we can push, but for compatibility with the C# design,
                            // we might want to respect a max size if resultArray had one.
                            // For now, just push.
                            resultArray.push(entry);
                            count++;
                        }
                    }
                    cell.entries = remainingEntries; // Update cell entries to only non-expired ones
                }
            }
        }
        return count;
    }
}

// Export for use in other modules if using a module system (e.g., ES6 modules)
// For simple browser environments, this will make PerceptionMap globally available.
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = PerceptionMap;
}
