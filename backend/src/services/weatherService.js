const axios = require('axios');

const getWeatherData = async (city) => {
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
        throw new Error('Weather API key is missing');
    }

    try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
        const weather = response.data;
        
        const rain = weather.rain ? (weather.rain['1h'] || 0) : 0;
        
        return {
            city: weather.name,
            temp: weather.main.temp,
            rainfall: rain,
            humidity: weather.main.humidity,
            windSpeed: weather.wind.speed,
            description: weather.weather[0].description,
            timestamp: new Date().toISOString(),
            lat: weather.coord.lat,
            lon: weather.coord.lon
        };
    } catch (error) {
        console.error(`[WEATHER SERVICE ERROR] ${error.message}`);
        throw error;
    }
};

module.exports = { getWeatherData };
