// Depends on Vector2.js, Ant.js, FoodSource.js, AntColony.js, PerceptionMap.js

class Renderer {
    constructor(canvas, worldSize) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.worldSize = worldSize; // e.g., { width, height } or { x, y }

        if (this.worldSize.width && this.worldSize.height) {
            this.canvas.width = this.worldSize.width;
            this.canvas.height = this.worldSize.height;
        } else if (this.worldSize.x && this.worldSize.y) { // Support {x,y} too
            this.canvas.width = this.worldSize.x;
            this.canvas.height = this.worldSize.y;
        } else {
            console.error("worldSize must have width/height or x/y properties.");
        }
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawAnt(ant) {
        this.ctx.save();
        this.ctx.translate(ant.currentPosition.x, ant.currentPosition.y);
        this.ctx.rotate(Math.atan2(ant.currentForwardDir.y, ant.currentForwardDir.x));

        // Body
        if (ant.collectedFood) {
            this.ctx.fillStyle = 'green'; // Carrying food
        } else if (ant.currentState === Ant.State.SearchingForFood) {
            this.ctx.fillStyle = 'black';
        } else {
            this.ctx.fillStyle = '#333'; // Returning home, no food (dark grey)
        }

        this.ctx.beginPath();
        // Simple triangle shape for the ant body
        const antSize = 4; // pixels
        this.ctx.moveTo(antSize, 0);
        this.ctx.lineTo(-antSize / 2, antSize / 2);
        this.ctx.lineTo(-antSize / 2, -antSize / 2);
        this.ctx.closePath();
        this.ctx.fill();

        // Optional: Head
        // this.ctx.fillStyle = 'grey';
        // this.ctx.beginPath();
        // this.ctx.arc(antSize * 0.75, 0, antSize / 3, 0, Math.PI * 2);
        // this.ctx.fill();

        this.ctx.restore();
    }

    drawFoodSource(foodSource) {
        // Optional: Draw the radius of the food source area
        this.ctx.strokeStyle = 'rgba(0, 100, 0, 0.2)'; // Light green for area
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(foodSource.position.x, foodSource.position.y, foodSource.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw individual food items
        this.ctx.fillStyle = 'rgb(100, 200, 0)'; // Brighter green for food items
        for (const foodItem of foodSource.foodItems) {
            if (!foodItem.isCollected) { // Only draw if not collected
                 this.ctx.beginPath();
                 this.ctx.arc(foodItem.position.x, foodItem.position.y, foodItem.size / 2, 0, Math.PI * 2);
                 this.ctx.fill();
            }
        }
    }

    drawColony(colony) {
        this.ctx.fillStyle = 'saddlebrown'; // Anthill color
        this.ctx.beginPath();
        this.ctx.arc(colony.position.x, colony.position.y, colony.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Optional: Entrance
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(colony.position.x, colony.position.y, colony.radius / 3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawPheromones(perceptionMap, baseColor, antSettings) {
        const currentTime = performance.now() / 1000.0; // seconds

        for (let x = 0; x < perceptionMap.numCellsX; x++) {
            for (let y = 0; y < perceptionMap.numCellsY; y++) {
                const cell = perceptionMap.cells[x][y];
                for (const entry of cell.entries) {
                    const age = currentTime - entry.creationTime;
                    if (age < antSettings.pheromoneEvaporateTime) {
                        const alpha = entry.initialWeight * (1 - (age / antSettings.pheromoneEvaporateTime));
                        if (alpha < 0.01) continue; // Don't draw very faint pheromones

                        // Convert baseColor (e.g., 'blue', 'red') to rgba
                        let r=0, g=0, b=0;
                        if (baseColor === 'blue') { r=0; g=0; b=255; }
                        else if (baseColor === 'red') { r=255; g=0; b=0; }
                        // Add more colors if needed

                        this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                        this.ctx.beginPath();
                        this.ctx.arc(entry.position.x, entry.position.y, 1.5, 0, Math.PI * 2); // Pheromone dot size
                        this.ctx.fill();
                    }
                }
            }
        }
    }

    render(colony, foodSources, antSettings) {
        this.clear();

        // Draw colony (anthill)
        if (colony) {
            this.drawColony(colony);

            // Draw pheromones
            if (colony.homeMarkers && antSettings.useHomeMarkers) {
                this.drawPheromones(colony.homeMarkers, 'blue', antSettings);
            }
            if (colony.foodMarkers && antSettings.useFoodMarkers) {
                this.drawPheromones(colony.foodMarkers, 'red', antSettings);
            }
        }

        // Draw food sources
        if (foodSources) {
            for (const fs of foodSources) {
                this.drawFoodSource(fs);
            }
        }

        // Draw ants
        if (colony && colony.ants) {
            for (const ant of colony.ants) {
                this.drawAnt(ant);
            }
        }
    }
}

// Export for use in other modules if using a module system (e.g., ES6 modules)
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Renderer;
}
