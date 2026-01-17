const { calculateComfortIndex } = require("./comfortIndex.service");

test("Comfort Index is always between 0 and 100", () => {
    const score = calculateComfortIndex({
        tempC: 50,
        humidity: 100,
        windSpeed: 20
    });

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
});

test("Comfortable weather scores higher than uncomfortable weather", () => {
    const comfortable = calculateComfortIndex({
        tempC: 22,
        humidity: 45,
        windSpeed: 3
    });

    const uncomfortable = calculateComfortIndex({
        tempC: 40,
        humidity: 90,
        windSpeed: 0
    });

    expect(comfortable).toBeGreaterThan(uncomfortable);
});
