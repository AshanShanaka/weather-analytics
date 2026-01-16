const axios = require("axios");
const { getCache, setCache } = require("./cache.service");

async function fetchWeatherByCityId(cityId) {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) throw new Error("Missing OPENWEATHER_API_KEY in .env");

    const cacheKey = `raw:${cityId}`;

    const cached = getCache(cacheKey);
    if (cached) {
        return { data: cached, cache: "HIT" };
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?id=${cityId}&appid=${apiKey}&units=metric`;
    const response = await axios.get(url);

    setCache(cacheKey, response.data);

    return { data: response.data, cache: "MISS" };
}

module.exports = { fetchWeatherByCityId };
