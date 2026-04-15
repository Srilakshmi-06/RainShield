const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const connectDB = require('./db');
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["https://rainshield.netlify.app", "http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: ["https://rainshield.netlify.app", "http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true
}));
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
const monitorRoutes = require('./routes/monitorRoutes');
const payoutRoutes = require('./routes/payoutRoutes');
const policyRoutes = require('./routes/policyRoutes');
const claimRoutes = require('./routes/claimRoutes');
const PolicyService = require('./services/policyService');
const ClaimService = require('./services/claimService');

// App Routes
app.use('/api/auth', authRoutes);
app.use('/api/monitor', monitorRoutes);
app.use('/api/payout', payoutRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/chat', require('./routes/chatRoutes'));

const axios = require('axios');

// Real-time weather logic via Socket.io
io.on('connection', (socket) => {
  console.log('Client connected for real-time updates');
  
  // Handle user's specific city
  socket.on('joinZone', async (city) => {
    console.log(`User joined monitoring for city: ${city}`);
    
    // Clear existing interval if any to prevent leaks
    if (socket.weatherInterval) clearInterval(socket.weatherInterval);

    const { getWeatherData } = require('./services/weatherService');
    const { getMLPrediction, calculateDynamicPremium } = require('./services/mlService');
    const { WeatherPrediction, User } = require('./models');
    
    const sendUpdate = async () => {
        try {
            const weather = await getWeatherData(city);
            const user = await User.findOne({ city: city });
            const userId = user ? user._id : null;

            const prediction = await getMLPrediction({
                rainfall: weather.rainfall,
                temp: weather.temp,
                humidity: weather.humidity,
                windSpeed: weather.windSpeed
            }, { 
                workingHours: user?.workingHours || 8,
                riskScore: user?.riskScore || 20 
            });

            // Calculate Dynamic Premium for real-time display
            const dynamicPremiumBreakdown = calculateDynamicPremium(200, weather, user || {}, prediction);

            const weatherData = {
                timestamp: weather.timestamp,
                city: weather.city,
                dynamicPremium: dynamicPremiumBreakdown.final,
                conditions: {
                    rainfall: `${weather.rainfall} mm/hr`,
                    temp: `${weather.temp}°C`,
                    desc: weather.description,
                    riskLevel: prediction ? prediction.risk_level : 'Low'
                },
                prediction: prediction ? {
                    predictedEarnings: prediction.predicted_earnings,
                    payoutAmount: prediction.recommended_payout,
                    riskLevel: prediction.risk_level,
                    lossPercentage: prediction.loss_percentage
                } : null
            };

            // Intelligent Policy Adjustment & Logging
            if (user && user.phone) {
                const adjustedPolicy = await PolicyService.adjustWithRiskInsights(user.phone, weather, prediction);
                if (adjustedPolicy) {
                    socket.emit('policyUpdate', adjustedPolicy);
                }
            }

            // Proactive Claim Suggestion Logic
            if (userId && (dynamicPremiumBreakdown.final > 250 || (prediction && prediction.loss_percentage > 15))) {
                const suggestion = await ClaimService.suggestClaim(userId, weatherData, prediction);
                if (suggestion) {
                    socket.emit('claimSuggestion', suggestion);
                }
            }

            // Real-time Risk Alerts based on high-risk conditions
            if (weather.rainfall > 10 || (prediction && prediction.risk_level === 'HIGH')) {
                const payout = prediction ? prediction.recommended_payout : 0;
                socket.emit('pushNotification', {
                    title: `🚨 Payout Eligible!`,
                    message: payout > 0 
                      ? `Risk level HIGH in ${city}. Predicted loss detected. You can submit a one-click claim for ₹${payout}.`
                      : `Risk level HIGH in ${city}. Stay safe!`,
                    type: 'danger',
                    payout: payout,
                    canClaim: true 
                });
            }

            socket.emit('weatherUpdate', weatherData);

            // Optional: Store prediction history
            if (prediction && userId) {
                new WeatherPrediction({
                    userId,
                    rainfall: weather.rainfall,
                    temperature: weather.temp,
                    predictedEarnings: prediction.predicted_earnings,
                    riskLevel: prediction.risk_level,
                    payoutAmount: prediction.recommended_payout
                }).save().catch(e => console.error('Prediction Log Error:', e.message));
            }

        } catch (err) {
            console.error(`[WEATHER/MONITOR FAILED] ${err.message}`);
        }
    };

    socket.weatherInterval = setInterval(sendUpdate, 10000);
    sendUpdate(); // Immediate first call
    
    socket.on('disconnect', () => {
        if (socket.weatherInterval) clearInterval(socket.weatherInterval);
    });
  });
});

const PORT = process.env.PORT || 5000;

const { initAutomation } = require('./services/automationService');

// Connect to MongoDB & Start Server
const startServer = async () => {
    try {
        await connectDB();
        server.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
            initAutomation();
        });
    } catch (err) {
        console.error('Failed to start server:', err.message);
    }
};

startServer();
