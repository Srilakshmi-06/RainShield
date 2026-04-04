const axios = require('axios');

const getMLPrediction = async (weatherData, userData = {}) => {
    try {
        const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001';
        const response = await axios.post(`${mlUrl}/predict-risk`, {
            rainfall: weatherData.rainfall || 0,
            temperature: weatherData.temp || 25,
            humidity: weatherData.humidity || 60,
            wind_speed: weatherData.windSpeed || 5,
            working_hours: userData.workingHours || 8,
            risk_score: userData.riskScore || 20
        });
        return response.data;
    } catch (error) {
        console.warn('ML Service unreachable, using advanced rule-based fallback');
        
        const rain = weatherData.rainfall || 0;
        const temp = weatherData.temp || 25;
        const hours = userData.workingHours || 8;
        
        // Advanced Fallback Logic
        let predictedLoss = 5; // Base 5% loss
        if (rain > 10) predictedLoss += 25;
        else if (rain > 5) predictedLoss += 15;
        
        if (temp > 40) predictedLoss += 15;
        if (hours > 10) predictedLoss += 10;

        let riskLevel = 'Low';
        if (predictedLoss > 30) riskLevel = 'High';
        else if (predictedLoss > 15) riskLevel = 'Medium';

        return {
            risk_level: riskLevel,
            predicted_earnings: 800 * (1 - predictedLoss/100),
            loss_percentage: predictedLoss,
            recommended_payout: predictedLoss > 20 ? 300 : (predictedLoss > 10 ? 150 : 0)
        };
    }
};

/**
 * Calculates dynamic premium with transparent breakdown
 */
const calculateDynamicPremium = (basePremium, weatherData, userData = {}, prediction = {}) => {
    let environmentalLoad = 0;
    let activityLoad = 0;
    let zoneLoad = 0;

    // 1. Environmental Factors
    if (weatherData.rainfall > 8) environmentalLoad += basePremium * 0.4;
    else if (weatherData.rainfall > 3) environmentalLoad += basePremium * 0.15;
    
    if (weatherData.temp > 42) environmentalLoad += basePremium * 0.25;

    // 2. Activity Factors (Personalization)
    if (userData.workingHours > 10) activityLoad += basePremium * 0.15;
    if (userData.vehicleType === 'Two-Wheeler' && weatherData.rainfall > 0) activityLoad += basePremium * 0.1;

    // 3. ML Risk Factors
    if (prediction.risk_level === 'High' || prediction.risk_level === 'HIGH') {
        zoneLoad += basePremium * 0.2;
    }

    const finalPremium = basePremium + environmentalLoad + activityLoad + zoneLoad;

    return {
        final: parseFloat(finalPremium.toFixed(2)),
        breakdown: {
            base: basePremium,
            environmental: parseFloat(environmentalLoad.toFixed(2)),
            activity: parseFloat(activityLoad.toFixed(2)),
            mlRisk: parseFloat(zoneLoad.toFixed(2))
        },
        explanation: buildExplanation(weatherData, userData, prediction)
    };
};

const buildExplanation = (weather, user, pred) => {
    const reasons = [];
    if (weather.rainfall > 5) reasons.push("heavy rain in your delivery zone");
    if (user.workingHours > 10) reasons.push("your extended working shift");
    if (pred.risk_level === 'High' || pred.risk_level === 'HIGH') reasons.push("high-risk ML prediction for your route");
    
    if (reasons.length === 0) return "Premium is at its baseline due to safe conditions.";
    return `Your premium is adjusted because of ${reasons.join(', ')}.`;
};

module.exports = { getMLPrediction, calculateDynamicPremium };
