const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const connectDB = require('./db');
const server = http.createServer(app);

// Connect to MongoDB
connectDB();
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for deployment
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
const monitorRoutes = require('./routes/monitorRoutes');
const payoutRoutes = require('./routes/payoutRoutes');

// App Routes
app.use('/api/auth', authRoutes);
app.use('/api/monitor', monitorRoutes);
app.use('/api/payout', payoutRoutes);

const axios = require('axios');

// Real-time weather logic via Socket.io
io.on('connection', (socket) => {
  console.log('Client connected for real-time updates');
  
  // Handle user's specific city
  socket.on('joinZone', async (city) => {
    console.log(`User joined monitoring for city: ${city}`);
    
    const sendUpdate = async () => {
        const { getWeatherData } = require('./services/weatherService');
        const { getMLPrediction, calculateDynamicPremium } = require('./services/mlService');
        const pgDb = require('./pgDb');
        
        try {
            const weather = await getWeatherData(city);
            
            const prediction = await getMLPrediction({
                rainMm: weather.rainfall,
                temp: weather.temp,
                humidity: weather.humidity,
                windSpeed: weather.windSpeed
            });

            // Calculate Dynamic Premium (Base premium ₹200 assumed)
            const dynamicPremium = calculateDynamicPremium(200, weather);

            const weatherData = {
                timestamp: weather.timestamp,
                city: weather.city,
                dynamicPremium: dynamicPremium,
                conditions: {
                    rainfall: `${weather.rainfall} mm/hr`,
                    temp: `${weather.temp}°C`,
                    desc: weather.description,
                    riskLevel: prediction ? prediction.risk_level : 'Low'
                },
                prediction: prediction ? {
                    predictedEarnings: prediction.predicted_earnings,
                    payoutAmount: prediction.recommended_payout,
                    riskLevel: prediction.risk_level
                } : null
            };

            // Automated Triggers & Alerts
            if (weather.rainfall > 10) {
              const msg = `🚨 Flood risk alert in ${city}! Suggested Claim for delivery loss.`;
              socket.emit('riskAlert', { id: Date.now(), type: 'Flood', message: msg, suggestClaim: true });
              try {
                await pgDb.query(
                  'INSERT INTO risk_alerts (user_id, city, risk_type, risk_level, message, suggested_claim) VALUES ($1, $2, $3, $4, $5, $6)',
                  [1, city, 'Flood', 'High', msg, true]
                );
              } catch (e) { console.error('Alert Store Error:', e.message); }
            } else if (weather.temp > 40) {
              const msg = `🚨 Health risk: Extreme heat in ${city}! Stay hydrated.`;
              socket.emit('riskAlert', { id: Date.now(), type: 'Health', message: msg, suggestClaim: false });
              try {
                await pgDb.query(
                  'INSERT INTO risk_alerts (user_id, city, risk_type, risk_level, message, suggested_claim) VALUES ($1, $2, $3, $4, $5, $6)',
                  [1, city, 'Health', 'High', msg, false]
                );
              } catch (e) { console.error('Alert Store Error:', e.message); }
            }

            if (prediction) {
                try {
                    await pgDb.query(
                        'INSERT INTO weather_risk_predictions (user_id, rainfall, temperature, predicted_earnings, risk_level, payout_amount) VALUES ($1, $2, $3, $4, $5, $6)',
                        [1, weather.rainfall, weather.temp, prediction.predicted_earnings, prediction.risk_level, prediction.recommended_payout]
                    );
                    
                    // Update current premium in policy for user (Assumed user_id=1 for simplicity)
                    await pgDb.query('UPDATE policies SET current_premium = $1 WHERE user_id = $2', [dynamicPremium, 1]);
                } catch (dbErr) {
                    console.error('PostgreSQL Storage Error:', dbErr.message);
                }
            }

            if (weatherData.conditions.riskLevel === 'High' || (weatherData.prediction && (weatherData.prediction.riskLevel === 'High' || weatherData.prediction.riskLevel === 'HIGH'))) {
                const payout = weatherData.prediction ? weatherData.prediction.payoutAmount : 0;
                socket.emit('pushNotification', {
                    title: `🚨 Payout Alert!`,
                    message: payout > 0 
                      ? `Risk level HIGH in ${city}. You can submit a claim for ₹${payout}.`
                      : `Risk level HIGH in ${city}. Stay safe!`,
                    type: 'danger',
                    payout: payout,
                    canClaim: true 
                });
            }

            socket.emit('weatherUpdate', weatherData);
        } catch (err) {
            console.error(`[WEATHER UPDATE FAILED] ${err.message}`);
        }
    };

    const interval = setInterval(sendUpdate, 10000); // Update every 10s
    sendUpdate(); // Initial call
    
    socket.on('disconnect', () => clearInterval(interval));
  });
});

const PORT = process.env.PORT || 5000;

const { initAutomation } = require('./services/automationService');

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  initAutomation();
});
