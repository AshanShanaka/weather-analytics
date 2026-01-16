const citiesData = require("../data/cities.json");

function getCities() {
    return citiesData.List;
}

function getCityCodes() {
    return citiesData.List.map(city => Number(city.CityCode));
}

module.exports = {
    getCities,
    getCityCodes
};
