const express = require('express');
const router = express.Router();
const { getIo } = require('../socket');

/**
 * DEBUG: Inject fake weather data for demo purposes
 */
router.post('/weather', (req, res) => {
    const { city, rainfall, temp, description, riskLevel } = req.body;
    const io = req.app.get('socketio');

    console.log(`[SIMULATION] Injecting fake weather for ${city}: ${rainfall}mm rain`);

    const fakeData = {
        city: city || 'Mumbai',
        conditions: {
            temp: temp || 28,
            rainfall: rainfall || 12.5,
            humidity: 85,
            windSpeed: 25,
            description: description || 'Simulated Extreme Rainfall',
            riskLevel: riskLevel || (rainfall > 8 ? 'High' : 'Normal')
        },
        AffectedWorkersEst: Math.floor(Math.random() * 500) + 100,
        dynamicPremium: 250,
        prediction: {
            payoutAmount: rainfall > 10 ? 800 : 300
        }
    };

    // Emit to everyone in that city zone
    io.to(city).emit('weatherUpdate', fakeData);

    // If it's high risk, emit a risk alert
    if (fakeData.conditions.riskLevel === 'High') {
        io.to(city).emit('riskAlert', {
            id: Date.now(),
            type: 'Rainfall',
            message: `CRITICAL: ${rainfall}mm rain detected in ${city}. Parametric triggers active.`,
            city: city
        });
    }

    res.json({ success: true, message: 'Fake weather injected!', data: fakeData });
});

module.exports = router;
