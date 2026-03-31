const axios = require('axios');

const getMLPrediction = async (weatherData) => {
    try {
        const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001';
        const response = await axios.post(`${mlUrl}/predict-risk`, {
            rainfall: weatherData.rainMm || 0,
            temperature: weatherData.temp || 30,
            humidity: weatherData.humidity || 60,
            wind_speed: weatherData.windSpeed || 5
        });
        return response.data;
    } catch (error) {
        // Simple Rule-Based Fallback (Beginner Friendly AI)
        console.warn('ML Service unreachable, using rule-based fallback');
        
        let riskLevel = 'Low';
        let recommendedPayout = 0;
        let predictedEarnings = 800;

        const rain = weatherData.rainMm || 0;
        const temp = weatherData.temp || 30;

        if (rain > 10 || temp > 40) {
            riskLevel = 'High';
            recommendedPayout = 500;
            predictedEarnings = 200;
        } else if (rain > 2 || temp > 35) {
            riskLevel = 'Medium';
            recommendedPayout = 200;
            predictedEarnings = 500;
        }

        return {
            risk_level: riskLevel,
            recommended_payout: recommendedPayout,
            predicted_earnings: predictedEarnings
        };
    }
};

/**
 * Calculates dynamic premium based on risk factors
 * @param {number} basePremium 
 * @param {object} weatherData 
 * @returns {number}
 */
const calculateDynamicPremium = (basePremium, weatherData) => {
    let adjustment = 1.0;
    
    // Logic: Rain/Storm -> Increase, Normal -> Decrease
    if (weatherData.rainfall > 5) adjustment += 0.3;
    if (weatherData.temp > 38) adjustment += 0.2;
    if (weatherData.rainfall === 0 && weatherData.temp < 30) adjustment -= 0.1;

    return parseFloat((basePremium * adjustment).toFixed(2));
};

module.exports = { getMLPrediction, calculateDynamicPremium };
