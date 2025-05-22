const AntSettings = {
    // Movement
    maxSpeed: 2,
    acceleration: 3,
    collisionAvoidSteerStrength: 5,
    targetSteerStrength: 3,
    randomSteerStrength: 0.6,
    randomSteerMaxDuration: 1,
    timeBetweenDirUpdate: 0.15,
    collisionRadius: 0.15,

    // Pheromones
    dstBetweenMarkers: 0.75,
    pheromoneEvaporateTime: 45,
    pheromoneRunOutTime: 30,
    pheromoneWeight: 1,
    perceptionRadius: 2.5,
    useHomeMarkers: true,
    useFoodMarkers: true,

    // Sensing
    sensorSize: 0.75,
    sensorDst: 1.25,
    sensorSpacing: 1,
    antennaDst: 0.25,

    // Lifetime
    lifetime: 150,
    useDeath: false,
};

// Export for use in other modules if using a module system (e.g., ES6 modules)
// For simple browser environments, this will make AntSettings globally available.
// If you intend to use ES6 modules, you would use: export default AntSettings;
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = AntSettings;
}
