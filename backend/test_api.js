const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const test = async () => {
    const city = 'Mumbai';
    const apiKey = process.env.WEATHER_API_KEY;
    console.log(`Using API Key: ${apiKey}`);
    try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
        console.log('Success:', response.data);
    } catch (err) {
        console.error('Error:', err.response?.status, err.response?.data);
    }
};
test();
