require("dotenv").config();

const express = require("express");
const cors = require("cors");



const { fetchWeatherByCityId } = require("./services/openweather.service");
const { getCityCodes, getCities } = require("./services/city.service");
const { calculateComfortIndex } = require("./services/comfortIndex.service");
const { getKeys, getStats, getCache, setCache } = require("./services/cache.service");
const { requireAuth } = require("./middleware/auth.middleware");
const { fetchForecastByCityId } = require("./services/openweatherForecast.service");





const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

app.get("/cities", (req, res) => {
    res.json(getCityCodes());
});

app.get("/weather/:cityId", async (req, res) => {
    try {
        const cityId = Number(req.params.cityId);
        const result = await fetchWeatherByCityId(cityId);
        res.json(result); // { data, cache: "HIT" | "MISS" }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/debug/cache", (req, res) => {
    res.json({
        keys: getKeys(),
        stats: getStats()
    });
});

app.get("/api/weather/comfort", requireAuth, async (req, res) => {
    try {
        const processedKey = "processed:comfort:list";

        // 1️ Check processed cache
        const cachedProcessed = getCache(processedKey);
        if (cachedProcessed) {
            return res.json({
                ...cachedProcessed,
                processedCache: "HIT"
            });
        }

        // 2️ Compute fresh result (MISS)
        const cities = getCities();

        const results = await Promise.all(
            cities.map(async (city) => {
                const cityId = Number(city.CityCode);
                const { data, cache } = await fetchWeatherByCityId(cityId);

                const tempC = data.main.temp;
                const humidity = data.main.humidity;
                const windSpeed = data.wind?.speed ?? 0;
                const description = data.weather?.[0]?.description ?? "N/A";

                const comfortScore = calculateComfortIndex({
                    tempC,
                    humidity,
                    windSpeed
                });

                return {
                    cityId,
                    cityName: city.CityName,
                    description,
                    tempC,
                    humidity,
                    windSpeed,
                    comfortScore,
                    rawCache: cache
                };
            })
        );

        results.sort((a, b) => b.comfortScore - a.comfortScore);

        const ranked = results.map((item, index) => ({
            rank: index + 1,
            ...item
        }));

        const payload = {
            generatedAt: new Date().toISOString(),
            totalCities: ranked.length,
            cities: ranked,
            processedCache: "MISS"
        };

        // 3️ Store processed result
        setCache(processedKey, payload);

        res.json(payload);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/weather/forecast/:cityId", requireAuth, async (req, res) => {
    try {
        const cityId = Number(req.params.cityId);

        const result = await fetchForecastByCityId(cityId);

        // return first 12 points (about 36 hours) for a clean chart
        const points = (result.data.list || []).slice(0, 12).map(p => ({
            time: p.dt_txt,
            tempC: p.main.temp
        }));

        res.json({
            cityId,
            cityName: result.data.city?.name,
            points,
            cache: result.cache
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
