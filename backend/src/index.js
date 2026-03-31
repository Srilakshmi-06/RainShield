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
        const { WeatherPrediction, Policy, RiskAlert, User } = require('./models');
        
        try {
            const weather = await getWeatherData(city);
            
            // Find user in MongoDB
            const user = await User.findOne({ city: city }); // Simplify: find any user in that city for demo
            const userId = user ? user._id : null;

            const prediction = await getMLPrediction({
                rainMm: weather.rainfall,
                temp: weather.temp,
                humidity: weather.humidity,
                windSpeed: weather.windSpeed
            });

            // Calculate Dynamic Premium
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

            // Automated Triggers & Alerts (Store in MongoDB)
            if (weather.rainfall > 10) {
              const msg = `🚨 Flood risk alert in ${city}! Suggested Claim for delivery loss.`;
              socket.emit('riskAlert', { id: Date.now(), type: 'Flood', message: msg, suggestClaim: true });
              if (userId) {
                const alert = new RiskAlert({ userId, city, riskType: 'Flood', riskLevel: 'High', message: msg, suggestedClaim: true });
                await alert.save().catch(e => console.error('Alert Save Error:', e.message));
              }
            } else if (weather.temp > 40) {
              const msg = `🚨 Health risk: Extreme heat in ${city}! Stay hydrated.`;
              socket.emit('riskAlert', { id: Date.now(), type: 'Health', message: msg, suggestClaim: false });
              if (userId) {
                const alert = new RiskAlert({ userId, city, riskType: 'Health', riskLevel: 'High', message: msg, suggestedClaim: false });
                await alert.save().catch(e => console.error('Alert Save Error:', e.message));
              }
            }

            if (prediction && userId) {
                try {
                    const newPred = new WeatherPrediction({
                        userId,
                        rainfall: weather.rainfall,
                        temperature: weather.temp,
                        predictedEarnings: prediction.predicted_earnings,
                        riskLevel: prediction.risk_level,
                        payoutAmount: prediction.recommended_payout
                    });
                    await newPred.save();
                    
                    // Update current premium in MongoDB Policy
                    await Policy.findOneAndUpdate(
                      { userId: userId, status: 'active' },
                      { currentPremium: dynamicPremium },
                      { upsert: false }
                    );
                } catch (dbErr) {
                    console.error('MongoDB Features Error:', dbErr.message);
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
