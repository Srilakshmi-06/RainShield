const axios = require('axios');

const getMLPrediction = async (weatherData) => {
    try {
        const response = await axios.post('http://localhost:5001/predict-risk', {
            rainfall: weatherData.rainMm || 0,
            temperature: weatherData.temp || 30,
            humidity: weatherData.humidity || 60,
            wind_speed: weatherData.windSpeed || 5
        });
        return response.data;
    } catch (error) {
        console.error('Error calling ML Service:', error.message);
        return null;
    }
};

module.exports = { getMLPrediction };
