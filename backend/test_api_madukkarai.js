const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const test = async () => {
    const city = 'Madukkarai';
    const apiKey = process.env.WEATHER_API_KEY;
    try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
        console.log('Success:', response.data);
    } catch (err) {
        console.error('Error:', err.response?.status, err.status, err.response?.data);
    }
};
test();
