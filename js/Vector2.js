class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(otherVector) {
        return new Vector2(this.x + otherVector.x, this.y + otherVector.y);
    }

    subtract(otherVector) {
        return new Vector2(this.x - otherVector.x, this.y - otherVector.y);
    }

    multiply(scalar) {
        return new Vector2(this.x * scalar, this.y * scalar);
    }

    divide(scalar) {
        if (scalar === 0) {
            console.error("Cannot divide by zero.");
            return new Vector2(this.x, this.y); // Or throw an error, or return (Infinity, Infinity)
        }
        return new Vector2(this.x / scalar, this.y / scalar);
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const mag = this.magnitude();
        if (mag === 0) {
            return new Vector2(0, 0); // Or handle as an error
        }
        return this.divide(mag);
    }

    dot(otherVector) {
        return this.x * otherVector.x + this.y * otherVector.y;
    }

    clone() {
        return new Vector2(this.x, this.y);
    }

    // Optional: Static methods for convenience
    static get zero() {
        return new Vector2(0, 0);
    }

    static get one() {
        return new Vector2(1, 1);
    }

    static get up() {
        return new Vector2(0, 1); // Assuming +y is up
    }

    static get down() {
        return new Vector2(0, -1); // Assuming -y is down
    }

    static get left() {
        return new Vector2(-1, 0);
    }

    static get right() {
        return new Vector2(1, 0);
    }

    static distance(vecA, vecB) {
        return vecA.subtract(vecB).magnitude();
    }

    static angle(vecA, vecB) { // Returns angle in radians
        const dotProduct = vecA.dot(vecB);
        const magA = vecA.magnitude();
        const magB = vecB.magnitude();
        if (magA === 0 || magB === 0) return 0; // Or handle error
        return Math.acos(dotProduct / (magA * magB));
    }
}

// Export for use in other modules if using a module system (e.g., ES6 modules)
// For simple browser environments, this will make Vector2 globally available.
// If you intend to use ES6 modules, you would use: export default Vector2;
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Vector2;
}
