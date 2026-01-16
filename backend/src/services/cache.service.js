const NodeCache = require("node-cache");

// 300 seconds = 5 minutes
const cache = new NodeCache({ stdTTL: 300 });

function getCache(key) {
    return cache.get(key);
}

function setCache(key, value) {
    cache.set(key, value);
}

function getKeys() {
    return cache.keys();
}

function getStats() {
    return cache.getStats();
}

module.exports = {
    getCache,
    setCache,
    getKeys,
    getStats
};
