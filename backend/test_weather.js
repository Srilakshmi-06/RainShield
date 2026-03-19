const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const testWeatherAPI = async () => {
    const apiKey = process.env.WEATHER_API_KEY;
    const city = 'Mumbai';
    console.log(`Testing OpenWeatherMap for ${city} with key: ${apiKey.substring(0, 5)}...`);

    try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
        console.log('✅ API Connected Successfully!');
        console.log('Current Temperature:', response.data.main.temp, '°C');
        console.log('Current Rain (1h):', response.data.rain ? response.data.rain['1h'] : 'None');
    } catch (error) {
        console.error('❌ API Connection Error:', error.response ? error.response.data : error.message);
    }
};

testWeatherAPI();
