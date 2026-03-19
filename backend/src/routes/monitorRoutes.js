const express = require('express');
const router = express.Router();

const { getMLPrediction } = require('../services/mlService');
const pgDb = require('../pgDb');

router.get('/status/:zone', async (req, res) => {
    const { zone } = req.params;
    const userId = req.query.userId || 1; 
    
    try {
        const { getWeatherData } = require('../services/weatherService');
        const { getMLPrediction } = require('../services/mlService');
        
        // Fetch LIVE data
        const weather = await getWeatherData(zone);
        
        // Call ML Service
        const prediction = await getMLPrediction({
            rainMm: weather.rainfall,
            temp: weather.temp,
            humidity: weather.humidity,
            windSpeed: weather.windSpeed
        });

        const riskLevel = prediction ? prediction.risk_level : 'Low';
        const predictedEarnings = prediction ? prediction.predicted_earnings : 800;
        const payoutAmount = prediction ? prediction.recommended_payout : 0;

    // Store in PostgreSQL
    try {
        await pgDb.query(
            'INSERT INTO weather_risk_predictions (user_id, rainfall, temperature, predicted_earnings, risk_level, payout_amount) VALUES ($1, $2, $3, $4, $5, $6)',
            [userId, rainMm, temp, predictedEarnings, riskLevel, payoutAmount]
        );
    } catch (err) {
        console.error('Failed to store prediction in PostgreSQL:', err.message);
    }

        res.json({
            zone,
            conditions: {
                rainfall: `${weather.rainfall} mm/hr`,
                temp: `${weather.temp}°C`,
                humidity: `${weather.humidity}%`,
                windSpeed: `${weather.windSpeed} km/h`,
                description: weather.description,
                riskLevel
            },
            prediction: {
                predictedEarnings,
                payoutAmount,
                status: riskLevel
            }
        });
    } catch (err) {
        console.error('Monitoring Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch live weather data' });
    }
});

router.get('/activity/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pgDb.query(
            'SELECT * FROM weather_risk_predictions WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 10',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Failed to fetch activity:', err.message);
        res.status(500).json({ error: 'Failed to fetch activity' });
    }
});

router.get('/heatmap/:city', async (req, res) => {
    const { city } = req.params;
    const zones = [
        { name: 'North ' + city, offset: { lat: 0.05, lon: 0 } },
        { name: 'South ' + city, offset: { lat: -0.05, lon: 0 } },
        { name: 'East ' + city, offset: { lat: 0, lon: 0.05 } },
        { name: 'West ' + city, offset: { lat: 0, lon: -0.05 } },
        { name: 'Central ' + city, offset: { lat: 0, lon: 0 } }
    ];

    try {
        const { getWeatherData } = require('../services/weatherService');
        const { getMLPrediction } = require('../services/mlService');

        const heatmapData = await Promise.all(zones.map(async (zone) => {
            // For a real app, we'd use lat/lon. For now, we use zone names to get variations.
            const weather = await getWeatherData(zone.name).catch(() => getWeatherData(city)); 
            
            const prediction = await getMLPrediction({
                rainMm: weather.rainfall,
                temp: weather.temp,
                humidity: weather.humidity,
                windSpeed: weather.windSpeed
            });

            return {
                zone: zone.name,
                rainfall: weather.rainfall,
                temp: weather.temp,
                riskLevel: prediction ? prediction.risk_level : 'Low',
                lat: 19.0760 + zone.offset.lat, // Mumbai base lat
                lng: 72.8777 + zone.offset.lon  // Mumbai base lng
            };
        }));

        res.json(heatmapData);
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate heatmap' });
    }
});

module.exports = router;
