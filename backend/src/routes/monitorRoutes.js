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

        // Get base city coordinates first
        const baseWeather = await getWeatherData(city);

        const heatmapData = await Promise.all(zones.map(async (zone) => {
            // Fetch weather variations. Fallback to base city if zone-specific fails
            const weather = await getWeatherData(zone.name).catch(() => baseWeather); 
            
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
                lat: baseWeather.lat + zone.offset.lat, 
                lng: baseWeather.lon + zone.offset.lon  
            };
        }));

        res.json(heatmapData);
    } catch (err) {
        console.error('Heatmap Error:', err.message);
        res.status(500).json({ error: 'Failed to generate heatmap' });
    }
});

// Claim Management Routes
router.post('/submit-claim', async (req, res) => {
    const { userId, type, description, amount, alertId } = req.body;
    
    try {
        // Fetch active policy
        const policyRes = await pgDb.query('SELECT id FROM policies WHERE user_id = $1 AND status = \'active\'', [userId]);
        const policyId = policyRes.rows[0] ? policyRes.rows[0].id : null;

        const result = await pgDb.query(
            'INSERT INTO claims (user_id, policy_id, risk_alert_id, claim_type, description, amount, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
            [userId, policyId, alertId, type, description, amount, 'Pending']
        );

        res.json({
            success: true,
            claimId: result.rows[0].id,
            status: 'Pending',
            message: 'Claim submitted successfully!'
        });
    } catch (err) {
        console.error('Claim Submission Error:', err.message);
        res.status(500).json({ error: 'Failed to submit claim' });
    }
});

router.get('/claims/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pgDb.query(
            'SELECT * FROM claims WHERE user_id = $1 ORDER BY submitted_at DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Failed to fetch claims:', err.message);
        res.status(500).json({ error: 'Failed to fetch claims history' });
    }
});

module.exports = router;
