const express = require('express');
const router = express.Router();

const { getMLPrediction } = require('../services/mlService');
const { WeatherPrediction, Claim, User, Policy } = require('../models');

router.get('/status/:zone', async (req, res) => {
    const { zone } = req.params;
    const phone = req.query.phone || '999'; // Use phone as identifier for demo
    const simulatedRain = req.query.rain;
    const simulatedTemp = req.query.temp;
    
    try {
        const { getWeatherData } = require('../services/weatherService');
        const { getMLPrediction } = require('../services/mlService');
        
        // Find user by phone in MongoDB (with safety for connection failure)
        let userId = null;
        let userProfile = {};
        try {
            const user = await User.findOne({ phone: phone });
            userId = user ? user._id : null;
            userProfile = user || {};
        } catch (dbErr) {
            console.warn('[MONITOR] DB search failed, continuing in demo mode.');
        }

        // Fetch LIVE data
        const weather = await getWeatherData(zone).catch(err => {
            console.warn('[MONITOR] Weather fetch failed, using realistic fallback.');
            return {
                city: zone, temp: 28, rainfall: 0, humidity: 65, windSpeed: 5,
                description: 'Clear (Fallback)', timestamp: new Date().toISOString()
            };
        });
        
        // Apply simulation overrides if present
        if (simulatedRain !== undefined) weather.rainfall = parseFloat(simulatedRain);
        if (simulatedTemp !== undefined) weather.temp = parseFloat(simulatedTemp);
        
        // Call ML Service
        const prediction = await getMLPrediction({
            rainfall: weather.rainfall, // Fixed: was rainMm
            temp: weather.temp,
            humidity: weather.humidity,
            windSpeed: weather.windSpeed
        }, {
            workingHours: userProfile.workingHours || 8,
            riskScore: userProfile.riskScore || 20
        });

        const riskLevel = prediction ? prediction.risk_level : 'Low';
        const predictedEarnings = prediction ? prediction.predicted_earnings : 800;
        const payoutAmount = prediction ? prediction.recommended_payout : 0;

        // Store in MongoDB (Optional, don't fail if DB is down)
        if (userId) {
            try {
                const newPrediction = new WeatherPrediction({
                    userId,
                    rainfall: weather.rainfall,
                    temperature: weather.temp,
                    predictedEarnings,
                    riskLevel,
                    payoutAmount
                });
                await newPrediction.save();
            } catch (err) {
                // Silently ignore storage errors in demo
            }
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
    try {
        // userId can be MongoID or Phone for fallback
        let filter = { userId: req.params.userId };
        if (!req.params.userId.match(/^[0-9a-fA-F]{24}$/)) {
            const user = await User.findOne({ phone: req.params.userId });
            filter = { userId: user ? user._id : null };
        }

        const results = await WeatherPrediction.find(filter)
            .sort({ timestamp: -1 })
            .limit(10);
        
        res.json(results);
    } catch (err) {
        console.error('[DATABASE ERROR] Activity Fetch:', err.message);
        res.status(500).json({ error: 'MongoDB Fetch Error' });
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

// Claim Management Routes (MongoDB)
router.post('/submit-claim', async (req, res) => {
    const { userId, type, description, amount, alertId } = req.body;
    
    try {
        // Find user by id or phone
        let targetUserId = userId;
        if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
            const user = await User.findOne({ phone: userId });
            targetUserId = user ? user._id : null;
        }

        // Fetch active policy from MongoDB
        const policy = await Policy.findOne({ userId: targetUserId, status: 'active' });

        const newClaim = new Claim({
            userId: targetUserId,
            policyId: policy ? policy._id : null,
            riskAlertId: alertId, // AlertId can be a dummy or MongoId
            claimType: type,
            description,
            amount,
            status: 'Pending'
        });

        await newClaim.save();

        res.json({
            success: true,
            claimId: newClaim._id,
            status: 'Pending',
            message: 'Claim submitted successfully in MongoDB!'
        });
    } catch (err) {
        console.error('Claim Submission Error:', err.message);
        res.status(500).json({ error: 'Failed to submit claim' });
    }
});

router.get('/claims/:userId', async (req, res) => {
    try {
        let filter = { userId: req.params.userId };
        if (!req.params.userId.match(/^[0-9a-fA-F]{24}$/)) {
            const user = await User.findOne({ phone: req.params.userId });
            filter = { userId: user ? user._id : null };
        }

        const results = await Claim.find(filter).sort({ submittedAt: -1 });
        res.json(results);
    } catch (err) {
        console.error('[DATABASE ERROR] Claims Fetch:', err.message);
        res.status(500).json({ error: 'MongoDB Fetch Error' });
    }
});

module.exports = router;
