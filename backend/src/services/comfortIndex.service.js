function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Comfort Index (0..100)
 * Uses 3 parameters: Temperature, Humidity, Wind Speed
 * - Ideal temp: 22°C (comfortable range)
 * - Ideal humidity: 45% (comfortable range)
 * - Ideal wind: 3 m/s (light breeze)
 */
function calculateComfortIndex({ tempC, humidity, windSpeed }) {
    // 1) Temperature score: best at 22C, drops as it goes away from 22
    // Every 1°C away reduces score by 3 points.
    const tempScore = clamp(100 - Math.abs(tempC - 22) * 3, 0, 100);

    // 2) Humidity score: best at 45%, drops as it goes away from 45
    // Every 1% away reduces score by 1.5 points.
    const humidityScore = clamp(100 - Math.abs(humidity - 45) * 1.5, 0, 100);

    // 3) Wind score: best at 3 m/s, too calm or too windy reduces comfort
    // Every 1 m/s away reduces score by 12 points.
    const windScore = clamp(100 - Math.abs(windSpeed - 3) * 12, 0, 100);

    // Weighted average (must be easy to explain in review)
    // Temperature matters most, then humidity, then wind.
    const weighted =
        tempScore * 0.5 +
        humidityScore * 0.3 +
        windScore * 0.2;

    return Math.round(clamp(weighted, 0, 100));
}

module.exports = { calculateComfortIndex };
